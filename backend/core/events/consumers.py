from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from datetime import datetime, timedelta

def process_analytics(db: Session):
    """
    Consumidor que procesa eventos recientes para generar insights de negocio.
    Se ejecuta de forma asíncrona vía scheduler.
    """
    # 1. Obtener eventos no procesados (aquí podríamos usar un flag 'processed')
    # Por simplicidad, analizaremos eventos de las últimas 24h para el dashboard diario.
    since = datetime.utcnow() - timedelta(hours=24)
    events = db.query(models.BusinessEvent).filter(models.BusinessEvent.created_at >= since).all()
    
    if not events:
        return
    
    # Ejemplo: Agrupar ventas por tenant
    stats = {}
    for ev in events:
        tid = ev.tenant_id
        if tid not in stats: stats[tid] = {"sales": 0, "orders": 0, "products": {}}
        
        if ev.type == "order_created":
            stats[tid]["orders"] += 1
            stats[tid]["sales"] += ev.payload.get("total_price", 0)
            
        elif ev.type == "product_viewed":
            pid = ev.payload.get("product_id")
            stats[tid]["products"][pid] = stats[tid]["products"].get(pid, 0) + 1

    # Aquí guardaríamos en una tabla de 'daily_analytics' o similar
    # print(f"[Analytics] Procesados {len(events)} eventos para {len(stats)} negocios.")

def recommendation_engine(db: Session):
    """
    Prepara la estructura para recomendaciones basadas en comportamiento.
    """
    # Futura implementación de filtrado colaborativo o IA
    pass
