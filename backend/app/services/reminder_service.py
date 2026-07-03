from app.repositories.reminder_repository import ReminderRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.fee_repository import FeeRepository
from app.repositories.settings_repository import SettingsRepository
from app.utils.phone_utils import build_whatsapp_link, build_tel_link, apply_template_variables


class ReminderFactory:
    """Factory for creating WhatsApp and phone reminders."""

    @staticmethod
    def create_whatsapp_reminder(tutor_id, student_id, fee_payment_id, created_by):
        student = StudentRepository.find_by_id(student_id, tutor_id)
        if not student:
            return None, "Student not found", "STUDENT_NOT_FOUND", None

        if not student.get("parent_phone_whatsapp"):
            return None, "Parent phone number is required for this reminder", "PARENT_PHONE_REQUIRED", None

        settings = SettingsRepository.get_by_tutor(tutor_id)
        fee = FeeRepository.find_by_id(fee_payment_id, tutor_id) if fee_payment_id else None

        month_name = str(fee["month"]) if fee else ""
        message = apply_template_variables(
            settings.get("whatsapp_template", ""),
            {"student_name": student["full_name"], "month": month_name},
        )

        reminder = ReminderRepository.create(
            tutor_id, student_id, fee_payment_id,
            student.get("parent_phone_local"), student.get("parent_phone_whatsapp"),
            "whatsapp", message, created_by,
        )

        wa_link = build_whatsapp_link(student["parent_phone_whatsapp"], message)
        return {
            "reminder_id": str(reminder["id"]),
            "message": message,
            "wa_link": wa_link,
            "student_name": student["full_name"],
        }, "WhatsApp reminder prepared", None, None

    @staticmethod
    def create_phone_reminder(tutor_id, student_id, fee_payment_id, created_by):
        student = StudentRepository.find_by_id(student_id, tutor_id)
        if not student:
            return None, "Student not found", "STUDENT_NOT_FOUND", None

        if not student.get("parent_phone_local"):
            return None, "Parent phone number is required for this reminder", "PARENT_PHONE_REQUIRED", None

        settings = SettingsRepository.get_by_tutor(tutor_id)
        message = apply_template_variables(
            settings.get("phone_template", "Call parent regarding pending fee."),
            {"student_name": student["full_name"]},
        )

        reminder = ReminderRepository.create(
            tutor_id, student_id, fee_payment_id,
            student.get("parent_phone_local"), student.get("parent_phone_whatsapp"),
            "phone", message, created_by,
        )

        tel_link = build_tel_link(student["parent_phone_local"])
        return {
            "reminder_id": str(reminder["id"]),
            "message": message,
            "tel_link": tel_link,
            "student_name": student["full_name"],
        }, "Phone reminder prepared", None, None


class ReminderService:
    @staticmethod
    def prepare_whatsapp(tutor_id, student_id, fee_payment_id, created_by):
        return ReminderFactory.create_whatsapp_reminder(tutor_id, student_id, fee_payment_id, created_by)

    @staticmethod
    def prepare_phone(tutor_id, student_id, fee_payment_id, created_by):
        return ReminderFactory.create_phone_reminder(tutor_id, student_id, fee_payment_id, created_by)

    @staticmethod
    def confirm_reminder(reminder_id, tutor_id):
        reminder = ReminderRepository.confirm(reminder_id, tutor_id)
        if not reminder:
            return None, "Reminder not found", "REMINDER_NOT_FOUND"
        return {"id": str(reminder["id"]), "status": reminder["status"]}, "Reminder confirmed as sent", None

    @staticmethod
    def get_history(tutor_id, **filters):
        rows, total = ReminderRepository.get_history(tutor_id, **filters)
        return [{
            "id": str(r["id"]),
            "student_name": r.get("student_name"),
            "reminder_type": r["reminder_type"],
            "status": r["status"],
            "message": r.get("message"),
            "confirmed_at": r["confirmed_at"].isoformat() if r.get("confirmed_at") else None,
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
        } for r in rows], total
