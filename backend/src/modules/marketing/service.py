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
        logger.info('Bienvenida de marketing pendiente: no hay proveedor configurado')

# Suscribir Marketing al descubrimiento de clientes
bus.subscribe("CUSTOMER_CREATED", MarketingService.trigger_welcome_campaign)
