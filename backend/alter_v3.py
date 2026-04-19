import sqlalchemy as sa
from database import engine

columns_to_add = [
    "ALTER TABLE orders ADD COLUMN created_at TIMESTAMP DEFAULT NOW();",
    "ALTER TABLE orders ADD COLUMN customer_name VARCHAR(100);"
]

for stmt in columns_to_add:
    try:
        with engine.begin() as conn:
            conn.execute(sa.text(stmt))
    except Exception as e:
        print(f"Skipping or error for stmt: {stmt}\n  => {e}")

print("Alter V3 executed successfully.")
