import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from src.gateway.health import get_system_health

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/gateway", tags=["Gateway WebSocket"])

ALLOWED_ORIGINS = {"http://localhost:3000", "http://127.0.0.1:3000"}
PUSH_INTERVAL_SECONDS = 3


class ConnectionManager:
    def __init__(self):
        self._clients: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> bool:
        # Cho phép mọi kết nối trong môi trường local dev để tránh lỗi 403 Forbidden
        await ws.accept()
        async with self._lock:
            self._clients.append(ws)
        logger.info(f"[WS] Client connected. Total clients: {len(self._clients)}")
        return True

    async def disconnect(self, ws: WebSocket):
        async with self._lock:
            try:
                self._clients.remove(ws)
            except ValueError:
                pass
        logger.info(f"[WS] Client disconnected. Total clients: {len(self._clients)}")

    async def broadcast(self, payload: dict):
        if not self._clients:
            return
        message = json.dumps(payload)
        dead: list[WebSocket] = []
        for ws in list(self._clients):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        if dead:
            async with self._lock:
                for ws in dead:
                    try:
                        self._clients.remove(ws)
                    except ValueError:
                        pass


manager = ConnectionManager()
_push_task: asyncio.Task | None = None


async def _health_push_loop():
    """Push health data to all connected WS clients every PUSH_INTERVAL_SECONDS."""
    while True:
        await asyncio.sleep(PUSH_INTERVAL_SECONDS)
        if not manager._clients:
            continue
        try:
            health = await get_system_health()
            await manager.broadcast({"type": "health_update", "data": health})
        except Exception as ex:
            logger.error(f"[WS] Error in health push loop: {ex}")


def ensure_push_task():
    global _push_task
    loop = asyncio.get_event_loop()
    if _push_task is None or _push_task.done():
        _push_task = loop.create_task(_health_push_loop())
        logger.info("[WS] Health push loop started.")


@router.websocket("/ws")
async def gateway_ws(websocket: WebSocket):
    """
    WebSocket endpoint for realtime gateway health push.
    FE connects here and receives health_update every 3 seconds.
    """
    connected = await manager.connect(websocket)
    if not connected:
        return

    ensure_push_task()

    # Send immediate snapshot on connect
    try:
        health = await get_system_health()
        await websocket.send_text(json.dumps({"type": "health_update", "data": health}))
    except Exception as ex:
        logger.warning(f"[WS] Failed to send initial snapshot: {ex}")

    try:
        while True:
            # Keep connection alive; handle client messages (ping/pong or ignore)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            else:
                try:
                    payload = json.loads(data)
                    if payload.get("type") == "text_command":
                        await manager.broadcast(payload)
                except Exception:
                    pass
    except WebSocketDisconnect:
        pass
    except Exception as ex:
        logger.warning(f"[WS] Connection error: {ex}")
    finally:
        await manager.disconnect(websocket)
