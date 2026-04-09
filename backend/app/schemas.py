from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

# Vendor Schemas
class VendorBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class VendorCreate(VendorBase):
    pass

class Vendor(VendorBase):
    id: str

    model_config = {"from_attributes": True}

# UsageLog Schemas
class UsageLogBase(BaseModel):
    medicine_id: str
    quantity_deducted: int
    handled_by: str
    notes: Optional[str] = None
    signature_data: Optional[str] = None

class UsageLogCreate(UsageLogBase):
    pass

class UsageLog(UsageLogBase):
    id: str
    timestamp: datetime

    model_config = {"from_attributes": True}

# Medicine Schemas
class MedicineBase(BaseModel):
    name: str
    brand_name: Optional[str] = None
    strength: Optional[str] = None
    invoice_no: Optional[str] = None
    batch_no: str
    mfg_date: Optional[date] = None
    exp_date: date
    quantity: int = 0
    unit: str
    storage_condition: Optional[str] = "Room Temp"
    storage_location: Optional[str] = None
    unit_cost: float = 0.0
    reorder_threshold: int = 5
    category: str # 'Tablet' | 'Syrup' | 'Injection' | 'Ointment' | 'Equipment'
    vendor_id: Optional[str] = None

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    quantity: Optional[int] = None
    last_updated_by: Optional[str] = None

class Medicine(MedicineBase):
    id: str
    vendor: Optional[Vendor] = None
    last_updated_by: Optional[str] = None
    usage_logs: List[UsageLog] = []

    model_config = {"from_attributes": True}

# Aggregated Stats
class DashboardStats(BaseModel):
    total_items: int
    items_expiring_soon: int # < 3 Months
    safe_items: int # > 6 Months
    monitoring_items: int # 3-6 Months
    expired_items: int # Expired
    low_stock_items: int
    total_inventory_value: float
