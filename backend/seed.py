from app.database import SessionLocal, engine
from app import models
from datetime import date, timedelta

# Create tables
models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    
    # Create Vendors
    v1 = models.Vendor(
        name="Global Pharma Solutions",
        contact_person="Alice Johnson",
        phone="555-0101",
        email="orders@globalpharma.com",
        address="123 Medical Center Way"
    )
    v2 = models.Vendor(
        name="LifeMed Supplies",
        contact_person="Bob Smith",
        phone="555-0202",
        email="bob@lifemed.com",
        address="456 Healthcare Blvd"
    )
    db.add_all([v1, v2])
    db.commit()
    
    # Create Medicines
    today = date.today()
    
    medicines = [
        # Safe (> 6 Months)
        models.Medicine(
            name="Amoxicillin 500mg",
            brand_name="Amoxil",
            batch_no="BATCH-A1",
            mfg_date=today - timedelta(days=30),
            exp_date=today + timedelta(days=400),
            quantity=500,
            unit="Tablets",
            category="Tablet",
            storage_location="Shelf A-4",
            unit_cost=0.15,
            reorder_threshold=100,
            vendor_id=v1.id
        ),
        # Monitoring (3-6 Months)
        models.Medicine(
            name="Paracetamol 500mg",
            brand_name="Panadol",
            batch_no="BATCH-P2",
            mfg_date=today - timedelta(days=60),
            exp_date=today + timedelta(days=120),
            quantity=300,
            unit="Tablets",
            category="Tablet",
            storage_location="Shelf B-1",
            unit_cost=0.05,
            reorder_threshold=50,
            vendor_id=v1.id
        ),
        # Expiring Soon (< 3 Months)
        models.Medicine(
            name="Insulin Aspart",
            brand_name="NovoLog",
            batch_no="BATCH-I3",
            mfg_date=today - timedelta(days=90),
            exp_date=today + timedelta(days=45),
            quantity=20,
            unit="Vials",
            category="Injection",
            storage_location="Fridge 1",
            unit_cost=25.0,
            reorder_threshold=10,
            vendor_id=v2.id
        ),
        # Expired
        models.Medicine(
            name="Vitamin C",
            brand_name="Cecon",
            batch_no="BATCH-V4",
            mfg_date=today - timedelta(days=400),
            exp_date=today - timedelta(days=10),
            quantity=100,
            unit="Tablets",
            category="Tablet",
            storage_location="Shelf C-2",
            unit_cost=0.10,
            reorder_threshold=20,
            vendor_id=v1.id
        ),
        # Low Stock
        models.Medicine(
            name="Epinephrine 1mg/ml",
            brand_name="Adrenaline",
            batch_no="BATCH-E5",
            mfg_date=today - timedelta(days=10),
            exp_date=today + timedelta(days=600),
            quantity=5,
            unit="Ampoules",
            category="Injection",
            storage_location="Emergency Kit",
            unit_cost=15.0,
            reorder_threshold=20,
            vendor_id=v2.id
        )
    ]
    
    db.add_all(medicines)
    db.commit()
    db.close()
    print("Database re-seeded with strict lifecycle logic data!")

if __name__ == "__main__":
    seed()
