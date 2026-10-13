from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ItemBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    kind: Literal["document", "subscription"]
    category: str = Field(min_length=1, max_length=60)
    issuer: Optional[str] = Field(default=None, max_length=120)
    expiry_date: date
    reminder_days: int = Field(default=30, ge=0, le=365)
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("name", "category")
    @classmethod
    def strip_required_strings(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value


class ItemCreate(ItemBase):
    pass


class ItemUpdate(ItemBase):
    pass


class ItemOut(ItemBase):
    id: int
    created_at: Optional[datetime] = None
    days_remaining: int
    status: Literal["expired", "expiring", "active"]

    model_config = ConfigDict(from_attributes=True)
