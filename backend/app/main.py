from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import os
from . import crud, models, schemas
from .database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="GHOPE Medical Stock Inventory API")

# Configure CORS
# In production, set ALLOWED_ORIGINS to your Netlify URL (e.g. "https://your-site.netlify.app")
# Multiple origins can be comma-separated: "http://localhost:5173,https://your-site.netlify.app"
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = allowed_origins_raw.split(",") if allowed_origins_raw != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stats", response_model=schemas.DashboardStats)
def read_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)

# Medicines
@app.get("/medicines", response_model=List[schemas.Medicine])
def read_medicines(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_medicines(db, skip=skip, limit=limit)

@app.post("/medicines", response_model=schemas.Medicine)
def create_medicine(medicine: schemas.MedicineCreate, db: Session = Depends(get_db)):
    return crud.create_medicine(db, medicine=medicine)

@app.get("/medicines/{medicine_id}", response_model=schemas.Medicine)
def read_medicine(medicine_id: str, db: Session = Depends(get_db)):
    db_medicine = crud.get_medicine(db, medicine_id=medicine_id)
    if db_medicine is None:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return db_medicine

# Vendors
@app.get("/vendors", response_model=List[schemas.Vendor])
def read_vendors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_vendors(db, skip=skip, limit=limit)

@app.post("/vendors", response_model=schemas.Vendor)
def create_vendor(vendor: schemas.VendorCreate, db: Session = Depends(get_db)):
    return crud.create_vendor(db, vendor=vendor)

# Usage Logs
@app.get("/logs", response_model=List[schemas.UsageLog])
def read_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_usage_logs(db, skip=skip, limit=limit)

@app.post("/logs", response_model=schemas.UsageLog)
def create_log(log: schemas.UsageLogCreate, db: Session = Depends(get_db)):
    # Check if medicine exists and has enough quantity
    db_medicine = crud.get_medicine(db, log.medicine_id)
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    if db_medicine.quantity < log.quantity_deducted:
        raise HTTPException(status_code=400, detail="Not enough stock")
    
    return crud.create_usage_log(db, log=log)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
