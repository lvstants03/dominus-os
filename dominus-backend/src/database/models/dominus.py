from sqlalchemy import Column, Integer, BigInteger, String, Boolean, Float, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from src.database.models.base import Base

class DominusService(Base):
    __tablename__ = "dominus_services"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="active", nullable=False)
    meta_payload = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    instances = relationship("DominusServiceInstance", back_populates="service", cascade="all, delete-orphan")
    user_roles = relationship("DominusUserServiceRole", back_populates="service", cascade="all, delete-orphan")
    actions = relationship("DominusAction", back_populates="service", cascade="all, delete-orphan")
    ai_logs = relationship("DominusAiLog", back_populates="service", cascade="all, delete-orphan")
    audit_trails = relationship("DominusAuditTrail", back_populates="service", cascade="all, delete-orphan")
    metrics = relationship("DominusMetric", back_populates="service", cascade="all, delete-orphan")
    devices = relationship("DominusDevice", back_populates="service", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive', 'pending')", name="chk_dominus_service_status"),
    )


class DominusServiceInstance(Base):
    __tablename__ = "dominus_service_instances"

    id = Column(Integer, primary_key=True, autoincrement=True)
    service_id = Column(Integer, ForeignKey("dominus_services.id", ondelete="CASCADE"), nullable=False)
    instance_code = Column(String(50), unique=True, nullable=False, index=True)
    config_payload = Column(JSONB, nullable=True)
    status = Column(String(20), default="running", nullable=False)
    last_heartbeat = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("DominusService", back_populates="instances")
    user_roles = relationship("DominusUserServiceRole", back_populates="instance")

    __table_args__ = (
        CheckConstraint("status IN ('running', 'stopped', 'error')", name="chk_dominus_instance_status"),
    )


class DominusUser(Base):
    __tablename__ = "dominus_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    face_embedding = Column(JSONB, nullable=True)
    role = Column(String(20), default="member", nullable=False)
    status = Column(String(20), default="active", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    service_roles = relationship("DominusUserServiceRole", back_populates="user", cascade="all, delete-orphan")
    actions = relationship("DominusAction", back_populates="user", cascade="all, delete-orphan")
    ai_logs = relationship("DominusAiLog", back_populates="user", cascade="all, delete-orphan")
    audit_trails = relationship("DominusAuditTrail", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'operator', 'analyst', 'member')", name="chk_dominus_user_role"),
        CheckConstraint("status IN ('active', 'inactive', 'suspended')", name="chk_dominus_user_status"),
    )


class DominusUserServiceRole(Base):
    __tablename__ = "dominus_user_service_roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("dominus_users.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("dominus_services.id", ondelete="CASCADE"), nullable=False)
    instance_id = Column(Integer, ForeignKey("dominus_service_instances.id", ondelete="CASCADE"), nullable=True)
    role = Column(String(50), default="user", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("DominusUser", back_populates="service_roles")
    service = relationship("DominusService", back_populates="user_roles")
    instance = relationship("DominusServiceInstance", back_populates="user_roles")


class DominusAction(Base):
    __tablename__ = "dominus_actions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    service_id = Column(Integer, ForeignKey("dominus_services.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("dominus_users.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String(50), nullable=False)
    payload = Column(JSONB, nullable=True)
    status = Column(String(20), default="pending", nullable=False)
    executed_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("DominusService", back_populates="actions")
    user = relationship("DominusUser", back_populates="actions")

    __table_args__ = (
        CheckConstraint("status IN ('pending', 'completed', 'failed')", name="chk_dominus_action_status"),
    )


class DominusAiLog(Base):
    __tablename__ = "dominus_ai_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    service_id = Column(Integer, ForeignKey("dominus_services.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("dominus_users.id", ondelete="CASCADE"), nullable=False)
    model_name = Column(String(50), default="dominus-core", nullable=False)
    session_id = Column(String(100), nullable=True, index=True)
    prompt = Column(Text, nullable=True)
    response = Column(Text, nullable=True)
    latency = Column(Float, nullable=True)
    success = Column(Boolean, default=True, nullable=False)
    meta_payload = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("DominusService", back_populates="ai_logs")
    user = relationship("DominusUser", back_populates="ai_logs")


class DominusAuditTrail(Base):
    __tablename__ = "dominus_audit_trails"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("dominus_users.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("dominus_services.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)
    payload = Column(JSONB, nullable=True)
    success = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("DominusUser", back_populates="audit_trails")
    service = relationship("DominusService", back_populates="audit_trails")


class DominusMetric(Base):
    __tablename__ = "dominus_metrics"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    service_id = Column(Integer, ForeignKey("dominus_services.id", ondelete="CASCADE"), nullable=False)
    metric_type = Column(String(50), nullable=False)
    metric_value = Column(Float, nullable=False)
    labels = Column(JSONB, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("DominusService", back_populates="metrics")


class DominusDevice(Base):
    __tablename__ = "dominus_devices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    service_id = Column(Integer, ForeignKey("dominus_services.id", ondelete="CASCADE"), nullable=False)
    device_code = Column(String(50), unique=True, nullable=False, index=True)
    device_type = Column(String(50), nullable=False)
    status = Column(String(20), default="active", nullable=False)
    device_metadata = Column(JSONB, nullable=True)
    last_seen = Column(DateTime, default=datetime.utcnow)

    service = relationship("DominusService", back_populates="devices")
