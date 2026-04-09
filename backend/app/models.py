from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    contact_person = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)

    medicines = relationship("Medicine", back_populates="vendor")

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    brand_name = Column(String)
    strength = Column(String) # e.g., "500mg" or "10mg/ml"
    invoice_no = Column(String) # Reference ID for the purchase
    batch_no = Column(String, nullable=False, index=True)
    mfg_date = Column(Date)
    exp_date = Column(Date, nullable=False, index=True)
    quantity = Column(Integer, default=0)
    unit = Column(String) # e.g., Tablets, Vials, Bottles
    storage_condition = Column(String, default="Room Temp") # Room Temp, Refrigerated, etc.
    storage_location = Column(String) # e.g., "Shelf A-4"
    unit_cost = Column(Float, default=0.0)
    reorder_threshold = Column(Integer, default=5)
    category = Column(String) 
    
    vendor_id = Column(String, ForeignKey("vendors.id"))
    last_updated_by = Column(String)
    
    vendor = relationship("Vendor", back_populates="medicines")
    usage_logs = relationship("UsageLog", back_populates="medicine")

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    medicine_id = Column(String, ForeignKey("medicines.id"))
    quantity_deducted = Column(Integer, nullable=False)
    handled_by = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)
    signature_data = Column(Text)

    medicine = relationship("Medicine", back_populates="usage_logs")
