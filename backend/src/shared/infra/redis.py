import os
import redis.asyncio as redis
import json
import logging

logger = logging.getLogger("platorin.redis")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class RedisManager:
    """
    Gestiona la conexión y comunicación con Redis para escalabilidad horizontal.
    """
    def __init__(self):
        self.client = None
        self.pubsub = None

    async def connect(self):
        try:
            self.client = redis.from_url(REDIS_URL, decode_responses=True)
            self.pubsub = self.client.pubsub()
            logger.info(f"Conectado a Redis en {REDIS_URL}")
        except Exception as e:
            logger.error(f"Error conectando a Redis: {e}")

    async def publish(self, channel: str, message: dict):
        if not self.client:
            await self.connect()
        await self.client.publish(channel, json.dumps(message))

    async def subscribe(self, channel: str):
        if not self.pubsub:
            await self.connect()
        await self.pubsub.subscribe(channel)
        return self.pubsub

redis_client = RedisManager()
