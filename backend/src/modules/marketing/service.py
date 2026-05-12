from src.shared.infra.event_bus import bus
import logging

logger = logging.getLogger("platorin.marketing")

class MarketingService:
    @staticmethod
    async def trigger_welcome_campaign(payload: dict):
        """
        Activa una campaña automática para nuevos clientes.
        """
        customer_name = payload.get('name') or "cliente"
        phone = payload.get('phone')
        
        # En el futuro, aquí la IA podría generar un cupón personalizado
        logger.info(f"[Marketing] ¡Bienvenido detectado! Preparando cupón para {customer_name} ({phone})")
        
        # Simulación de envío de WhatsApp de bienvenida
        print(f"[Marketing Auto] Enviando mensaje a {phone}: '¡Hola {customer_name}! Gracias por elegirnos. Usa el cupón HOLA10 en tu próximo pedido.'")

# Suscribir Marketing al descubrimiento de clientes
bus.subscribe("CUSTOMER_CREATED", MarketingService.trigger_welcome_campaign)
