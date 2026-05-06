import sqlalchemy as sa
from database import engine

# Definimos el comando para crear la tabla business_events
stmt = """
CREATE TABLE IF NOT EXISTS business_events (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    type VARCHAR(50) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

try:
    with engine.begin() as conn:
        conn.execute(sa.text(stmt))
    print("Tabla 'business_events' creada exitosamente.")
except Exception as e:
    print(f"Error al ejecutar la migración: {e}")
