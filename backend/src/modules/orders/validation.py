import json
import re
from decimal import Decimal, InvalidOperation
from datetime import datetime

import models
from src.shared.errors.app_error import AppError


def price_in_pesos(value):
    text = str(value).lower().strip().replace('$', '').replace(' ', '')
    try:
        if text.endswith('k'):
            amount = Decimal(text[:-1].replace(',', '.')) * 1000
        else:
            if re.fullmatch(r'\d{1,3}(?:[.,]\d{3})+', text):
                text = text.replace('.', '').replace(',', '')
            amount = Decimal(text)
        if not amount.is_finite() or amount <= 0 or amount != amount.to_integral_value():
            raise ValueError()
        return int(amount)
    except (InvalidOperation, ValueError):
        raise AppError('Precio de catálogo inválido; contacta con el negocio', 400)


def validate_order(db, tenant_id, data):
    tenant = db.get(models.Tenant, tenant_id)
    if not tenant or tenant.subscription_status != 'active' or (tenant.valid_until and tenant.valid_until < datetime.utcnow()):
        raise AppError('El negocio no está disponible para recibir pedidos', 403)
    branch_id = data.get('branch_id')
    if branch_id and not db.query(models.Branch).filter_by(id=branch_id, tenant_id=tenant_id, is_active=True).first():
        raise AppError('Sede inválida', 400)
    try:
        items = json.loads(data['items_json'])
    except (ValueError, TypeError):
        raise AppError('Carrito inválido', 400)
    if not isinstance(items, list) or not 1 <= len(items) <= 100:
        raise AppError('El carrito debe contener entre 1 y 100 productos', 400)
    normalized, reservations, total = [], {}, 0
    for item in items:
        if not isinstance(item, dict):
            raise AppError('Producto inválido', 400)
        qty, product_id = item.get('qty', 1), item.get('id')
        if type(qty) is not int or not 1 <= qty <= 1000 or type(product_id) is not int:
            raise AppError('Producto o cantidad inválidos', 400)
        product = db.query(models.Product).filter_by(id=product_id, tenant_id=tenant_id, is_available=True).first()
        if not product:
            raise AppError('Producto no disponible en este negocio', 400)
        variant_id = item.get('variant_id')
        variant = None
        if variant_id is not None:
            if type(variant_id) is not int:
                raise AppError('Variante inválida', 400)
            variant = db.query(models.ProductVariant).filter_by(id=variant_id, product_id=product.id).first()
            if not variant:
                raise AppError('Variante inválida', 400)
        elif product.type == 'variant':
            raise AppError('Selecciona una variante del producto', 400)
        unit_price = price_in_pesos(variant.price if variant else product.price)
        total += unit_price * qty
        if total > 2_000_000_000:
            raise AppError('Importe del pedido demasiado alto', 400)
        normalized.append({
            'id': product.id, 'name': product.name, 'qty': qty,
            'price': unit_price, 'variant_id': variant_id,
            'customizations': item.get('customizations', {}),
        })
        inventory = db.query(models.Inventory).filter_by(tenant_id=tenant_id)
        inventory = inventory.filter_by(variant_id=variant_id) if variant else inventory.filter_by(product_id=product.id, variant_id=None)
        inventory = inventory.first()
        if inventory:
            reservations[inventory.id] = reservations.get(inventory.id, 0) + qty
    for inventory_id, qty in reservations.items():
        updated = db.query(models.Inventory).filter(
            models.Inventory.id == inventory_id,
            models.Inventory.tenant_id == tenant_id,
            models.Inventory.stock >= qty,
        ).update({models.Inventory.stock: models.Inventory.stock - qty}, synchronize_session=False)
        if updated != 1:
            raise AppError('Stock insuficiente para completar el pedido', 409)
    return {**data, 'total_price': total, 'items_json': json.dumps(normalized, ensure_ascii=False)}


def release_inventory(db, order):
    for item in json.loads(order.items_json):
        inventory = db.query(models.Inventory).filter_by(tenant_id=order.tenant_id)
        inventory = inventory.filter_by(variant_id=item['variant_id']) if item.get('variant_id') else inventory.filter_by(product_id=item['id'], variant_id=None)
        inventory.update({models.Inventory.stock: models.Inventory.stock + item['qty']}, synchronize_session=False)
