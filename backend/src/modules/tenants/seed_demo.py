"""
seed_demo.py — Genera datos demo realistas para un tenant recién creado.

Las métricas del dashboard se CALCULAN de estos datos (no son hardcoded).
Cada tenant obtiene datos contextuales distintos.
"""
import json
import random
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models

logger = logging.getLogger("platorin.seed")

# ═══════════════════════════════════════════════════════════════
#  DEMO DATA POOLS
# ═══════════════════════════════════════════════════════════════

CUSTOMER_NAMES = [
    "Juan Camilo", "María Fernanda", "Andrés Felipe", "Laura Valentina",
    "Carlos Andrés", "Daniela Patricia", "Santiago José", "Natalia Andrea",
    "Diego Alejandro", "Camila Sofia", "Julián David", "Valentina Isabel",
]

CUSTOMER_PHONES = [
    "3001234567", "3109876543", "3201122334", "3155544332",
    "3187766554", "3006655443", "3112233445", "3148877665",
    "3169988776", "3002211009", "3133344556", "3177788990",
]

ORDER_STATUSES = ["pending", "preparing", "ready", "delivered", "paid"]

# ═══════════════════════════════════════════════════════════════
#  MAIN SEED FUNCTION
# ═══════════════════════════════════════════════════════════════

def seed_restaurant_demo(db: Session, tenant_id: int):
    """
    Genera datos demo para un restaurante recién registrado.
    
    Crea:
    - 8-12 clientes CRM
    - 15-22 órdenes con estados variados (spread en los últimos 7 días)
    - Analytics events para productos populares
    - 2-3 sugerencias de automatización
    
    Todo asociado al tenant_id, nunca global.
    """
    try:
        # ── Verificar que el tenant existe y tiene productos ──
        tenant = db.query(models.Tenant).filter_by(id=tenant_id).first()
        if not tenant:
            logger.warning(f"[seed_demo] Tenant {tenant_id} no encontrado")
            return
        
        products = db.query(models.Product).filter_by(tenant_id=tenant_id).all()
        if len(products) < 5:
            logger.info(f"[seed_demo] Tenant {tenant_id} con solo {len(products)} productos, agregando menú demo...")
            extra = _create_fallback_menu(db, tenant_id)
            products = products + extra
        
        logger.info(f"[seed_demo] Sembrando demo para '{tenant.name}' con {len(products)} productos")
        
        # ── 1. Crear Clientes CRM ──
        num_customers = random.randint(8, 12)
        customers = _create_demo_customers(db, tenant_id, num_customers)
        
        # ── 2. Crear Órdenes (últimos 7 días) ──
        num_orders = random.randint(15, 22)
        orders = _create_demo_orders(db, tenant_id, products, customers, num_orders)
        
        # ── 3. Crear Analytics Events ──
        _create_demo_analytics(db, tenant_id, products)
        
        # ── 4. Crear Sugerencias de Automatización ──
        _create_demo_suggestions(db, tenant_id, products)
        
        db.commit()
        logger.info(f"[seed_demo] ✅ Demo completo: {num_customers} clientes, {num_orders} órdenes")
        
    except Exception as e:
        db.rollback()
        logger.error(f"[seed_demo] Error sembrando demo: {e}")


# ═══════════════════════════════════════════════════════════════
#  PRIVATE HELPERS
# ═══════════════════════════════════════════════════════════════

def _create_fallback_menu(db: Session, tenant_id: int) -> list:
    """Crea un menú demo mínimo si Gemini no extrajo productos."""
    categories_data = [
        {
            "name": "Entradas", "icon": "🥗",
            "products": [
                {"name": "Empanadas Criollas", "desc": "Rellenas de carne desmechada con hogao.", "price": "12000", "emoji": "🥟"},
                {"name": "Patacones con Guacamole", "desc": "Crujientes con guacamole fresco.", "price": "15000", "emoji": "🥑"},
                {"name": "Arepas Rellenas", "desc": "De maíz con queso y chicharrón.", "price": "10000", "emoji": "🫓"},
            ]
        },
        {
            "name": "Platos Fuertes", "icon": "🍖",
            "products": [
                {"name": "Bandeja Paisa", "desc": "El clásico colombiano completo.", "price": "28000", "emoji": "🍛"},
                {"name": "Lomo al Fogón", "desc": "A la parrilla con chimichurri y papas.", "price": "35000", "emoji": "🥩"},
                {"name": "Trucha en Salsa", "desc": "Filete fresco en reducción de maracuyá.", "price": "32000", "emoji": "🐟"},
                {"name": "Pollo a la Plancha", "desc": "Pechuga jugosa con ensalada fresca.", "price": "24000", "emoji": "🍗"},
            ]
        },
        {
            "name": "Bebidas", "icon": "🍹",
            "products": [
                {"name": "Limonada de Coco", "desc": "Cremosa con leche de coco y hierbabuena.", "price": "8000", "emoji": "🥥"},
                {"name": "Jugo de Lulo", "desc": "Natural con hielo.", "price": "6000", "emoji": "🍊"},
                {"name": "Cerveza Artesanal", "desc": "IPA local, 330ml.", "price": "12000", "emoji": "🍺"},
            ]
        },
    ]
    
    all_products = []
    for cat_data in categories_data:
        cat = models.Category(tenant_id=tenant_id, name=cat_data["name"], icon=cat_data["icon"])
        db.add(cat)
        db.flush()
        
        for p in cat_data["products"]:
            prod = models.Product(
                tenant_id=tenant_id, category_id=cat.id,
                name=p["name"], description=p["desc"],
                price=p["price"], emoji=p["emoji"]
            )
            db.add(prod)
            db.flush()
            all_products.append(prod)
    
    return all_products


def _create_demo_customers(db: Session, tenant_id: int, count: int) -> list:
    """Crea clientes CRM demo con historial variado."""
    customers = []
    shuffled_names = random.sample(CUSTOMER_NAMES, min(count, len(CUSTOMER_NAMES)))
    shuffled_phones = random.sample(CUSTOMER_PHONES, min(count, len(CUSTOMER_PHONES)))
    
    for i in range(count):
        name = shuffled_names[i] if i < len(shuffled_names) else f"Cliente Demo {i+1}"
        phone = shuffled_phones[i] if i < len(shuffled_phones) else f"300{random.randint(1000000, 9999999)}"
        
        days_ago = random.randint(0, 14)
        orders_count = random.randint(1, 8)
        
        customer = models.Customer(
            tenant_id=tenant_id,
            name=name,
            phone=phone,
            total_orders=orders_count,
            last_interaction=datetime.utcnow() - timedelta(days=days_ago),
            created_at=datetime.utcnow() - timedelta(days=random.randint(7, 30)),
        )
        db.add(customer)
        db.flush()
        customers.append(customer)
    
    return customers


def _create_demo_orders(db: Session, tenant_id: int, products: list, customers: list, count: int) -> list:
    """
    Crea órdenes demo distribuidas en los últimos 7 días.
    Las órdenes de HOY quedan en estados variados (para el Kanban).
    Las anteriores quedan todas como 'paid'.
    """
    orders = []
    now = datetime.utcnow()
    
    # Buscar branch por defecto
    branch = db.query(models.Branch).filter_by(tenant_id=tenant_id).first()
    branch_id = branch.id if branch else None
    
    for i in range(count):
        # Distribuir: 40% hoy, 60% días anteriores
        if i < int(count * 0.4):
            # Órdenes de hoy — horas entre 8am-22pm UTC para que caigan en CURRENT_DATE
            today = now.replace(hour=0, minute=0, second=0, microsecond=0)
            created = today + timedelta(hours=random.randint(8, 20), minutes=random.randint(0, 59))
            
            # Garantizar mix: 2 pending, 2 preparing, 1 ready, resto paid
            today_statuses = ["pending", "pending", "preparing", "preparing", "ready"]
            if i < len(today_statuses):
                status = today_statuses[i]
            else:
                status = "paid"
        else:
            # Órdenes pasadas (todas pagadas para métricas)
            days_ago = random.randint(1, 6)
            created = now - timedelta(days=days_ago, hours=random.randint(8, 22))
            status = "paid"
        
        # Seleccionar 1-4 productos aleatorios
        num_items = random.randint(1, min(4, len(products)))
        selected_products = random.sample(products, num_items)
        
        items = []
        total = 0
        for prod in selected_products:
            qty = random.randint(1, 3)
            # Parsear precio (puede ser "$12.000" o "12000")
            price_str = str(prod.price).replace("$", "").replace(".", "").replace(",", "").strip()
            try:
                unit_price = int(price_str)
            except ValueError:
                unit_price = 15000
            
            items.append({
                "id": prod.id,
                "name": prod.name,
                "price": unit_price,
                "quantity": qty,
                "emoji": prod.emoji or "🍽️"
            })
            total += unit_price * qty
        
        customer = random.choice(customers) if customers else None
        delivery = random.choice(["mesa", "domicilio", "recoger"])
        payment = random.choice(["efectivo", "nequi", "wompi"])
        
        order = models.Order(
            tenant_id=tenant_id,
            branch_id=branch_id,
            delivery_method=delivery,
            payment_method=payment,
            total_price=total,
            items_json=json.dumps(items),
            status=status,
            table_number=str(random.randint(1, 12)) if delivery == "mesa" else None,
            phone=customer.phone if customer else "3001234567",
            customer_name=customer.name if customer else "Cliente Demo",
            created_at=created,
        )
        db.add(order)
        db.flush()
        orders.append(order)
    
    return orders


def _create_demo_analytics(db: Session, tenant_id: int, products: list):
    """Crea eventos de analytics para que el dashboard muestre trending products."""
    if not products:
        return
    
    # Crear distribución realista: algunos productos mucho más vistos que otros
    popular_products = random.sample(products, min(3, len(products)))
    
    for prod in products:
        # Productos populares tienen más hits
        hits = random.randint(15, 45) if prod in popular_products else random.randint(2, 10)
        
        for _ in range(hits):
            days_ago = random.randint(0, 6)
            analytics_event = models.Analytics(
                tenant_id=tenant_id,
                product_id=prod.id,
                action="view",
                timestamp=datetime.utcnow() - timedelta(
                    days=days_ago,
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                ),
            )
            db.add(analytics_event)


def _create_demo_suggestions(db: Session, tenant_id: int, products: list):
    """Crea sugerencias de automatización demo para el admin dashboard."""
    if not products:
        return
    
    top_product = random.choice(products) if products else None
    low_product = random.choice([p for p in products if p != top_product]) if len(products) > 1 else None
    
    suggestions = [
        {
            "type": "suggestion",
            "message": f"📈 '{top_product.name}' es tu producto estrella esta semana. Considera crear un combo con él para aumentar ticket promedio.",
            "metadata_json": {"product_id": top_product.id, "category": "growth"},
        },
    ]
    
    if low_product:
        suggestions.append({
            "type": "notification",
            "message": f"⚠️ '{low_product.name}' ha bajado un 35% en ventas. ¿Quieres lanzar una promoción?",
            "metadata_json": {"product_id": low_product.id, "category": "alert"},
        })
    
    suggestions.append({
        "type": "suggestion",
        "message": "💡 Tus clientes piden más entre 7pm-9pm. Activa un descuento del 10% para horario fuera de pico (2pm-5pm).",
        "metadata_json": {"category": "optimization"},
    })
    
    for s in suggestions:
        suggestion = models.Suggestion(
            tenant_id=tenant_id,
            type=s["type"],
            message=s["message"],
            status="pending",
            metadata_json=s["metadata_json"],
        )
        db.add(suggestion)
