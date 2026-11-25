import os
import requests
import logging
import hashlib
import hmac

logger = logging.getLogger("platorin")

# Wompi Config
WOMPI_API_URL = "https://production.wompi.co/v1" if os.getenv("WOMPI_ENV") == "prod" else "https://sandbox.wompi.co/v1"
WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY", "")
WOMPI_PRIVATE_KEY = os.getenv("WOMPI_PRIVATE_KEY", "")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "")

def generate_integrity_signature(reference, amount_in_cents, currency="COP"):
    """
    Genera la firma de integridad requerida por Wompi para transacciones seguras.
    Concatenación: referencia + monto_en_centavos + moneda + secreto_integridad
    """
    if not WOMPI_INTEGRITY_SECRET:
        return None
    
    raw_chain = f"{reference}{amount_in_cents}{currency}{WOMPI_INTEGRITY_SECRET}"
    return hashlib.sha256(raw_chain.encode('utf-8')).hexdigest()

def create_wompi_transaction_intent(amount_in_cents, reference, currency="COP"):
    """
    Genera el link de pago para el Web Checkout de Wompi con firma de integridad.
    """
    if not WOMPI_PUBLIC_KEY or not WOMPI_INTEGRITY_SECRET:
        raise ValueError('Wompi no está configurado')
    signature = generate_integrity_signature(reference, amount_in_cents, currency)
    
    payment_url = f"https://checkout.wompi.co/p/?public-key={WOMPI_PUBLIC_KEY}&currency={currency}&amount-in-cents={amount_in_cents}&reference={reference}"
    
    if signature:
        payment_url += f"&signature:integrity={signature}"
    
    return {
        "payment_url": payment_url,
        "qr_data": None
    }

def verify_webhook_signature(payload_data, timestamp=None, signature=None):
    """Verify Wompi's ordered signature.properties and payload timestamp."""
    if not WOMPI_EVENTS_SECRET or not isinstance(payload_data, dict):
        return False
    try:
        signature_data = payload_data['signature']
        properties = signature_data['properties']
        if not isinstance(properties, list) or not properties or not all(isinstance(p, str) for p in properties):
            return False
        # A transaction signature must cover its identity, status and amount.
        if payload_data.get('event') == 'transaction.updated' and not {
            'transaction.id', 'transaction.status', 'transaction.amount_in_cents'
        }.issubset(properties):
            return False
        values = []
        for path in properties:
            value = payload_data['data']
            for part in path.split('.'):
                value = value[part]
            if isinstance(value, (dict, list)) or value is None:
                return False
            values.append(str(value))
        event_timestamp = payload_data['timestamp']
        if type(event_timestamp) is not int:
            return False
        checksum = signature or signature_data['checksum']
        if not isinstance(checksum, str):
            return False
        raw = ''.join(values) + str(event_timestamp) + WOMPI_EVENTS_SECRET
        computed = hashlib.sha256(raw.encode()).hexdigest()
        return hmac.compare_digest(computed, checksum.lower())
    except (KeyError, TypeError, ValueError):
        return False


def get_transaction_status(transaction_id):
    """
    Consulta el estado de una transacción directamente en Wompi.
    """
    url = f"{WOMPI_API_URL}/transactions/{transaction_id}"
    if not WOMPI_PRIVATE_KEY:
        return None
    try:
        res = requests.get(url, headers={"Authorization": f"Bearer {WOMPI_PRIVATE_KEY}"}, timeout=15)
        res.raise_for_status()
        return res.json()
    except Exception as e:
        logger.error(f"Error consultando transacción {transaction_id}: {e}")
        return None
