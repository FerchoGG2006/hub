from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    """Modelo de Autenticación de Usuarios (SaaS)"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="admin") # "superadmin" o "admin"
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True) # nulo implica superadmin

    tenant = relationship("Tenant")

class Tenant(Base):
    """Modelo Multi-inquilino para la plataforma HUB SaaS."""
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, index=True, nullable=False) # ej "la-rivera"
    name = Column(String(100), nullable=False)
    brand_color = Column(String(20), default="#f59e0b")
    logo_url = Column(String(255))
    whatsapp_number = Column(String(20))
    whatsapp_message = Column(Text, default="¡Hola! Quiero hacer el siguiente pedido:")
    enabled_modules = Column(JSON, default=["orders", "products"]) # "tables", "variants", "inventory", etc.
    
    # Phase 2 Branding
    instagram_url = Column(String(255), nullable=True)
    tiktok_url = Column(String(255), nullable=True)
    maps_url = Column(String(255), nullable=True)
    
    # Phase 4 Billing
    subscription_status = Column(String(20), default="active") # active, suspended
    valid_until = Column(DateTime, nullable=True)

    branches = relationship("Branch", back_populates="tenant", cascade="all, delete-orphan")

class Branch(Base):
    """Modelo de Sedes/Locales para un Tenant."""
    __tablename__ = "branches"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(100), nullable=False) # ej "Sede Principal", "Mall Plaza"
    slug = Column(String(50), nullable=False) # ej "principal", "norte"
    whatsapp_number = Column(String(20))
    address = Column(String(255))
    is_active = Column(Boolean, default=True)
    
    # Instagram Autopilot
    ig_account_id = Column(String(100), nullable=True)
    ig_token = Column(String(255), nullable=True)
    ig_username = Column(String(100), nullable=True)
    ig_profile_picture = Column(Text, nullable=True)
    autopilot_active = Column(Boolean, default=False)
    opening_time = Column(String(5), nullable=True) # "HH:MM"
    closing_time = Column(String(5), nullable=True) # "HH:MM"
    timezone = Column(String(50), default="America/Bogota")

    # TikTok Integration
    tt_account_id = Column(String(100), nullable=True)
    tt_token = Column(String(255), nullable=True)
    tt_username = Column(String(100), nullable=True)
    tt_profile_picture = Column(String(500), nullable=True)

    tenant = relationship("Tenant", back_populates="branches")
    orders = relationship("Order", back_populates="branch")

class Category(Base):
    __tablename__ = "categories"

    id   = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(50), nullable=False)
    icon = Column(String(10), default="🍽️")

    tenant = relationship("Tenant")
    products = relationship(
        "Product",
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="Product.id",
    )

class Product(Base):
    __tablename__ = "products"

    id           = Column(Integer, primary_key=True, index=True)
    tenant_id    = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    category_id  = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name         = Column(String(100), nullable=False)
    description  = Column(Text)
    price        = Column(String(20), nullable=False)
    emoji        = Column(String(10), default="🍽️")
    image_url    = Column(Text)
    is_available = Column(Boolean, default=True)
    type         = Column(String(20), default="simple") # simple, variant

    tenant   = relationship("Tenant")
    category = relationship("Category", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="product", uselist=False)

class Order(Base):
    __tablename__ = "orders"

    id              = Column(Integer, primary_key=True, index=True)
    tenant_id       = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    delivery_method = Column(String(20), nullable=False)
    payment_method  = Column(String(20), nullable=False)
    total_price     = Column(Integer, nullable=False)
    items_json      = Column(Text, nullable=False)
    status          = Column(String(20), default="pending")
    table_number    = Column(String(255))
    phone           = Column(String(20))
    customer_name   = Column(String(100))
    created_at      = Column(DateTime, default=datetime.utcnow)
    branch_id       = Column(Integer, ForeignKey("branches.id"), nullable=True)
    
    tenant = relationship("Tenant")
    branch = relationship("Branch", back_populates="orders")

class Coupon(Base):
    __tablename__ = "coupons"
    
    id         = Column(Integer, primary_key=True, index=True)
    tenant_id  = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    code       = Column(String(20), nullable=False)
    discount_percent = Column(Integer, default=10)
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProductVariant(Base):
    """Modelo para variantes de producto (talla, color, etc.)"""
    __tablename__ = "product_variants"
    
    id         = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name       = Column(String(100), nullable=False) # ej: "Talla M", "Rojo"
    price      = Column(Integer, nullable=False)
    
    product   = relationship("Product", back_populates="variants")
    inventory = relationship("Inventory", back_populates="variant", uselist=False)

class Inventory(Base):
    """Modelo centralizado de stock para productos simples y variantes."""
    __tablename__ = "inventory"
    
    id         = Column(Integer, primary_key=True, index=True)
    tenant_id  = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    stock      = Column(Integer, default=0)
    
    product = relationship("Product", back_populates="inventory")
    variant = relationship("ProductVariant", back_populates="inventory")
    
    tenant = relationship("Tenant")

class Analytics(Base):
    __tablename__ = "analytics"
    
    id         = Column(Integer, primary_key=True, index=True)
    tenant_id  = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    action     = Column(String(50), nullable=False)
    timestamp  = Column(DateTime, default=datetime.utcnow)

    tenant  = relationship("Tenant")
    product = relationship("Product")

class SpecialEvent(Base):
    """Modelo de Solicitudes de Eventos Especiales (público → admin)."""
    __tablename__ = "special_events"

    id              = Column(Integer, primary_key=True, index=True)
    restaurant_id   = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    client_name     = Column(String(100), nullable=False)
    client_phone    = Column(String(30), nullable=False)   # WhatsApp del cliente
    event_type      = Column(String(30), default="otro")   # cumpleanos, aniversario, reunion, despedida, otro
    event_date      = Column(DateTime, nullable=True)
    guests_count    = Column(Integer, default=1)
    extras          = Column(JSON, default=[])              # lista: decoracion, torta, zona_privada, menu_especial, musica
    notes           = Column(Text, nullable=True)           # mensaje adicional del cliente
    admin_notes     = Column(Text, nullable=True)           # notas internas del admin
    status          = Column(String(20), default="pending") # pending | managing | confirmed | rejected
    created_at      = Column(DateTime, default=datetime.utcnow)

    restaurant = relationship("Tenant")

class BusinessEvent(Base):
    """Modelo para el sistema impulsado por eventos (Analytics, AI, Automation)."""
    __tablename__ = "business_events"
    
    id         = Column(Integer, primary_key=True, index=True)
    tenant_id  = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    type       = Column(String(50), nullable=False) # order_created, product_viewed, etc.
    payload    = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

class AutomationRule(Base):
    """Reglas de negocio automatizadas (Triggers -> Conditions -> Actions)."""
    __tablename__ = "automation_rules"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    trigger_event = Column(String(50))  # e.g., "order_paid"
    condition_json = Column(JSON, default={})
    action_json = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Suggestion(Base):
    """Sugerencias generadas por el motor de automatización para el administrador."""
    __tablename__ = "suggestions"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    type = Column(String(50))           # suggestion, notification, flag
    message = Column(Text)
    status = Column(String(20), default="pending") # pending, applied, dismissed
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant")

class PaymentSession(Base):
    """Sesiones de pago para integración con pasarelas (Wompi)."""
    __tablename__ = "payment_sessions"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    business_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    reference = Column(String(100), unique=True, index=True, nullable=False)
    amount = Column(Integer, nullable=False)
    currency = Column(String(10), default="COP")
    gateway = Column(String(50), default="wompi")
    status = Column(String(20), default="pending") # pending, paid, failed, expired
    payment_url = Column(Text, nullable=True)
    qr_data = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order")
    business = relationship("Tenant")

class Customer(Base):
    """Base de datos centralizada de clientes para Marketing y CRM."""
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(100))
    phone = Column(String(20), index=True)
    email = Column(String(100), nullable=True)
    total_orders = Column(Integer, default=0)
    last_interaction = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Nuevos campos de CRM, opt-in y segmentación
    whatsapp_opt_in = Column(Boolean, default=True)
    instagram_username = Column(String(100), nullable=True)
    last_order_at = Column(DateTime, nullable=True)
    tags = Column(JSON, default=[])

    tenant = relationship("Tenant")

class Campaign(Base):
    """Modelo para registrar Campañas Masivas creadas por el admin o la IA."""
    __tablename__ = "campaigns"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(100), nullable=False)
    campaign_type = Column(String(20), nullable=False)  # "whatsapp", "email", "instagram", "sms"
    audience_filter = Column(String(50), default="all")  # "all", "inactive", "vip"
    message_body = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # "pending", "sending", "completed", "failed"
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant")
    jobs = relationship("CampaignJob", back_populates="campaign", cascade="all, delete-orphan")

class CampaignJob(Base):
    """Modelo para la cola de envíos individuales de una Campaña."""
    __tablename__ = "campaign_jobs"
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(String(20), default="pending")  # "pending", "sending", "delivered", "failed"
    delivered_at = Column(DateTime, nullable=True)
    failed_reason = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="jobs")
    customer = relationship("Customer")

class Payment(Base):
    """Registros de transacciones de pago reales confirmadas."""
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    payment_session_id = Column(Integer, ForeignKey("payment_sessions.id"), nullable=False)
    gateway_transaction_id = Column(String(100), unique=True, nullable=True)
    amount = Column(Integer, nullable=False)
    method = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False)
    raw_response = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("PaymentSession")

