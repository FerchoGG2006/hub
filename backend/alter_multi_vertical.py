import sqlalchemy as sa
from database import engine

columns_to_add = [
    "ALTER TABLE tenants ADD COLUMN business_type VARCHAR(50) DEFAULT 'restaurant';",
    "ALTER TABLE tenants ADD COLUMN settings JSON DEFAULT '{}';",
    "ALTER TABLE products ADD COLUMN price_type VARCHAR(20) DEFAULT 'fixed';",
    "ALTER TABLE orders ADD COLUMN start_date TIMESTAMP;",
    "ALTER TABLE orders ADD COLUMN end_date TIMESTAMP;"
]

for stmt in columns_to_add:
    try:
        with engine.begin() as conn:
            conn.execute(sa.text(stmt))
        print(f"Success: {stmt}")
    except Exception as e:
        print(f"Skipping or error for stmt: {stmt}\n  => {e}")

print("Alter executed successfully.")
