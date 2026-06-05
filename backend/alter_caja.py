import sqlalchemy as sa
from database import engine

dialect = engine.dialect.name
print(f"Detectando dialecto de base de datos: {dialect}")

create_sessions = """
CREATE TABLE IF NOT EXISTS cash_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    opened_by VARCHAR(100),
    closed_by VARCHAR(100),
    base_amount INTEGER DEFAULT 0,
    real_cash INTEGER,
    status VARCHAR(20) DEFAULT 'open',
    notes TEXT
);
"""

create_expenses = """
CREATE TABLE IF NOT EXISTS cash_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    amount INTEGER NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);
"""

for name, stmt in [("cash_sessions", create_sessions), ("cash_expenses", create_expenses)]:
    try:
        with engine.begin() as conn:
            conn.execute(sa.text(stmt))
        print(f"Tabla '{name}' creada o validada exitosamente.")
    except Exception as e:
        print(f"Error al crear tabla '{name}': {e}")

print("Proceso de migración de Caja finalizado.")
