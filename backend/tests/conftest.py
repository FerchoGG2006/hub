import os
import sys
import tempfile
from pathlib import Path

import pytest
from sqlalchemy.engine import make_url

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
TEST_DIR = tempfile.TemporaryDirectory(prefix='platorin-tests-')
test_url = os.getenv('PLATORIN_TEST_DATABASE_URL')
if test_url and not (make_url(test_url).database or '').endswith('_test'):
    raise RuntimeError('La base externa de pruebas debe terminar en _test. Nunca uses la base de un negocio.')
os.environ['DATABASE_URL'] = test_url or 'sqlite:///' + (Path(TEST_DIR.name) / 'test.db').as_posix()
os.environ['JWT_SECRET_KEY'] = 'test-only-secret-key-with-at-least-32-characters'
os.environ['AUTO_CREATE_SCHEMA'] = 'false'
os.environ['ENABLE_SCHEDULER'] = 'false'
os.environ['SEED_DEMO_DATA'] = 'false'
for key in ('WA_ACCESS_TOKEN', 'WA_PHONE_NUMBER_ID', 'RESEND_API_KEY', 'REDIS_URL'):
    os.environ.pop(key, None)

import models
import auth
from database import engine, SessionLocal
from main import app
from fastapi.testclient import TestClient


def pytest_sessionfinish(session, exitstatus):
    engine.dispose()
    TEST_DIR.cleanup()


@pytest.fixture
def store():
    from src.shared.middleware.rate_limit import _windows
    _windows.clear()
    models.Base.metadata.drop_all(engine)
    models.Base.metadata.create_all(engine)
    with SessionLocal() as db:
        a = models.Tenant(name='Negocio A', slug='negocio-a', subscription_status='active', enabled_modules=['orders', 'products', 'inventory', 'tables'])
        b = models.Tenant(name='Negocio B', slug='negocio-b', subscription_status='active')
        db.add_all([a, b])
        db.flush()
        ca = models.Category(name='Carta A', tenant_id=a.id)
        cb = models.Category(name='Carta B', tenant_id=b.id)
        db.add_all([ca, cb])
        db.flush()
        pa = models.Product(name='Producto A', price='$12.000', tenant_id=a.id, category_id=ca.id)
        pb = models.Product(name='Producto B', price='20k', tenant_id=b.id, category_id=cb.id)
        db.add_all([pa, pb])
        db.flush()
        db.add(models.Inventory(tenant_id=a.id, product_id=pa.id, stock=5))
        db.add(models.User(username='admin-a', tenant_id=a.id, role='admin', hashed_password=auth.get_password_hash('test-password')))
        db.commit()
        yield db, a, b, pa, pb


@pytest.fixture
def client(store):
    with TestClient(app) as client:
        yield client
