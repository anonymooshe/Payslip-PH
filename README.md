# PaySlip PH — Philippine Payroll System

DOLE-compliant payroll calculator with a **React + Vite** frontend and **Flask** API backend.

---

## Architecture

```
┌─────────────┐   POST /api/compute (Vite proxy → Flask)   ┌──────────────┐
│  React App  │ ──────────────────────────────────────────► │  server.py   │
│  (Vite dev) │                                            │  (Flask API)  │
│  port 3000  │ ◄────────────────────────────────────────── │  port 8080   │
└─────────────┘              JSON response                  └──────┬───────┘
                                                                   │
                                                          ┌────────▼───────┐
                                                          │   payroll.py   │
                                                          │  (Core engine) │
                                                          └────────────────┘
```

| File | Purpose |
|------|---------|
| `frontend/src/App.jsx` | React UI — DTR entries, rate modes, deductions, payslip display |
| `app/server.py` | Flask API — `/compute` endpoint with rate limiting, validation |
| `app/payroll.py` | Pure Python computation engine — DOLE rate multipliers |
| `run.py` | Flask entry point |

---

## Quick Start

**Terminal 1 — Backend:**
```bash
pip install -r requirements.txt
python3 run.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser. The Vite dev server proxies `/api/*` calls to Flask on port 8080.

---

## API

### `POST /api/compute`

**Rate modes:**

| Mode | Fields | Description |
|------|--------|-------------|
| `monthly` | `monthlySalary` | Monthly salary ÷ 26 ÷ 8 = hourly rate |
| `hourly` | `fixedHourly` | Direct hourly rate × 8 × 26 = monthly equiv |
| `straight` | `stHours`, `stPay` | Derive hourly rate from straight-time total |
| `simple` | `totalHours`, `fixedHourly` | Gross = hours × rate (no DTR needed) |

**DTR entries** (`dtrEntries[]`):

| Field | Values |
|-------|--------|
| `type` | `regular`, `rest_day`, `special`, `special_rest`, `legal`, `legal_rest`, `absent` |
| `reg` | Regular hours (0–24) |
| `ot` | Overtime hours (0–24) |

**Deductions:** `sss`, `philhealth`, `pagibig`, `tax`, `otherDeductions`

---

## DOLE Pay Multipliers

| Day type | Regular | OT |
|----------|---------|-----|
| Regular workday | ×1.00 | ×1.25 |
| Rest day (worked) | ×1.30 | ×1.69 |
| Special holiday | ×1.30 | ×1.69 |
| Special on rest day | ×1.50 | ×1.95 |
| Legal holiday | ×2.00 | ×2.60 |
| Legal on rest day | ×2.60 | ×3.38 |
| Legal holiday (unworked) | Full day | — |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3, Flask |
| Frontend | React 19, Vite |
| Computation | Pure Python |
| API | REST (JSON) |
