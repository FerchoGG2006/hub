from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import auth
from database import get_db
from src.shared.utils.responses import success_response
from src.shared.errors.app_error import AppError
from src.shared.utils.websocket_manager import manager
from src.modules.orders.service import OrderService
from schemas.order import OrderRequest
import logging

router = APIRouter(prefix="/api", tags=["orders"])
logger = logging.getLogger("platorin.orders")


@router.post("/v1/tenant/{slug}/orders")
async def receive_order(slug: str, req: OrderRequest, db: Session = Depends(get_db)):
    t = db.query(models.Tenant).filter_by(slug=slug).first()
    if not t:
        raise AppError(message="Tenant no encontrado", status_code=404)
    
    # Nuevo servicio modular (Emite eventos internamente)
    nuevo = await OrderService.create_order(db, t.id, req.dict())
    
    return success_response({"orderId": nuevo.id}, message="Pedido recibido")

@router.get("/v1/tenant/{slug}/orders/{order_id}")
def get_public_order_status(slug: str, order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter_by(id=order_id).first()
    if not order:
        raise AppError(message="Pedido no encontrado", status_code=404)
    
    data = {
        "id": order.id,
        "status": order.status,
        "total_price": order.total_price
    }
    return success_response(data)

@router.get("/admin/orders")
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    orders = OrderService.get_tenant_orders(db, current_user.tenant_id)
    result = []
    for o in orders:
        result.append({
            "id": o.id,
            "customer_name": o.customer_name,
            "total_price": o.total_price,
            "status": o.status,
            "table_number": o.table_number,
            "items_json": o.items_json,
            "created_at": o.created_at.isoformat(),
            "branch_id": o.branch_id,
            "branch_name": o.branch.name if o.branch else "Central"
        })
    return success_response(result)

@router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: int, status: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    try:
        # Usar el nuevo servicio modular
        o = await OrderService.update_status(db, order_id, current_user.tenant_id, status)
        
        if not o: 
            raise AppError(message="Pedido no encontrado o acceso denegado", status_code=404)
            
        return success_response({"status": "ok"})
    except ValueError as e:
        raise AppError(message=str(e), status_code=400)


# ═══════════════════════════════════════════════════════════
#  CAJA / COMANDAS — Gestión de mesas abiertas y cobros
# ═══════════════════════════════════════════════════════════

from sqlalchemy import func, case
from datetime import date
import json as json_module

@router.get("/admin/caja/mesas-abiertas")
def get_open_tables(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Retorna las mesas con pedidos activos (no pagados ni cancelados), agrupadas por table_number."""
    tenant_id = current_user.tenant_id
    
    active_statuses = ["pending", "preparing", "ready", "completed"]
    
    active_orders = (
        db.query(models.Order)
        .filter(
            models.Order.tenant_id == tenant_id,
            models.Order.status.in_(active_statuses),
            models.Order.table_number.isnot(None),
            models.Order.table_number != ""
        )
        .order_by(models.Order.created_at.asc())
        .all()
    )
    
    # Agrupar por mesa
    mesas = {}
    for o in active_orders:
        mesa = o.table_number
        if mesa not in mesas:
            mesas[mesa] = {
                "table_number": mesa,
                "orders": [],
                "total": 0,
                "oldest_order": o.created_at.isoformat() if o.created_at else None,
                "all_completed": True,
            }
        
        items = []
        try:
            items = json_module.loads(o.items_json) if isinstance(o.items_json, str) else (o.items_json or [])
        except Exception:
            pass
        
        mesas[mesa]["orders"].append({
            "id": o.id,
            "status": o.status,
            "total_price": o.total_price,
            "customer_name": o.customer_name,
            "payment_method": o.payment_method,
            "items": items,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })
        mesas[mesa]["total"] += (o.total_price or 0)
        
        if o.status != "completed":
            mesas[mesa]["all_completed"] = False
    
    return success_response(list(mesas.values()))


@router.post("/admin/caja/cerrar-mesa/{table_number}")
async def close_table(
    table_number: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Marca todos los pedidos activos de una mesa como 'paid' y cierra la mesa."""
    tenant_id = current_user.tenant_id
    
    active_orders = (
        db.query(models.Order)
        .filter(
            models.Order.tenant_id == tenant_id,
            models.Order.table_number == table_number,
            models.Order.status.in_(["pending", "preparing", "ready", "completed"])
        )
        .all()
    )
    
    if not active_orders:
        raise AppError(message=f"No hay pedidos activos en mesa {table_number}", status_code=404)
    
    total_cobrado = 0
    for order in active_orders:
        order.status = "paid"
        total_cobrado += (order.total_price or 0)
    
    db.commit()
    
    # Notificar via WebSocket
    await manager.broadcast({
        "type": "TABLE_CLOSED",
        "table_number": table_number,
        "total": total_cobrado,
        "tenant_id": tenant_id
    }, tenant_id=tenant_id)
    
    return success_response({
        "message": f"Mesa {table_number} cerrada",
        "total_cobrado": total_cobrado,
        "orders_closed": len(active_orders)
    })


from pydantic import BaseModel

class AdminAddOrderRequest(BaseModel):
    items_json: str
    total_price: int

@router.post("/admin/caja/mesas-abiertas/{table_number}/add-order")
async def add_order_to_table(
    table_number: str,
    req: AdminAddOrderRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Permite al admin agregar una orden adicional a una mesa existente."""
    order_data = {
        "table_number": table_number,
        "payment_method": "efectivo",
        "delivery_method": "mesa",
        "total_price": req.total_price,
        "items_json": req.items_json,
        "customer_name": "Agregado en Caja",
        "phone": ""
    }
    nuevo = await OrderService.create_order(db, current_user.tenant_id, order_data)
    
    # Optionally force status to pending to skip pending_payment logic
    nuevo.status = "pending"
    db.commit()
    
    return success_response({"orderId": nuevo.id, "message": "Productos agregados a la mesa"})

from datetime import datetime, timezone, date

@router.get("/admin/caja/resumen")
def get_cash_summary(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Resumen de caja del día: total cobrado, desglose por método de pago, pedidos abiertos vs cerrados."""
    tenant_id = current_user.tenant_id
    today = datetime.now(timezone.utc).date()
    
    # Total pagado hoy
    paid_today = db.query(
        func.sum(models.Order.total_price),
        func.count(models.Order.id)
    ).filter(
        models.Order.tenant_id == tenant_id,
        models.Order.status == "paid",
        func.date(models.Order.created_at) == today
    ).first()
    
    total_ventas = paid_today[0] or 0
    total_pedidos_cerrados = paid_today[1] or 0
    
    # Desglose por método de pago
    payment_breakdown = (
        db.query(
            models.Order.payment_method,
            func.sum(models.Order.total_price),
            func.count(models.Order.id)
        )
        .filter(
            models.Order.tenant_id == tenant_id,
            models.Order.status == "paid",
            func.date(models.Order.created_at) == today
        )
        .group_by(models.Order.payment_method)
        .all()
    )
    
    metodos = {}
    for method, total, count in payment_breakdown:
        metodos[method or "otro"] = {"total": total or 0, "count": count or 0}
    
    # Pedidos activos (aún no pagados)
    active_count = db.query(func.count(models.Order.id)).filter(
        models.Order.tenant_id == tenant_id,
        models.Order.status.in_(["pending", "preparing", "ready", "completed"]),
        func.date(models.Order.created_at) == today
    ).scalar() or 0
    
    return success_response({
        "fecha": today.isoformat(),
        "total_ventas": int(total_ventas),
        "pedidos_cerrados": total_pedidos_cerrados,
        "pedidos_activos": active_count,
        "ticket_promedio": round(total_ventas / total_pedidos_cerrados, 0) if total_pedidos_cerrados > 0 else 0,
        "metodos_pago": metodos
    })
