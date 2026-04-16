"""
seed_db.py — Poblar Neon DB con categorías y productos de ejemplo.

Ejecutar desde la carpeta raíz del proyecto:
    cd lacarta
    python -m backend.seed_db

O directamente desde la carpeta backend (sin el paquete):
    cd lacarta/backend
    python seed_db.py
"""
import os, sys
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Permite ejecutar como script directo (sin paquete)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no encontrada en .env")

from models import Base, Category, Product, Order  # noqa: E402

engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"})
Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()


def seed_data():
    print("🗑  Limpiando datos existentes…")
    db.query(Product).delete()
    db.query(Order).delete()
    db.query(Category).delete()
    db.commit()

    # ── Categorías (cada una es una "hoja" del libro 3D) ──
    print("📂 Creando categorías…")
    cat_entradas = Category(name="Entradas",           icon="🌿")
    cat_fuertes  = Category(name="Fuertes",            icon="🔥")
    cat_licores  = Category(name="Licores",            icon="🥃")
    db.add_all([cat_entradas, cat_fuertes, cat_licores])
    db.commit()

    # ── Productos ──
    print("🍽️  Añadiendo productos…")
    productos = [
        # Entradas
        Product(category_id=cat_entradas.id, emoji="🐟", name="Ceviche Valle",
                price="$32k", description="Pesca del día maridada con cítricos y suero costeño.",
                image_url="https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400"),
        Product(category_id=cat_entradas.id, emoji="🍌", name="Patacón Power",
                price="$18k", description="Base crocante con ahogao artesanal y queso fundido.",
                image_url="https://images.unsplash.com/photo-1541529086526-db283c563270?w=400"),
        Product(category_id=cat_entradas.id, emoji="🫓", name="Empanaditas",
                price="$15k", description="Cuatro unidades rellenas de carne desmechada.",
                image_url="https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400"),
        Product(category_id=cat_entradas.id, emoji="🥩", name="Carpaccio Res",
                price="$35k", description="Láminas finas con aceite de trufa y parmesano.",
                image_url="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400"),
        Product(category_id=cat_entradas.id, emoji="🧀", name="Tabla de Quesos",
                price="$42k", description="Selección artesanal con miel, nueces y mermelada.",
                image_url="https://images.unsplash.com/photo-1486297678162-eb2a19b0a318?w=400"),
        Product(category_id=cat_entradas.id, emoji="🌮", name="Nachos Rivera",
                price="$25k", description="Con chili, guacamole y pico de gallo fresco.",
                image_url="https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400"),

        # Fuertes
        Product(category_id=cat_fuertes.id, emoji="🔥", name="Punta de Anca",
                price="$55k", description="350g a la parrilla con papas rústicas y hogao.",
                image_url="https://images.unsplash.com/photo-1544025162-d76694265947?w=400"),
        Product(category_id=cat_fuertes.id, emoji="🍕", name="Pizza Artisanal",
                price="$32k", description="Masa madre, pepperoni curado y miel picante.",
                image_url="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"),
        Product(category_id=cat_fuertes.id, emoji="🫒", name="Salmón Grill",
                price="$48k", description="A la plancha con puré de coliflor y espárragos.",
                image_url="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400"),
        Product(category_id=cat_fuertes.id, emoji="🍔", name="Burger Monster",
                price="$35k", description="Triple carne, cheddar importado y tocineta crocante.",
                image_url="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"),
        Product(category_id=cat_fuertes.id, emoji="🍚", name="Risotto Trufa",
                price="$52k", description="Arroz arborio cremoso con trufa negra y parmesano.",
                image_url="https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400"),
        Product(category_id=cat_fuertes.id, emoji="🐙", name="Pulpo a la Parrilla",
                price="$68k", description="Tentáculos braseados con aceite de pimentón ahumado.",
                image_url="https://images.unsplash.com/photo-1559742811-822873691df8?w=400"),

        # Licores
        Product(category_id=cat_licores.id, emoji="🥃", name="Old Parr 12",
                price="$180k", description="Botella 750ml con hielo cristalino y agua de manantial.",
                image_url="https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400"),
        Product(category_id=cat_licores.id, emoji="🍾", name="Ron Dictador 12",
                price="$95k", description="Ron colombiano premium añejado en roble americano.",
                image_url="https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400"),
        Product(category_id=cat_licores.id, emoji="🍺", name="Corona Extra",
                price="$12k", description="Cerveza premium bien fría, servida con limón.",
                image_url="https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400"),
        Product(category_id=cat_licores.id, emoji="🍹", name="Cóctel de Casa",
                price="$28k", description="Creación del bartender con ron, fruta y jengibre.",
                image_url="https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400"),
        Product(category_id=cat_licores.id, emoji="🍷", name="Vino Tinto Reserva",
                price="$45k", description="Malbec argentino. Frutas rojas, taninos suaves.",
                image_url="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400"),
        Product(category_id=cat_licores.id, emoji="☕", name="Café Especial",
                price="$9k", description="Origen Sierra Nevada. Preparado en V60 o espresso.",
                image_url="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400"),
    ]

    db.add_all(productos)
    db.commit()
    print(f"✅ {len(productos)} productos insertados en Neon DB.")
    print("   Abre tu panel en https://console.neon.tech para verificar.")


if __name__ == "__main__":
    seed_data()
    db.close()
