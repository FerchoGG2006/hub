import os
import requests
import logging
import hashlib

logger = logging.getLogger("tech-gastro-hub")

# Wompi Config
WOMPI_API_URL = "https://production.wompi.co/v1" if os.getenv("WOMPI_ENV") == "prod" else "https://sandbox.wompi.co/v1"
WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY", "pub_test_Q5yDA9xoKdePzhS8qn967ls8vsh49m")
WOMPI_PRIVATE_KEY = os.getenv("WOMPI_PRIVATE_KEY", "prv_test_...")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "")

def create_wompi_transaction_intent(amount_in_cents, reference, currency="COP"):
    """
    Crea una intención de transacción en Wompi o genera el link de pago.
    Para una integración completa con QR y Nequi vía API se requiere token de aceptación.
    Aquí generamos el Link de Pago que soporta todos los métodos automáticamente.
    """
    # En una implementación avanzada, aquí se llamaría a /transactions
    # Por ahora, usamos el Widget/Link de pago que es lo más robusto para multi-método
    payment_url = f"https://checkout.wompi.co/p/?public-key={WOMPI_PUBLIC_KEY}&currency={currency}&amount-in-cents={amount_in_cents}&reference={reference}"
    
    return {
        "payment_url": payment_url,
        "qr_data": None # El QR lo genera Wompi dentro del checkout
    }

def verify_webhook_signature(payload_data, timestamp, signature):
    """
    Valida la firma de eventos enviada por Wompi.
    """
    events_secret = os.getenv("WOMPI_EVENTS_SECRET")
    if not events_secret:
        return True # Solo para desarrollo

    # Estructura de firma para eventos de Wompi:
    # concatenar: id_evento + timestamp + secret
    # Pero Wompi suele enviar una firma de integridad en la transacción misma si se configura.
    # Para eventos simples, validamos según su documentación.
    
    return True # Placeholder: En producción implementar HMAC SHA256

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
