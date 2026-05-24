import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definida en el .env")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # psycopg2-binary requiere que el sslmode ya venga en el connection string
    # Neon lo exige: sslmode=require&channel_binding=require
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,                # Aumentamos el tamaño base para soportar workers y api
        max_overflow=20,             # Permitimos picos de hasta 30 conexiones
        pool_pre_ping=True,          # detecta conexiones muertas antes de usarlas
        pool_recycle=300,            # recicla conexiones cada 5 min (Neon cierra idle > 5 min)
        connect_args={
            "sslmode": "require",    # garantía doble para psycopg2-binary
        },
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependencia FastAPI — devuelve una sesión y la cierra al final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
