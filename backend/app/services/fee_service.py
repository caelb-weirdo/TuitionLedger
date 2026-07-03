from app.repositories.fee_repository import FeeRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.class_repository import ClassRepository
from app.utils.validation_utils import validate_fee_payload


class FeeService:
    @staticmethod
    def get_fees(tutor_id, **filters):
        rows, total = FeeRepository.get_records(tutor_id, **filters)
        return [FeeService._serialize(r) for r in rows], total

    @staticmethod
    def get_unpaid(tutor_id):
        rows = FeeRepository.get_unpaid(tutor_id)
        return [FeeService._serialize(r) for r in rows]

    @staticmethod
    def create_fee(tutor_id, data):
        errors = validate_fee_payload(data)
        if errors:
            return None, "Validation failed", "VALIDATION_ERROR", errors

        if not StudentRepository.find_by_id(data["student_id"], tutor_id):
            return None, "Student not found", "STUDENT_NOT_FOUND", None
        if not ClassRepository.find_by_id(data["class_id"], tutor_id):
            return None, "Class not found", "CLASS_NOT_FOUND", None

        if FeeRepository.find_duplicate(data["student_id"], data["class_id"], data["month"], data["year"]):
            return None, "Fee record already exists for this month", "FEE_RECORD_ALREADY_EXISTS", None

        fee = FeeRepository.create(
            tutor_id, data["student_id"], data["class_id"],
            data["month"], data["year"], data.get("amount_due", 0),
            data.get("amount_paid", 0), data["status"],
            data.get("payment_date"), data.get("notes"),
        )
        return FeeService._serialize(fee), "Fee record created", None, None

    @staticmethod
    def update_fee(fee_id, tutor_id, data):
        fee = FeeRepository.find_by_id(fee_id, tutor_id)
        if not fee:
            return None, "Fee record not found", "FEE_RECORD_NOT_FOUND", None

        errors = validate_fee_payload({**dict(fee), **data})
        if errors:
            return None, "Validation failed", "VALIDATION_ERROR", errors

        fields = {}
        for key in ["amount_due", "amount_paid", "status", "payment_date", "notes"]:
            if key in data:
                fields[key] = data[key]

        updated = FeeRepository.update(fee_id, tutor_id, fields) if fields else fee
        return FeeService._serialize(updated), "Fee record updated", None, None

    @staticmethod
    def _serialize(row):
        return {
            "id": str(row["id"]),
            "student_id": str(row["student_id"]),
            "student_name": row.get("student_name"),
            "class_id": str(row["class_id"]),
            "class_name": row.get("class_name"),
            "month": row["month"],
            "year": row["year"],
            "amount_due": float(row["amount_due"]),
            "amount_paid": float(row["amount_paid"]),
            "status": row["status"],
            "payment_date": str(row["payment_date"]) if row.get("payment_date") else None,
            "notes": row.get("notes"),
            "parent_phone_local": row.get("parent_phone_local"),
            "parent_phone_whatsapp": row.get("parent_phone_whatsapp"),
        }
