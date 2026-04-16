from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Category(Base):
    __tablename__ = "categories"

    id   = Column(Integer, primary_key=True, index=True)   # primary_key (minúsculas)
    name = Column(String(50), unique=True, nullable=False)
    icon = Column(String(10), default="🍽️")               # emoji para los tabs del menú 3D

    products = relationship(
        "Product",
        back_populates="category",
        cascade="all, delete-orphan",
        order_by="Product.id",
    )


class Product(Base):
    __tablename__ = "products"

    id           = Column(Integer, primary_key=True, index=True)
    category_id  = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name         = Column(String(100), nullable=False)
    description  = Column(Text)
    price        = Column(String(20), nullable=False)   # Ej: "$32k"
    emoji        = Column(String(10), default="🍽️")    # Emoji para la ProductCell
    image_url    = Column(Text)
    is_available = Column(Boolean, default=True)

    category = relationship("Category", back_populates="products")


class Order(Base):
    """Registro de pedidos — almacena el carrito enviado por el CheckoutView."""
    __tablename__ = "orders"

    id              = Column(Integer, primary_key=True, index=True)
    delivery_method = Column(String(20), nullable=False)  # mesa | recoger | domicilio
    payment_method  = Column(String(20), nullable=False)  # efectivo | transferencia
    total_price     = Column(Integer, nullable=False)      # en pesos
    items_json      = Column(Text, nullable=False)         # JSON serializado del carrito
    status          = Column(String(20), default="pending")
    table_number    = Column(String(10))
    phone           = Column(String(20))

class Analytics(Base):
    """Eventos de click y monitor HUD en tiempo real."""
    __tablename__ = "analytics"
    id         = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    action     = Column(String(50), nullable=False) # "view", "add_to_cart"
    timestamp  = Column(DateTime, default=datetime.utcnow)

    product    = relationship("Product")
