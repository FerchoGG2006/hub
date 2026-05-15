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
        # Verificar por tenant_id O por la relación directa del usuario
        user_tenant = db.query(models.Tenant).filter_by(id=current_user.tenant_id).first()
        if not user_tenant or user_tenant.slug != tenant_slug:
            logger.warning(f"403 debug: user={current_user.username}, user_tenant_id={current_user.tenant_id}, requested_slug={tenant_slug}, tenant_id={tenant.id}")
            raise HTTPException(status_code=403, detail="Acceso denegado a este negocio")

    today = date.today()
    
    # 1. Ventas de Hoy (Solo órdenes pagadas)
    sales_today = db.query(func.sum(models.Order.total)).filter(
        models.Order.tenant_id == tenant.id,
        func.date(models.Order.created_at) == today,
        models.Order.status == 'paid'
    ).scalar() or 0.0

    # 2. Total de órdenes hoy (Cualquier estado)
    orders_today = db.query(func.count(models.Order.id)).filter(
        models.Order.tenant_id == tenant.id,
        func.date(models.Order.created_at) == today
    ).scalar() or 0

    # 3. Ticket Promedio
    avg_ticket = float(sales_today) / orders_today if orders_today > 0 else 0.0

    # 4. Tiempo Promedio de Preparación (si existe un campo prep_time en Order)
    avg_prep = 0.0
    try:
        prep_result = db.query(func.avg(models.Order.prep_time)).filter(
            models.Order.tenant_id == tenant.id,
            func.date(models.Order.created_at) == today,
            models.Order.prep_time.isnot(None)
        ).scalar()
        avg_prep = float(prep_result) if prep_result else 0.0
    except Exception:
        pass  # Si prep_time no existe aún, devolvemos 0

    # 5. Productos Más Vistos (Data Real de Analytics)
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
        "sales_today": float(sales_today),
        "orders_today": int(orders_today),
        "avg_ticket": round(float(avg_ticket), 2),
        "avg_prep_min": round(avg_prep, 1),
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
