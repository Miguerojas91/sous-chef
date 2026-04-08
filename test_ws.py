import asyncio
import websockets
import json
import sys

async def test_connection():
    uri = "ws://127.0.0.1:8000/api/v1/ws/cooking/test-session"
    print(f"Connnecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            msg = {"text": "Hello Chef", "audio_chunk": None}
            await websocket.send(json.dumps(msg))
            response = await websocket.recv()
            print(f"Received: {response}")
            return True
    except ConnectionRefusedError:
        print("ERROR: Connection Refused. Backend is NOT running or checking wrong port.")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    try:
        if asyncio.run(test_connection()):
            sys.exit(0)
        else:
            sys.exit(1)
    except KeyboardInterrupt:
        pass
