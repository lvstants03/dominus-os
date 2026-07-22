import uvicorn
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import config
from src.database.connection import init_db
from src.database.db_seeding import seed_default_services
from src.gateway.router import router as gateway_router
from src.gateway.auth_routes import router as auth_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("dominus-backend")

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting DOMINUS-OS Backend...")
    # Khoi tao bang CSDL neu chua co
    init_db()
    # Gieo du lieu dich vu mac dinh
    seed_default_services()
    logger.info("DOMINUS-OS Backend successfully initialized.")
    yield

app = FastAPI(
    title="DOMINUS Global Operating System API",
    description="The Central Intelligence Operating System API Gateway.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "name": "DOMINUS Global Operating System",
        "status": "online",
        "version": "1.0.0"
    }

# Dang ky routers
app.include_router(gateway_router)
app.include_router(auth_router)

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=True
    )
