import asyncio
import json
from typing import Any

from websockets.asyncio.server import ServerConnection, serve


async def handle_request(request: dict[str, Any]) -> dict[str, Any]:
    action = request.get("action")

    if action == "add":
        a = request.get("a")
        b = request.get("b")

        if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
            raise ValueError("a and b must be numbers")

        return {
            "result": a + b,
        }

    if action == "greet":
        name = request.get("name", "world")

        return {
            "message": f"Hello, {name}!",
        }

    raise ValueError(f"Unknown action: {action}")


async def connection_handler(websocket: ServerConnection) -> None:
    async for message in websocket:
        try:
            request = json.loads(message)
            request_id = request.get("id")

            result = await handle_request(request)

            response = {
                "id": request_id,
                "ok": True,
                "data": result,
            }
        except Exception as error:
            response = {
                "id": request.get("id") if "request" in locals() else None,
                "ok": False,
                "error": str(error),
            }

        await websocket.send(json.dumps(response))


async def main() -> None:
    port = 3001
    async with serve(connection_handler, "localhost", port):
        print(f"WebSocket server listening on ws://localhost:{port}")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
