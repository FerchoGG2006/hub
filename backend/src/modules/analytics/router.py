from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import models
import auth
from database import get_db
from src.shared.utils.responses import success_response
import logging

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])
logger = logging.getLogger("platorin")

@router.get("/metrics/{tenant_slug}")
def get_tenant_metrics(
    tenant_slug: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    tenant = db.query(models.Tenant).filter_by(slug=tenant_slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
    
    # Seguridad: superadmin puede ver todo, admin solo su propio tenant
    if current_user.role != "superadmin":
        user_tenant = db.query(models.Tenant).filter_by(id=current_user.tenant_id).first()
        if not user_tenant or user_tenant.slug != tenant_slug:
            logger.warning(f"403 debug: user={current_user.username}, user_tenant_id={current_user.tenant_id}, requested_slug={tenant_slug}, tenant_id={tenant.id}")
            raise HTTPException(status_code=403, detail="Acceso denegado a este negocio")

    today = date.today()
    
    # ── VENTAS DE HOY (Solo órdenes pagadas) ──
    # Columna real: total_price (Integer, en COP)
    sales_today = db.query(func.sum(models.Order.total_price)).filter(
        models.Order.tenant_id == tenant.id,
        func.date(models.Order.created_at) == today,
        models.Order.status == 'paid'
    ).scalar() or 0

    # ── TOTAL DE ÓRDENES HOY ──
    orders_today = db.query(func.count(models.Order.id)).filter(
        models.Order.tenant_id == tenant.id,
        func.date(models.Order.created_at) == today
    ).scalar() or 0

    # ── TICKET PROMEDIO ──
    avg_ticket = float(sales_today) / orders_today if orders_today > 0 else 0.0

    # ── TIEMPO DE PREPARACIÓN PROMEDIO ──
    # Calculado desde el tiempo entre 'pending' y 'delivered' si existen timestamps
    # Por ahora devolvemos 0 hasta que se implemente el tracking de tiempos
    avg_prep_min = 0.0

    # ── PRODUCTOS MÁS POPULARES (Data Real de Analytics) ──
    top_hits = (
        db.query(models.Analytics.product_id, func.count(models.Analytics.id).label("hits"))
        .filter(models.Analytics.tenant_id == tenant.id)
        .group_by(models.Analytics.product_id)
        .order_by(func.count(models.Analytics.id).desc())
        .limit(5)
        .all()
    )

    trending_products = []
    for pid, hits in top_hits:
        p = db.query(models.Product).filter_by(id=pid).first()
        if p:
            trending_products.append({
                "id": p.id,
                "name": p.name,
                "hits": hits,
                "price": p.price
            })

    return success_response({
        "sales_today": int(sales_today),
        "orders_today": int(orders_today),
        "avg_ticket": round(avg_ticket, 2),
        "avg_prep_min": round(avg_prep_min, 1),
        "trending_products": trending_products,
        "period": "today",
        "currency": "COP"
    })

@router.post("/track")
def track_event(
    product_id: int, 
    action: str, 
    tenant_slug: str, 
    db: Session = Depends(get_db)
):
    tenant = db.query(models.Tenant).filter_by(slug=tenant_slug).first()
    if not tenant:
        return success_response({"status": "ignored"})
        
    log = models.Analytics(tenant_id=tenant.id, product_id=product_id, action=action)
    db.add(log)
    db.commit()
    return success_response({"status": "ok"})
