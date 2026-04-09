# GSTOCK - GHOPE Medical Stock Inventory System

![Project Header](https://raw.githubusercontent.com/iamrealvinnu/GSTOCK/main/frontend/src/assets/hero.png)

A professional-grade, high-precision pharmacy and medical inventory management system designed for GHOPE. This platform enables real-time tracking of medical supplies, stock health, expiry monitoring, and volunteer-attributed usage logging.

---

## ⚖️ LEGAL NOTICE & DISCLAIMER

**WARNING: UNAUTHORIZED COPYING, DISTRIBUTION, OR MODIFICATION OF THIS SOFTWARE IS STRICTLY PROHIBITED.**

This software and its associated documentation are the exclusive property of **iamrealvinnu**. All rights reserved.

1. **Intellectual Property:** The source code, design, and logic contained within this repository are protected by copyright laws.
2. **Usage Restriction:** You may not use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software without explicit written permission from the owner.
3. **Liability:** This software is provided "as is", without warranty of any kind. The author shall not be held liable for any claim, damages, or other liability arising from the use of this software.
4. **Enforcement:** Any unauthorized use or reproduction of this codebase will result in **immediate legal action**.

---

## 🚀 Key Features

- **📊 Central Dashboard:** Real-time visibility into stock health and critical metrics.
- **📝 Smart Usage Log:** Automated stock deduction with volunteer attribution ("Handled By").
- **⏰ Expiry Tracker:** Visual alerts and reporting for items nearing expiry or expired.
- **⚠️ Low Stock Alerts:** Intelligent identification of supplies needing urgent reorder.
- **🏢 Vendor Management:** Detailed tracking of suppliers linked to every medicine for seamless restocking.
- **📱 Responsive Design:** Modern, fast UI built with React and Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (TypeScript)
- **Styling:** Tailwind CSS 4, Material UI (MUI)
- **State Management:** TanStack React Query
- **Build Tool:** Vite

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLAlchemy with SQLite (Production-ready for PostgreSQL/MySQL)
- **Server:** Uvicorn
- **API Documentation:** Swagger UI (Auto-generated)

---

## 📂 Project Structure

```text
GSTOCK/
├── frontend/           # React + Vite application
│   ├── src/            # Components, Hooks, API services
│   └── public/         # Static assets
├── backend/            # FastAPI application
│   ├── app/            # Models, Schemas, CRUD, Routes
│   └── requirements.txt # Python dependencies
├── netlify.toml        # Frontend deployment configuration
└── README.md           # Project documentation
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# .\venv\Scripts\activate # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API Access: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Local URL: `http://localhost:5173`

---

## ☁️ Deployment

### Frontend (Netlify)
This project is configured for seamless deployment on **Netlify**. 
- **Build Command:** `npm run build`
- **Publish Directory:** `frontend/dist`
- **Base Directory:** `frontend/`

### Backend
The backend can be deployed to **Render**, **Railway**, or any **Docker**-compatible hosting provider.

---

## 👨‍💻 Author
**iamrealvinnu**  
GitHub: [iamrealvinnu](https://github.com/iamrealvinnu)

*Copyright © 2026 iamrealvinnu. All Rights Reserved.*
