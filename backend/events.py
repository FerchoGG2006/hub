"""
Router de Eventos Especiales — Módulo público + admin
"""
import os
import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

import models
import auth
from database import get_db

router = APIRouter()

# ════════════════ SCHEMAS ════════════════

class EventCreateRequest(BaseModel):
    client_name: str
    client_phone: str
    event_type: str = "otro"
    event_date: Optional[str] = None        # ISO format string
    guests_count: int = 1
    extras: List[str] = []
    notes: Optional[str] = None

class EventStatusUpdate(BaseModel):
    status: str                              # pending | managing | confirmed | rejected
    admin_notes: Optional[str] = None

# ════════════════ UTILIDAD WhatsApp ════════════════

def send_whatsapp_message(to_phone: str, message: str):
    """Envía un mensaje WhatsApp vía Meta Cloud API."""
    import requests
    wa_token = os.getenv("WA_ACCESS_TOKEN")
    wa_phone_id = os.getenv("WA_PHONE_NUMBER_ID")
    
    if not wa_token or wa_token == "TU_WHATSAPP_TOKEN_AQUI":
        print(f"[WA] Token no configurado. Mensaje no enviado a {to_phone}: {message[:80]}...")
        return False
    
    if not wa_phone_id:
        print(f"[WA] WA_PHONE_NUMBER_ID no configurado. Mensaje no enviado.")
        return False
    
    endpoint = f"https://graph.facebook.com/v19.0/{wa_phone_id}/messages"
    
    # Limpiar el telefono (solo digitos)
    clean_phone = to_phone.replace("+", "").replace(" ", "").replace("-", "")
    
    payload = {
        "messaging_product": "whatsapp",
        "to": clean_phone,
        "type": "text",
        "text": {"body": message}
    }
    
    try:
        res = requests.post(
            endpoint, 
            json=payload, 
            headers={"Authorization": f"Bearer {wa_token}"}
        )
        print(f"[WA] Mensaje enviado a {clean_phone}: {res.status_code}")
        return res.status_code == 200
    except Exception as e:
        print(f"[WA] Error enviando mensaje: {e}")
        return False

# ════════════════ MAPEO DE TIPOS ════════════════

EVENT_TYPE_LABELS = {
    "cumpleanos": "Cumpleanos",
    "aniversario": "Aniversario", 
    "reunion": "Reunion",
    "despedida": "Despedida",
    "otro": "Otro"
}

EXTRAS_LABELS = {
    "decoracion": "Decoracion especial",
    "torta": "Torta incluida",
    "zona_privada": "Zona privada",
    "menu_especial": "Menu especial",
    "musica": "Musica"
}

# ════════════════ ENDPOINTS PUBLICOS ════════════════

@router.post("/api/events/{restaurant_slug}")
def create_event_request(restaurant_slug: str, req: EventCreateRequest, db: Session = Depends(get_db)):
    """Endpoint publico - un cliente solicita un evento especial."""
    tenant = db.query(models.Tenant).filter_by(slug=restaurant_slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")

    # Parsear fecha
    event_date = None
    if req.event_date:
        try:
            event_date = datetime.datetime.fromisoformat(req.event_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha invalido. Usa ISO 8601.")

    # Validar tipo de evento
    valid_types = ["cumpleanos", "aniversario", "reunion", "despedida", "otro"]
    event_type = req.event_type if req.event_type in valid_types else "otro"

    nuevo_evento = models.SpecialEvent(
        restaurant_id=tenant.id,
        client_name=req.client_name,
        client_phone=req.client_phone,
        event_type=event_type,
        event_date=event_date,
        guests_count=req.guests_count,
        extras=req.extras,
        notes=req.notes,
        status="pending"
    )
    db.add(nuevo_evento)
    db.commit()
    db.refresh(nuevo_evento)

    # Notificar al restaurante por WhatsApp
    extras_text = ", ".join([EXTRAS_LABELS.get(e, e) for e in (req.extras or [])]) or "Ninguno"
    fecha_text = event_date.strftime("%d/%m/%Y %H:%M") if event_date else "Por definir"
    
    wa_message = (
        f"Nueva solicitud de evento\n"
        f"Cliente: {req.client_name}\n"
        f"Fecha: {fecha_text}\n"
        f"Personas: {req.guests_count}\n"
        f"Tipo: {EVENT_TYPE_LABELS.get(event_type, event_type)}\n"
        f"Extras: {extras_text}\n"
        f"WhatsApp: {req.client_phone}\n"
        f"Notas: {req.notes or 'Sin notas'}"
    )
    
    if tenant.whatsapp_number:
        send_whatsapp_message(tenant.whatsapp_number, wa_message)

    return {
        "status": "ok",
        "message": "Solicitud de evento recibida exitosamente",
        "event_id": nuevo_evento.id
    }

# ════════════════ ENDPOINTS ADMIN ════════════════

@router.get("/api/events/restaurant/{restaurant_id}")
def get_restaurant_events(
    restaurant_id: int, 
    status: str = Query(None),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Lista eventos del restaurante (solo admin autenticado)."""
    # Verificar que el admin tiene acceso a este tenant
    if current_user.role != "superadmin" and current_user.tenant_id != restaurant_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a estos eventos")
    
    query = db.query(models.SpecialEvent).filter_by(restaurant_id=restaurant_id)
    
    if status:
        query = query.filter(models.SpecialEvent.status == status)
    
    events = query.order_by(models.SpecialEvent.created_at.desc()).all()
    
    return [
        {
            "id": e.id,
            "client_name": e.client_name,
            "client_phone": e.client_phone,
            "event_type": e.event_type,
            "event_date": e.event_date.isoformat() if e.event_date else None,
            "guests_count": e.guests_count,
            "extras": e.extras or [],
            "notes": e.notes,
            "admin_notes": e.admin_notes,
            "status": e.status,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in events
    ]

@router.get("/api/events/{event_id}")
def get_event_detail(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Detalle completo de un evento (solo admin autenticado)."""
    event = db.query(models.SpecialEvent).filter_by(id=event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    if current_user.role != "superadmin" and current_user.tenant_id != event.restaurant_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a este evento")
    
    return {
        "id": event.id,
        "restaurant_id": event.restaurant_id,
        "client_name": event.client_name,
        "client_phone": event.client_phone,
        "event_type": event.event_type,
        "event_date": event.event_date.isoformat() if event.event_date else None,
        "guests_count": event.guests_count,
        "extras": event.extras or [],
        "notes": event.notes,
        "admin_notes": event.admin_notes,
        "status": event.status,
        "created_at": event.created_at.isoformat() if event.created_at else None
    }

@router.patch("/api/events/{event_id}/status")
def update_event_status(
    event_id: int,
    req: EventStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Actualiza el estado de un evento y notifica al cliente."""
    valid_statuses = ["pending", "managing", "confirmed", "rejected"]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Estado invalido. Opciones: {', '.join(valid_statuses)}")

    event = db.query(models.SpecialEvent).filter_by(id=event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    if current_user.role != "superadmin" and current_user.tenant_id != event.restaurant_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a este evento")
    
    old_status = event.status
    event.status = req.status
    
    if req.admin_notes is not None:
        event.admin_notes = req.admin_notes
    
    db.commit()

    # Notificaciones WhatsApp al cliente segun cambio de estado
    if req.status == "confirmed" and old_status != "confirmed":
        msg = (
            f"Tu evento fue confirmado! El restaurante "
            f"te contactara pronto al {event.client_phone}."
        )
        send_whatsapp_message(event.client_phone, msg)
    
    elif req.status == "rejected" and old_status != "rejected":
        msg = (
            f"Lo sentimos, tu solicitud no pudo ser procesada. "
            f"Por favor contactanos directamente."
        )
        send_whatsapp_message(event.client_phone, msg)

    return {
        "status": "ok",
        "event_id": event.id,
        "new_status": event.status
    }

# ════════════════ ENDPOINT PARA CONTEO (Badge del sidebar) ════════════════

@router.get("/api/events/restaurant/{restaurant_id}/pending-count")
def get_pending_events_count(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Retorna conteo de eventos pendientes para el badge del sidebar."""
    if current_user.role != "superadmin" and current_user.tenant_id != restaurant_id:
        raise HTTPException(status_code=403, detail="No tienes acceso")
    
    count = db.query(models.SpecialEvent).filter_by(
        restaurant_id=restaurant_id, 
        status="pending"
    ).count()
    
    return {"pending_count": count}
