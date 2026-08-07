import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.gateway.health import get_system_health
from src.config import config
from src.database.connection import get_db
from src.database.models.dominus import DominusService, DominusMetric

router = APIRouter(prefix="/api/gateway", tags=["Gateway"])

import subprocess
import sys
import os
import platform
from pathlib import Path
import psutil

# In-memory AI process handle
_assistant_process = None

def get_project_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent.parent

def is_assistant_running() -> bool:
    global _assistant_process
    if _assistant_process and _assistant_process.poll() is None:
        return True
    
    # Quét dự phòng các tiến trình python đang chạy dominus-assistant/main.py
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = proc.info.get('cmdline') or []
            cmd_str = " ".join(cmdline).lower()
            if "python" in proc.info['name'].lower() and "dominus-assistant/main.py" in cmd_str:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False

def start_assistant() -> bool:
    global _assistant_process
    if is_assistant_running():
        return True
        
    project_root = get_project_root()
    venv_python = project_root / "MarkovBrain" / ".venv" / "Scripts" / "python.exe"
    if not venv_python.exists():
        venv_python = sys.executable
        
    cmd = [str(venv_python), "dominus-assistant/main.py"]
    env = os.environ.copy()
    env["PYTHONPATH"] = str(project_root / "dominus-core") + ";" + str(project_root)
    env["PYTHONWARNINGS"] = "ignore"
    env["PYTHONIOENCODING"] = "utf-8"
    
    try:
        # Không dùng CREATE_NO_WINDOW để cửa sổ GUI PySide6 Ambient Orb hiển thị ra màn hình desktop
        _assistant_process = subprocess.Popen(
            cmd,
            cwd=str(project_root),
            env=env
        )
        return True
    except Exception as e:
        print(f"Error starting assistant: {e}")
        return False

def stop_assistant() -> bool:
    global _assistant_process
    killed = False
    
    # Kill bằng PID handle trước
    if _assistant_process:
        try:
            parent = psutil.Process(_assistant_process.pid)
            for child in parent.children(recursive=True):
                child.kill()
            parent.kill()
            killed = True
        except Exception:
            try:
                _assistant_process.kill()
                killed = True
            except Exception:
                pass
        _assistant_process = None
        
    # Quét dọn dẹp dự phòng nếu có các tiến trình assistant khác mồ côi
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = proc.info.get('cmdline') or []
            cmd_str = " ".join(cmdline).lower()
            if "python" in proc.info['name'].lower() and "dominus-assistant/main.py" in cmd_str:
                parent = psutil.Process(proc.info['pid'])
                for child in parent.children(recursive=True):
                    child.kill()
                parent.kill()
                killed = True
        except Exception:
            pass
            
    return killed


class AiToggleRequest(BaseModel):
    enabled: bool


@router.get("/ai/status")
async def get_ai_status():
    """Lay trang thai bat/tat AI Dominus Intelligence Engine"""
    return {"enabled": is_assistant_running()}


@router.post("/ai/toggle")
async def toggle_ai(body: AiToggleRequest):
    """Bat/tat AI Dominus Intelligence Engine de tiet kiem RAM"""
    success = False
    if body.enabled:
        success = start_assistant()
        message = "Dominus AI Assistant started successfully." if success else "Failed to start Dominus AI Assistant."
    else:
        success = stop_assistant()
        message = "Dominus AI Assistant stopped successfully." if success else "Dominus AI Assistant was not running."
        
    return {
        "status": "ok" if success else "error",
        "enabled": is_assistant_running(),
        "message": message
    }


class UiLogRequest(BaseModel):
    text: str


class UiStateRequest(BaseModel):
    state: str


@router.post("/ui/log")
async def receive_ui_log(body: UiLogRequest):
    from src.gateway.ws_router import manager as ws_manager
    await ws_manager.broadcast({"type": "assistant_log", "text": body.text})
    return {"status": "ok"}


@router.post("/ui/state")
async def receive_ui_state(body: UiStateRequest):
    from src.gateway.ws_router import manager as ws_manager
    await ws_manager.broadcast({"type": "assistant_state", "state": body.state})
    return {"status": "ok"}


class UiControlMicRequest(BaseModel):
    muted: bool


class UiControlCameraRequest(BaseModel):
    active: bool


@router.post("/ui/control/mic")
async def control_mic(body: UiControlMicRequest):
    from src.gateway.ws_router import manager as ws_manager
    await ws_manager.broadcast({"type": "control_mic", "muted": body.muted})
    return {"status": "ok"}


@router.post("/ui/control/interrupt")
async def control_interrupt():
    from src.gateway.ws_router import manager as ws_manager
    await ws_manager.broadcast({"type": "control_interrupt"})
    return {"status": "ok"}


@router.post("/ui/control/camera")
async def control_camera(body: UiControlCameraRequest):
    from src.gateway.ws_router import manager as ws_manager
    await ws_manager.broadcast({"type": "control_camera", "active": body.active})
    return {"status": "ok"}


from src.database.models.assistant import DominusAssistantConfig

class AssistantConfigResponse(BaseModel):
    gemini_api_key: str | None
    assistant_name: str
    assistant_voice: str
    user_name: str
    ui_color: str
    camera_index: int
    briefing_enabled: bool


class AssistantConfigUpdate(BaseModel):
    gemini_api_key: str | None = None
    assistant_name: str | None = None
    assistant_voice: str | None = None
    user_name: str | None = None
    ui_color: str | None = None
    camera_index: int | None = None
    briefing_enabled: bool | None = None


@router.get("/config", response_model=AssistantConfigResponse)
async def get_assistant_config(db: Session = Depends(get_db)):
    cfg = db.query(DominusAssistantConfig).first()
    if not cfg:
        return {
            "gemini_api_key": None,
            "assistant_name": "DOMINUS",
            "assistant_voice": "Charon",
            "user_name": "Sir",
            "ui_color": "#00d4ff",
            "camera_index": 0,
            "briefing_enabled": True
        }
    return cfg


@router.post("/config")
async def update_assistant_config(body: AssistantConfigUpdate, db: Session = Depends(get_db)):
    cfg = db.query(DominusAssistantConfig).first()
    if not cfg:
        cfg = DominusAssistantConfig()
        db.add(cfg)
    
    if body.gemini_api_key is not None:
        cfg.gemini_api_key = body.gemini_api_key if body.gemini_api_key.strip() != "" else None
    if body.assistant_name is not None:
        cfg.assistant_name = body.assistant_name
    if body.assistant_voice is not None:
        cfg.assistant_voice = body.assistant_voice
    if body.user_name is not None:
        cfg.user_name = body.user_name
    if body.ui_color is not None:
        cfg.ui_color = body.ui_color
    if body.camera_index is not None:
        cfg.camera_index = body.camera_index
    if body.briefing_enabled is not None:
        cfg.briefing_enabled = body.briefing_enabled
        
    try:
        db.commit()
        db.refresh(cfg)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
        
    return {"status": "success", "message": "Assistant configuration updated successfully."}


import socket

@router.get("/remote-url")
async def get_remote_url():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
        
    return {
        "ip": ip,
        "url": f"http://{ip}:8003",
        "message": "Quét mã QR bằng điện thoại cùng mạng Wifi để truy cập Executive Control."
    }


@router.get("/health")
async def gateway_health():
    """Endpoint bao cao suc khoe toan bo cac module va service trong he thong"""
    health_report = await get_system_health()
    return health_report

@router.post("/metric")
async def record_metric(
    metric_type: str,
    metric_value: float,
    service_code: str,
    labels: dict = None,
    db: Session = Depends(get_db)
):
    """Ghi nhan metric cua cac service con vao he thong dominus-os"""
    service = db.query(DominusService).filter_by(code=service_code).first()
    if not service:
        raise HTTPException(status_code=404, detail=f"Service {service_code} not found")
    
    metric = DominusMetric(
        service_id=service.id,
        metric_type=metric_type,
        metric_value=metric_value,
        labels=labels
    )
    db.add(metric)
    db.commit()
    return {"status": "success", "message": "Metric recorded"}

@router.api_route("/proxy/{service_code}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def dynamic_proxy(
    service_code: str,
    path: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Reverse proxy dong chuyen tiep requests tu Gateway toi service con tuong ung.
    """
    service = db.query(DominusService).filter_by(code=service_code).first()
    if not service:
        raise HTTPException(status_code=404, detail=f"Service {service_code} not found")
        
    base_url = (service.meta_payload or {}).get("url")
    if not base_url:
        raise HTTPException(status_code=400, detail=f"Service {service_code} does not have a configured URL")
        
    target_url = f"{base_url.rstrip('/')}/{path}"
    if request.query_params:
        target_url = f"{target_url}?{request.query_params}"
        
    body = await request.body()
    headers = dict(request.headers)
    
    # Clean headers
    headers.pop("host", None)
    headers.pop("content-length", None)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            proxy_req = client.build_request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body
            )
            proxy_resp = await client.send(proxy_req)
            
            return StreamingResponse(
                proxy_resp.aiter_raw(),
                status_code=proxy_resp.status_code,
                headers=dict(proxy_resp.headers)
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Bad Gateway: Failed to contact upstream service {service_code}: {exc}")
