from sqlalchemy.orm import Session
import models
import json
from datetime import datetime
from core.events import dispatcher

def emit_event(db: Session, tenant_id: int, event_type: str, payload: dict):
    """
    Registra un evento en la base de datos y dispara el dispatcher para efectos secundarios.
    """
    try:
        nuevo_evento = models.BusinessEvent(
            tenant_id=tenant_id,
            type=event_type,
            payload=payload
        )
        db.add(nuevo_evento)
        db.commit()
        
        # FASE 7 & 10 — DISPATCHER ( Side Effects )
        dispatcher.dispatch_event(db, tenant_id, event_type, payload)
        
        return nuevo_evento
    except Exception as e:
        print(f"[EventBus] Error emitiendo evento {event_type}: {e}")
        db.rollback()
        return None
