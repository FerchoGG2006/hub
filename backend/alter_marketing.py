import sqlalchemy as sa
from database import engine

dialect = engine.dialect.name
print(f"Detectando dialecto de base de datos: {dialect}")

# 1. Agregar columnas a 'customers' de forma segura
columns_to_add = [
    ("whatsapp_opt_in", "BOOLEAN DEFAULT TRUE"),
    ("instagram_username", "VARCHAR(100)"),
    ("last_order_at", "TIMESTAMP"),
    ("tags", "JSON" if dialect == "sqlite" else "JSONB DEFAULT '[]'::jsonb")
]

for col_name, col_type in columns_to_add:
    stmt = f"ALTER TABLE customers ADD COLUMN {col_name} {col_type};"
    try:
        with engine.begin() as conn:
            conn.execute(sa.text(stmt))
        print(f"Columna '{col_name}' agregada exitosamente a 'customers'.")
    except Exception as e:
        # Si la columna ya existe, fallará de forma controlada y continuará
        print(f"Omitiendo columna '{col_name}': {e}")

# 2. Crear tabla de campañas masivas
if dialect == "sqlite":
    create_campaigns = """
    CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        name VARCHAR(100) NOT NULL,
        campaign_type VARCHAR(20) NOT NULL,
        audience_filter VARCHAR(50) DEFAULT 'all',
        message_body TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    create_campaign_jobs = """
    CREATE TABLE IF NOT EXISTS campaign_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        delivered_at TIMESTAMP,
        failed_reason TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
else:  # PostgreSQL
    create_campaigns = """
    CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES tenants(id),
        name VARCHAR(100) NOT NULL,
        campaign_type VARCHAR(20) NOT NULL,
        audience_filter VARCHAR(50) DEFAULT 'all',
        message_body TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    create_campaign_jobs = """
    CREATE TABLE IF NOT EXISTS campaign_jobs (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        delivered_at TIMESTAMP,
        failed_reason TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

# Ejecutar creación de tablas
for name, stmt in [("campaigns", create_campaigns), ("campaign_jobs", create_campaign_jobs)]:
    try:
        with engine.begin() as conn:
            conn.execute(sa.text(stmt))
        print(f"Tabla '{name}' creada o validada exitosamente.")
    except Exception as e:
        print(f"Error al crear tabla '{name}': {e}")

print("Proceso de migración de Marketing Hub finalizado.")
