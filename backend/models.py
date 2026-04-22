from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, DateTime
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

    tenant = relationship("Tenant")
    category = relationship("Category", back_populates="products")

class Order(Base):
    __tablename__ = "orders"

    id              = Column(Integer, primary_key=True, index=True)
    tenant_id       = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    delivery_method = Column(String(20), nullable=False)
    payment_method  = Column(String(20), nullable=False)
    total_price     = Column(Integer, nullable=False)
    items_json      = Column(Text, nullable=False)
    status          = Column(String(20), default="pending")
    table_number    = Column(String(10))
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
