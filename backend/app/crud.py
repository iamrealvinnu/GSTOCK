from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from datetime import date, datetime, timedelta

# Vendor CRUD
def get_vendor(db: Session, vendor_id: str):
    return db.query(models.Vendor).filter(models.Vendor.id == vendor_id).first()

def get_vendors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Vendor).offset(skip).limit(limit).all()

def create_vendor(db: Session, vendor: schemas.VendorCreate):
    db_vendor = models.Vendor(**vendor.dict())
    db.add(db_vendor)
    db.commit()
    db.refresh(db_vendor)
    return db_vendor

# Medicine CRUD
def get_medicine(db: Session, medicine_id: str):
    return db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()

def get_medicines(db: Session, skip: int = 0, limit: int = 100, category: str = None):
    query = db.query(models.Medicine)
    if category:
        query = query.filter(models.Medicine.category == category)
    return query.offset(skip).limit(limit).all()

def create_medicine(db: Session, medicine: schemas.MedicineCreate):
    db_medicine = models.Medicine(**medicine.dict())
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine

def update_medicine_quantity(db: Session, medicine_id: str, quantity_change: int, handled_by: str = None):
    db_medicine = get_medicine(db, medicine_id)
    if db_medicine:
        db_medicine.quantity += quantity_change
        if handled_by:
            db_medicine.last_updated_by = handled_by
        db.commit()
        db.refresh(db_medicine)
    return db_medicine

# UsageLog CRUD
def create_usage_log(db: Session, log: schemas.UsageLogCreate):
    db_log = models.UsageLog(**log.dict())
    # Update medicine quantity and the "last_updated_by" field
    update_medicine_quantity(db, log.medicine_id, -log.quantity_deducted, log.handled_by)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

# Stats
def get_dashboard_stats(db: Session):
    today = date.today()
    
    total_items = db.query(models.Medicine).count()
    
    # Life-Cycle Logic
    six_months = today + timedelta(days=180)
    three_months = today + timedelta(days=90)

    safe_items = db.query(models.Medicine).filter(models.Medicine.exp_date > six_months).count()
    monitoring_items = db.query(models.Medicine).filter(
        models.Medicine.exp_date <= six_months,
        models.Medicine.exp_date > three_months
    ).count()
    expiring_soon = db.query(models.Medicine).filter(
        models.Medicine.exp_date <= three_months,
        models.Medicine.exp_date > today
    ).count()
    expired_items = db.query(models.Medicine).filter(models.Medicine.exp_date <= today).count()
    
    low_stock_items = db.query(models.Medicine).filter(
        models.Medicine.quantity <= models.Medicine.reorder_threshold
    ).count()
    
    total_value = db.query(func.sum(models.Medicine.quantity * models.Medicine.unit_cost)).scalar() or 0.0
    
    return schemas.DashboardStats(
        total_items=total_items,
        items_expiring_soon=expiring_soon,
        safe_items=safe_items,
        monitoring_items=monitoring_items,
        expired_items=expired_items,
        low_stock_items=low_stock_items,
        total_inventory_value=total_value
    )
