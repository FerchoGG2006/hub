import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import models

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Falta DATABASE_URL en .env")
    exit(1)

engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require", "options": "-c timezone=utc", "keepalives": 1, "keepalives_idle": 30, "keepalives_interval": 10, "keepalives_count": 5}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_data():
    print("Limpiando y Recreando esquema Multi-Tenant en Neon DB...")
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Crear el primer Tenant Master: La Rivera
    t_rivera = models.Tenant(
        slug="la-rivera",
        name="La Rivera Restaurante",
        brand_color="#f59e0b",
        whatsapp_number="573210000000",
        whatsapp_message="Hola HUB, mi orden:"
    )
    db.add(t_rivera)
    db.commit()
    db.refresh(t_rivera)
    print(f"Tenant Creado: {t_rivera.name} (ID: {t_rivera.id})")

    # 2. Categorías asociadas a La Rivera
    c1 = models.Category(name="Entradas", icon="🥟", tenant_id=t_rivera.id)
    c2 = models.Category(name="Platos Fuertes", icon="🥘", tenant_id=t_rivera.id)
    c3 = models.Category(name="Cócteles", icon="🍸", tenant_id=t_rivera.id)
    
    db.add_all([c1, c2, c3])
    db.commit()
    db.refresh(c1)
    db.refresh(c2)
    db.refresh(c3)

    # 3. Productos
    productos = [
        models.Product(tenant_id=t_rivera.id, category_id=c1.id, name="Empanadas Vallunas", description="Rellenas de guiso tradicional con ají de lulo.", price="$12.000", emoji="🥟"),
        models.Product(tenant_id=t_rivera.id, category_id=c1.id, name="Ceviche de Chicharrón", description="Crocante panceta en leche de tigre al cilantro.", price="$22.000", emoji="🍋"),
        models.Product(tenant_id=t_rivera.id, category_id=c2.id, name="Bife de Chorizo", description="Corte madurado 400g con chimichurri.", price="$55.000", emoji="🥩"),
        models.Product(tenant_id=t_rivera.id, category_id=c2.id, name="Salchipapa", description="La mejor salchipapa del mundo.", price="$23.000", emoji="🍟"),
        models.Product(tenant_id=t_rivera.id, category_id=c3.id, name="Margarita Clásica", description="Tequila 100% agave, triple sec y limón taiti.", price="$28.000", emoji="🍸")
    ]
    db.add_all(productos)
    db.commit()
    
    # 4. Crear un segundo Tenant de prueba para evidenciar que funciona
    t_pizza = models.Tenant(
        slug="pizzacol",
        name="Pizza Colombia",
        brand_color="#e11d48", # Rosa oscuro / Rojo rosa
        whatsapp_number="573000000000",
    )
    db.add(t_pizza)
    db.commit()
    db.refresh(t_pizza)
    
    c_pizzas = models.Category(name="Pizzas Artesanales", icon="🍕", tenant_id=t_pizza.id)
    db.add(c_pizzas)
    db.commit()
    db.refresh(c_pizzas)
    
    prod_pizza = models.Product(
        tenant_id=t_pizza.id, category_id=c_pizzas.id, 
        name="Pizza Margarita", description="Mozzarella, tomate San Marzano y albahaca fresca.", 
        price="$35.000", emoji="🍕"
    )
    db.add(prod_pizza)
    db.commit()

    print("Creando Usuarios Administradores...")
    import auth
    # Superadmin global
    superadmin = models.User(
        username="superadmin",
        hashed_password=auth.get_password_hash("superadmin123"),
        role="superadmin",
        tenant_id=None
    )
    db.add(superadmin)

    # Admin La Rivera
    admin_rivera = models.User(
        username="admin_rivera",
        hashed_password=auth.get_password_hash("rivera123"),
        role="admin",
        tenant_id=t_rivera.id
    )
    db.add(admin_rivera)

    # Admin Pizza
    admin_pizza = models.User(
        username="admin_pizza",
        hashed_password=auth.get_password_hash("pizza123"),
        role="admin",
        tenant_id=t_pizza.id
    )
    db.add(admin_pizza)

    db.commit()

    print("Operacion completada: Multiples tenants y usuarios inyectados con exito.")

if __name__ == "__main__":
    seed_data()
