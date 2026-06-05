from src.shared.infra.event_bus import bus
from database import SessionLocal
import models
import logging
import datetime
from events import send_whatsapp_message
from src.shared.utils.websocket_manager import manager

logger = logging.getLogger("platorin.whatsapp.alerts")

class WhatsAppAlertsService:
    @staticmethod
    async def handle_order_created(payload: dict):
        """
        Envía una notificación de WhatsApp al cliente cuando se crea su pedido.
        """
        tenant_id = payload.get("tenant_id")
        order_id = payload.get("order_id")
        phone = payload.get("phone")
        name = payload.get("customer_name") or "cliente"
        
        # Limpiar teléfono
        clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "") if phone else None
        if not clean_phone or clean_phone == "0000":
            return # Sin número real registrado

        db = SessionLocal()
        try:
            tenant = db.query(models.Tenant).filter_by(id=tenant_id).first()
            tenant_name = tenant.name if tenant else "Restaurante"
            
            msg = (
                f"¡Hola {name}! 🍽️\n\n"
                f"Hemos recibido tu pedido *#{order_id}* en *{tenant_name}* con éxito.\n"
                f"Total: ${payload.get('total_price')}\n\n"
                f"Te avisaremos por aquí cuando empiece a prepararse. ¡Gracias por tu compra! ✨"
            )

            logger.info(f"📬 Enviando alerta de pedido creado #{order_id} a {clean_phone}")
            send_whatsapp_message(clean_phone, msg)

            # Guardar en base de datos de Inbox
            db_msg = models.WhatsAppMessage(
                tenant_id=tenant_id,
                customer_id=None,
                phone=clean_phone,
                sender="system",
                body=msg,
                created_at=datetime.datetime.utcnow()
            )
            db.add(db_msg)
            db.commit()

            # Broadcast WebSocket
            ws_payload = {
                "type": "NEW_WHATSAPP_MESSAGE",
                "message": {
                    "id": db_msg.id,
                    "phone": db_msg.phone,
                    "customer_name": name,
                    "sender": "system",
                    "body": db_msg.body,
                    "created_at": db_msg.created_at.isoformat()
                }
            }
            await manager.broadcast(ws_payload, tenant_id=tenant_id)

        except Exception as e:
            logger.error(f"Error enviando alerta transaccional de pedido creado: {e}")
        finally:
            db.close()

    @staticmethod
    async def handle_order_status_updated(payload: dict):
        """
        Envía notificaciones de WhatsApp al cliente según el cambio de estado de su pedido.
        """
        tenant_id = payload.get("tenant_id")
        order_id = payload.get("order_id")
        new_status = payload.get("new_status")

        db = SessionLocal()
        try:
            order = db.query(models.Order).filter_by(id=order_id, tenant_id=tenant_id).first()
            if not order or not order.phone:
                return

            clean_phone = order.phone.replace("+", "").replace(" ", "").replace("-", "")
            if clean_phone == "0000":
                return # Sin número real

            tenant = db.query(models.Tenant).filter_by(id=tenant_id).first()
            tenant_name = tenant.name if tenant else "Restaurante"
            name = order.customer_name or "cliente"

            # Formatear mensaje según el nuevo estado
            msg = None
            if new_status == "preparing":
                msg = (
                    f"👨‍🍳 ¡Buenas noticias, {name}!\n\n"
                    f"Tu pedido *#{order_id}* en *{tenant_name}* ya ingresó a la cocina y está siendo preparado en este momento. 🔥"
                )
            elif new_status == "ready":
                msg = (
                    f"🍽️ ¡Pedido Listo, {name}!\n\n"
                    f"Tu pedido *#{order_id}* ya está listo. "
                    f"{'Te lo llevamos a la mesa en un instante.' if order.delivery_method == 'mesa' else 'Puedes pasar a recogerlo o ya va en camino con el domiciliario. 🛵'}"
                )
            elif new_status == "completed":
                msg = (
                    f"✨ ¡Pedido entregado, {name}!\n\n"
                    f"Esperamos que disfrutes de tu comida. ¡Muchas gracias por elegirnos! 🌟"
                )
            elif new_status == "cancelled":
                msg = (
                    f"⚠️ Hola {name}.\n\n"
                    f"Tu pedido *#{order_id}* ha sido cancelado. Si tienes alguna duda o deseas reprogramar, por favor contáctanos directamente."
                )

            if not msg:
                return

            logger.info(f"📬 Enviando alerta de cambio de estado ({new_status}) para #{order_id} a {clean_phone}")
            send_whatsapp_message(clean_phone, msg)

            # Guardar en base de datos de Inbox
            db_msg = models.WhatsAppMessage(
                tenant_id=tenant_id,
                customer_id=None,
                phone=clean_phone,
                sender="system",
                body=msg,
                created_at=datetime.datetime.utcnow()
            )
            db.add(db_msg)
            db.commit()

            # Broadcast WebSocket
            ws_payload = {
                "type": "NEW_WHATSAPP_MESSAGE",
                "message": {
                    "id": db_msg.id,
                    "phone": db_msg.phone,
                    "customer_name": name,
                    "sender": "system",
                    "body": db_msg.body,
                    "created_at": db_msg.created_at.isoformat()
                }
            }
            await manager.broadcast(ws_payload, tenant_id=tenant_id)

        except Exception as e:
            logger.error(f"Error enviando alerta transaccional de cambio de estado: {e}")
        finally:
            db.close()

# Suscribir los listeners al bus de eventos
bus.subscribe("ORDER_CREATED", WhatsAppAlertsService.handle_order_created)
bus.subscribe("ORDER_STATUS_UPDATED", WhatsAppAlertsService.handle_order_status_updated)
bus.subscribe("ORDER_PAID", WhatsAppAlertsService.handle_order_status_updated)
