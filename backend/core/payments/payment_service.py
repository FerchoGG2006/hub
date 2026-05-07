import uuid
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models
from core.events.event_bus import emit_event
from core.payments import wompi_provider

logger = logging.getLogger("tech-gastro-hub")

def create_payment_session(db: Session, order_id: int, provider: str = "wompi"):
    """
    FASE 4 — CREATE PAYMENT SESSION
    1. Generar referencia única
    2. Crear sesión en el proveedor (Wompi)
    3. Guardar sesión en DB
    4. Retornar datos para el frontend
    """
    order = db.query(models.Order).filter_by(id=order_id).first()
    if not order:
        raise ValueError("Pedido no encontrado")

    # 1. Generar Referencia Única: PLAT-{ID}-{RANDOM}
    reference = f"PLAT-{order.id}-{uuid.uuid4().hex[:6]}".upper()

    # 2. Crear intención en Wompi
    amount_in_cents = int(order.total_price) * 100
    wompi_data = wompi_provider.create_wompi_transaction_intent(amount_in_cents, reference)

    # 3. Guardar Sesión en DB
    session = models.PaymentSession(
        order_id=order.id,
        business_id=order.tenant_id,
        reference=reference,
        amount=order.total_price,
        currency="COP",
        gateway=provider,
        status="pending",
        payment_url=wompi_data["payment_url"],
        qr_data=wompi_data.get("qr_data"),
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.add(session)
    
    # Emitir Evento
    emit_event(db, order.tenant_id, "payment_created", {
        "order_id": order.id,
        "reference": reference,
        "amount": order.total_price
    })
    
    db.commit()
    db.refresh(session)

    return {
        "paymentUrl": session.payment_url,
        "reference": session.reference,
        "qrData": session.qr_data,
        "expiresAt": session.expires_at.isoformat()
    }

def process_webhook_payment(db: Session, reference: str, gateway_data: dict):
    """
    FASE 6 — WEBHOOKS
    Actualiza estados y emite eventos tras confirmación real.
    """
    session = db.query(models.PaymentSession).filter_by(reference=reference).first()
    if not session:
        logger.error(f"Webhook recibido para referencia inexistente: {reference}")
        return False

    if session.status == "paid":
        return True

    status = gateway_data.get("status")
    
    if status == "APPROVED":
        # 1. Actualizar Sesión
        session.status = "paid"
        
        # 2. Actualizar Pedido
        order = db.query(models.Order).filter_by(id=session.order_id).first()
        if order:
            order.status = "paid"
            
            # 3. Crear Registro de Pago (Auditoría)
            payment = models.Payment(
                payment_session_id=session.id,
                gateway_transaction_id=gateway_data.get("id"),
                amount=gateway_data.get("amount_in_cents", 0) / 100,
                method=gateway_data.get("payment_method_type"),
                status="APPROVED",
                raw_response=gateway_data
            )
            db.add(payment)

            # 4. Emitir evento centralizado (FASE 10)
            emit_event(db, order.tenant_id, "payment_confirmed", {
                "order_id": order.id,
                "amount": payment.amount,
                "reference": reference,
                "method": payment.method
            })
            
            logger.info(f"✅ Pago CONFIRMADO: Orden #{order.id}, Ref: {reference}")

    elif status in ["DECLINED", "ERROR", "VOIDED"]:
        session.status = "failed"
        emit_event(db, session.business_id, "payment_failed", {
            "order_id": session.order_id,
            "reference": reference,
            "reason": status
        })

    db.commit()
    return True

def handle_payment_expiration(db: Session):
    """
    FASE 9 — TIMEOUTS
    Busca sesiones expiradas y cancela las órdenes vinculadas.
    """
    now = datetime.utcnow()
    expired_sessions = db.query(models.PaymentSession).filter(
        models.PaymentSession.status == "pending",
        models.PaymentSession.expires_at < now
    ).all()

    for session in expired_sessions:
        session.status = "expired"
        order = db.query(models.Order).filter_by(id=session.order_id).first()
        if order and order.status == "pending_payment":
            order.status = "cancelled"
            emit_event(db, order.tenant_id, "payment_expired", {
                "order_id": order.id,
                "reference": session.reference
            })
            logger.info(f"⏰ Pago EXPIRADO: Orden #{order.id} cancelada.")
    
    db.commit()
