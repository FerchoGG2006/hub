import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def fix_db():
    queries = [
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS ig_account_id VARCHAR(100);",
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS ig_token VARCHAR(255);",
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS ig_username VARCHAR(100);",
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS ig_profile_picture TEXT;",
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS autopilot_active BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS opening_time VARCHAR(5);",
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS closing_time VARCHAR(5);",
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Bogota';",
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS tt_account_id VARCHAR(100);",
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS tt_token VARCHAR(255);",
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS tt_username VARCHAR(100);",
        "ALTER TABLE branches ADD COLUMN IF NOT EXISTS tt_profile_picture VARCHAR(500);"
    ]
    
    with engine.connect() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
                conn.commit()
                print(f"Executed: {q}")
            except Exception as e:
                print(f"Error executing {q}: {e}")

if __name__ == "__main__":
    fix_db()
    print("Base de datos actualizada con las columnas de Instagram Autopilot.")
