import asyncio
import websockets
import json

async def test_cooking_session():
    uri = "ws://localhost:8000/api/v1/ws/cooking/test-session-123"
    async with websockets.connect(uri) as websocket:
        print("Connected to WebSocket")
        
        # Send a mock voice command (as text for now)
        message = {"text": "Start the pasta timer for 10 minutes", "audio_chunk": None}
        await websocket.send(json.dumps(message))
        print(f"Sent: {message['text']}")
        
        # Wait for response
        response = await websocket.recv()
        print(f"Received: {response}")

if __name__ == "__main__":
    asyncio.run(test_cooking_session())
