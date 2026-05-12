from typing import List, Dict
from fastapi import WebSocket
import json
import logging
import asyncio

logger = logging.getLogger("platorin.ws")

from src.shared.infra.redis_manager import redis_client

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self._redis_task = None

    async def connect(self, websocket: WebSocket, tenant_id: int):
        await websocket.accept()
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = []
        self.active_connections[tenant_id].append(websocket)
        
        # Iniciar escucha de Redis si está disponible
        if not self._redis_task and redis_client._available:
            self._redis_task = asyncio.create_task(self._listen_redis())
            
        logger.info(f"WS connected: tenant {tenant_id}, pool: {len(self.active_connections[tenant_id])}")

    async def _listen_redis(self):
        """Escucha mensajes de otras instancias via Redis."""
        pubsub = await redis_client.subscribe("tenant_events")
        if not pubsub:
            return  # Redis no disponible
        logger.info("Realtime: Escuchando eventos globales desde Redis.")
        async for message in pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                target_tenant = data.get("tenant_id")
                if target_tenant in self.active_connections:
                    await self._local_broadcast(data, target_tenant)

    async def _local_broadcast(self, message: dict, tenant_id: int):
        """Envía el mensaje solo a los sockets conectados a ESTA instancia."""
        connections = self.active_connections.get(tenant_id, [])
        dead = []
        for connection in connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead.append(connection)
        # Limpiar sockets muertos
        for d in dead:
            connections.remove(d)

    def disconnect(self, websocket: WebSocket, tenant_id: int):
        if tenant_id in self.active_connections:
            if websocket in self.active_connections[tenant_id]:
                self.active_connections[tenant_id].remove(websocket)
            if not self.active_connections[tenant_id]:
                del self.active_connections[tenant_id]

    async def broadcast(self, message: dict, tenant_id: int = None):
        """
        Si Redis está disponible, publica vía Pub/Sub.
        Si no, hace broadcast local directamente.
        """
        message["tenant_id"] = tenant_id
        if redis_client._available:
            await redis_client.publish("tenant_events", message)
        else:
            # Fallback: broadcast local directo
            if tenant_id:
                await self._local_broadcast(message, tenant_id)
            else:
                for tid in list(self.active_connections.keys()):
                    await self._local_broadcast(message, tid)

manager = ConnectionManager()
