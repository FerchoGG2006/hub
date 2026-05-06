# Central Registry of Modules for Tech Gastro Hub
# This defines the capabilities available in the system for different sectors.

MODULE_REGISTRY = {
    "orders": {
        "name": "Gestión de Pedidos",
        "description": "Permite recibir y procesar pedidos en tiempo real.",
        "core": True
    },
    "products": {
        "name": "Catálogo de Productos",
        "description": "Gestión básica de menú y productos.",
        "core": True
    },
    "tables": {
        "name": "Gestión de Mesas",
        "description": "Habilita la asignación de pedidos a mesas físicas y generación de QRs por mesa.",
        "core": False
    },
    "variants": {
        "name": "Variantes de Producto",
        "description": "Soporte para tallas, colores, combos y personalizaciones complejas.",
        "core": False
    },
    "inventory": {
        "name": "Control de Inventario",
        "description": "Seguimiento de stock en tiempo real para productos y variantes.",
        "core": False
    },
    "marketing": {
        "name": "Marketing AI",
        "description": "Generación de campañas y briefings estratégicos con IA.",
        "core": False
    },
    "autopilot": {
        "name": "Instagram Autopilot",
        "description": "Sincronización y respuestas automáticas en redes sociales.",
        "core": False
    }
}

def get_module_info(module_name: str):
    return MODULE_REGISTRY.get(module_name)

def list_available_modules():
    return MODULE_REGISTRY
