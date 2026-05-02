"""
Philippine Payroll Salary Calculator
Based on DOLE (Department of Labor and Employment) labor standards
Supports: Regular OT, Rest Day, Special Holiday, Legal Holiday, Night Differential
Pay periods: 1-15 and 16-30/31 of each month
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class DayType(Enum):
    REGULAR          = "regular"
    REST_DAY         = "rest_day"
    SPECIAL_HOLIDAY  = "special_holiday"
    SPECIAL_RESTDAY  = "special_holiday_restday"
    LEGAL_HOLIDAY    = "legal_holiday"
    LEGAL_RESTDAY    = "legal_holiday_restday"
    ABSENT           = "absent"


class PayPeriod(Enum):
    FIRST  = "1-15"
    SECOND = "16-30"


# ─── DOLE Multipliers ─────────────────────────────────────────────────────────

MULTIPLIERS = {
    # (day_type): (regular_multiplier, ot_multiplier)
    DayType.REGULAR:         (1.00, 1.25),
    DayType.REST_DAY:        (1.30, 1.30 * 1.30),   # rest day work OT
    DayType.SPECIAL_HOLIDAY: (1.30, 1.30 * 1.30),
    DayType.SPECIAL_RESTDAY: (1.50, 1.50 * 1.30),
    DayType.LEGAL_HOLIDAY:   (2.00, 2.00 * 1.30),
    DayType.LEGAL_RESTDAY:   (2.60, 2.60 * 1.30),
}

# ─── Data Classes ─────────────────────────────────────────────────────────────

@dataclass
class DTREntry:
    """Single day entry from the Daily Time Record."""
    date: str
    day_type: DayType
    regular_hours: float = 0.0
    ot_hours: float = 0.0
    status: str = ""          # e.g. WFH, On Leave

    def __post_init__(self):
        if self.regular_hours < 0 or self.ot_hours < 0:
            raise ValueError(f"Hours cannot be negative for {self.date}")


@dataclass
class Deductions:
    """Mandatory and voluntary deductions."""
    sss: float = 0.0
    philhealth: float = 0.0
    pagibig: float = 0.0
    withholding_tax: float = 0.0
    other: float = 0.0

    @property
    def total(self) -> float:
        return self.sss + self.philhealth + self.pagibig + self.withholding_tax + self.other


@dataclass
class PayrollResult:
    """Full payroll computation result."""
    employee_name: str
    period: PayPeriod
    monthly_salary: float
    daily_rate: float
    hourly_rate: float

    regular_pay: float = 0.0
    ot_pay: float = 0.0
    rest_day_pay: float = 0.0
    holiday_pay: float = 0.0
    absent_deduction: float = 0.0

    deductions: Deductions = field(default_factory=Deductions)
    work_days: int = 0
    entries: list = field(default_factory=list)

    @property
    def gross_pay(self) -> float:
        return (self.regular_pay + self.ot_pay + self.rest_day_pay
                + self.holiday_pay)

    @property
    def total_deductions(self) -> float:
        return self.deductions.total + self.absent_deduction

    @property
    def net_pay(self) -> float:
        return self.gross_pay - self.total_deductions


# ─── Payroll Engine ───────────────────────────────────────────────────────────

class PayrollCalculator:
    """
    Computes employee salary based on DTR entries and DOLE multipliers.

    Usage:
        calc = PayrollCalculator(monthly_salary=20000)
        calc.add_entry(DTREntry("Apr 14 (Tue)", DayType.REGULAR, regular_hours=8))
        calc.add_entry(DTREntry("Apr 27 (Mon)", DayType.REGULAR, regular_hours=8, ot_hours=1))
        result = calc.compute("Juan dela Cruz", PayPeriod.FIRST, deductions)
        print(result)
    """

    WORKING_DAYS_PER_MONTH = 26  # DOLE standard

    def __init__(self, monthly_salary: float):
        if monthly_salary <= 0:
            raise ValueError("Monthly salary must be greater than zero.")
        self.monthly_salary = monthly_salary
        self.daily_rate = monthly_salary / self.WORKING_DAYS_PER_MONTH
        self.hourly_rate = self.daily_rate / 8
        self._entries: list[DTREntry] = []

    def add_entry(self, entry: DTREntry) -> None:
        self._entries.append(entry)

    def add_entries(self, entries: list[DTREntry]) -> None:
        self._entries.extend(entries)

    def clear_entries(self) -> None:
        self._entries.clear()

    # ── Core computation ──────────────────────────────────────────────────────

    def _compute_entry(self, entry: DTREntry) -> dict:
        """Compute pay for a single DTR entry."""
        result = {
            "date": entry.date,
            "day_type": entry.day_type.value,
            "status": entry.status,
            "regular_pay": 0.0,
            "ot_pay": 0.0,
            "holiday_pay": 0.0,
            "rest_day_pay": 0.0,
            "absent_deduction": 0.0,
            "worked": False,
        }

        if entry.day_type == DayType.ABSENT:
            result["absent_deduction"] = self.daily_rate
            return result

        reg_mult, ot_mult = MULTIPLIERS.get(entry.day_type, (1.0, 1.25))
        reg_pay = (entry.regular_hours / 8) * self.daily_rate * reg_mult
        ot_pay  = entry.ot_hours * self.hourly_rate * ot_mult

        # Legal holiday: employee gets paid even if they don't work
        if entry.day_type in (DayType.LEGAL_HOLIDAY, DayType.LEGAL_RESTDAY):
            if entry.regular_hours == 0 and entry.ot_hours == 0:
                reg_pay = self.daily_rate  # unworked legal holiday pay

        # Bucket the pay
        if entry.day_type == DayType.REGULAR:
            result["regular_pay"] = reg_pay
            result["ot_pay"]      = ot_pay
        elif entry.day_type == DayType.REST_DAY:
            result["rest_day_pay"] = reg_pay + ot_pay
        else:
            result["holiday_pay"] = reg_pay + ot_pay

        result["worked"] = (entry.regular_hours > 0 or entry.ot_hours > 0)
        return result

    def compute(
        self,
        employee_name: str,
        period: PayPeriod,
        deductions: Optional[Deductions] = None,
    ) -> PayrollResult:
        """Run full payroll computation and return a PayrollResult."""
        if deductions is None:
            deductions = Deductions()

        result = PayrollResult(
            employee_name=employee_name,
            period=period,
            monthly_salary=self.monthly_salary,
            daily_rate=self.daily_rate,
            hourly_rate=self.hourly_rate,
            deductions=deductions,
        )

        computed_entries = []
        for entry in self._entries:
            e = self._compute_entry(entry)
            result.regular_pay      += e["regular_pay"]
            result.ot_pay           += e["ot_pay"]
            result.rest_day_pay     += e["rest_day_pay"]
            result.holiday_pay      += e["holiday_pay"]
            result.absent_deduction += e["absent_deduction"]
            if e["worked"]:
                result.work_days += 1
            computed_entries.append(e)

        result.entries = computed_entries
        return result

    # ── Reporting ─────────────────────────────────────────────────────────────

    @staticmethod
    def format_report(r: PayrollResult) -> str:
        """Return a formatted text payslip."""
        sep  = "=" * 60
        thin = "-" * 60
        P    = lambda v: f"₱{v:>12,.2f}"

        lines = [
            sep,
            f"  PAYSLIP — {r.employee_name}",
            f"  Pay Period : {r.period.value}",
            f"  Monthly    : {P(r.monthly_salary)}",
            f"  Daily Rate : {P(r.daily_rate)}",
            f"  Hourly Rate: {P(r.hourly_rate)}",
            thin,
            f"  {'EARNINGS':<30} {'AMOUNT':>18}",
            thin,
        ]

        earnings = [
            ("Regular pay",                  r.regular_pay),
            ("Overtime pay (×1.25)",          r.ot_pay),
            ("Rest day pay",                  r.rest_day_pay),
            ("Holiday pay",                   r.holiday_pay),
        ]
        for label, amount in earnings:
            if amount > 0:
                lines.append(f"  {label:<30} {P(amount)}")

        lines += [
            thin,
            f"  {'Gross Pay':<30} {P(r.gross_pay)}",
            thin,
            f"  {'DEDUCTIONS':<30} {'AMOUNT':>18}",
            thin,
        ]

        deducts = [
            ("Absent / unpaid leave",         r.absent_deduction),
            ("SSS contribution",              r.deductions.sss),
            ("PhilHealth contribution",       r.deductions.philhealth),
            ("Pag-IBIG contribution",         r.deductions.pagibig),
            ("Withholding tax",               r.deductions.withholding_tax),
            ("Other deductions",              r.deductions.other),
        ]
        for label, amount in deducts:
            if amount > 0:
                lines.append(f"  {label:<30} {P(amount)}")

        lines += [
            thin,
            f"  {'Total Deductions':<30} {P(r.total_deductions)}",
            sep,
            f"  {'NET PAY':<30} {P(r.net_pay)}",
            sep,
            f"  Work days counted: {r.work_days}",
            sep,
        ]
        return "\n".join(lines)
