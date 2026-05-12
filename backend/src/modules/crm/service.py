from sqlalchemy.orm import Session
import models
import asyncio
from datetime import datetime
from src.shared.infra.event_bus import bus
from database import SessionLocal

class CRMService:
    @staticmethod
    def upsert_customer(db: Session, tenant_id: int, phone: str, name: str = None):
        """Lógica base de registro de cliente."""
        if not phone: return
        
        customer = db.query(models.Customer).filter_by(tenant_id=tenant_id, phone=phone).first()
        if customer:
            if name: customer.name = name
            customer.last_interaction = datetime.utcnow()
        else:
            customer = models.Customer(
                tenant_id=tenant_id,
                phone=phone,
                name=name,
                created_at=datetime.utcnow(),
                last_interaction=datetime.utcnow()
            )
            db.add(customer)
            db.flush() # Obtener ID para el evento
            
            # EMITIR EVENTO DE DESCUBRIMIENTO
            # Esto permite que Marketing reaccione sin que CRM sepa qué hace Marketing.
            asyncio.create_task(bus.publish("CUSTOMER_CREATED", {
                "tenant_id": tenant_id,
                "customer_id": customer.id,
                "phone": phone,
                "name": name
            }))
        
        db.commit()
        return customer

# --- LISTENERS DE DOMINIO ---

async def on_order_created(payload: dict):
    """
    Reacciona al evento ORDER_CREATED.
    Este es el desacople real.
    """
    db = SessionLocal()
    try:
        CRMService.upsert_customer(
            db, 
            tenant_id=payload['tenant_id'],
            phone=payload.get('phone'),
            name=payload.get('customer_name')
        )
        print(f"[CRM] Cliente sincronizado automáticamente tras pedido #{payload['order_id']}")
    finally:
        db.close()

# Suscribir el listener al bus
bus.subscribe("ORDER_CREATED", on_order_created)
