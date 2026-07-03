import uuid
from app.repositories.user_repository import UserRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.utils.password_utils import hash_password
from app.utils.validation_utils import validate_student_payload


class StudentService:
    @staticmethod
    def get_students(tutor_id, search=None, class_id=None, page=1, limit=50):
        rows, total = StudentRepository.find_all_by_tutor(tutor_id, search, class_id, page, limit)
        return [StudentService._serialize(r) for r in rows], total

    @staticmethod
    def get_student(student_id, tutor_id):
        student = StudentRepository.find_by_id(student_id, tutor_id)
        if not student:
            return None, "Student not found", "STUDENT_NOT_FOUND"
        data = StudentService._serialize(student)
        data["classes"] = [dict(c) for c in StudentRepository.get_enrolled_classes(student_id)]
        return data, None, None

    @staticmethod
    def create_student(tutor_id, data):
        errors = validate_student_payload(data)
        if errors:
            return None, "Validation failed", "VALIDATION_ERROR", errors

        existing = UserRepository.find_by_identifier(data.get("email") or data.get("username"))
        if existing:
            return None, "Email or username already exists", "VALIDATION_ERROR", {"username": "Already exists"}

        user = UserRepository.create_user(
            data["full_name"],
            data.get("email"),
            data["username"],
            hash_password(data["password"]),
            "student",
        )

        student_code = f"STU{str(uuid.uuid4())[:8].upper()}"
        student = StudentRepository.create(
            tutor_id, str(user["id"]), student_code, data["full_name"],
            data.get("parent_name"), data.get("parent_phone_local"),
            data.get("parent_phone_whatsapp"), data.get("parent_email"),
            data.get("address"), data.get("notes"),
        )

        for class_id in data.get("class_ids", []):
            if not EnrollmentRepository.exists(str(student["id"]), class_id):
                EnrollmentRepository.create(tutor_id, str(student["id"]), class_id)

        return StudentService._serialize(student), "Student created successfully", None, None

    @staticmethod
    def update_student(student_id, tutor_id, data):
        student = StudentRepository.find_by_id(student_id, tutor_id)
        if not student:
            return None, "Student not found", "STUDENT_NOT_FOUND", None

        fields = {}
        for key in ["full_name", "parent_name", "parent_phone_local", "parent_phone_whatsapp",
                    "parent_email", "address", "notes"]:
            if key in data:
                fields[key] = data[key]

        updated = StudentRepository.update(student_id, tutor_id, fields) if fields else student

        if "class_ids" in data:
            for class_id in data["class_ids"]:
                if not EnrollmentRepository.exists(student_id, class_id):
                    EnrollmentRepository.create(tutor_id, student_id, class_id)

        return StudentService._serialize(updated), "Student updated successfully", None, None

    @staticmethod
    def delete_student(student_id, tutor_id):
        student = StudentRepository.find_by_id(student_id, tutor_id)
        if not student:
            return None, "Student not found", "STUDENT_NOT_FOUND"
        StudentRepository.soft_delete(student_id, tutor_id)
        UserRepository.soft_delete(str(student["user_id"]))
        return True, "Student deleted successfully", None

    @staticmethod
    def _serialize(row):
        return {
            "id": str(row["id"]),
            "user_id": str(row["user_id"]),
            "student_code": row.get("student_code"),
            "full_name": row["full_name"],
            "email": row.get("email"),
            "username": row.get("username"),
            "parent_name": row.get("parent_name"),
            "parent_phone_local": row.get("parent_phone_local"),
            "parent_phone_whatsapp": row.get("parent_phone_whatsapp"),
            "parent_email": row.get("parent_email"),
            "address": row.get("address"),
            "notes": row.get("notes"),
            "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        }
