import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from datetime import datetime, timedelta
import json

logger = logging.getLogger("tech-gastro-hub")

def evaluate_rules(db: Session, tenant_id: int, event_type: str, payload: dict):
    """
    Evalúa las reglas de automatización activas para un evento específico.
    """
    rules = db.query(models.AutomationRule).filter_by(
        tenant_id=tenant_id, 
        trigger_event=event_type, 
        is_active=True
    ).all()
    
    for rule in rules:
        try:
            if _check_condition(db, tenant_id, rule.condition_json, payload):
                _execute_action(db, tenant_id, rule.action_json, payload)
        except Exception as e:
            logger.error(f"Error evaluando regla {rule.id}: {str(e)}")

def _check_condition(db: Session, tenant_id: int, condition: dict, payload: dict) -> bool:
    """
    Lógica de comprobación de condiciones.
    """
    # Ejemplo: Regla de "Producto Frío" (Ventas bajas)
    if condition.get("type") == "low_sales":
        days = condition.get("days", 7)
        threshold = condition.get("threshold", 5)
        
        # Consultar ventas reales en ese periodo
        # Simplificado: En un entorno real, cruzaríamos con la tabla orders
        # Aquí simularemos que si el payload indica un producto específico, revisamos su performance
        return True # Simulamos match para el ejemplo
        
    return True

def _execute_action(db: Session, tenant_id: int, action: dict, payload: dict):
    """
    Ejecuta la acción definida (usualmente crear una sugerencia).
    """
    action_type = action.get("type")
    
    if action_type == "create_suggestion":
        new_suggestion = models.Suggestion(
            tenant_id=tenant_id,
            type="suggestion",
            message=action.get("message", "Sugerencia del sistema"),
            metadata_json=payload
        )
        db.add(new_suggestion)
        db.commit()
        logger.info(f"Nueva sugerencia creada para tenant {tenant_id}")

def seed_default_rules(db: Session, tenant_id: int):
    """
    Crea reglas básicas para un nuevo negocio.
    """
    rules = [
        models.AutomationRule(
            tenant_id=tenant_id,
            trigger_event="order_paid",
            condition_json={"type": "low_sales", "days": 7, "threshold": 10},
            action_json={
                "type": "create_suggestion", 
                "message": "🔥 OPORTUNIDAD: El producto 'Especial del Día' tiene ventas bajas. ¿Deseas aplicar un descuento del 15% para mover inventario?"
            }
        ),
        models.AutomationRule(
            tenant_id=tenant_id,
            trigger_event="order_paid",
            condition_json={"type": "frequent_customer"},
            action_json={
                "type": "create_suggestion", 
                "message": "👑 CLIENTE VIP: Andrés ha realizado 5 pedidos este mes. Sugerimos enviarle un postre gratis en su próxima visita."
            }
        )
    ]
    db.add_all(rules)
    db.commit()
