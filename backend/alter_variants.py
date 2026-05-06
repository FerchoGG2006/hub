import sqlalchemy as sa
from database import engine
import models

# 1. Agregar columna 'type' a products
try:
    with engine.begin() as conn:
        conn.execute(sa.text("ALTER TABLE products ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'simple';"))
    print("Columna 'type' agregada a 'products'.")
except Exception as e:
    print(f"Error agregando columna 'type': {e}")

# 2. Crear tablas nuevas (product_variants, inventory)
# create_all no rompe tablas existentes, solo crea las nuevas.
try:
    models.Base.metadata.create_all(bind=engine)
    print("Tablas 'product_variants' e 'inventory' creadas (si no existían).")
except Exception as e:
    print(f"Error creando tablas: {e}")

print("Migración de Variantes e Inventario finalizada.")
