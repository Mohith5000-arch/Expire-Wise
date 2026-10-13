from sqlalchemy import Column, Date, DateTime, Integer, String, Text
from sqlalchemy.sql import func
from .database import Base


class TrackedItem(Base):
    __tablename__ = "tracked_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, index=True)
    kind = Column(String(24), nullable=False, index=True)  # document | subscription
    category = Column(String(60), nullable=False, default="Other")
    issuer = Column(String(120), nullable=True)
    expiry_date = Column(Date, nullable=False, index=True)
    reminder_days = Column(Integer, nullable=False, default=30)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
