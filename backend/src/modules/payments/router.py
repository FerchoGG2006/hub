from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
import auth
from database import get_db
from src.shared.utils.responses import success_response
from src.shared.errors.app_error import AppError

router = APIRouter(prefix="/api", tags=["payments"])

@router.get("/admin/payments")
def get_admin_payments(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    sessions = db.query(models.PaymentSession).filter_by(business_id=current_user.tenant_id).order_by(models.PaymentSession.created_at.desc()).all()
    result = []
    for s in sessions:
        payment = db.query(models.Payment).filter_by(payment_session_id=s.id).first()
        result.append({
            "id": s.id,
            "reference": s.reference,
            "order_id": s.order_id,
            "customer_name": s.order.customer_name if s.order else "Desconocido",
            "amount": s.amount,
            "status": s.status,
            "gateway": s.gateway,
            "created_at": s.created_at.isoformat(),
            "transaction_id": payment.gateway_transaction_id if payment else None,
            "payment_method": payment.method if payment else None
        })
    return success_response(result)

@router.get("/admin/billing")
def get_billing_status(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == current_user.tenant_id).first()
    return success_response({
        "subscription_status": tenant.subscription_status,
        "valid_until": tenant.valid_until.isoformat() if tenant.valid_until else None
    })

@router.post("/admin/billing/subscribe")
def subscribe_tenant(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    from datetime import datetime, timedelta
    tenant = db.query(models.Tenant).filter(models.Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise AppError(message="Tenant no encontrado", status_code=404)
        
    tenant.subscription_status = "active"
    tenant.valid_until = datetime.utcnow() + timedelta(days=30)
    db.commit()
    
    data = {
        "valid_until": tenant.valid_until.isoformat(), 
        "subscription_status": tenant.subscription_status
    }
    return success_response(data, message="Facturación completada")
