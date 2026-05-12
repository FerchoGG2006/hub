from typing import List, Dict
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger("platorin")

from src.shared.infra.redis import redis_client
import asyncio

class ConnectionManager:
    def __init__(self):
        # tenant_id -> list of websockets
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self._redis_task = None

    async def connect(self, websocket: WebSocket, tenant_id: int):
        await websocket.accept()
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = []
        self.active_connections[tenant_id].append(websocket)
        
        # Iniciar escucha de Redis si es la primera conexión global
        if not self._redis_task:
            self._redis_task = asyncio.create_task(self._listen_redis())
            
        logger.info(f"WS: Client connected to tenant {tenant_id}. Local pool: {len(self.active_connections[tenant_id])}")

    async def _listen_redis(self):
        """Escucha mensajes de otras instancias via Redis."""
        pubsub = await redis_client.subscribe("tenant_events")
        logger.info("Realtime: Escuchando eventos globales desde Redis.")
        async for message in pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                # Enviar solo a los que este servidor tiene localmente
                target_tenant = data.get("tenant_id")
                if target_tenant in self.active_connections:
                    await self._local_broadcast(data, target_tenant)

    async def _local_broadcast(self, message: dict, tenant_id: int):
        """Envía el mensaje solo a los sockets conectados a ESTA instancia."""
        connections = self.active_connections.get(tenant_id, [])
        for connection in connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

    def disconnect(self, websocket: WebSocket, tenant_id: int):
        if tenant_id in self.active_connections:
            if websocket in self.active_connections[tenant_id]:
                self.active_connections[tenant_id].remove(websocket)
            if not self.active_connections[tenant_id]:
                del self.active_connections[tenant_id]

    async def broadcast(self, message: dict, tenant_id: int = None):
        """
        Publica el mensaje en Redis para que todas las instancias lo reciban.
        """
        message["tenant_id"] = tenant_id # Asegurar que el ID viaje en el payload
        await redis_client.publish("tenant_events", message)

manager = ConnectionManager()
