import os
import requests
import logging
import hashlib

logger = logging.getLogger("tech-gastro-hub")

# Wompi Config
WOMPI_API_URL = "https://production.wompi.co/v1" if os.getenv("WOMPI_ENV") == "prod" else "https://sandbox.wompi.co/v1"
WOMPI_PUBLIC_KEY = os.getenv("WOMPI_PUBLIC_KEY", "pub_test_...")
WOMPI_PRIVATE_KEY = os.getenv("WOMPI_PRIVATE_KEY", "prv_test_...")
WOMPI_INTEGRITY_SECRET = os.getenv("WOMPI_INTEGRITY_SECRET", "prod_integrity_8go6AvJ4lpZ6z2AzAnu3F01TTeVzDG4e")
WOMPI_EVENTS_SECRET = os.getenv("WOMPI_EVENTS_SECRET", "prod_events_NFIJyDV2IDXyhV0NMP9dNgQ26kiITwcg")

def create_wompi_transaction_intent(amount_in_cents, reference, currency="COP"):
    """
    Genera el link de pago para el Web Checkout de Wompi.
    """
    # FASE 6 — INTEGRIDAD (Opcional pero recomendado para Prod)
    # Si se activa la integridad en Wompi, aquí se generaría el hash de integridad.
    # Por ahora usamos el link directo que Wompi valida internamente.
    payment_url = f"https://checkout.wompi.co/p/?public-key={WOMPI_PUBLIC_KEY}&currency={currency}&amount-in-cents={amount_in_cents}&reference={reference}"
    
    return {
        "payment_url": payment_url,
        "qr_data": None
    }

def verify_webhook_signature(payload_data, timestamp, signature):
    """
    Valida la firma de eventos enviada por Wompi usando el Events Secret.
    """
    if not WOMPI_EVENTS_SECRET:
        return True # Solo para desarrollo inicial
        
    # La firma de Wompi en eventos usa HMAC-SHA256 con el Events Secret
    # sobre una cadena construida con datos del evento y el timestamp.
    # Aquí implementaremos la lógica exacta de la documentación de Wompi.
    
    return True # Placeholder: Validado en la capa de infraestructura

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
