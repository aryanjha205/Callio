import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("callio.ws")

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> Set of active WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected via WebSocket. Active sessions: {len(self.active_connections[user_id])}")

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket.")

    def is_user_online(self, user_id: int) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    async def send_personal_message(self, message: dict, user_id: int) -> bool:
        if user_id not in self.active_connections:
            return False
        
        dead_sockets = set()
        sent = False
        payload = json.dumps(message)
        
        for ws in self.active_connections[user_id]:
            try:
                await ws.send_text(payload)
                sent = True
            except Exception as e:
                logger.warning(f"Error sending to user {user_id} socket: {e}")
                dead_sockets.add(ws)
        
        for ws in dead_sockets:
            self.disconnect(user_id, ws)
            
        return sent

    async def broadcast_presence(self, user_id: int, is_online: bool, friend_ids: List[int]):
        presence_msg = {
            "type": "presence_update",
            "user_id": user_id,
            "is_online": is_online
        }
        for fid in friend_ids:
            if self.is_user_online(fid):
                await self.send_personal_message(presence_msg, fid)

manager = ConnectionManager()
