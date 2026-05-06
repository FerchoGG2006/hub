import sqlalchemy as sa
from database import engine

stmt = "ALTER TABLE orders ALTER COLUMN table_number TYPE VARCHAR(255);"

try:
    with engine.begin() as conn:
        conn.execute(sa.text(stmt))
    print("Columna 'table_number' ampliada a 255 caracteres en la tabla 'orders'.")
except Exception as e:
    print(f"Error al ejecutar la migración: {e}")
