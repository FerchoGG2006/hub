"""Local-only fixtures; never creates synthetic sales or customers."""
import json
import os
import secrets
from pathlib import Path

from database import SessionLocal, engine
from sqlalchemy import inspect
import auth
import models


def create_local_demo():
    if engine.dialect.name != 'sqlite':
        raise SystemExit('El demo local solo puede crearse en SQLite')
    with SessionLocal() as db:
        if db.query(models.Tenant).filter_by(slug='demo').first():
            print('El negocio demo ya existe. No se cambiaron credenciales ni datos.')
            return
        tenant = models.Tenant(slug='demo', name='Platorin Demo', subscription_status='active',
                               enabled_modules=['products', 'orders', 'tables', 'inventory'], whatsapp_number='')
        db.add(tenant)
        db.flush()
        branch = models.Branch(tenant_id=tenant.id, name='Sede principal', slug='principal')
        category = models.Category(tenant_id=tenant.id, name='Carta de prueba', icon='🍪')
        db.add_all([branch, category])
        db.flush()
        for name, price, image in [('Galleta de Pistachos', 7000, 'pistachio.png'), ('Brownie de Arequipe', 7000, 'arequipe.png'), ('Brookie', 8000, 'brookie.png')]:
            product = models.Product(tenant_id=tenant.id, category_id=category.id, name=name,
                                     price=str(price), image_url='/images/'+image, emoji='🍪')
            db.add(product)
            db.flush()
            db.add(models.Inventory(tenant_id=tenant.id, product_id=product.id, stock=100))
        password = secrets.token_urlsafe(18)
        db.add(models.User(username='admin@platorin.local', tenant_id=tenant.id, role='admin', hashed_password=auth.get_password_hash(password)))
        db.commit()
        local = Path(__file__).resolve().parents[1] / '.local'
        local.mkdir(exist_ok=True)
        (local / 'access.json').write_text(json.dumps({'url':'http://localhost:3000/admin/demo',
            'menu':'http://localhost:3000/demo', 'username':'admin@platorin.local','password':password}, indent=2), encoding='utf-8')
        print('Demo local creado. Acceso guardado en .local/access.json (excluido de Git).')


def check_legacy_schema():
    inspector = inspect(engine)
    differences = []
    for table in models.Base.metadata.sorted_tables:
        if table.name == 'order_request_keys':
            continue
        if not inspector.has_table(table.name):
            differences.append(f'{table.name}: falta la tabla')
            continue
        actual = {c['name']: c for c in inspector.get_columns(table.name)}
        expected = {c.name: c for c in table.columns if not (table.name == 'orders' and c.name in ('payment_status','paid_at'))}
        if actual.keys() != expected.keys():
            differences.append(f'{table.name}: columnas distintas de la base histórica')
        for name in actual.keys() & expected.keys():
            if actual[name]['type']._type_affinity != expected[name].type._type_affinity:
                differences.append(f'{table.name}.{name}: tipo distinto')
    if differences:
        raise SystemExit('\n'.join(differences))
    print('Las tablas y columnas coinciden con la base histórica. No se modificó la base. Revisa respaldo, índices y restricciones antes de marcar la revisión inicial.')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['demo', 'check-legacy-schema'])
    args = parser.parse_args()
    if args.command == 'demo':
        create_local_demo()
    else:
        check_legacy_schema()
