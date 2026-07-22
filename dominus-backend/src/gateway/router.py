import httpx
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.gateway.health import get_system_health
from src.config import config
from src.database.connection import get_db
from src.database.models.dominus import DominusService, DominusMetric

router = APIRouter(prefix="/api/gateway", tags=["Gateway"])

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
