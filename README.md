# PaySlip PH — Philippine Payroll System

Philippine payroll calculator with a Python backend and HTML/JS frontend.
---

## Architecture

```
┌─────────────┐      POST /compute (JSON)        ┌──────────────┐
│             │ ───────────────────────────────► │              │
│  index.html │                                  │  server.py   │
│  (Frontend) │ ◄─────────────────────────────── │  (Flask API) │
│             │         Computed result          │              │
└─────────────┘                                  └──────┬───────┘
                                                       │
                                              ┌────────▼───-────┐
                                              │   payroll.py    │
                                              │ (Core engine)   │
                                              └─────────────────┘
```

| File | Purpose |
|------|---------|
| `server.py` | Flask web server — serves the frontend and exposes the `/compute` REST API |
| `index.html` | Single-page web UI — collects DTR entries, salary info, deductions, and displays the payslip |
| `payroll.py` | Pure Python computation engine — DOLE rate multipliers, pay calculations, data models |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3, Flask |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Computation | Pure Python (no external math/finance libs) |
| API | REST (JSON) |

---

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:8080** in your browser.

---

## API

### `POST /api/compute`

**Rate modes:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rateMode` | string | Yes | `"monthly"`, `"hourly"`, or `"straight"` |
| `monthlySalary` | number | if monthly | Monthly basic salary in PHP |
| `fixedHourly` | number | if hourly | Fixed hourly rate in PHP |
| `stHours` | number | if straight | Straight-time total hours |
| `stPay` | number | if straight | Straight-time total pay |
| `dtrEntries` | array | Yes | Daily Time Record entries |
| `period` | string | Yes | `"1-15"` or `"16-30"` |
| `empName` | string | No | Employee display name |
| `sss` | number | No | SSS contribution |
| `philhealth` | number | No | PhilHealth contribution |
| `pagibig` | number | No | Pag-IBIG contribution |
| `tax` | number | No | Withholding tax |
| `otherDeductions` | number | No | Other deductions |

**`dtrEntries[]` object:**

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Display label (e.g. `"Apr 14 (Tue)"`) |
| `type` | string | One of: `"regular"`, `"rest_day"`, `"special"`, `"special_rest"`, `"legal"`, `"legal_rest"`, `"absent"` |
| `reg` | number | Regular hours worked |
| `ot` | number | Overtime hours |
| `status` | string | Optional note (e.g. `"WFH"`) |

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
