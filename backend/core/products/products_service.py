from sqlalchemy.orm import Session
import models
from services.module_service import has_module

def create_product(db: Session, tenant_id: int, category_id: int, name: str, price: str, product_type: str = "simple"):
    """Crea un producto base."""
    new_product = models.Product(
        tenant_id=tenant_id,
        category_id=category_id,
        name=name,
        price=price,
        type=product_type
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def add_variant(db: Session, tenant_id: int, product_id: int, name: str, price: int):
    """Añade una variante a un producto si el módulo está habilitado."""
    if not has_module(db, tenant_id, "variants"):
        raise Exception("Módulo de variantes no habilitado para este negocio.")
    
    # Verificar que el producto sea tipo 'variant'
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if product.type != "variant":
        product.type = "variant"
        db.commit()

    new_variant = models.ProductVariant(
        product_id=product_id,
        name=name,
        price=price
    )
    db.add(new_variant)
    db.commit()
    db.refresh(new_variant)
    return new_variant

def update_stock(db: Session, product_id: int = None, variant_id: int = None, delta: int = 0):
    """Actualiza el stock de un producto o variante."""
    if product_id:
        inv = db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()
        if not inv:
            inv = models.Inventory(product_id=product_id, stock=0)
            db.add(inv)
    elif variant_id:
        inv = db.query(models.Inventory).filter(models.Inventory.variant_id == variant_id).first()
        if not inv:
            inv = models.Inventory(variant_id=variant_id, stock=0)
            db.add(inv)
    else:
        return None

    inv.stock += delta
    db.commit()
    db.refresh(inv)
    return inv.stock

def get_product_with_variants(db: Session, product_id: int):
    """Obtiene producto con sus variantes y stock consolidado."""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return None
    
    return {
        "id": product.id,
        "name": product.name,
        "type": product.type,
        "price": product.price,
        "stock": product.inventory.stock if product.inventory else 0,
        "variants": [
            {
                "id": v.id,
                "name": v.name,
                "price": v.price,
                "stock": v.inventory.stock if v.inventory else 0
            } for v in product.variants
        ]
    }
