import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
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
    options = {'pool_pre_ping': True, 'connect_args': {'sslmode': os.getenv('DB_SSLMODE', 'require'), 'connect_timeout': 15}}
    if os.getenv('DB_POOL_MODE') == 'null':
        # Close idle connections so free hosts and Neon can suspend normally.
        options['poolclass'] = NullPool
    else:
        options.update(pool_size=int(os.getenv('DB_POOL_SIZE', '2')),
                       max_overflow=int(os.getenv('DB_MAX_OVERFLOW', '3')), pool_recycle=300)
    engine = create_engine(DATABASE_URL, **options)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependencia FastAPI — devuelve una sesión y la cierra al final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
