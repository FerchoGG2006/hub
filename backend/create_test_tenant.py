"""
Script para crear un tenant de prueba: "El Fogón Dorado"
Con usuario admin: fogon_admin / admin123
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from database import SessionLocal
from models import Tenant, Branch, Category, Product, User
from auth import get_password_hash

db = SessionLocal()

try:
    # 1. Verificar si ya existe
    existing = db.query(Tenant).filter_by(slug="el-fogon-dorado").first()
    if existing:
        print(f"⚠️  El tenant 'el-fogon-dorado' ya existe (ID: {existing.id}). Abortando.")
        sys.exit(0)

    # 2. Crear el Tenant
    tenant = Tenant(
        slug="el-fogon-dorado",
        name="El Fogón Dorado",
        brand_color="#e63946",
        whatsapp_number="573001234567",
        whatsapp_message="¡Hola! Quiero hacer este pedido del Fogón Dorado:",
        subscription_status="active"
    )
    db.add(tenant)
    db.flush()  # Obtener el ID antes de commit
    print(f"✅ Tenant creado: '{tenant.name}' (slug: {tenant.slug}, ID: {tenant.id})")

    # 3. Crear una Sede
    branch = Branch(
        tenant_id=tenant.id,
        name="Sede Central",
        slug="central",
        whatsapp_number="573001234567",
        address="Calle 85 #15-40, Bogotá",
        is_active=True
    )
    db.add(branch)
    print(f"✅ Sede creada: '{branch.name}'")

    # 4. Crear Categorías y Productos
    categories_data = {
        "Entradas": {
            "icon": "🥗",
            "products": [
                {"name": "Empanadas Criollas", "description": "Empanadas rellenas de carne desmechada con hogao", "price": "8.000", "emoji": "🥟"},
                {"name": "Patacones con Guacamole", "description": "Patacones crujientes con guacamole fresco y pico de gallo", "price": "12.000", "emoji": "🥑"},
                {"name": "Arepas Rellenas", "description": "Arepas de maíz rellenas de queso y chicharrón", "price": "10.000", "emoji": "🫓"},
            ]
        },
        "Platos Fuertes": {
            "icon": "🍖",
            "products": [
                {"name": "Bandeja Paisa", "description": "El clásico: frijoles, arroz, carne molida, chicharrón, huevo, plátano y aguacate", "price": "28.000", "emoji": "🍛"},
                {"name": "Lomo al Fogón", "description": "Lomo de res a la parrilla con chimichurri artesanal y papas doradas", "price": "35.000", "emoji": "🥩"},
                {"name": "Trucha en Salsa de Maracuyá", "description": "Filete de trucha fresca en reducción de maracuyá con arroz de coco", "price": "32.000", "emoji": "🐟"},
            ]
        },
        "Bebidas": {
            "icon": "🍹",
            "products": [
                {"name": "Limonada de Coco", "description": "Limonada cremosa con leche de coco y hierbabuena", "price": "8.000", "emoji": "🥥"},
                {"name": "Jugo de Lulo", "description": "Jugo natural de lulo con hielo", "price": "6.000", "emoji": "🍊"},
                {"name": "Aguapanela con Limón", "description": "Bebida tradicional de panela con limón fresco", "price": "5.000", "emoji": "🍯"},
            ]
        },
        "Postres": {
            "icon": "🍰",
            "products": [
                {"name": "Tres Leches", "description": "Torta húmeda bañada en tres leches con canela", "price": "12.000", "emoji": "🎂"},
                {"name": "Oblea con Arequipe", "description": "Oblea crocante con arequipe casero y coco rallado", "price": "7.000", "emoji": "🧇"},
            ]
        }
    }

    for cat_name, cat_data in categories_data.items():
        cat = Category(
            tenant_id=tenant.id,
            name=cat_name,
            icon=cat_data["icon"]
        )
        db.add(cat)
        db.flush()

        for prod_data in cat_data["products"]:
            prod = Product(
                tenant_id=tenant.id,
                category_id=cat.id,
                name=prod_data["name"],
                description=prod_data["description"],
                price=prod_data["price"],
                emoji=prod_data["emoji"],
                is_available=True
            )
            db.add(prod)
        
        print(f"✅ Categoría '{cat_name}' con {len(cat_data['products'])} productos")

    # 5. Crear el Usuario Admin
    admin_user = User(
        username="fogon_admin",
        hashed_password=get_password_hash("admin123"),
        role="admin",
        tenant_id=tenant.id
    )
    db.add(admin_user)
    print(f"✅ Usuario admin creado: fogon_admin")

    # 6. Commit
    db.commit()
    
    print("\n" + "="*50)
    print("🎉 TENANT CREADO EXITOSAMENTE")
    print("="*50)
    print(f"📋 Restaurante: {tenant.name}")
    print(f"🔗 Menú Digital: http://localhost:3000/{tenant.slug}")
    print(f"🛠️  Panel Admin:  http://localhost:3000/admin/{tenant.slug}")
    print(f"👤 USER_ID:      fogon_admin")
    print(f"🔑 PASSCODE:     admin123")
    print("="*50)

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
