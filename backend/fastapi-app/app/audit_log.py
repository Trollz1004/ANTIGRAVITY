from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

from app.database import Base # Import Base from app.database

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True)
    action = Column(String, index=True, nullable=False)
    table_name = Column(String, index=True, nullable=False)
    record_id = Column(String, nullable=True)
    before_values = Column(JSONB, nullable=True)
    after_values = Column(JSONB, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String, nullable=True)
