from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, CheckConstraint
from sqlalchemy.orm import validates
from datetime import datetime
import re
from src.database.models.base import Base

class DominusAssistantConfig(Base):
    __tablename__ = "dominus_assistant_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    gemini_api_key = Column(String(255), nullable=True)
    assistant_name = Column(String(50), default="DOMINUS", nullable=False)
    assistant_voice = Column(String(20), default="Charon", nullable=False)
    user_name = Column(String(50), default="Sir", nullable=False)
    ui_color = Column(String(7), default="#00d4ff", nullable=False)
    camera_index = Column(Integer, default=0, nullable=False)
    briefing_enabled = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint(
            "assistant_voice IN ('Charon', 'Puck', 'Kore', 'Fenrir', 'Aoede')",
            name="chk_assistant_voice"
        ),
    )

    @validates("ui_color")
    def validate_ui_color(self, key, value):
        if not re.match(r"^#[0-9a-fA-F]{6}$", value):
            raise ValueError("ui_color must be a valid hex color starting with # followed by 6 hex characters")
        return value

    @validates("gemini_api_key")
    def validate_api_key(self, key, value):
        if value and not value.startswith("AIza"):
            raise ValueError("gemini_api_key must start with google API key prefix 'AIza'")
        return value


class DominusAssistantMemory(Base):
    __tablename__ = "dominus_assistant_memory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(50), nullable=False, index=True)
    key = Column(String(100), nullable=False, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint(
            "category IN ('identity', 'preferences', 'projects', 'relationships', 'wishes', 'notes')",
            name="chk_memory_category"
        ),
    )


class DominusAssistantMonitor(Base):
    __tablename__ = "dominus_assistant_monitors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    topic = Column(String(255), unique=True, nullable=False)
    last_checked = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DominusAssistantReminder(Base):
    __tablename__ = "dominus_assistant_reminders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message = Column(Text, nullable=False)
    remind_at = Column(DateTime, nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'completed', 'cancelled')",
            name="chk_reminder_status"
        ),
    )
