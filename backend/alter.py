import sqlalchemy as sa
from database import engine

columns_to_add = [
    "ALTER TABLE tenants ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'active';",
    "ALTER TABLE tenants ADD COLUMN valid_until TIMESTAMP;",
    "ALTER TABLE tenants ADD COLUMN instagram_url VARCHAR(255);",
    "ALTER TABLE tenants ADD COLUMN tiktok_url VARCHAR(255);",
    "ALTER TABLE tenants ADD COLUMN maps_url VARCHAR(255);"
]

for stmt in columns_to_add:
    try:
        with engine.begin() as conn:
            conn.execute(sa.text(stmt))
    except Exception as e:
        print(f"Skipping or error for stmt: {stmt}\n  => {e}")

print("Alter executed successfully.")
