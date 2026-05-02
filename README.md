# PaySlip PH — Philippine Payroll System 🇵🇭

DOLE-compliant web-based payroll calculator with a Python backend and React frontend.

---

## Architecture

```
Payslip-PH/
├── app/
│   ├── __init__.py      # Flask app factory
│   ├── server.py        # Routes, API, payslip print
│   ├── payroll.py       # Core computation engine
│   ├── templates/
│   │   ├── landing.html    # Landing page
│   │   └── payslip_print.html  # Printable payslip
│   └── static/
│       └── favicon.svg
├── frontend/            # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   └── App.css        # Styles
│   ├── index.html
│   └── vite.config.js  # Proxies API to Flask
├── run.py               # Backend entry point
├── requirements.txt     # Python dependencies
└── README.md
```

**Data flow:**
```
React Frontend → POST /compute (JSON) → Flask (server.py) → PayrollCalculator (payroll.py)
                                            ↓
                           POST /print-payslip → payslip_print.html
```

---

## Features

- **DOLE-compliant calculations** — proper holiday, rest day, and overtime multipliers
- **Date picker** — select dates with calendar widget instead of manual text input
- **Load Sample** — one-click sample data to get started quickly
- **Clear All** — remove all DTR entries instantly
- **Printable payslip** — dedicated print template with clean layout
- **Toastify notifications** — clean, non-intrusive alerts
- **Rate modes** — monthly, hourly, or straight-time salary input

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3, Flask |
| Frontend | React 18, Vite, Toastify-js |
| Computation | Pure Python (no external math/finance libs) |
| API | REST (JSON) |
| UI Notifications | Toastify-js |
| Deployment | Vercel (serverless) |

---

## Quick Start

**Development:**

1. Start Flask backend:
```bash
pip install -r requirements.txt
python3 run.py
```

2. Start React frontend (new terminal):
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

**Deploy to Vercel:**
```bash
vercel --prod
```

---

## API Reference

### `POST /compute`

Computes an employee's salary for a given pay period.

**Request body (JSON):**

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
| `date` | string | Date in YYYY-MM-DD format (e.g. `"2026-04-14"`) |
| `type` | string | One of: `"regular"`, `"rest_day"`, `"special"`, `"special_rest"`, `"legal"`, `"legal_rest"`, `"absent"` |
| `reg` | number | Regular hours worked |
| `ot` | number | Overtime hours |
| `status` | string | Optional note (e.g. `"WFH"`) |

**Response (JSON):**

```json
{
  "employeeName": "Juan dela Cruz",
  "period": "1-15",
  "hourlyRate": 96.15,
  "workDays": 11,
  "totalRegHrs": 88.0,
  "totalOTHrs": 1.0,
  "grossPay": 8581.73,
  "totalDeductions": 981.30,
  "netPay": 7600.43,
  "earnings": [
    { "label": "Regular pay", "amount": 8461.54 },
    { "label": "Overtime pay (×1.25)", "amount": 120.19 }
  ],
  "deductions": [
    { "label": "SSS contribution", "amount": 581.30 },
    { "label": "PhilHealth contribution", "amount": 300.00 },
    { "label": "Pag-IBIG contribution", "amount": 100.00 }
  ]
}
```

---

## Core Engine (`payroll.py`)

### Data Models

**`DayType` (Enum)** — Classifies each day for correct multiplier application:
- `REGULAR` — Standard workday
- `REST_DAY` — Scheduled rest day (worked)
- `SPECIAL_HOLIDAY` — Special non-working holiday (worked)
- `SPECIAL_RESTDAY` — Special holiday that falls on a rest day
- `LEGAL_HOLIDAY` — Regular holiday (worked)
- `LEGAL_RESTDAY` — Legal holiday that falls on a rest day
- `ABSENT` — Unpaid leave / absence

**`DTREntry`** — Single day's attendance record:
```python
DTREntry(
    date="Apr 14 (Tue)",
    day_type=DayType.REGULAR,
    regular_hours=8,
    ot_hours=1,
    status="WFH"
)
```

**`Deductions`** — Container for all deduction amounts:
```python
Deductions(sss=581.30, philhealth=300, pagibig=100, withholding_tax=0, other=0)
```

**`PayrollResult`** — Full computation output with properties:
- `gross_pay` — Sum of all earnings
- `total_deductions` — Sum of all deductions + absences
- `net_pay` — `gross_pay - total_deductions`

### `PayrollCalculator`

```python
from payroll import PayrollCalculator, DTREntry, DayType, PayPeriod, Deductions

calc = PayrollCalculator(monthly_salary=20_000)

calc.add_entries([
    DTREntry("Apr 14 (Tue)", DayType.REGULAR,       regular_hours=8),
    DTREntry("Apr 27 (Mon)", DayType.REGULAR,       regular_hours=8, ot_hours=1),
    DTREntry("May  1 (Thu)", DayType.LEGAL_HOLIDAY, regular_hours=8, ot_hours=2),
    DTREntry("May  3 (Sat)", DayType.REST_DAY,      regular_hours=8),
])

deductions = Deductions(sss=581.30, philhealth=300, pagibig=100)
result = calc.compute("Juan dela Cruz", PayPeriod.SECOND, deductions)
```

### Rate Computation

- **Daily rate** = Monthly salary ÷ 26 (DOLE standard working days)
- **Hourly rate** = Daily rate ÷ 8

### DOLE Pay Multipliers

| Day type | Regular hours | Overtime |
|----------|--------------|----------|
| Regular workday | ×1.00 | ×1.25 |
| Rest day (worked) | ×1.30 | ×1.69 |
| Special holiday | ×1.30 | ×1.69 |
| Special holiday on rest day | ×1.50 | ×1.95 |
| Legal holiday (worked) | ×2.00 | ×2.60 |
| Legal holiday on rest day | ×2.60 | ×3.38 |
| Legal holiday (unworked) | Full day pay | — |

---

## Supported Deductions

- **SSS** — Social Security System
- **PhilHealth** — Philippine Health Insurance
- **Pag-IBIG** — Home Development Mutual Fund
- **Withholding tax** — BIR income tax
- **Other** — Miscellaneous / voluntary deductions
- **Absent/unpaid leave** — Auto-deducted from DTR entries with type `"absent"`

---

## Pay Periods

| Period | Dates | Payout |
|--------|-------|--------|
| 1st | 1–15 of month | 15th |
| 2nd | 16–30/31 of month | 30th/31st |
