from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import json
import asyncio
from app.agents.chef_agent import ChefAgent
from app.agents.safety_agent import SafetyAgent

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.chef_agent = ChefAgent()
        self.safety_agent = SafetyAgent()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

    async def handle_session(self, websocket: WebSocket, session_id: str):
        """
        Main loop for handling a cooking session.
        - Receives Audio/Text from Client
        - Processes via Agents
        - Sends Response (Audio/Text) + Safety Events
        """
        try:
            session_context = {"timers": {}, "step": 1}
            while True:
                # 1. Receive Input (Assuming JSON for now, binary for audio later)
                data = await websocket.receive_text() 
                message = json.loads(data)
                
                # Check for initialization context
                msg_type = message.get("type", "text")
                if msg_type == "init_context":
                    session_context.update(message.get("context", {}))
                    continue # Wait for the next user message
                
                # 2. Process via Chef Agent
                # TODO: Integrate STT here to convert audio -> text
                user_text = message.get("text", "")
                
                chef_response = await self.chef_agent.process_voice_command(user_text, session_context)
                
                # 3. Check for Safety Injections (Proactive)
                # In a real scenario, this might run as a parallel task
                safety_alert = await self.safety_agent.generate_safety_check(session_context, elapsed_time=300)
                
                timers_payload = [t.dict() for t in chef_response.timers_to_start]
                
                response_payload = {
                    "agent": "chef",
                    "text": chef_response.message,
                    "audio_base64": None, # TODO: TTS generation
                    "timers": timers_payload,
                    "safety_injection": safety_alert.dict() if safety_alert else None
                }

                await self.send_personal_message(json.dumps(response_payload), websocket)

        except WebSocketDisconnect:
            self.disconnect(websocket)

from fastapi import APIRouter

router = APIRouter()
manager = ConnectionManager()

@router.websocket("/ws/cooking/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket)
    try:
        await manager.handle_session(websocket, session_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

