from sqlalchemy.orm import Session
from sqlalchemy import desc
import models
import json
import logging
from src.shared.infra.event_bus import bus

logger = logging.getLogger("platorin.orders")

VALID_STATUS_TRANSITIONS = {
    "pending": ["preparing", "cancelled"],
    "pending_payment": ["paid", "cancelled"],
    "paid": ["preparing", "cancelled"],
    "preparing": ["ready", "cancelled"],
    "ready": ["completed", "cancelled"],
    "completed": [],
    "cancelled": []
}

class OrderService:
    @staticmethod
    async def create_order(db: Session, tenant_id: int, order_data: dict) -> models.Order:
        """
        Crea un pedido y emite el evento ORDER_CREATED.
        Ya no llama al CRM ni al WebSocket directamente.
        """
        try:
            # Lógica de creación (Simplificada para el dominio de órdenes)
            payment_method = order_data.get("payment_method", "transferencia")
            initial_status = "pending_payment" if payment_method in ["transferencia", "wompi", "nequi", "pse"] else "pending"

            nuevo_pedido = models.Order(
                tenant_id=tenant_id,
                delivery_method=order_data.get("delivery_method", "mesa"),
                payment_method=payment_method,
                total_price=order_data.get("total_price"),
                items_json=order_data.get("items_json"),
                status=initial_status,
                phone=order_data.get("phone"),
                customer_name=order_data.get("customer_name"),
                table_number=order_data.get("table_number"),
                branch_id=order_data.get("branch_id")
            )
            
            db.add(nuevo_pedido)
            db.commit()
            db.refresh(nuevo_pedido)

            # EMISIÓN DE EVENTO DE DOMINIO
            await bus.publish("ORDER_CREATED", {
                "tenant_id": tenant_id,
                "order_id": nuevo_pedido.id,
                "customer_name": nuevo_pedido.customer_name,
                "phone": nuevo_pedido.phone,
                "total_price": nuevo_pedido.total_price,
                "status": nuevo_pedido.status,
                "items": json.loads(nuevo_pedido.items_json)
            })

            logger.info(f"Pedido #{nuevo_pedido.id} creado y evento emitido.")
            return nuevo_pedido

        except Exception as e:
            db.rollback()
            logger.error(f"Error en OrderService.create_order: {e}")
            raise e

    @staticmethod
    async def update_status(db: Session, order_id: int, tenant_id: int, new_status: str) -> models.Order:
        """
        Actualiza el estado y emite ORDER_STATUS_UPDATED.
        """
        order = db.query(models.Order).filter_by(id=order_id, tenant_id=tenant_id).first()
        if not order: return None

        # Validación de transiciones (Opcional, pero recomendada)
        if new_status not in VALID_STATUS_TRANSITIONS.get(order.status, []):
            raise ValueError(f"Transición inválida: {order.status} -> {new_status}")

        old_status = order.status
        order.status = new_status
        db.commit()

        # EVENTO DE DOMINIO
        event_name = "ORDER_PAID" if new_status == "paid" else "ORDER_STATUS_UPDATED"
        await bus.publish(event_name, {
            "tenant_id": tenant_id,
            "order_id": order.id,
            "old_status": old_status,
            "new_status": new_status
        })

        return order
