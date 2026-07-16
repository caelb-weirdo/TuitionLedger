import re
from datetime import date, time
from decimal import Decimal, InvalidOperation
from uuid import UUID


GRADES = ("Grade 10", "Grade 11")
SUBJECTS = ("Maths", "Science", "English", "Tamil", "History")
WEEKDAYS = tuple(range(7))
NAME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z .'-]*$")
STUDENT_CODE_PATTERN = re.compile(r"^STU[0-9]{3,6}$")
TOKEN_PATTERN = re.compile(r"^[A-Za-z0-9_-]{20,200}$")


class ValidationError(ValueError):
    pass


def required_text(value, label, minimum=1, maximum=160):
    text = str(value or "").strip()
    if not minimum <= len(text) <= maximum:
        raise ValidationError(
            f"{label} must be between {minimum} and {maximum} characters."
        )
    return text


def person_name(value, label="Name"):
    text = required_text(value, label, 2, 160)
    if not NAME_PATTERN.fullmatch(text):
        raise ValidationError(f"{label} contains unsupported characters.")
    return text


def sri_lankan_phone(value, label="Phone number"):
    text = str(value or "").strip()
    if re.fullmatch(r"0[0-9]{9}", text):
        text = "+94" + text[1:]
    if not re.fullmatch(r"\+94[0-9]{9}", text):
        raise ValidationError(f"Enter a valid {label.lower()} in Sri Lankan format.")
    return text


def one_of(value, allowed, label):
    if value not in allowed:
        raise ValidationError(f"Choose a valid {label.lower()}.")
    return value


def grade(value):
    return one_of(str(value or "").strip(), GRADES, "Grade")


def subject(value):
    return one_of(str(value or "").strip(), SUBJECTS, "Subject")


def weekday(value):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValidationError("Choose a valid weekday.") from None
    return one_of(parsed, WEEKDAYS, "Weekday")


def uuid_value(value, label="Identifier"):
    try:
        return UUID(str(value))
    except (TypeError, ValueError, AttributeError):
        raise ValidationError(f"{label} is invalid.") from None


def student_code(value):
    parsed = str(value or "").strip().upper()
    if not STUDENT_CODE_PATTERN.fullmatch(parsed):
        raise ValidationError("Enter a valid Student ID.")
    return parsed


def browser_id(value):
    parsed = required_text(value, "Browser identifier", 20, 100)
    try:
        UUID(parsed)
    except ValueError:
        if not TOKEN_PATTERN.fullmatch(parsed):
            raise ValidationError("Browser identifier is invalid.") from None
    return parsed


def secure_token(value, label="Token"):
    parsed = required_text(value, label, 20, 200)
    if not TOKEN_PATTERN.fullmatch(parsed):
        raise ValidationError(f"{label} is invalid.")
    return parsed


def clock_time(value, label):
    try:
        return time.fromisoformat(str(value or ""))
    except ValueError:
        raise ValidationError(f"Enter a valid {label.lower()}.") from None


def time_range(start_value, end_value):
    start = clock_time(start_value, "Start time")
    end = clock_time(end_value, "End time")
    if end <= start:
        raise ValidationError("End time must be later than start time.")
    return start, end


def money(value, label="Monthly fee", maximum=Decimal("1000000.00")):
    try:
        parsed = Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError(f"Enter a valid {label.lower()}.") from None
    if parsed < 0 or parsed > maximum:
        raise ValidationError(f"Enter a valid {label.lower()}.")
    return parsed


def fee_month(value):
    text = str(value or "").strip()
    try:
        parsed = date.fromisoformat(f"{text}-01")
    except ValueError:
        raise ValidationError("Choose a valid fee month.") from None
    if parsed.strftime("%Y-%m") != text:
        raise ValidationError("Choose a valid fee month.")
    return parsed


def attendance_date(value):
    try:
        return date.fromisoformat(str(value or "").strip())
    except ValueError:
        raise ValidationError("Choose a valid attendance date.") from None


def qr_duration(value):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValidationError("Choose a 5 or 10 minute session.") from None
    return one_of(parsed, (5, 10), "5 or 10 minute session")


def attendance_status(value):
    return one_of(str(value or "").strip(), ("Present", "Absent"), "Attendance status")


def fee_status(value):
    return one_of(str(value or "").strip(), ("Paid", "Unpaid"), "Fee status")


def manual_reason(value):
    return required_text(value, "Correction reason", 3, 300)
