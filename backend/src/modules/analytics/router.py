from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import models
import auth
from database import get_db
from src.shared.utils.responses import success_response

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

@router.get("/metrics/{tenant_slug}")
def get_tenant_metrics(
    tenant_slug: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    tenant = db.query(models.Tenant).filter_by(slug=tenant_slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")
        
    # Seguridad: Solo el admin del tenant o superadmin pueden ver esto
    # Convertimos a string por si acaso hay discrepancia de tipos
    if current_user.role != "superadmin":
        if str(current_user.tenant_id) != str(tenant.id):
             raise HTTPException(status_code=403, detail=f"Acceso denegado: {current_user.tenant_id} vs {tenant.id}")

    today = date.today()
    
    # 1. Ventas de Hoy (Solo órdenes pagadas)
    # Asumiendo que Order tiene 'total' (Decimal) y 'status' ('paid')
    sales_today = db.query(func.sum(models.Order.total)).filter(
        models.Order.tenant_id == tenant.id,
        func.date(models.Order.created_at) == today,
        models.Order.status == 'paid'
    ).scalar() or 0.0

    # 2. Total de órdenes hoy (Cualquier estado)
    orders_count = db.query(func.count(models.Order.id)).filter(
        models.Order.tenant_id == tenant.id,
        func.date(models.Order.created_at) == today
    ).scalar() or 0

    # 3. Ticket Promedio
    avg_ticket = float(sales_today) / orders_count if orders_count > 0 else 0.0

    # 4. Productos Más Vistos (Data Real de Analytics)
    top_hits = (
        db.query(models.Analytics.product_id, func.count(models.Analytics.id).label("hits"))
        .filter(models.Analytics.tenant_id == tenant.id)
        .filter(models.Analytics.action == "view") # Solo visualizaciones reales
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
        "orders_today": int(orders_count),
        "avg_ticket": float(avg_ticket),
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
