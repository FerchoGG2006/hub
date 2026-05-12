from typing import List, Dict
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger("platorin")

class ConnectionManager:
    def __init__(self):
        # tenant_id -> list of websockets
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tenant_id: int):
        await websocket.accept()
        if tenant_id not in self.active_connections:
            self.active_connections[tenant_id] = []
        self.active_connections[tenant_id].append(websocket)
        logger.info(f"Client connected to tenant {tenant_id}. Active: {len(self.active_connections[tenant_id])}")

    def disconnect(self, websocket: WebSocket, tenant_id: int):
        if tenant_id in self.active_connections:
            if websocket in self.active_connections[tenant_id]:
                self.active_connections[tenant_id].remove(websocket)
                logger.info(f"Client disconnected from tenant {tenant_id}")
            if not self.active_connections[tenant_id]:
                del self.active_connections[tenant_id]

    async def broadcast(self, message: dict, tenant_id: int = None):
        """Broadcasts to a specific tenant or all if tenant_id is None"""
        if tenant_id:
            connections = self.active_connections.get(tenant_id, [])
            for connection in connections:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    pass
        else:
            for t_id, connections in self.active_connections.items():
                for connection in connections:
                    try:
                        await connection.send_text(json.dumps(message))
                    except Exception:
                        pass

manager = ConnectionManager()
