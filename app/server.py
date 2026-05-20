#!/usr/bin/env python3
"""
Flask backend for the Philippine Payroll System.
Serves the HTML frontend and exposes a /compute API.
Security-hardened: rate limiting, input validation, CSP headers, error sanitization.
"""

import os
import time
from collections import defaultdict
from functools import wraps

from flask import request, jsonify, send_from_directory
from markupsafe import escape
from flask_cors import CORS
from app.payroll import PayrollCalculator, DTREntry, DayType, PayPeriod, Deductions
from app import app

CORS(app)

# ─── Security limits ─────────────────────────────────────────────────────────

RATE_LIMIT_MAX = 30  # Max requests per IP per window
RATE_LIMIT_WINDOW = 60  # Time window in seconds
MAX_DTR_ENTRIES = 366  # Max DTR entries (1 per day per year)
MAX_PAYLOAD_BYTES = 50 * 1024  # 50KB max request body
MAX_NAME_LENGTH = 120
MAX_STATUS_LENGTH = 60
MAX_SALARY = 10_000_000_000  # ₱10 billion cap

ip_requests: dict[str, list[float]] = defaultdict(list)  # Rate limit storage

# ─── Rate limiter ─────────────────────────────────────────────────────────────

def rate_limit(f):
    """Reject clients that exceed the request threshold."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        ip = request.remote_addr or "unknown"
        now = time.time()
        # Prune expired entries
        ip_requests[ip] = [
            t for t in ip_requests[ip] if now - t < RATE_LIMIT_WINDOW
        ]
        if len(ip_requests[ip]) >= RATE_LIMIT_MAX:
            return jsonify({"error": "Too many requests. Try again later."}), 429
        ip_requests[ip].append(now)
        return f(*args, **kwargs)
    return wrapper

# ─── Security headers ─────────────────────────────────────────────────────────

@app.after_request
def add_security_headers(response):
    """Apply hardening HTTP headers to every response."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"  # rely on CSP instead
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src https://fonts.gstatic.com; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "object-src 'none'"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=()"
    )
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    # Remove server identity
    response.headers.pop("Server", None)
    return response

# ─── Error handlers ───────────────────────────────────────────────────────────

@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": "Invalid request"}), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(413)
def payload_too_large(e):
    return jsonify({"error": "Request too large"}), 413

@app.errorhandler(429)
def rate_limited(e):
    return jsonify({"error": "Too many requests"}), 429

@app.errorhandler(500)
def internal_error(e):
    """Never leak stack traces or internal details."""
    return jsonify({"error": "Internal server error"}), 500

# ─── Valid day types (whitelist) ──────────────────────────────────────────────

DAY_TYPE_MAP = {
    "regular":       DayType.REGULAR,
    "rest_day":      DayType.REST_DAY,
    "special":       DayType.SPECIAL_HOLIDAY,
    "special_rest":  DayType.SPECIAL_RESTDAY,
    "legal":         DayType.LEGAL_HOLIDAY,
    "legal_rest":    DayType.LEGAL_RESTDAY,
    "absent":        DayType.ABSENT,
}
VALID_PERIODS = {"1-15", "16-30"}
VALID_RATE_MODES = {"monthly", "hourly", "straight", "simple"}


# ─── Routes ───────────────────────────────────────────────────────────────────

DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

@app.route("/api")
def api_index():
    return jsonify({"message": "PaySlip PH API is running."})

@app.route("/")
def serve_app():
    index = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index):
        return send_from_directory(DIST_DIR, "index.html")
    return jsonify({"error": "Frontend not built. Run: cd frontend && npm run build"}), 503

@app.route("/assets/<path:filename>")
def serve_assets(filename):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(os.path.join(assets_dir, filename)):
        return send_from_directory(assets_dir, filename)
    return jsonify({"error": "Not found"}), 404

@app.route("/favicon.svg")
def serve_favicon():
    f = os.path.join(DIST_DIR, "favicon.svg")
    if os.path.exists(f):
        return send_from_directory(DIST_DIR, "favicon.svg")
    return app.send_static_file("favicon.svg")


@app.route("/api/compute", methods=["POST"])
@rate_limit
def compute():
    """Compute payroll from validated JSON input."""

    # Enforce JSON content type
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 400

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Invalid JSON payload"}), 400

    # Reject unexpected top-level keys (strict schema)
    ALLOWED_KEYS = {
        "rateMode", "monthlySalary", "fixedHourly", "stHours", "stPay",
        "dtrEntries", "sss", "philhealth", "pagibig", "tax",
        "otherDeductions", "period", "empName",
        "totalHours", "simpleRegHours", "simpleRestHours", "simpleSpecialHours",
        "simpleSpecialRestHours", "simpleLegalHours", "simpleLegalRestHours",
        "simpleLegalUnworked",
    }
    extra_keys = set(data.keys()) - ALLOWED_KEYS
    if extra_keys:
        return jsonify({"error": "Unexpected fields in request"}), 400

    # ── Validate rate mode ──
    rate_mode = str(data.get("rateMode", "monthly"))
    if rate_mode not in VALID_RATE_MODES:
        return jsonify({"error": "Invalid rate mode"}), 400

    # ── Simple mode: categorized hours × DOLE multipliers, no DTR ──
    if rate_mode == "simple":
        SIMPLE_FIELDS = {
            "simpleRegHours":      1.00,
            "simpleRestHours":     1.30,
            "simpleSpecialHours":  1.30,
            "simpleSpecialRestHours": 1.50,
            "simpleLegalHours":    2.00,
            "simpleLegalRestHours":  2.60,
            "simpleLegalUnworked": 1.00,  # days, converted to hours
        }

        try:
            hourly_rate = float(data.get("fixedHourly", 0))
        except (TypeError, ValueError, OverflowError):
            return jsonify({"error": "Invalid hourly rate"}), 400
        if hourly_rate < 0 or hourly_rate > MAX_SALARY / (8 * 26):
            return jsonify({"error": "Invalid hourly rate"}), 400

        try:
            sss = float(data.get("sss", 0))
            philhealth = float(data.get("philhealth", 0))
            pagibig = float(data.get("pagibig", 0))
            wtax = float(data.get("tax", 0))
            other = float(data.get("otherDeductions", 0))
        except (TypeError, ValueError, OverflowError):
            return jsonify({"error": "Invalid deduction values"}), 400
        for val, name in [(sss,"sss"),(philhealth,"philhealth"),(pagibig,"pagibig"),(wtax,"tax"),(other,"otherDeductions")]:
            if val < 0:
                return jsonify({"error": f"{name} cannot be negative"}), 400

        period_str = str(data.get("period", ""))
        if period_str not in VALID_PERIODS:
            return jsonify({"error": "Invalid pay period"}), 400

        emp_name = str(data.get("empName", "Employee"))[:MAX_NAME_LENGTH]
        emp_name = escape(emp_name).strip() or "Employee"

        earnings = []
        gross = 0.0
        total_hours = 0.0
        CAT_LABELS = {
            "simpleRegHours": "Regular pay",
            "simpleRestHours": "Rest day pay",
            "simpleSpecialHours": "Special holiday pay",
            "simpleSpecialRestHours": "Special holiday (rest day) pay",
            "simpleLegalHours": "Legal holiday pay",
            "simpleLegalRestHours": "Legal holiday (rest day) pay",
            "simpleLegalUnworked": "Legal holiday (unworked)",
        }

        for field, mult in SIMPLE_FIELDS.items():
            try:
                val = float(data.get(field, 0))
            except (TypeError, ValueError, OverflowError):
                continue
            if val < 0:
                return jsonify({"error": f"Invalid {field}"}), 400

            h = val * 8 if field == "simpleLegalUnworked" else val
            amt = h * hourly_rate * mult
            if amt > 0:
                earnings.append({"label": CAT_LABELS[field], "amount": round(amt, 2)})
            gross += amt
            total_hours += h

        total_ded = sss + philhealth + pagibig + wtax + other
        net = max(round(gross, 2) - total_ded, 0)

        ded_rows = []
        if sss > 0:
            ded_rows.append({"label": "SSS contribution", "amount": sss})
        if philhealth > 0:
            ded_rows.append({"label": "PhilHealth contribution", "amount": philhealth})
        if pagibig > 0:
            ded_rows.append({"label": "Pag-IBIG contribution", "amount": pagibig})
        if wtax > 0:
            ded_rows.append({"label": "Withholding tax", "amount": wtax})
        if other > 0:
            ded_rows.append({"label": "Other deductions", "amount": other})

        return jsonify({
            "employeeName": emp_name,
            "period": period_str,
            "hourlyRate": hourly_rate,
            "workDays": 0,
            "totalRegHrs": round(total_hours, 2),
            "totalOTHrs": 0,
            "grossPay": round(gross, 2),
            "totalDeductions": total_ded,
            "netPay": round(net, 2),
            "earnings": earnings,
            "deductions": ded_rows,
            "baseLabel": None,
        })

    # ── Validate salary ──
    try:
        if rate_mode == "monthly":
            monthly_salary = float(data.get("monthlySalary", 0))
        elif rate_mode == "hourly":
            fixed_hourly = float(data.get("fixedHourly", 0))
            if fixed_hourly < 0:
                return jsonify({"error": "Negative values not allowed"}), 400
            monthly_salary = fixed_hourly * 8 * 26
        else:
            st_hours = float(data.get("stHours", 1))
            st_pay = float(data.get("stPay", 0))
            if st_hours <= 0 or st_pay < 0:
                return jsonify({"error": "Invalid straight-time values"}), 400
            hourly_equiv = st_pay / st_hours
            monthly_salary = hourly_equiv * 8 * 26
    except (TypeError, ValueError, OverflowError):
        return jsonify({"error": "Invalid numeric values"}), 400

    if monthly_salary <= 0:
        return jsonify({"error": "Invalid pay rate"}), 400
    if monthly_salary > MAX_SALARY:
        return jsonify({"error": "Salary exceeds maximum allowed"}), 400

    # ── Validate DTR entries ──
    raw_entries = data.get("dtrEntries")
    if not isinstance(raw_entries, list):
        return jsonify({"error": "dtrEntries must be an array"}), 400
    if len(raw_entries) > MAX_DTR_ENTRIES:
        return jsonify({"error": "Too many DTR entries"}), 400

    dtr_entries = []
    for idx, entry in enumerate(raw_entries):
        if not isinstance(entry, dict):
            return jsonify({"error": f"Invalid DTR entry at index {idx}"}), 400

        # Validate day type via whitelist
        day_type_str = str(entry.get("type", "regular"))
        day_type = DAY_TYPE_MAP.get(day_type_str)
        if day_type is None:
            return jsonify({"error": f"Invalid day type: {day_type_str}"}), 400

        # Validate hours
        try:
            reg = float(entry.get("reg", 0))
            ot = float(entry.get("ot", 0))
        except (TypeError, ValueError, OverflowError):
            return jsonify({"error": f"Invalid hours at index {idx}"}), 400

        if reg < 0 or ot < 0 or reg > 24 or ot > 24:
            return jsonify({"error": f"Hours out of range at index {idx}"}), 400

        # Sanitize status
        status = str(entry.get("status", ""))[:MAX_STATUS_LENGTH]

        # Sanitize date label
        date = str(entry.get("date", ""))[:60]

        dtr_entries.append(DTREntry(
            date=date,
            day_type=day_type,
            regular_hours=reg,
            ot_hours=ot,
            status=escape(status),
        ))

    # ── Validate deductions ──
    try:
        sss = float(data.get("sss", 0))
        philhealth = float(data.get("philhealth", 0))
        pagibig = float(data.get("pagibig", 0))
        withholding_tax = float(data.get("tax", 0))
        other = float(data.get("otherDeductions", 0))
    except (TypeError, ValueError, OverflowError):
        return jsonify({"error": "Invalid deduction values"}), 400

    for val, name in [(sss, "sss"), (philhealth, "philhealth"),
                       (pagibig, "pagibig"), (withholding_tax, "tax"),
                       (other, "otherDeductions")]:
        if val < 0:
            return jsonify({"error": f"{name} cannot be negative"}), 400

    deductions = Deductions(
        sss=sss,
        philhealth=philhealth,
        pagibig=pagibig,
        withholding_tax=withholding_tax,
        other=other,
    )

    # ── Validate period ──
    period_str = str(data.get("period", ""))
    if period_str not in VALID_PERIODS:
        return jsonify({"error": "Invalid pay period"}), 400
    period = PayPeriod.FIRST if period_str == "1-15" else PayPeriod.SECOND

    # ── Sanitize employee name ──
    employee_name = str(data.get("empName", "Employee"))[:MAX_NAME_LENGTH]
    employee_name = escape(employee_name).strip()
    if not employee_name:
        employee_name = "Employee"

    # ── Compute ──
    try:
        calc = PayrollCalculator(monthly_salary=monthly_salary)
        calc.add_entries(dtr_entries)
        result = calc.compute(employee_name, period, deductions)
    except Exception:
        return jsonify({"error": "Computation error"}), 400

    # ── Build response ──
    earnings = []
    if result.regular_pay > 0:
        earnings.append({"label": "Regular pay", "amount": result.regular_pay})
    if result.ot_pay > 0:
        earnings.append({"label": "Overtime pay (×1.25)", "amount": result.ot_pay})
    if result.rest_day_pay > 0:
        earnings.append({"label": "Rest day pay", "amount": result.rest_day_pay})
    if result.holiday_pay > 0:
        earnings.append({"label": "Holiday / special pay", "amount": result.holiday_pay})

    deduction_rows = []
    if result.absent_deduction > 0:
        deduction_rows.append({"label": "Absent / unpaid leave", "amount": result.absent_deduction})
    if deductions.sss > 0:
        deduction_rows.append({"label": "SSS contribution", "amount": deductions.sss})
    if deductions.philhealth > 0:
        deduction_rows.append({"label": "PhilHealth contribution", "amount": deductions.philhealth})
    if deductions.pagibig > 0:
        deduction_rows.append({"label": "Pag-IBIG contribution", "amount": deductions.pagibig})
    if deductions.withholding_tax > 0:
        deduction_rows.append({"label": "Withholding tax", "amount": deductions.withholding_tax})
    if deductions.other > 0:
        deduction_rows.append({"label": "Other deductions", "amount": deductions.other})

    return jsonify({
        "employeeName": result.employee_name,
        "period": result.period.value,
        "hourlyRate": result.hourly_rate,
        "workDays": result.work_days,
        "totalRegHrs": sum(e.regular_hours for e in dtr_entries),
        "totalOTHrs": sum(e.ot_hours for e in dtr_entries),
        "grossPay": result.gross_pay,
        "totalDeductions": result.total_deductions,
        "netPay": result.net_pay,
        "earnings": earnings,
        "deductions": deduction_rows,
        "baseLabel": f"₱{monthly_salary:,.2f}/mo" if rate_mode == "monthly" else None,
    })
