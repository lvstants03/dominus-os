import time
import asyncio
import httpx
import logging
from typing import Dict, Any
from sqlalchemy import text
from src.config import config
from src.database.connection import get_db_session

logger = logging.getLogger(__name__)

def _check_db_sync():
    with get_db_session() as session:
        session.execute(text("SELECT 1"))

async def check_database() -> Dict[str, Any]:
    start_time = time.time()
    try:
        await asyncio.to_thread(_check_db_sync)
        latency = (time.time() - start_time) * 1000
        return {"status": "healthy", "latency_ms": round(latency, 2)}
    except Exception as e:
        logger.error(f"Health check: Database failure: {e}")
        return {"status": "unhealthy", "error": str(e)}

def _check_redis_sync():
    import redis
    r = redis.Redis(
        host=config.REDIS_HOST,
        port=config.REDIS_PORT,
        password=config.REDIS_PASSWORD,
        socket_timeout=2
    )
    r.ping()

async def check_redis() -> Dict[str, Any]:
    start_time = time.time()
    try:
        await asyncio.to_thread(_check_redis_sync)
        latency = (time.time() - start_time) * 1000
        return {"status": "healthy", "latency_ms": round(latency, 2)}
    except Exception as e:
        logger.warning(f"Health check: Redis connection failed: {e}")
        return {"status": "unhealthy", "error": str(e)}

async def check_gemini() -> Dict[str, Any]:
    start_time = time.time()
    if not config.GEMINI_API_KEY:
        return {"status": "unconfigured", "error": "GEMINI_API_KEY is missing"}
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={config.GEMINI_API_KEY}"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(url)
            latency = (time.time() - start_time) * 1000
            if response.status_code == 200:
                return {"status": "healthy", "latency_ms": round(latency, 2)}
            else:
                return {"status": "unhealthy", "status_code": response.status_code, "error": response.text[:100]}
    except Exception as e:
        logger.warning(f"Health check: Gemini API check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}

async def check_dynamic_service(code: str, name: str, meta_payload: Any) -> Dict[str, Any]:
    start_time = time.time()
    if not meta_payload or not isinstance(meta_payload, dict):
        return {"status": "unconfigured", "error": "meta_payload is missing or invalid"}
    
    base_url = meta_payload.get("url")
    if not base_url:
        return {"status": "unconfigured", "error": "url is missing in meta_payload"}
        
    health_path = meta_payload.get("health_path", "/")
    if not health_path.startswith("/"):
        health_path = "/" + health_path
        
    url = f"{base_url.rstrip('/')}{health_path}"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(url)
            latency = (time.time() - start_time) * 1000
            if response.status_code == 200:
                details = {}
                try:
                    details = response.json()
                except Exception:
                    pass
                return {
                    "status": "healthy",
                    "latency_ms": round(latency, 2),
                    "details": details
                }
            else:
                return {"status": "unhealthy", "status_code": response.status_code, "error": response.text[:100]}
    except Exception as e:
        logger.warning(f"Health check: Service {code} ({url}) check failed: {e}")
        return {"status": "offline", "error": str(e)}

async def get_system_health() -> Dict[str, Any]:
    # 1. Check core systems: db, redis, gemini
    db_task = check_database()
    redis_task = check_redis()
    gemini_task = check_gemini()
    
    # 2. Get active services from database
    services_to_check = []
    try:
        from src.database.models.dominus import DominusService
        with get_db_session() as session:
            active_services = session.query(DominusService).filter_by(status="active").all()
            for svc in active_services:
                services_to_check.append({
                    "code": svc.code,
                    "name": svc.name,
                    "meta_payload": svc.meta_payload
                })
    except Exception as ex:
        logger.error(f"Health check: Failed to fetch services from DB: {ex}")

    # 3. Build task list
    tasks = [db_task, redis_task, gemini_task]
    for svc in services_to_check:
        tasks.append(check_dynamic_service(svc["code"], svc["name"], svc["meta_payload"]))
        
    # 4. Execute all tasks in parallel
    results = await asyncio.gather(*tasks)
    
    db_status = results[0]
    redis_status = results[1]
    gemini_status = results[2]
    
    # Parse dynamic service statuses
    services_report = {}
    service_results = results[3:]
    
    overall_status = "healthy"
    if db_status["status"] != "healthy" or gemini_status["status"] == "unhealthy":
        overall_status = "unhealthy"
        
    for i, svc in enumerate(services_to_check):
        code = svc["code"]
        status_info = service_results[i]
        
        # Đặc biệt bóc tách markovbrain http/websocket để giữ nguyên định dạng API cũ
        if code == "markovbrain":
            markov_http = {"status": "unhealthy"}
            markov_ws = {"status": "unhealthy"}
            if status_info["status"] == "healthy":
                markov_http = {"status": "healthy", "latency_ms": status_info.get("latency_ms", 0)}
                ws_status = status_info.get("details", {}).get("ws_status", "disconnected")
                if ws_status == "connected":
                    markov_ws = {"status": "healthy"}
                else:
                    markov_ws = {"status": "unhealthy", "message": f"WebSocket state is {ws_status}"}
            else:
                markov_http = {"status": "unhealthy", "error": status_info.get("error")}
                markov_ws = {"status": "unhealthy", "error": "MarkovBrain API Node is offline"}
            
            services_report["markov_brain_http"] = markov_http
            services_report["markov_brain_ws"] = markov_ws
            if markov_http["status"] == "unhealthy" and overall_status == "healthy":
                overall_status = "degraded"
        else:
            services_report[code] = status_info
            if status_info["status"] != "healthy" and overall_status == "healthy":
                overall_status = "degraded"
                
    return {
        "status": overall_status,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "services": {
            "database": db_status,
            "redis": redis_status,
            "gemini_api": gemini_status,
            **services_report
        }
    }
