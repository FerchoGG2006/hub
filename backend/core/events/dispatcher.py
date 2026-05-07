import logging
import json
import models
from sqlalchemy.orm import Session

logger = logging.getLogger("tech-gastro-hub")

# Variable global para el WebSocket Manager (inyectada desde main.py)
ws_manager = None

def dispatch_event(db: Session, tenant_id: int, event_type: str, payload: dict):
    """
    FASE 7 — AUTOMATIZACIÓN
    Coordina los efectos secundarios de los eventos de negocio.
    """
    logger.info(f"🚀 Dispatching Event: {event_type} for Tenant {tenant_id}")

    # 1. Notificar vía WebSockets (Dashboard / Kanban / Modal)
    if ws_manager:
        import asyncio
        
        # Construir mensaje para el frontend
        msg = {
            "type": "ORDER_UPDATED" if "payment" in event_type or "order" in event_type else "EVENT_NOTIFICATION",
            "event": event_type,
            "tenant_id": tenant_id,
            "order_id": payload.get("order_id"),
            "status": "paid" if event_type == "payment_confirmed" else None,
            "payload": payload
        }
        
        # Ejecutar broadcast de forma segura (los eventos suelen emitirse en hilos síncronos)
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.run_coroutine_threadsafe(ws_manager.broadcast(msg), loop)
        except Exception as e:
            logger.error(f"Error broadcasting event: {e}")

    # 2. Lógica Específica por Tipo de Evento (Phase 10)
    if event_type == "payment_confirmed":
        handle_payment_confirmed(db, tenant_id, payload)
    
    elif event_type == "payment_failed":
        handle_payment_failed(db, tenant_id, payload)
        
    elif event_type == "payment_expired":
        handle_payment_expired(db, tenant_id, payload)

def handle_payment_confirmed(db: Session, tenant_id: int, payload: dict):
    """
    Automatización: Pago confirmado -> Notificar Restaurante + Cocina.
    """
    order_id = payload.get("order_id")
    tenant = db.query(models.Tenant).filter_by(id=tenant_id).first()
    order = db.query(models.Order).filter_by(id=order_id).first()
    
    if not tenant or not order:
        return

    # A. Notificar por WhatsApp al restaurante (Fase 7)
    from events import send_whatsapp_message
    msg = (
        f"✅ ¡PAGO CONFIRMADO!\n"
        f"Pedido: #{order_id}\n"
        f"Cliente: {order.customer_name}\n"
        f"Monto: ${order.total_price}\n"
        f"Método: {payload.get('method', 'Digital')}\n"
        f"━━━━━━━━━━━━━━\n"
        f"Ya puedes iniciar la preparación."
    )
    
    if tenant.whatsapp_number:
        send_whatsapp_message(tenant.whatsapp_number, msg)

def handle_payment_failed(db: Session, tenant_id: int, payload: dict):
    logger.warning(f"Payment failed for order {payload.get('order_id')}")

def handle_payment_expired(db: Session, tenant_id: int, payload: dict):
    logger.info(f"Payment expired for order {payload.get('order_id')}")
