from sqlalchemy.orm import Session
import models

def has_module(db: Session, tenant_id: int, module_name: str) -> bool:
    """
    Verifica si un Tenant específico tiene habilitado un módulo.
    Utiliza el tenant_id para buscar en la base de datos.
    """
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        return False
    
    # Si enabled_modules es None, devolvemos los básicos por defecto
    enabled = tenant.enabled_modules or ["orders", "products"]
    return module_name in enabled

def get_enabled_modules(db: Session, tenant_id: int) -> list[str]:
    """
    Retorna la lista de módulos habilitados para un tenant.
    """
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        return []
    return tenant.enabled_modules or ["orders", "products"]
