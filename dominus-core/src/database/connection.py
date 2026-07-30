import logging
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from src.config import config
from src.database.models.base import Base

logger = logging.getLogger(__name__)

db_url = config.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
    with engine.connect() as conn:
        pass
    logger.info("Successfully connected to shared database.")
except Exception as e:
    logger.error(f"Failed to connect to configured DATABASE_URL ({db_url}): {e}")
    raise e

SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

def init_db():
    """Khoi tao cac bang CSDL cua Dominus neu chua ton tai"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Dominus database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}")

@contextmanager
def get_db_session():
    """Context manager cap phat va dong session CSDL an toan"""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def get_db():
    """Generator danh rieng cho FastAPI dependency injection (khong boc contextmanager)"""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()
