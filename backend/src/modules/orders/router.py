from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import auth
from database import get_db
from src.shared.utils.responses import success_response
from src.shared.errors.app_error import AppError
from src.shared.utils.websocket_manager import manager
from core.orders import orders_service
from schemas.order import OrderRequest
import logging

router = APIRouter(prefix="/api", tags=["orders"])
logger = logging.getLogger("platorin")

@router.post("/v1/tenant/{slug}/orders")
async def receive_order(slug: str, req: OrderRequest, db: Session = Depends(get_db)):
    t = db.query(models.Tenant).filter_by(slug=slug).first()
    if not t:
        raise AppError(message="Tenant no encontrado", status_code=404)
    
    nuevo = orders_service.create_order(db, t.id, req.dict())
    
    await manager.broadcast({
        "type": "NEW_ORDER", 
        "tenant_id": t.id, 
        "order": {
            "id": nuevo.id,
            "customer_name": nuevo.customer_name,
            "total_price": nuevo.total_price,
            "status": nuevo.status,
            "table_number": nuevo.table_number,
            "created_at": nuevo.created_at.isoformat(),
            "items_json": nuevo.items_json
        }
    }, tenant_id=t.id)
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
    orders = orders_service.get_tenant_orders(db, current_user.tenant_id)
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
        o = orders_service.update_order_status(db, order_id, current_user.tenant_id, status)
        if not o: 
            raise AppError(message="Pedido no encontrado o acceso denegado", status_code=404)
            
        await manager.broadcast({"type": "ORDER_UPDATED", "tenant_id": current_user.tenant_id, "order_id": o.id, "status": status}, tenant_id=current_user.tenant_id)
        return success_response({"status": "ok"})
    except ValueError as e:
        raise AppError(message=str(e), status_code=400)
