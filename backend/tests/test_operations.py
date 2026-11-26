import hashlib
import json

import pytest
from starlette.websockets import WebSocketDisconnect
import auth
import models
from src.shared.utils.websocket_manager import ConnectionManager
from src.modules.orders.validation import price_in_pesos
from core.payments import wompi_provider


def payload(product_id, qty=1):
    return {'items_json': json.dumps([{'id': product_id, 'qty': qty, 'price': 1}]),
            'total_price': 1, 'customer_name': 'Cliente', 'phone': '3000000000', 'payment_method': 'efectivo'}


def order(client, product_id, **kwargs):
    return client.post('/api/v1/tenant/negocio-a/orders', json=payload(product_id, kwargs.pop('qty', 1)), **kwargs)


def test_catalog_prices():
    assert [price_in_pesos(p) for p in ('$12.000', '12k', '12,5k', '12500')] == [12000, 12000, 12500, 12500]


def test_passwords_salted_and_legacy_upgrade(client, store):
    first, second = auth.get_password_hash('password'), auth.get_password_hash('password')
    assert first != second
    assert auth.verify_password('password', first)
    assert not auth.verify_password('wrong', first)
    db = store[0]
    user = db.query(models.User).first()
    user.hashed_password = hashlib.sha256(b'test-password').hexdigest()
    db.commit()
    res = client.post('/api/auth/token', data={'username': 'admin-a', 'password': 'test-password'})
    assert res.status_code == 200
    db.expire_all()
    assert db.query(models.User).first().hashed_password.startswith('pbkdf2_sha256$')
    assert client.post('/api/auth/token', data={'username': 'admin-a', 'password': 'wrong'}).status_code == 401


def test_orders_recalculate_and_reserve_stock(client, store):
    db, a, b, product, foreign = store
    res = order(client, product.id, qty=2)
    assert res.status_code == 200, res.text
    data = res.json()['data']
    assert data['total'] == 24000
    db.expire_all()
    assert db.query(models.Inventory).first().stock == 3
    assert order(client, foreign.id).status_code == 400
    assert order(client, product.id, qty=4).status_code == 409
    assert order(client, product.id, qty=-1).status_code == 400
    db.expire_all()
    assert db.query(models.Inventory).first().stock == 3
    assert db.query(models.Order).count() == 1


def test_retries_create_one_order(client, store):
    headers = {'Idempotency-Key': 'checkout-retry-1'}
    first = order(client, store[3].id, headers=headers)
    second = order(client, store[3].id, headers=headers)
    assert first.status_code == second.status_code == 200
    assert first.json()['data']['orderId'] == second.json()['data']['orderId']
    assert order(client, store[3].id, qty=2, headers=headers).status_code == 409
    store[0].expire_all()
    assert store[0].query(models.Inventory).first().stock == 4


def test_order_access_scoped_to_token_and_business(client, store):
    data = order(client, store[3].id).json()['data']
    headers = {'X-Order-Token': data['orderToken']}
    path = f"/api/v1/tenant/negocio-a/orders/{data['orderId']}"
    assert client.get(path).status_code == 403
    assert client.get(path, headers=headers).status_code == 200
    assert client.get(path.replace('negocio-a', 'negocio-b'), headers=headers).status_code == 404
    assert client.post('/payments/session', json={'orderId': data['orderId']}).status_code == 403


def test_cannot_activate_subscription_without_payment(client):
    token = client.post('/api/auth/token', data={'username': 'admin-a', 'password': 'test-password'}).json()['data']['access_token']
    assert client.post('/api/admin/billing/subscribe', headers={'Authorization': 'Bearer '+token}).status_code == 403


def test_admin_socket_rejects_foreign_business(client, store):
    token = client.post('/api/auth/token', data={'username': 'admin-a', 'password': 'test-password'}).json()['data']['access_token']
    with client.websocket_connect(f'/ws/admin/{store[1].id}') as ws:
        ws.send_json({'token': token})
        assert ws.receive_json()['type'] == 'AUTHENTICATED'
    with client.websocket_connect(f'/ws/admin/{store[2].id}') as ws:
        ws.send_json({'token': token})
        with pytest.raises(WebSocketDisconnect):
            ws.receive_json()


def signed_event(secret, **changes):
    transaction = {'id': 'test-transaction', 'reference': 'TEST', 'status': 'APPROVED', 'currency': 'COP', 'amount_in_cents': 1200000, **changes}
    properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents', 'transaction.reference', 'transaction.currency']
    checksum = hashlib.sha256((''.join(str(transaction[p.split('.')[1]]) for p in properties)+'1234567890'+secret).encode()).hexdigest()
    return {'event': 'transaction.updated', 'environment': 'test', 'data': {'transaction': transaction}, 'timestamp': 1234567890,
            'signature': {'properties': properties, 'checksum': checksum}}


def test_payment_signatures_fail_closed(client, monkeypatch):
    monkeypatch.setattr(wompi_provider, 'WOMPI_EVENTS_SECRET', 'test-events-secret')
    event = signed_event('test-events-secret')
    assert wompi_provider.verify_webhook_signature(event)
    event['data']['transaction']['amount_in_cents'] = 1
    assert not wompi_provider.verify_webhook_signature(event)
    assert client.post('/payments/webhook', json=event).status_code == 401
    monkeypatch.setattr(wompi_provider, 'WOMPI_EVENTS_SECRET', '')
    assert not wompi_provider.verify_webhook_signature(signed_event(''))


def test_full_payment_flow_and_duplicate_webhook(client, store, monkeypatch):
    for key, value in [('WOMPI_EVENTS_SECRET','test-events-secret'), ('WOMPI_INTEGRITY_SECRET','test-integrity'), ('WOMPI_PUBLIC_KEY','pub_test_example')]:
        monkeypatch.setattr(wompi_provider, key, value)
    request = payload(store[3].id)
    request['payment_method'] = 'wompi'
    created = client.post('/api/v1/tenant/negocio-a/orders', json=request).json()['data']
    headers = {'X-Order-Token': created['orderToken']}
    response = client.post('/payments/session', json={'orderId':created['orderId']}, headers=headers)
    assert response.status_code == 200, response.text
    reference = response.json()['reference']
    invalid = signed_event('test-events-secret', reference=reference, amount_in_cents=1)
    assert client.post('/payments/webhook', json=invalid).status_code == 422
    event = signed_event('test-events-secret', reference=reference)
    monkeypatch.setattr(wompi_provider, 'get_transaction_status', lambda _: {'data': event['data']['transaction']})
    assert client.post('/payments/webhook', json=event).status_code == 200
    assert client.post('/payments/webhook', json=event).status_code == 200
    assert client.get('/payments/status/'+reference, headers=headers).json()['status'] == 'paid'
    store[0].expire_all()
    assert store[0].query(models.Payment).count() == 1
    assert store[0].get(models.Order, created['orderId']).payment_status == 'paid'
    assert store[0].get(models.Order, created['orderId']).status == 'pending'


def admin_headers(client):
    token = client.post('/api/auth/token', data={'username':'admin-a', 'password':'test-password'}).json()['data']['access_token']
    return {'Authorization': 'Bearer '+token}


def test_kitchen_and_cash_session(client, store):
    headers = admin_headers(client)
    request = payload(store[3].id)
    request['table_number'] = '1'
    created = client.post('/api/v1/tenant/negocio-a/orders', json=request).json()['data']
    assert client.post('/api/admin/caja/session/open', json={'base_amount':50000}, headers=headers).status_code == 200
    for status in ('preparing','ready','completed'):
        assert client.put(f"/api/admin/orders/{created['orderId']}/status", params={'status':status}, headers=headers).status_code == 200
    response = client.post('/api/admin/caja/cerrar-mesa/1', headers=headers)
    assert response.status_code == 200, response.text
    current = client.get('/api/admin/caja/session/current', headers=headers).json()['data']
    assert current['cash_sales'] == 12000
    assert current['expected_cash'] == 62000
    assert client.post('/api/admin/caja/session/expense', json={'amount':2000,'description':'Insumos'}, headers=headers).status_code == 200
    closed = client.post('/api/admin/caja/session/close', json={'real_cash':60000}, headers=headers)
    assert closed.status_code == 200
    assert closed.json()['data']['discrepancy'] == 0


def test_cancellation_restores_stock_once(client, store):
    created = order(client, store[3].id, qty=3).json()['data']
    headers = admin_headers(client)
    path=f"/api/admin/orders/{created['orderId']}/status"
    assert client.put(path, params={'status':'cancelled'}, headers=headers).status_code == 200
    assert client.put(path, params={'status':'cancelled'}, headers=headers).status_code == 400
    store[0].expire_all()
    assert store[0].query(models.Inventory).first().stock == 5


def test_suspended_business_cannot_receive_order(client, store):
    store[1].subscription_status = 'suspended'
    store[0].commit()
    assert order(client, store[3].id).status_code == 403


def test_public_socket_never_receives_private_events():
    import asyncio
    class Socket:
        def __init__(self): self.messages=[]
        async def send_text(self, text): self.messages.append(json.loads(text))
    manager=ConnectionManager()
    public, admin = Socket(), Socket()
    manager.register(public,1)
    manager.register(admin,1,admin=True)
    asyncio.run(manager._local_broadcast({'type':'NEW_ORDER','order':{'customer_name':'Private'}},1))
    assert public.messages == []
    assert len(admin.messages) == 1
    asyncio.run(manager._local_broadcast({'type':'MENU_UPDATE'},1))
    assert public.messages == [{'type':'MENU_UPDATE'}]


def test_login_rate_limit(client):
    for _ in range(10):
        assert client.post('/api/auth/token', data={'username':'nobody','password':'wrong'}).status_code == 401
    assert client.post('/api/auth/token', data={'username':'nobody','password':'wrong'}).status_code == 429


def test_concurrent_stock_cannot_go_negative(client, store):
    from concurrent.futures import ThreadPoolExecutor
    product_id=store[3].id
    with ThreadPoolExecutor(max_workers=2) as pool:
        results=list(pool.map(lambda _: order(client,product_id,qty=4).status_code, range(2)))
    assert sorted(results) == [200,409]
    store[0].expire_all()
    assert store[0].query(models.Inventory).first().stock == 1
