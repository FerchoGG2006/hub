from fastapi import APIRouter, Request, Depends, HTTPException, Header
from typing import Optional
import auth
from sqlalchemy.orm import Session
from database import get_db
from core.payments import payment_service, wompi_provider
import models
import logging
import json
import os

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger("platorin")

@router.post("/webhook")
async def wompi_webhook(request: Request, db: Session = Depends(get_db)):
    """
    FASE 6 — WEBHOOKS
    Endpoint para recibir notificaciones de Wompi.
    """
    try:
        payload = await request.json()
        
        # 1. Extraer datos básicos
        data = payload.get("data", {})
        transaction = data.get("transaction", {})
        event = payload.get("event")
        
        # 2. Validar firma (Opcional en sandbox, obligatorio en prod)
        signature = request.headers.get("x-event-checksum")
        timestamp = payload.get('timestamp')
        expected_environment = 'prod' if os.getenv('WOMPI_ENV') == 'prod' else 'test'
        if payload.get('environment') != expected_environment:
            raise HTTPException(status_code=400, detail='Ambiente de pago inválido')
        if not wompi_provider.verify_webhook_signature(payload, timestamp, signature):
            logger.warning(f"⚠️ Firma de Webhook INVÁLIDA para Ref: {transaction.get('reference')}")
            raise HTTPException(status_code=401, detail="Firma inválida")

        if event == "transaction.updated":
            reference = transaction.get("reference")
            
            # 3. Procesar pago en el servicio
            success = payment_service.process_webhook_payment(db, reference, transaction)
            
            if success:
                return {"status": "ok"}
            else:
                raise HTTPException(status_code=422, detail="Pago no conciliado")

        return {"status": "ignored"}

    except HTTPException:
        raise
    except (ValueError, TypeError, KeyError):
        raise HTTPException(status_code=400, detail="Evento inválido")
    except Exception as e:
        logger.error(f"❌ Error Webhook: {str(e)}")
        # Retornamos 200 para que Wompi no reintente en caso de errores controlados
        raise HTTPException(status_code=500, detail="No se pudo procesar el evento")

@router.get("/status/{reference}")
def get_payment_status(reference: str, db: Session = Depends(get_db), x_order_token: Optional[str] = Header(default=None)):
    """
    FASE 9 — PAYMENT OBSERVABILITY
    Endpoint para consultar el estado real de una sesión de pago.
    """
    session = db.query(models.PaymentSession).filter_by(reference=reference).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión de pago no encontrada")
    auth.require_order_token(x_order_token, session.order_id)
    
    return {
        "reference": session.reference,
        "status": session.status, # pending, paid, failed, expired
        "order_id": session.order_id,
        "amount": session.amount,
        "expires_at": session.expires_at.isoformat() if session.expires_at else None
    }

@router.post("/session")
async def create_session(req: dict, db: Session = Depends(get_db), x_order_token: Optional[str] = Header(default=None)):
    """
    FASE 4 — CREATE PAYMENT SESSION (Manual Endpoint)
    """
    order_id = req.get("orderId")
    provider = req.get("provider", "wompi")
    
    if not order_id:
        raise HTTPException(status_code=400, detail="orderId is required")
    auth.require_order_token(x_order_token, order_id)
        
    try:
        session_data = payment_service.create_payment_session(db, order_id, provider)
        return session_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
