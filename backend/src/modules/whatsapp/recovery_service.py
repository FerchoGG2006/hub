from sqlalchemy.orm import Session
import models
import datetime
import json
import logging
from events import send_whatsapp_message
from src.shared.utils.websocket_manager import manager

logger = logging.getLogger("platorin.whatsapp.recovery")

def recover_abandoned_carts(db: Session):
    """
    Job periódico que busca sesiones de carritos activas sin interacción
    por más de 10 minutos, envía un recordatorio persuasivo de WhatsApp y actualiza el estado.
    """
    try:
        threshold = datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
        
        # Obtener carritos inactivos
        abandoned_carts = db.query(models.CartSession).filter(
            models.CartSession.status == "active",
            models.CartSession.last_interaction < threshold
        ).all()

        if not abandoned_carts:
            return

        logger.info(f"🔍 Encontrados {len(abandoned_carts)} carritos inactivos listos para recuperación.")

        for session in abandoned_carts:
            try:
                # 1. Marcar como abandonado para evitar procesamiento duplicado
                session.status = "abandoned"
                db.commit()

                # 2. Reconstruir resumen de platos del carrito
                try:
                    items = json.loads(session.items_json)
                except Exception:
                    items = []

                if not items:
                    # Carrito vacío o inválido, marcar como recuperado sin enviar
                    session.status = "recovered"
                    db.commit()
                    continue

                items_text = ", ".join([f"{item.get('name', 'Plato')} (x{item.get('qty', 1)})" for item in items])

                # 3. Formatear mensaje persuasivo
                name = session.customer_name or "cliente"
                tenant = db.query(models.Tenant).filter_by(id=session.tenant_id).first()
                tenant_name = tenant.name if tenant else "Restaurante"
                tenant_slug = tenant.slug if tenant else ""

                message = (
                    f"¡Hola {name}! 👋\n\n"
                    f"Notamos que dejaste algunos platos increíbles en tu carrito de *{tenant_name}*:\n"
                    f"👉 {items_text}\n\n"
                    f"¿Te gustaría completar tu pedido ahora y calmar ese antojo? 🤤\n"
                    f"Haz click aquí para continuar comprando con un solo toque:\n"
                    f"https://platorin.com/{tenant_slug}"
                )

                # 4. Enviar vía WhatsApp Cloud API
                logger.info(f"📤 Enviando recordatorio de carrito abandonado a {session.phone}: {items_text}")
                success = send_whatsapp_message(session.phone, message)

                # 5. Guardar mensaje enviado en la BD de Inbox
                system_msg = models.WhatsAppMessage(
                    tenant_id=session.tenant_id,
                    customer_id=None,
                    phone=session.phone,
                    sender="system",
                    body=message,
                    created_at=datetime.datetime.utcnow()
                )
                db.add(system_msg)
                
                # 6. Actualizar estado final del carrito
                session.status = "recovered"
                db.commit()

                # 7. Broadcast vía WebSocket al dashboard admin para registrar el mensaje en tiempo real
                ws_payload = {
                    "type": "NEW_WHATSAPP_MESSAGE",
                    "message": {
                        "id": system_msg.id,
                        "phone": system_msg.phone,
                        "customer_name": session.customer_name or "Cliente de WhatsApp",
                        "sender": "system",
                        "body": system_msg.body,
                        "created_at": system_msg.created_at.isoformat()
                    }
                }
                # Intentamos enviar el broadcast (puede correr asíncronamente)
                import asyncio
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        asyncio.run_coroutine_threadsafe(manager.broadcast(ws_payload, tenant_id=session.tenant_id), loop)
                except Exception:
                    pass

            except Exception as inner_e:
                db.rollback()
                logger.error(f"Error procesando recuperación de sesión {session.id}: {inner_e}")

    except Exception as e:
        logger.error(f"Error general en job de recuperación de carritos: {e}")
