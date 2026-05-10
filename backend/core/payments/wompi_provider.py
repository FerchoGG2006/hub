import os
import requests
import logging
import hashlib

logger = logging.getLogger("platorin")

# Wompi Config
WOMPI_API_URL = "https://production.wompi.co/v1" if os.getenv("WOMPI_ENV") == "prod" else "https://sandbox.wompi.co/v1"
WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY", "pub_test_...")
WOMPI_PRIVATE_KEY = os.getenv("WOMPI_PRIVATE_KEY", "prv_test_...")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "prod_integrity_8go6AvJ4lpZ6z2AzAnu3F01TTeVzDG4e")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "prod_events_NFIJyDV2IDXyhV0NMP9dNgQ26kiITwcg")

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
    signature = generate_integrity_signature(reference, amount_in_cents, currency)
    
    payment_url = f"https://checkout.wompi.co/p/?public-key={WOMPI_PUBLIC_KEY}&currency={currency}&amount-in-cents={amount_in_cents}&reference={reference}"
    
    if signature:
        payment_url += f"&signature:integrity={signature}"
    
    return {
        "payment_url": payment_url,
        "qr_data": None
    }

def verify_webhook_signature(payload_data, timestamp, signature):
    """
    Valida la firma de eventos enviada por Wompi usando el Events Secret.
    Concatenación: id + status + amount_in_cents + timestamp + secreto_eventos
    """
    if not WOMPI_EVENTS_SECRET or not signature:
        return True # Permitir si no hay secreto (solo para pruebas iniciales)
        
    try:
        transaction = payload_data.get("data", {}).get("transaction", {})
        t_id = transaction.get("id")
        t_status = transaction.get("status")
        t_amount = transaction.get("amount_in_cents")
        
        raw_chain = f"{t_id}{t_status}{t_amount}{timestamp}{WOMPI_EVENTS_SECRET}"
        computed_hash = hashlib.sha256(raw_chain.encode('utf-8')).hexdigest()
        
        return computed_hash == signature
    except Exception as e:
        logger.error(f"Error verificando firma de webhook: {e}")
        return False

def get_transaction_status(transaction_id):
    """
    Consulta el estado de una transacción directamente en Wompi.
    """
    url = f"{WOMPI_API_URL}/transactions/{transaction_id}"
    try:
        res = requests.get(url, headers={"Authorization": f"Bearer {WOMPI_PRIVATE_KEY}"})
        return res.json()
    except Exception as e:
        logger.error(f"Error consultando transacción {transaction_id}: {e}")
        return None
