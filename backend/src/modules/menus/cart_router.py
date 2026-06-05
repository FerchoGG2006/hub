from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
from database import get_db
from src.shared.utils.responses import success_response
from src.shared.errors.app_error import AppError
from pydantic import BaseModel
from typing import Optional
import datetime

router = APIRouter(prefix="/api", tags=["carts"])

class CartSyncRequest(BaseModel):
    phone: str
    customer_name: Optional[str] = None
    items_json: str

@router.post("/v1/tenant/{slug}/cart-sessions")
def sync_cart_session(slug: str, req: CartSyncRequest, db: Session = Depends(get_db)):
    """
    Sincroniza el estado del carrito activo del cliente en tiempo real
    para posibilitar la recuperación automatizada de carritos abandonados.
    """
    # 1. Resolver Tenant
    tenant = db.query(models.Tenant).filter_by(slug=slug).first()
    if not tenant:
        raise AppError(message="Negocio no encontrado", status_code=404)

    # Limpiar el teléfono para evitar inconsistencias
    clean_phone = req.phone.replace("+", "").replace(" ", "").replace("-", "")
    if not clean_phone or len(clean_phone) < 7:
        return success_response({"status": "ignored", "message": "Teléfono inválido para tracking"})

    # 2. Buscar si ya existe una sesión activa para esta combinación
    session = db.query(models.CartSession).filter_by(
        tenant_id=tenant.id,
        phone=clean_phone,
        status="active"
    ).first()

    if session:
        session.customer_name = req.customer_name or session.customer_name
        session.items_json = req.items_json
        session.last_interaction = datetime.datetime.utcnow()
        logger_msg = f"Sincronizando carrito existente para {clean_phone}"
    else:
        session = models.CartSession(
            tenant_id=tenant.id,
            phone=clean_phone,
            customer_name=req.customer_name,
            items_json=req.items_json,
            status="active",
            last_interaction=datetime.datetime.utcnow(),
            created_at=datetime.datetime.utcnow()
        )
        db.add(session)
        logger_msg = f"Creando nueva sesión de carrito para {clean_phone}"

    db.commit()
    return success_response({"status": "ok", "message": logger_msg})
