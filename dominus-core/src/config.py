import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8001))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:123456@localhost:5432/markovlotteai")
    
    REDIS_HOST: str = os.getenv("REDIS_HOST", "127.0.0.1")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    MARKOV_BRAIN_URL: str = os.getenv("MARKOV_BRAIN_URL", "http://localhost:8000")
    MARKOV_BRAIN_WS: str = os.getenv("MARKOV_BRAIN_WS", "ws://localhost:8000/ws")
    MARK_XLIX_URL: str = os.getenv("MARK_XLIX_URL", "http://localhost:9000")

config = Config()
