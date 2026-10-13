from contextlib import asynccontextmanager
from datetime import date, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine, get_db
from .models import TrackedItem
from .schemas import ItemCreate, ItemOut, ItemUpdate

EXPIRING_WINDOW_DAYS = 30


def calculate_status(expiry_date: date) -> tuple[int, str]:
    days = (expiry_date - date.today()).days
    if days < 0:
        return days, "expired"
    if days <= EXPIRING_WINDOW_DAYS:
        return days, "expiring"
    return days, "active"


def serialize_item(item: TrackedItem) -> dict:
    days, status = calculate_status(item.expiry_date)
    return {
        "id": item.id,
        "name": item.name,
        "kind": item.kind,
        "category": item.category,
        "issuer": item.issuer,
        "expiry_date": item.expiry_date,
        "reminder_days": item.reminder_days,
        "notes": item.notes,
        "created_at": item.created_at,
        "days_remaining": days,
        "status": status,
    }


def seed_demo_data():
    db = SessionLocal()
    try:
        if db.query(TrackedItem).count() == 0:
            today = date.today()
            examples = [
                TrackedItem(name="Passport", kind="document", category="Identity", issuer="Government of India", expiry_date=today + timedelta(days=420), reminder_days=90, notes="Demo record — replace with your own details."),
                TrackedItem(name="Driving Licence", kind="document", category="Transport", issuer="RTO", expiry_date=today + timedelta(days=18), reminder_days=30, notes="Demo record — check renewal requirements."),
                TrackedItem(name="Vehicle Insurance", kind="document", category="Insurance", issuer="Insurance provider", expiry_date=today + timedelta(days=6), reminder_days=30, notes="Demo record."),
                TrackedItem(name="Music subscription", kind="subscription", category="Entertainment", issuer="Streaming service", expiry_date=today + timedelta(days=12), reminder_days=7, notes="Demo record — check auto-renewal settings."),
                TrackedItem(name="Cloud storage plan", kind="subscription", category="Software", issuer="Cloud provider", expiry_date=today - timedelta(days=3), reminder_days=7, notes="Demo record."),
            ]
            db.add_all(examples)
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_demo_data()
    yield


app = FastAPI(
    title="ExpiryWise API",
    description="Track official-document and subscription expiry dates.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ExpiryWise API"}


@app.get("/api/items", response_model=list[ItemOut])
def list_items(
    q: Optional[str] = Query(default=None, max_length=120),
    kind: Optional[str] = Query(default=None, pattern="^(document|subscription)$"),
    status: Optional[str] = Query(default=None, pattern="^(expired|expiring|active)$"),
    db: Session = Depends(get_db),
):
    query = db.query(TrackedItem)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(or_(
            TrackedItem.name.ilike(term),
            TrackedItem.category.ilike(term),
            TrackedItem.issuer.ilike(term),
        ))
    if kind:
        query = query.filter(TrackedItem.kind == kind)
    items = query.order_by(TrackedItem.expiry_date.asc()).all()
    output = [serialize_item(item) for item in items]
    if status:
        output = [item for item in output if item["status"] == status]
    return output


@app.post("/api/items", response_model=ItemOut, status_code=201)
def create_item(payload: ItemCreate, db: Session = Depends(get_db)):
    item = TrackedItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return serialize_item(item)


@app.get("/api/items/{item_id}", response_model=ItemOut)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(TrackedItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return serialize_item(item)


@app.put("/api/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, payload: ItemUpdate, db: Session = Depends(get_db)):
    item = db.get(TrackedItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return serialize_item(item)


@app.delete("/api/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(TrackedItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return Response(status_code=204)


@app.get("/api/stats")
def stats(db: Session = Depends(get_db)):
    items = db.query(TrackedItem).all()
    serialized = [serialize_item(item) for item in items]
    return {
        "total": len(serialized),
        "expired": sum(item["status"] == "expired" for item in serialized),
        "expiring": sum(item["status"] == "expiring" for item in serialized),
        "active": sum(item["status"] == "active" for item in serialized),
        "documents": sum(item["kind"] == "document" for item in serialized),
        "subscriptions": sum(item["kind"] == "subscription" for item in serialized),
        "upcoming": sorted(
            [item for item in serialized if item["days_remaining"] >= 0],
            key=lambda item: item["days_remaining"],
        )[:5],
    }
