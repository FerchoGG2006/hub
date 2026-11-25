from sqlalchemy.orm import Session
from sqlalchemy import desc
import models
import json
import logging
import hashlib
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from src.shared.errors.app_error import AppError
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
from src.modules.orders.validation import validate_order, release_inventory

class OrderService:
    @staticmethod
    async def create_order(db: Session, tenant_id: int, order_data: dict, idempotency_key=None) -> models.Order:
        """
        Crea un pedido, gestiona inventario y emite el evento ORDER_CREATED.
        """
        try:
            fingerprint = hashlib.sha256(json.dumps(order_data, sort_keys=True).encode()).hexdigest()
            request_key = None
            if idempotency_key:
                existing = db.query(models.OrderRequestKey).filter_by(tenant_id=tenant_id, key=idempotency_key).first()
                if existing:
                    if existing.fingerprint != fingerprint:
                        raise AppError('La clave ya se utilizó para otro pedido', 409)
                    return db.get(models.Order, existing.order_id)
                request_key = models.OrderRequestKey(tenant_id=tenant_id, key=idempotency_key, fingerprint=fingerprint)
                db.add(request_key)
                db.flush()
            order_data = validate_order(db, tenant_id, order_data)
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
            if request_key:
                request_key.order_id = nuevo_pedido.id

            # Marcar CartSession activa como 'converted'
            try:
                if nuevo_pedido.phone:
                    clean_phone = nuevo_pedido.phone.replace("+", "").replace(" ", "").replace("-", "")
                    active_cart = db.query(models.CartSession).filter_by(
                        tenant_id=tenant_id,
                        phone=clean_phone,
                        status="active"
                    ).first()
                    if active_cart:
                        active_cart.status = "converted"
            except Exception as e:
                logger.warning(f"Error marcando CartSession como converted: {e}")

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

        except IntegrityError:
            db.rollback()
            if idempotency_key:
                existing = db.query(models.OrderRequestKey).filter_by(tenant_id=tenant_id, key=idempotency_key).first()
                if existing and existing.fingerprint == fingerprint and existing.order_id:
                    return db.get(models.Order, existing.order_id)
            raise AppError('Conflicto al registrar el pedido; reintenta', 409)
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
        if new_status == 'paid':
            if order.payment_method == 'wompi':
                raise ValueError('Los pagos Wompi se confirman mediante la pasarela')
            order.payment_status = 'paid'
            order.paid_at = datetime.utcnow()
        if new_status == 'cancelled' and order.payment_status == 'paid':
            raise ValueError('Un pedido pagado requiere un proceso de devolución')
        if new_status == 'cancelled':
            release_inventory(db, order)
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

