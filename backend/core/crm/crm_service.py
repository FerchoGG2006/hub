from sqlalchemy.orm import Session
import models
from datetime import datetime

def upsert_customer(db: Session, tenant_id: int, phone: str, name: str = None, email: str = None):
    """
    Registra o actualiza un cliente en la base de datos centralizada.
    Si el teléfono ya existe para ese restaurante, actualiza la última interacción.
    """
    if not phone:
        return None

    # Buscar si ya existe
    customer = db.query(models.Customer).filter_by(tenant_id=tenant_id, phone=phone).first()

    if customer:
        # Actualizar datos existentes
        if name: customer.name = name
        if email: customer.email = email
        customer.last_interaction = datetime.utcnow()
    else:
        # Crear nuevo cliente
        customer = models.Customer(
            tenant_id=tenant_id,
            phone=phone,
            name=name,
            email=email,
            created_at=datetime.utcnow(),
            last_interaction=datetime.utcnow()
        )
        db.add(customer)
    
    try:
        db.commit()
        db.refresh(customer)
        return customer
    except Exception as e:
        db.rollback()
        print(f"Error en CRM Upsert: {e}")
        return None
