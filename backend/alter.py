import sqlalchemy as sa
from database import engine

con = engine.connect()
try:
    con.execute(sa.text("ALTER TABLE tenants ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'active';"))
except Exception as e:
    print("Error col 1:", e)

try:
    con.execute(sa.text("ALTER TABLE tenants ADD COLUMN valid_until TIMESTAMP;"))
except Exception as e:
    print("Error col 2:", e)

con.commit()
con.close()
print("Alter executed.")
