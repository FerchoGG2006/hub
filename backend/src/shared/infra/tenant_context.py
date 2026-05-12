from contextvars import ContextVar
from typing import Optional

# Variable de contexto para el Tenant actual
_tenant_id: ContextVar[Optional[int]] = ContextVar("tenant_id", default=None)

class TenantContext:
    """
    Gestiona el aislamiento de datos (Multi-tenancy) de forma transparente.
    Evita pasar tenant_id manualmente en cada función del sistema.
    """
    @staticmethod
    def set(tenant_id: int):
        _tenant_id.set(tenant_id)

    @staticmethod
    def get() -> int:
        tid = _tenant_id.get()
        if tid is None:
            raise RuntimeError("Se intentó acceder al TenantContext fuera de un contexto válido.")
        return tid

    @staticmethod
    def clear():
        _tenant_id.set(None)
