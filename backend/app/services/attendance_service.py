from datetime import datetime, timezone
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.device_repository import DeviceRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.class_repository import ClassRepository
from app.utils.qr_utils import generate_secure_session_token, generate_qr_link, calculate_expiry_time
from app.utils.validation_utils import validate_manual_attendance_payload


class QRAttendanceStrategy:
    """Strategy for QR-based attendance marking."""

    @staticmethod
    def validate_and_mark(user_id, session_token, device_token):
        student = StudentRepository.find_by_user_id(user_id)
        if not student:
            return None, "Student profile not found", "STUDENT_NOT_FOUND"

        session = AttendanceRepository.find_by_token(session_token)
        if not session:
            return None, "QR session not found", "SESSION_NOT_FOUND"

        if session["status"] == "closed":
            return None, "QR session is closed", "SESSION_CLOSED"

        now = datetime.now(timezone.utc)
        expires_at = session["expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if now > expires_at or session["status"] == "expired":
            return None, "QR code has expired", "SESSION_EXPIRED"

        if not EnrollmentRepository.is_enrolled(str(student["id"]), str(session["class_id"])):
            return None, "You are not enrolled in this class", "STUDENT_NOT_ENROLLED"

        device = DeviceRepository.find_by_student_and_token(str(student["id"]), device_token)
        if not device:
            return None, "This device is not registered. Please register your device.", "DEVICE_NOT_APPROVED"
        if device["status"] == "pending":
            return None, "This device is not approved yet", "DEVICE_PENDING"
        if device["status"] == "rejected":
            return None, "Your device request was rejected. Please contact your tutor.", "DEVICE_REJECTED"
        if device["status"] != "approved":
            return None, "This device is not approved yet", "DEVICE_NOT_APPROVED"

        existing = AttendanceRepository.find_existing(str(student["id"]), str(session["id"]))
        if existing:
            return None, "Attendance already marked", "ATTENDANCE_ALREADY_MARKED"

        record = AttendanceRepository.mark_attendance(
            str(session["tutor_id"]), str(student["id"]), str(session["class_id"]),
            str(session["id"]), "present", "qr", str(device["id"]),
        )
        return {
            "status": record["status"],
            "marked_at": record["marked_at"].isoformat(),
            "class_name": session.get("class_name"),
            "student_name": student["full_name"],
        }, "Attendance marked successfully", None


class ManualAttendanceStrategy:
    """Strategy for manual attendance correction by tutor."""

    @staticmethod
    def validate_and_mark(tutor_id, data):
        errors = validate_manual_attendance_payload(data)
        if errors:
            return None, "Validation failed", "VALIDATION_ERROR", errors

        student = StudentRepository.find_by_id(data["student_id"], tutor_id)
        if not student:
            return None, "Student not found", "STUDENT_NOT_FOUND", None

        session = AttendanceRepository.find_by_id(data["session_id"], tutor_id)
        if not session:
            return None, "Session not found", "SESSION_NOT_FOUND", None

        existing = AttendanceRepository.find_existing(data["student_id"], data["session_id"])
        if existing:
            record = AttendanceRepository.update_manual(
                str(existing["id"]), data["status"], data["manual_reason"], tutor_id,
            )
        else:
            record = AttendanceRepository.mark_attendance(
                tutor_id, data["student_id"], data["class_id"], data["session_id"],
                data["status"], "manual", updated_by=tutor_id, manual_reason=data["manual_reason"],
            )

        return {
            "id": str(record["id"]),
            "status": record["status"],
            "method": record["method"],
            "marked_at": record["marked_at"].isoformat(),
        }, "Attendance updated successfully", None, None


class AttendanceService:
    @staticmethod
    def create_session(tutor_id, class_id, qr_minutes):
        cls = ClassRepository.find_by_id(class_id, tutor_id)
        if not cls:
            return None, "Class not found", "CLASS_NOT_FOUND"

        token = generate_secure_session_token()
        now = datetime.now(timezone.utc)
        expires = calculate_expiry_time(qr_minutes)

        session = AttendanceRepository.create_session(
            tutor_id, class_id, token, now, expires, qr_minutes,
        )
        return {
            "session_id": str(session["id"]),
            "session_token": token,
            "qr_link": generate_qr_link(token),
            "expires_at": expires.isoformat(),
            "class_name": cls["class_name"],
            "present_count": 0,
        }, "QR attendance session created successfully", None

    @staticmethod
    def get_session_by_token(session_token):
        session = AttendanceRepository.find_by_token(session_token)
        if not session:
            return None, "Session not found", "SESSION_NOT_FOUND"

        now = datetime.now(timezone.utc)
        expires_at = session["expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        is_expired = now > expires_at

        return {
            "session_id": str(session["id"]),
            "class_id": str(session["class_id"]),
            "class_name": session.get("class_name"),
            "subject": session.get("subject"),
            "expires_at": expires_at.isoformat(),
            "status": "expired" if is_expired else session["status"],
            "present_count": AttendanceRepository.count_present_in_session(str(session["id"])),
        }, None, None

    @staticmethod
    def close_session(session_id, tutor_id):
        session = AttendanceRepository.find_by_id(session_id, tutor_id)
        if not session:
            return None, "Session not found", "SESSION_NOT_FOUND"

        enrolled = ClassRepository.get_students_in_class(str(session["class_id"]), tutor_id)
        for student in enrolled:
            existing = AttendanceRepository.find_existing(str(student["id"]), session_id)
            if not existing:
                AttendanceRepository.mark_attendance(
                    tutor_id, str(student["id"]), str(session["class_id"]),
                    session_id, "absent", "manual",
                    updated_by=tutor_id, manual_reason="Auto-marked absent on session close",
                )

        AttendanceRepository.close_session(session_id, tutor_id)
        return True, "Session closed and absent records created", None

    @staticmethod
    def mark_qr_attendance(user_id, session_token, device_token):
        return QRAttendanceStrategy.validate_and_mark(user_id, session_token, device_token)

    @staticmethod
    def mark_manual_attendance(tutor_id, data):
        return ManualAttendanceStrategy.validate_and_mark(tutor_id, data)

    @staticmethod
    def get_records(tutor_id, **filters):
        rows, total = AttendanceRepository.get_records(tutor_id, **filters)
        return [AttendanceService._serialize(r) for r in rows], total

    @staticmethod
    def _serialize(row):
        return {
            "id": str(row["id"]),
            "student_id": str(row["student_id"]),
            "student_name": row.get("student_name"),
            "class_id": str(row["class_id"]),
            "class_name": row.get("class_name"),
            "session_id": str(row["session_id"]),
            "status": row["status"],
            "method": row["method"],
            "marked_at": row["marked_at"].isoformat() if row.get("marked_at") else None,
            "manual_reason": row.get("manual_reason"),
        }
