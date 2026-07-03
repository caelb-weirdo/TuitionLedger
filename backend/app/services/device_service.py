from datetime import datetime, timezone
from app.repositories.device_repository import DeviceRepository
from app.repositories.student_repository import StudentRepository


class DeviceService:
    @staticmethod
    def request_device(user_id, device_token, device_name, browser_info):
        student = StudentRepository.find_by_user_id(user_id)
        if not student:
            return None, "Student profile not found", "STUDENT_NOT_FOUND"

        existing = DeviceRepository.find_by_student_and_token(str(student["id"]), device_token)
        if existing:
            return DeviceService._serialize(existing), "Device request already exists", None

        approved = DeviceRepository.find_approved_by_student(str(student["id"]))
        if approved and approved["device_token"] != device_token:
            device = DeviceRepository.create(
                str(student["tutor_id"]), str(student["id"]),
                device_token, device_name, browser_info,
            )
            return DeviceService._serialize(device), "New device request submitted", None

        device = DeviceRepository.create(
            str(student["tutor_id"]), str(student["id"]),
            device_token, device_name, browser_info,
        )
        return DeviceService._serialize(device), "Device request submitted", None

    @staticmethod
    def get_devices(tutor_id, status=None, student_id=None, page=1, limit=50):
        rows, total = DeviceRepository.find_all_by_tutor(tutor_id, status, student_id, page, limit)
        return [DeviceService._serialize(r) for r in rows], total

    @staticmethod
    def approve_device(device_id, tutor_id, approved_by):
        device = DeviceRepository.find_by_id(device_id, tutor_id)
        if not device:
            return None, "Device not found", "DEVICE_NOT_FOUND"
        if device["status"] != "pending":
            return None, "Device is not pending", "VALIDATION_ERROR"

        approved = DeviceRepository.approve(device_id, tutor_id, approved_by)
        DeviceRepository.reject_other_devices(str(device["student_id"]), device_id)
        return DeviceService._serialize(approved), "Device approved successfully", None

    @staticmethod
    def reject_device(device_id, tutor_id, reason):
        device = DeviceRepository.find_by_id(device_id, tutor_id)
        if not device:
            return None, "Device not found", "DEVICE_NOT_FOUND"
        if device["status"] != "pending":
            return None, "Device is not pending", "VALIDATION_ERROR"
        if not reason:
            return None, "Rejection reason is required", "VALIDATION_ERROR"

        rejected = DeviceRepository.reject(device_id, tutor_id, reason)
        return DeviceService._serialize(rejected), "Device rejected", None

    @staticmethod
    def get_student_device_status(user_id):
        student = StudentRepository.find_by_user_id(user_id)
        if not student:
            return None
        approved = DeviceRepository.find_approved_by_student(str(student["id"]))
        if approved:
            return {"status": "approved", "device_name": approved.get("device_name")}
        from app.repositories.base_repository import BaseRepository
        pending = BaseRepository.execute_query(
            """SELECT * FROM devices WHERE student_id = %s AND status = 'pending'
               AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1""",
            (str(student["id"]),),
            fetchone=True,
        )
        if pending:
            return {"status": "pending", "device_name": pending.get("device_name")}
        rejected = BaseRepository.execute_query(
            """SELECT * FROM devices WHERE student_id = %s AND status = 'rejected'
               AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1""",
            (str(student["id"]),),
            fetchone=True,
        )
        if rejected:
            return {"status": "rejected", "reason": rejected.get("rejection_reason")}
        return {"status": "none"}

    @staticmethod
    def _serialize(row):
        return {
            "id": str(row["id"]),
            "student_id": str(row["student_id"]),
            "student_name": row.get("student_name"),
            "device_token": row["device_token"],
            "device_name": row.get("device_name"),
            "status": row["status"],
            "rejection_reason": row.get("rejection_reason"),
            "requested_at": row["requested_at"].isoformat() if row.get("requested_at") else None,
            "approved_at": row["approved_at"].isoformat() if row.get("approved_at") else None,
        }
