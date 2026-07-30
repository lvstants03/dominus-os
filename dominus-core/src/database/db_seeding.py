import logging
from src.database.connection import get_db_session
from src.database.models.dominus import DominusService

logger = logging.getLogger(__name__)

def seed_default_services():
    """Gieo du lieu dich vu mac dinh vao CSDL"""
    default_services = [
        {
            "code": "markovbrain",
            "name": "MarkovBrain Real-time Lottery Service",
            "description": "Real-time analysis and prediction system for 5-minute lottery.",
            "status": "active",
            "meta_payload": {"url": "http://localhost:8000"}
        },
        {
            "code": "mark_xlix",
            "name": "Mark-XLIX Jarvis Voice Assistant",
            "description": "Jarvis-inspired local voice and vision assistant.",
            "status": "active",
            "meta_payload": {"url": "http://localhost:9000"}
        }
    ]

    try:
        with get_db_session() as session:
            for svc_data in default_services:
                existing = session.query(DominusService).filter_by(code=svc_data["code"]).first()
                if not existing:
                    svc = DominusService(
                        code=svc_data["code"],
                        name=svc_data["name"],
                        description=svc_data["description"],
                        status=svc_data["status"],
                        meta_payload=svc_data["meta_payload"]
                    )
                    session.add(svc)
                    logger.info(f"Seeded default service: {svc_data['code']}")
            session.commit()
    except Exception as e:
        logger.error(f"Error seeding default services: {e}")
