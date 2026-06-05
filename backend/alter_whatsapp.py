import sqlalchemy as sa
from database import engine

dialect = engine.dialect.name
print(f"Detectando dialecto de base de datos: {dialect}")

# 1. Agregar columnas a 'tenants' de forma segura
columns_to_add = [
    ("chatbot_enabled", "BOOLEAN DEFAULT TRUE"),
    ("chatbot_personality", "TEXT DEFAULT 'Eres PlatoBot, el asistente inteligente de este restaurante. Responde preguntas sobre el menú de forma amable y concisa.'")
]

for col_name, col_type in columns_to_add:
    stmt = f"ALTER TABLE tenants ADD COLUMN {col_name} {col_type};"
    try:
        with engine.begin() as conn:
            conn.execute(sa.text(stmt))
        print(f"Columna '{col_name}' agregada exitosamente a 'tenants'.")
    except Exception as e:
        print(f"Omitiendo columna '{col_name}' en 'tenants' (posiblemente ya existe): {e}")

# 2. Crear tablas de WhatsApp e Inbox
if dialect == "sqlite":
    create_whatsapp_messages = """
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        customer_id INTEGER REFERENCES customers(id),
        phone VARCHAR(20) NOT NULL,
        sender VARCHAR(20) NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    create_cart_sessions = """
    CREATE TABLE IF NOT EXISTS cart_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        phone VARCHAR(20) NOT NULL,
        customer_name VARCHAR(100),
        items_json TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
else:  # PostgreSQL
    create_whatsapp_messages = """
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        customer_id INTEGER REFERENCES customers(id),
        phone VARCHAR(20) NOT NULL,
        sender VARCHAR(20) NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    create_cart_sessions = """
    CREATE TABLE IF NOT EXISTS cart_sessions (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        phone VARCHAR(20) NOT NULL,
        customer_name VARCHAR(100),
        items_json TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

# Ejecutar creación de tablas
for name, stmt in [("whatsapp_messages", create_whatsapp_messages), ("cart_sessions", create_cart_sessions)]:
    try:
        with engine.begin() as conn:
            conn.execute(sa.text(stmt))
        print(f"Tabla '{name}' creada o validada exitosamente.")
    except Exception as e:
        print(f"Error al crear tabla '{name}': {e}")

print("Proceso de migración de WhatsApp e Inbox finalizado.")
