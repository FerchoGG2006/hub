from sqlalchemy.orm import Session
import models
import json
from datetime import datetime

def emit_event(db: Session, tenant_id: int, event_type: str, payload: dict):
    """
    Registra un evento en la base de datos de forma síncrona.
    Próximamente puede extenderse para enviar a una cola (Redis/RabbitMQ).
    """
    try:
        nuevo_evento = models.BusinessEvent(
            tenant_id=tenant_id,
            type=event_type,
            payload=payload
        )
        db.add(nuevo_evento)
        db.commit()
        # Aquí se podrían disparar consumidores asíncronos en el futuro
        return nuevo_evento
    except Exception as e:
        print(f"[EventBus] Error emitiendo evento {event_type}: {e}")
        db.rollback()
        return None
