"""
Migración: Crear tabla special_events (fix)
Ejecutar: python alter_events.py
"""
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"})

with engine.connect() as conn:
    # Drop if exists (safe for migration retry)
    conn.execute(text("DROP TABLE IF EXISTS special_events CASCADE;"))
    conn.commit()
    
    conn.execute(text("""
        CREATE TABLE special_events (
            id SERIAL PRIMARY KEY,
            restaurant_id INTEGER NOT NULL REFERENCES tenants(id),
            client_name VARCHAR(100) NOT NULL,
            client_phone VARCHAR(30) NOT NULL,
            event_type VARCHAR(30) DEFAULT 'otro',
            event_date TIMESTAMP,
            guests_count INTEGER DEFAULT 1,
            extras JSONB DEFAULT '[]'::jsonb,
            notes TEXT,
            admin_notes TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW()
        );
    """))
    conn.commit()
    
    conn.execute(text("""
        CREATE INDEX idx_special_events_restaurant 
        ON special_events(restaurant_id);
    """))
    conn.execute(text("""
        CREATE INDEX idx_special_events_status 
        ON special_events(status);
    """))
    conn.commit()
    print("✅ Tabla special_events creada exitosamente.")
