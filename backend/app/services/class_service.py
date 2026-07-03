from app.repositories.class_repository import ClassRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.utils.validation_utils import validate_class_payload


class ClassService:
    @staticmethod
    def get_classes(tutor_id):
        rows = ClassRepository.find_all_by_tutor(tutor_id)
        return [ClassService._serialize(r) for r in rows]

    @staticmethod
    def get_class(class_id, tutor_id):
        cls = ClassRepository.find_by_id(class_id, tutor_id)
        if not cls:
            return None, "Class not found", "CLASS_NOT_FOUND"
        data = ClassService._serialize(cls)
        students = ClassRepository.get_students_in_class(class_id, tutor_id)
        data["students"] = [{"id": str(s["id"]), "full_name": s["full_name"]} for s in students]
        return data, None, None

    @staticmethod
    def create_class(tutor_id, data):
        errors = validate_class_payload(data)
        if errors:
            return None, "Validation failed", "VALIDATION_ERROR", errors

        cls = ClassRepository.create(
            tutor_id, data["subject"], data["class_name"],
            data.get("schedule_day"), data.get("start_time"),
            data.get("end_time"), data.get("fee_amount", 0),
        )
        return ClassService._serialize(cls), "Class created successfully", None, None

    @staticmethod
    def update_class(class_id, tutor_id, data):
        cls = ClassRepository.find_by_id(class_id, tutor_id)
        if not cls:
            return None, "Class not found", "CLASS_NOT_FOUND", None

        fields = {}
        for key in ["subject", "class_name", "schedule_day", "start_time", "end_time", "fee_amount"]:
            if key in data:
                fields[key] = data[key]

        updated = ClassRepository.update(class_id, tutor_id, fields) if fields else cls
        return ClassService._serialize(updated), "Class updated successfully", None, None

    @staticmethod
    def delete_class(class_id, tutor_id):
        if not ClassRepository.find_by_id(class_id, tutor_id):
            return None, "Class not found", "CLASS_NOT_FOUND"
        ClassRepository.soft_delete(class_id, tutor_id)
        return True, "Class deleted successfully", None

    @staticmethod
    def create_enrollment(tutor_id, student_id, class_id):
        from app.repositories.student_repository import StudentRepository
        student = StudentRepository.find_by_id(student_id, tutor_id)
        if not student:
            return None, "Student not found", "STUDENT_NOT_FOUND"
        cls = ClassRepository.find_by_id(class_id, tutor_id)
        if not cls:
            return None, "Class not found", "CLASS_NOT_FOUND"
        if EnrollmentRepository.exists(student_id, class_id):
            return None, "Student is already enrolled in this class", "ENROLLMENT_ALREADY_EXISTS"
        enrollment = EnrollmentRepository.create(tutor_id, student_id, class_id)
        return dict(enrollment), "Enrollment created successfully", None

    @staticmethod
    def _serialize(row):
        return {
            "id": str(row["id"]),
            "subject": row["subject"],
            "class_name": row["class_name"],
            "schedule_day": row.get("schedule_day"),
            "start_time": str(row["start_time"]) if row.get("start_time") else None,
            "end_time": str(row["end_time"]) if row.get("end_time") else None,
            "fee_amount": float(row["fee_amount"]) if row.get("fee_amount") else 0,
        }
