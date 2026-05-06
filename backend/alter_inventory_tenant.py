import sqlalchemy as sa
from database import engine

stmt = "ALTER TABLE inventory ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id);"

try:
    with engine.begin() as conn:
        conn.execute(sa.text(stmt))
        # Si ya había datos, esto podría fallar por el NOT NULL si no asignamos uno.
        # Pero como la tabla es nueva (Fase 3), es probable que esté vacía o podamos poblarla.
        conn.execute(sa.text("UPDATE inventory SET tenant_id = (SELECT tenant_id FROM products WHERE products.id = inventory.product_id) WHERE product_id IS NOT NULL;"))
    print("Columna 'tenant_id' agregada exitosamente a la tabla 'inventory' y datos sincronizados.")
except Exception as e:
    print(f"Error al ejecutar la migración: {e}")
