"""
WebSocket de cocina en tiempo real con los agentes ChefAgent/SafetyAgent.

Seguridad:
- El handshake exige un JWT válido (query param `?token=...`). Sin token o
  con token inválido se rechaza con código 1008 antes de aceptar la conexión.
  Esto evita que cualquiera consuma cuota de los agentes de IA.
- `json.loads` está envuelto en try/except (input no-JSON no tumba la sesión).
- Cap de conexiones concurrentes por usuario.
"""
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, status
from typing import List, Dict
import json
import logging

import jwt
from jwt import PyJWTError as JWTError
from app.core.security import JWT_SECRET, JWT_ALGORITHM
from app.agents.chef_agent import ChefAgent
from app.agents.safety_agent import SafetyAgent

logger = logging.getLogger("sous.ws")

MAX_CONNECTIONS_PER_USER = 3


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        # user_id -> número de conexiones activas
        self.per_user: Dict[str, int] = {}
        self.chef_agent = ChefAgent()
        self.safety_agent = SafetyAgent()

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.per_user[user_id] = self.per_user.get(user_id, 0) + 1

    def disconnect(self, websocket: WebSocket, user_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        n = self.per_user.get(user_id, 1) - 1
        if n <= 0:
            self.per_user.pop(user_id, None)
        else:
            self.per_user[user_id] = n

    def at_capacity(self, user_id: str) -> bool:
        return self.per_user.get(user_id, 0) >= MAX_CONNECTIONS_PER_USER

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def handle_session(self, websocket: WebSocket, session_id: str):
        """Loop principal de una sesión de cocina."""
        session_context = {"timers": {}, "step": 1}
        while True:
            data = await websocket.receive_text()
            # Input malformado no debe tumbar la conexión.
            try:
                message = json.loads(data)
            except (json.JSONDecodeError, TypeError):
                await self.send_personal_message(
                    json.dumps({"error": "Formato inválido"}), websocket
                )
                continue

            if not isinstance(message, dict):
                continue

            msg_type = message.get("type", "text")
            if msg_type == "init_context":
                ctx = message.get("context", {})
                if isinstance(ctx, dict):
                    session_context.update(ctx)
                continue

            user_text = str(message.get("text", ""))[:2000]

            chef_response = await self.chef_agent.process_voice_command(user_text, session_context)
            safety_alert = await self.safety_agent.generate_safety_check(session_context, elapsed_time=300)

            timers_payload = [t.dict() for t in chef_response.timers_to_start]
            response_payload = {
                "agent": "chef",
                "text": chef_response.message,
                "audio_base64": None,
                "timers": timers_payload,
                "safety_injection": safety_alert.dict() if safety_alert else None,
            }
            await self.send_personal_message(json.dumps(response_payload), websocket)


router = APIRouter()
manager = ConnectionManager()


def _validate_ws_token(token: str | None) -> str | None:
    """Valida el JWT del query param. Retorna el user_id (sub) o None."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        sub = payload.get("sub")
        return str(sub) if sub else None
    except JWTError:
        return None


@router.websocket("/ws/cooking/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    # Auth en el handshake: el cliente debe pasar ?token=<JWT>.
    token = websocket.query_params.get("token")
    user_id = _validate_ws_token(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if manager.at_capacity(user_id):
        await websocket.close(code=status.WS_1013_TRY_AGAIN_LATER)
        return

    await manager.connect(websocket, user_id)
    try:
        await manager.handle_session(websocket, session_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception:  # noqa: BLE001
        logger.exception("ws session error")
        manager.disconnect(websocket, user_id)
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:  # noqa: BLE001
            pass
