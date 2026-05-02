from dotenv import load_dotenv
load_dotenv()
import os
from sqlalchemy import create_engine, text

e = create_engine(os.getenv("DATABASE_URL"), connect_args={"sslmode": "require"})
c = e.connect()
r = c.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='special_events' ORDER BY ordinal_position"))
cols = [row[0] for row in r]
print("Columns:", cols)
c.close()
