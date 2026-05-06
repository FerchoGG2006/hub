import sqlalchemy as sa
from database import engine

# Definimos el comando para agregar la columna enabled_modules
# Usamos JSONB si estamos en Postgres (recomendado) o JSON
# Dado que models.py usa JSON, usaremos JSON aquí también.
stmt = "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS enabled_modules JSON DEFAULT '[]'::json;"

try:
    with engine.begin() as conn:
        conn.execute(sa.text(stmt))
    print("Columna 'enabled_modules' agregada exitosamente a la tabla 'tenants'.")
except Exception as e:
    print(f"Error al ejecutar la migración: {e}")

print("Proceso de alteración finalizado.")
