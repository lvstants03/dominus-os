import time
import asyncio
import httpx
import logging
from typing import Dict, Any
from sqlalchemy import text
from src.config import config
from src.database.connection import get_db_session

logger = logging.getLogger(__name__)

async def check_database() -> Dict[str, Any]:
    start_time = time.time()
    try:
        with get_db_session() as session:
            session.execute(text("SELECT 1"))
        latency = (time.time() - start_time) * 1000
        return {"status": "healthy", "latency_ms": round(latency, 2)}
    except Exception as e:
        logger.error(f"Health check: Database failure: {e}")
        return {"status": "unhealthy", "error": str(e)}

async def check_redis() -> Dict[str, Any]:
    start_time = time.time()
    try:
        import redis
        r = redis.Redis(
            host=config.REDIS_HOST,
            port=config.REDIS_PORT,
            password=config.REDIS_PASSWORD,
            socket_timeout=2
        )
        r.ping()
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

async def check_service_markovbrain() -> Dict[str, Any]:
    start_time = time.time()
    url = f"{config.MARKOV_BRAIN_URL}/api/statistics"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(url)
            latency = (time.time() - start_time) * 1000
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "latency_ms": round(latency, 2),
                    "details": response.json()
                }
            else:
                return {"status": "unhealthy", "status_code": response.status_code}
    except Exception as e:
        logger.warning(f"Health check: MarkovBrain check failed: {e}")
        return {"status": "offline", "error": str(e)}

async def check_service_markxlix() -> Dict[str, Any]:
    start_time = time.time()
    # Mark-XLIX có thể có endpoint health hoặc root endpoint
    url = f"{config.MARK_XLIX_URL}/"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(url)
            latency = (time.time() - start_time) * 1000
            # Nhận 200 hoặc bất kỳ status nào chứng tỏ service online
            return {"status": "healthy", "latency_ms": round(latency, 2)}
    except Exception as e:
        logger.warning(f"Health check: Mark-XLIX check failed: {e}")
        return {"status": "offline", "error": str(e)}

async def get_system_health() -> Dict[str, Any]:
    # Run all health checks in parallel to minimize latency
    db_task = check_database()
    redis_task = check_redis()
    gemini_task = check_gemini()
    markov_task = check_service_markovbrain()
    markxlix_task = check_service_markxlix()

    db_status, redis_status, gemini_status, markov_status, markxlix_status = await asyncio.gather(
        db_task, redis_task, gemini_task, markov_task, markxlix_task
    )

    # Split markov_brain into HTTP and WebSocket components
    markov_http = {"status": "unhealthy"}
    markov_ws = {"status": "unhealthy"}
    if markov_status["status"] == "healthy":
        markov_http = {"status": "healthy", "latency_ms": markov_status.get("latency_ms", 0)}
        ws_status = markov_status.get("details", {}).get("ws_status", "disconnected")
        if ws_status == "connected":
            markov_ws = {"status": "healthy"}
        else:
            markov_ws = {"status": "unhealthy", "message": f"WebSocket state is {ws_status}"}
    else:
        markov_http = {"status": "unhealthy", "error": markov_status.get("error")}
        markov_ws = {"status": "unhealthy", "error": "MarkovBrain API Node is offline"}

    overall_status = "healthy"
    if db_status["status"] != "healthy" or gemini_status["status"] == "unhealthy":
        overall_status = "unhealthy"
    elif markov_http["status"] == "unhealthy" or markxlix_status["status"] == "offline":
        overall_status = "degraded"

    return {
        "status": overall_status,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "services": {
            "database": db_status,
            "redis": redis_status,
            "gemini_api": gemini_status,
            "markov_brain_http": markov_http,
            "markov_brain_ws": markov_ws,
            "mark_xlix": markxlix_status
        }
    }
