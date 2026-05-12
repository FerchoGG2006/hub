import os
import json
import logging

logger = logging.getLogger("platorin.redis")

REDIS_URL = os.getenv("REDIS_URL", "")

class RedisManager:
    """
    Gestiona la conexión y comunicación con Redis para escalabilidad horizontal.
    Si Redis no está disponible, opera en modo degradado sin errores.
    """
    def __init__(self):
        self.client = None
        self.pubsub = None
        self._available = False

    async def connect(self):
        if not REDIS_URL:
            logger.info("REDIS_URL no configurado. Operando en modo local (sin Pub/Sub).")
            return
        try:
            import redis.asyncio as aioredis
            self.client = aioredis.from_url(REDIS_URL, decode_responses=True)
            self.pubsub = self.client.pubsub()
            self._available = True
            logger.info(f"Conectado a Redis en {REDIS_URL}")
        except Exception as e:
            logger.warning(f"Redis no disponible, modo local activado: {e}")
            self._available = False

    async def publish(self, channel: str, message: dict):
        if not self._available:
            if not self.client and REDIS_URL:
                await self.connect()
            if not self._available:
                return  # Modo local: no hacer nada
        await self.client.publish(channel, json.dumps(message))

    async def subscribe(self, channel: str):
        if not self._available:
            if not self.client and REDIS_URL:
                await self.connect()
            if not self._available:
                return None
        await self.pubsub.subscribe(channel)
        return self.pubsub

redis_client = RedisManager()
