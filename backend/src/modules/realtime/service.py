from src.shared.infra.event_bus import bus
from src.shared.utils.websocket_manager import manager

async def on_order_created_realtime(payload: dict):
    """
    Escucha ORDER_CREATED y envía la notificación al Dashboard del restaurante.
    """
    await manager.broadcast({
        "type": "NEW_ORDER", 
        "tenant_id": payload['tenant_id'], 
        "order": {
            "id": payload['order_id'],
            "customer_name": payload['customer_name'],
            "total_price": payload['total_price'],
            "status": payload['status'],
            "items": payload['items']
        }
    }, tenant_id=payload['tenant_id'])
    print(f"[Realtime] Notificación de nuevo pedido enviada al tenant {payload['tenant_id']}")

async def on_order_status_updated_realtime(payload: dict):
    """
    Notifica cambios de estado en tiempo real.
    """
    await manager.broadcast({
        "type": "ORDER_UPDATED",
        "tenant_id": payload['tenant_id'],
        "order_id": payload['order_id'],
        "status": payload['new_status']
    }, tenant_id=payload['tenant_id'])

# Suscripciones
bus.subscribe("ORDER_CREATED", on_order_created_realtime)
bus.subscribe("ORDER_STATUS_UPDATED", on_order_status_updated_realtime)
bus.subscribe("ORDER_PAID", on_order_status_updated_realtime)
