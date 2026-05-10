import uuid
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models
from core.events.event_bus import emit_event
from core.payments import wompi_provider

logger = logging.getLogger("platorin")

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
    FASE 6 — WEBHOOKS (HARDENED)
    Actualiza estados y emite eventos tras confirmación real.
    Implementa Idempotencia y validación de estado de orden.
    """
    transaction_id = gateway_data.get("id")
    logger.info(f"📡 Procesando Webhook para Ref: {reference}, Transacción: {transaction_id}")

    # 1. Recuperar la sesión
    session = db.query(models.PaymentSession).filter_by(reference=reference).first()
    if not session:
        logger.error(f"❌ Error: Webhook recibido para referencia inexistente: {reference}")
        return False

    # 2. IDEMPOTENCIA: Verificar si esta transacción de pasarela ya fue procesada
    existing_payment = db.query(models.Payment).filter_by(gateway_transaction_id=transaction_id).first()
    if existing_payment:
        logger.warning(f"⚠️ Aviso: La transacción {transaction_id} ya fue procesada previamente. Ignorando duplicado.")
        return True

    # 3. Verificar estado de la sesión y la orden
    if session.status == "paid":
        logger.info(f"ℹ️ Información: La sesión {reference} ya está marcada como pagada.")
        return True

    status = gateway_data.get("status")
    logger.info(f"🔄 Estado reportado por Pasarela: {status}")
    
    try:
        if status == "APPROVED":
            # Actualizar Sesión
            session.status = "paid"
            
            # Actualizar Pedido (Source of Truth)
            order = db.query(models.Order).filter_by(id=session.order_id).first()
            if order:
                if order.status == "paid":
                    logger.warning(f"⚠️ Alerta: El pedido #{order.id} ya figura como pagado. Posible discrepancia.")
                else:
                    order.status = "paid"
                    logger.info(f"✅ Pedido #{order.id} marcado como PAGADO.")
                
                # Crear Registro de Pago (Auditoría / Idempotencia)
                payment = models.Payment(
                    payment_session_id=session.id,
                    gateway_transaction_id=transaction_id,
                    amount=gateway_data.get("amount_in_cents", 0) / 100,
                    method=gateway_data.get("payment_method_type"),
                    status="APPROVED",
                    raw_response=gateway_data
                )
                db.add(payment)

                # Emitir evento centralizado (Sincronización de Sistemas)
                emit_event(db, order.tenant_id, "payment_confirmed", {
                    "order_id": order.id,
                    "amount": payment.amount,
                    "reference": reference,
                    "method": payment.method,
                    "transaction_id": transaction_id
                })
                
                logger.info(f"🎊 ÉXITO: Pago confirmado para Orden #{order.id}")

        elif status in ["DECLINED", "ERROR", "VOIDED"]:
            session.status = "failed"
            logger.error(f"❌ Pago FALLIDO: Referencia {reference} marcada como {status}")
            emit_event(db, session.business_id, "payment_failed", {
                "order_id": session.order_id,
                "reference": reference,
                "reason": status
            })

        db.commit()
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"💥 ERROR CRÍTICO procesando webhook: {str(e)}")
        return False

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
