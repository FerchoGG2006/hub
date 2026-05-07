from sqlalchemy.orm import Session
from sqlalchemy import desc
import models
from datetime import datetime
from services.module_service import has_module
import json
import logging
from core.events.event_bus import emit_event

# Configuración básica de logs
logger = logging.getLogger("tech-gastro-hub")
logging.basicConfig(level=logging.INFO)

VALID_STATUS_TRANSITIONS = {
    "pending": ["preparing", "cancelled"],
    "pending_payment": ["paid", "cancelled"],
    "paid": ["preparing", "cancelled"],
    "preparing": ["ready", "cancelled"],
    "ready": ["completed", "cancelled"],
    "completed": [],
    "cancelled": []
}

def deduct_stock(db: Session, tenant_id: int, items_json: str):
    """Deduce el stock de los productos/variantes en el pedido si el módulo de inventario está activo."""
    if not has_module(db, tenant_id, "inventory"):
        return

    try:
        items = json.loads(items_json)
        for item in items:
            product_id = item.get("id")
            variant_id = item.get("variant_id")
            qty = item.get("qty", 1)

            if variant_id:
                inv = db.query(models.Inventory).filter(models.Inventory.variant_id == variant_id).first()
            else:
                inv = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()
            
            if inv:
                inv.stock -= qty
                # Emitir evento de actualización de stock
                emit_event(db, tenant_id, "stock_updated", {
                    "product_id": product_id,
                    "variant_id": variant_id,
                    "new_stock": inv.stock,
                    "reason": "order_deduction"
                })
        db.commit()
    except Exception as e:
        print(f"Error deduciendo stock: {e}")
        db.rollback()

def create_order(db: Session, tenant_id: int, order_data: dict) -> models.Order:
    """
    Crea un nuevo pedido con transaccionalidad atómica y gestión de inventario.
    """
    try:
        table_number = order_data.get("table_number")
        if table_number and not has_module(db, tenant_id, "tables"):
            table_number = None

        # Determinar estado inicial basado en método de pago
        initial_status = "pending"
        payment_method = order_data.get("payment_method", "transferencia")
        
        # Si es transferencia/digital, iniciamos en espera de pago real
        if payment_method in ["transferencia", "wompi", "nequi", "pse"]:
            initial_status = "pending_payment"

        nuevo_pedido = models.Order(
            tenant_id=tenant_id,
            delivery_method=order_data.get("delivery_method", "mesa"),
            payment_method=payment_method,
            total_price=order_data.get("total_price"),
            items_json=order_data.get("items_json"),
            status=initial_status,
            table_number=table_number,
            phone=order_data.get("phone"),
            customer_name=order_data.get("customer_name"),
            branch_id=order_data.get("branch_id")
        )
        
        db.add(nuevo_pedido)
        db.flush() # Obtener ID sin confirmar transacción aún

        # Integración con Inventario (Atomic)
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
                    if inv.stock < qty:
                        logger.warning(f"Stock insuficiente para item {prod_id}/{var_id}. Stock actual: {inv.stock}")
                        # Opcional: lanzar error si queremos impedir ventas sin stock
                    inv.stock -= qty

        db.commit()
        db.refresh(nuevo_pedido)
        
        # Emitir evento de pedido creado
        emit_event(db, tenant_id, "order_created", {
            "order_id": nuevo_pedido.id,
            "total_price": nuevo_pedido.total_price,
            "items_count": len(json.loads(nuevo_pedido.items_json))
        })

        logger.info(f"Pedido #{nuevo_pedido.id} creado exitosamente para Tenant {tenant_id}")
        return nuevo_pedido

    except Exception as e:
        db.rollback()
        logger.error(f"Error crítico creando pedido: {str(e)}")
        raise e

def get_tenant_orders(db: Session, tenant_id: int):
    """
    Obtiene todos los pedidos de un tenant específico, ordenados por ID descendente.
    """
    return db.query(models.Order).filter_by(tenant_id=tenant_id).order_by(desc(models.Order.id)).all()

def update_order_status(db: Session, order_id: int, tenant_id: int, status: str) -> models.Order:
    """
    Actualiza el estado con validación de transiciones permitidas.
    """
    order = db.query(models.Order).filter_by(id=order_id, tenant_id=tenant_id).first()
    if not order:
        return None
    
    current_status = order.status
    allowed = VALID_STATUS_TRANSITIONS.get(current_status, [])
    
    if status not in allowed:
        logger.warning(f"Transición de estado inválida: {current_status} -> {status} para Pedido #{order_id}")
        raise ValueError(f"No se puede pasar de {current_status} a {status}")

    order.status = status
    db.commit()
    db.refresh(order)

    # Emitir evento de cambio de estado (ej: pagado)
    event_type = "order_paid" if status == "paid" else "order_status_updated"
    emit_event(db, tenant_id, event_type, {
        "order_id": order_id,
        "new_status": status
    })

    logger.info(f"Pedido #{order_id} actualizado a estado: {status}")
    return order
