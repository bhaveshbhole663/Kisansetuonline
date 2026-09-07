# KisanSetu — Multi-Channel Farmer Procurement System

> **Tagline:** Digital Procurement Without Forcing Farmers to Use Smartphones  
> **Target Problem Statement:** Smart India Hackathon (SIH) — Congestion, waiting time, and lack of transparency at APMC / MSP grain procurement centres.

---

## 🏛 The Core Architectural Principle

```
                         KISANSETU
                             │
             ┌───────────────┼────────────────┐
             │               │                │
          WEB APP            SMS              IVR
       Smartphone         Keypad Phone     Keypad Phone
             │               │                │
             └───────────────┼────────────────┘
                             ↓
                    ┌─────────────────┐
                    │   BACKEND API   │
                    │                 │
                    │ Authentication  │
                    │ Slot Engine     │
                    │ Queue Engine    │
                    │ Procurement     │
                    │ Notifications   │
                    │ Payment Status  │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │   PostgreSQL/   │
                    │  SQLite Database│
                    └────────┬────────┘
                             ↑
                    ┌─────────────────┐
                    │ ADMIN DASHBOARD │
                    └─────────────────┘
```

**One farmer. One booking. One token. One status — regardless of the channel used.**

---

## 🚀 Key Features

### 1. 🌾 Farmer Web Portal
- **Multilingual Support:** Instant switching between English, हिन्दी (Hindi), and मराठी (Marathi) via JSON locale dictionaries.
- **Smart Slot Allocation:** Visual APMC centre capacity indicator with automatic traffic load re-direction when a centre exceeds 85% capacity.
- **8-Stage Procurement Timeline:**
  `Registered` → `Slot Booked` → `Arrived` → `Quality Check` → `Weighed` → `Accepted/Rejected` → `Payment Processing` → `Paid`.
- **Simulated DBT/PFMS Payment Tracker:** Displays verified MSP credit calculation, transaction reference (e.g. `PFMS-DEMO-82932`), and Aadhaar bank credit status.
- **Multilingual AI Farmer Query Assistant:** Strict intent detection (`PAYMENT_STATUS`, `QUEUE_POSITION`, `BOOKING_STATUS`, `CANCEL_INFO`) grounded 100% in database records with zero hallucination.

### 2. 🏢 APMC Admin Console
- **Executive Operations KPI Cards:** Today's Bookings, Arrived at Gate, Quality Checked, Weighed, Completed/Accepted, DBT Paid, Waiting, and Avg Wait Time (24 min).
- **Mandi Capacity & Load Distribution Bars:** Compares real-time loads (Pune APMC, Baramati Kendra, Daund Yard, Nashik Mandi).
- **Live Unified Queue Table:** Filterable by centre, channel badge (`WEB`, `SMS`, `IVR`, `WALK_IN`), and procurement status.
- **APMC Operator Workflow Modal:** Official buttons to record gate arrivals, grain assay grades (Grade A/B, Moisture %), weighbridge quintals, acceptance/rejection, and DBT payment disbursement.
- **Walk-in Gate Exception Admission:** On-spot farmer registration generating `WALK-IN` tokens (`PUN-DDMM-W01`).

### 3. 📱 Keypad Phone SMS Simulator
- Interactive realistic mobile phone interface with live SMS thread from `56161`.
- Deterministic state machine:
  - `BOOK` → Select Centre (1/2/3) → Select Date (1/2/3) → Select Slot (1/2/3) → Booking confirmed!
- Direct text commands:
  - `STATUS <Token>`: Returns stage, crop, quantity, quality result, and payment status.
  - `PAYMENT <Token>`: Returns MSP amount and PFMS transaction reference.
  - `CANCEL <Token>`: Releases slot quota.
  - `HELP`: Lists available commands.

### 4. 📞 Toll-Free IVR Voice Simulator
- Interactive DTMF telephone dial pad (1-9) with dual-tone audio simulation.
- **Web Speech API Audio Synthesis:** Reads voice prompts aloud in Hindi, Marathi, or English.
- Real-time voice prompt transcription and token confirmation readout.

### 5. 📐 System Architecture & Live Event Inspector
- Visual architectural diagram showing how all 4 entry points update the single source of truth.
- Real-time event log trace displaying multi-channel transactions.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite + Tailwind CSS v4 |
| **Icons & UI** | Lucide React |
| **Backend API** | Python 3.14 + FastAPI + Pydantic |
| **Database** | SQLite (PRD-compliant relational schema, portable to PostgreSQL/Supabase) |
| **Voice / Audio** | Web Speech API + Web Audio API (DTMF synthesis) |
| **Testing** | Fast API TestClient + Automated Test Suite |

---

## 🏃 Running the Application

### Option 1: One-Click Startup (Windows)
Double-click `start.bat` in this folder.

### Option 2: Manual Startup

**1. Start the Backend:**
```bash
cd backend
.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

**2. Start the Frontend:**
```bash
cd frontend
npm run dev
```
Web App: [http://localhost:5173](http://localhost:5173)

**3. Run Automated Tests:**
```bash
cd backend
.venv\Scripts\python.exe test_api.py
```
All 10 tests will execute and verify the end-to-end multi-channel pipeline.
