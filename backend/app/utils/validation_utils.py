import re

VALID_ATTENDANCE_STATUSES = {"present", "absent", "late"}
VALID_FEE_STATUSES = {"paid", "unpaid", "partial", "overdue"}


def validate_password(password: str) -> str | None:
    if not password or len(password) < 8:
        return "Password must be at least 8 characters"
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        return "Password must include letters and numbers"
    return None


def validate_email(email: str) -> str | None:
    if not email:
        return None
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return "Invalid email format"
    return None


def validate_student_payload(data: dict, is_update=False) -> dict:
    errors = {}
    if not is_update and not data.get("full_name"):
        errors["full_name"] = "Full name is required"
    if not is_update:
        if not data.get("username"):
            errors["username"] = "Username is required"
        if not data.get("password"):
            pwd_err = validate_password(data.get("password", ""))
            if pwd_err:
                errors["password"] = pwd_err
    if data.get("email"):
        email_err = validate_email(data.get("email"))
        if email_err:
            errors["email"] = email_err
    return errors


def validate_class_payload(data: dict) -> dict:
    errors = {}
    if not data.get("subject"):
        errors["subject"] = "Subject is required"
    if not data.get("class_name"):
        errors["class_name"] = "Class name is required"
    return errors


def validate_fee_payload(data: dict) -> dict:
    errors = {}
    amount_due = data.get("amount_due", 0)
    amount_paid = data.get("amount_paid", 0)
    status = data.get("status")

    if amount_due < 0:
        errors["amount_due"] = "Amount due cannot be negative"
    if amount_paid < 0:
        errors["amount_paid"] = "Amount paid cannot be negative"
    if status not in VALID_FEE_STATUSES:
        errors["status"] = "Invalid fee status"
    if status == "partial" and not (0 < amount_paid < amount_due):
        errors["amount_paid"] = "Partial payment requires amount_paid between 0 and amount_due"
    if status == "paid" and float(amount_paid) != float(amount_due):
        errors["amount_paid"] = "Paid status requires amount_paid equal to amount_due"
    return errors


def validate_manual_attendance_payload(data: dict) -> dict:
    errors = {}
    if not data.get("student_id"):
        errors["student_id"] = "Student is required"
    if not data.get("class_id"):
        errors["class_id"] = "Class is required"
    if not data.get("session_id"):
        errors["session_id"] = "Session is required"
    if data.get("status") not in VALID_ATTENDANCE_STATUSES:
        errors["status"] = "Invalid attendance status"
    if not data.get("manual_reason") or not str(data.get("manual_reason")).strip():
        errors["manual_reason"] = "Manual reason is required"
    return errors
