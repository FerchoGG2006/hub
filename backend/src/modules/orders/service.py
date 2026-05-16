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
    "completed": ["paid", "cancelled"],
    "cancelled": []
}

from services.module_service import has_module

class OrderService:
    @staticmethod
    async def create_order(db: Session, tenant_id: int, order_data: dict) -> models.Order:
        """
        Crea un pedido, gestiona inventario y emite el evento ORDER_CREATED.
        """
        try:
            # Validación de Mesas
            table_number = order_data.get("table_number")
            if table_number and not has_module(db, tenant_id, "tables"):
                table_number = None

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
                table_number=table_number,
                branch_id=order_data.get("branch_id")
            )
            
            db.add(nuevo_pedido)
            db.flush() 

            # INTEGRACIÓN CON INVENTARIO (Atomic)
            if has_module(db, tenant_id, "inventory"):
                items = json.loads(nuevo_pedido.items_json)
                for item in items:
                    prod_id = item.get("id")
                    var_id = item.get("variant_id")
                    qty = item.get("qty", 1)

                    if var_id:
                        inv = db.query(models.Inventory).filter_by(variant_id=var_id).first()
                    else:
                        inv = db.query(models.Inventory).filter_by(product_id=prod_id).first()
                    
                    if inv:
                        if inv.stock >= qty:
                            inv.stock -= qty
                        else:
                            logger.warning(f"Stock insuficiente para item {prod_id}/{var_id}")

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

    @staticmethod
    def get_tenant_orders(db: Session, tenant_id: int):
        """
        Obtiene todos los pedidos de un tenant.
        """
        return db.query(models.Order).filter_by(tenant_id=tenant_id).order_by(desc(models.Order.id)).all()

