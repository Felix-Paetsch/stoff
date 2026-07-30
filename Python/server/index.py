import asyncio
import inspect
import json
import traceback
from typing import Any

from stoff_types import deserialize_from_json, serialize
from websockets.asyncio.server import ServerConnection, serve
from websockets.exceptions import ConnectionClosed

from methods import method_dict


async def handle_request(request: dict[str, Any]) -> dict[str, Any]:
    request_id = request.get("id")
    message = request.get("message")

    if not isinstance(message, str):
        return {
            "id": request_id,
            "ok": False,
            "reason": "invalid_message",
        }

    try:
        message_deserialized = json.loads(message)
    except json.JSONDecodeError:
        return {
            "id": request_id,
            "ok": False,
            "reason": "invalid_message",
        }

    if not isinstance(message_deserialized, dict):
        return {
            "id": request_id,
            "ok": False,
            "reason": "invalid_message",
        }

    method_name = message_deserialized.get("method")
    serialized_arguments = message_deserialized.get("data")

    if not isinstance(method_name, str):
        return {
            "id": request_id,
            "ok": False,
            "reason": "unknown_method",
        }

    method = method_dict.get(method_name)

    if method is None:
        return {
            "id": request_id,
            "ok": False,
            "reason": "unknown_method",
        }

    try:
        arguments = deserialize_from_json(serialized_arguments)
    except Exception:
        return {
            "id": request_id,
            "ok": False,
            "reason": "invalid_arguments",
        }

    if not isinstance(arguments, (list, tuple)):
        return {
            "id": request_id,
            "ok": False,
            "reason": "invalid_message",
        }

    try:
        result = method(*arguments)

        if inspect.isawaitable(result):
            result = await result

        return {
            "id": request_id,
            "ok": True,
            "data": serialize(result),
        }

    except Exception:
        print("====== Exception =======")
        traceback.print_exc()
        print("=========================")

        return {
            "id": request_id,
            "ok": False,
            "reason": "internal_error",
        }


async def connection_handler(websocket: ServerConnection) -> None:
    try:
        async for message in websocket:
            request: dict[str, Any] | None = None

            try:
                if not isinstance(message, str):
                    raise ValueError("Request must be a text message")

                request = json.loads(message)

                if not isinstance(request, dict):
                    raise ValueError("Request must be a JSON object")

                response = await handle_request(request)

            except json.JSONDecodeError:
                response = {
                    "id": None,
                    "ok": False,
                    "reason": "invalid_request",
                    "error": "Invalid JSON",
                }

            except Exception as error:
                response = {
                    "id": request.get("id") if request else None,
                    "ok": False,
                    "reason": "invalid_request",
                    "error": str(error),
                }

            try:
                await websocket.send(json.dumps(response))
            except ConnectionClosed:
                break

    except ConnectionClosed:
        pass


async def main() -> None:
    port = 3001

    async with serve(connection_handler, "localhost", port):
        print(f"WebSocket server listening on ws://localhost:{port}")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
