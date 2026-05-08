from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from core.payments import payment_service, wompi_provider
import logging
import json

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger("tech-gastro-hub")

@router.post("/webhook")
async def wompi_webhook(request: Request, db: Session = Depends(get_db)):
    """
    FASE 6 — WEBHOOKS
    Endpoint para recibir notificaciones de Wompi.
    """
    try:
        payload = await request.json()
        logger.info(f"📡 Webhook Recibido: {json.dumps(payload, indent=2)}")
        
        # 1. Extraer datos básicos
        data = payload.get("data", {})
        transaction = data.get("transaction", {})
        event = payload.get("event")
        
        # 2. Validar firma (Opcional en sandbox, obligatorio en prod)
        # signature = request.headers.get("x-event-checksum")
        # timestamp = request.headers.get("x-event-timestamp")
        # if not wompi_provider.verify_webhook_signature(payload, timestamp, signature):
        #     raise HTTPException(status_code=401, detail="Firma inválida")

        if event == "transaction.updated":
            reference = transaction.get("reference")
            
            # 3. Procesar pago en el servicio
            success = payment_service.process_webhook_payment(db, reference, transaction)
            
            if success:
                return {"status": "ok"}
            else:
                return {"status": "error", "message": "Reference not found"}

        return {"status": "ignored"}

    except Exception as e:
        logger.error(f"❌ Error Webhook: {str(e)}")
        # Retornamos 200 para que Wompi no reintente en caso de errores controlados
        return {"status": "error", "message": str(e)}

@router.post("/session")
async def create_session(req: dict, db: Session = Depends(get_db)):
    """
    FASE 4 — CREATE PAYMENT SESSION (Manual Endpoint)
    """
    order_id = req.get("orderId")
    provider = req.get("provider", "wompi")
    
    if not order_id:
        raise HTTPException(status_code=400, detail="orderId is required")
        
    try:
        session_data = payment_service.create_payment_session(db, order_id, provider)
        return session_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
