import asyncio
from typing import Callable, Dict, List, Any
import logging

logger = logging.getLogger("platorin.events")

class EventBus:
    """
    Bus de eventos interno para desacoplar dominios.
    Permite que un módulo emita un evento y múltiples listeners reaccionen sin conocer al emisor.
    """
    def __init__(self):
        self._listeners: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, handler: Callable):
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(handler)
        logger.info(f"Dominio suscrito a evento: {event_type}")

    async def publish(self, event_type: str, payload: Any):
        if event_type not in self._listeners:
            return

        logger.info(f"Evento emitido: {event_type}")
        
        # Ejecutar todos los handlers de forma asíncrona
        tasks = [handler(payload) for handler in self._listeners[event_type]]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

# Instancia global para el bus interno
bus = EventBus()
