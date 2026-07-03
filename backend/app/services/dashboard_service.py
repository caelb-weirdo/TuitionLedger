from datetime import datetime
from app.repositories.student_repository import StudentRepository
from app.repositories.device_repository import DeviceRepository
from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.fee_repository import FeeRepository
from app.repositories.reminder_repository import ReminderRepository
from app.repositories.base_repository import BaseRepository


class DashboardService:
    @staticmethod
    def get_summary(tutor_id, month=None, year=None):
        now = datetime.now()
        month = month or now.month
        year = year or now.year

        return {
            "total_students": StudentRepository.count_by_tutor(tutor_id),
            "present_today": AttendanceRepository.count_today_by_status(tutor_id, "present"),
            "absent_today": AttendanceRepository.count_today_by_status(tutor_id, "absent"),
            "late_today": AttendanceRepository.count_today_by_status(tutor_id, "late"),
            "paid_this_month": FeeRepository.count_by_status(tutor_id, "paid", month, year),
            "unpaid_this_month": FeeRepository.count_by_status(tutor_id, "unpaid", month, year),
            "partial_this_month": FeeRepository.count_by_status(tutor_id, "partial", month, year),
            "overdue_this_month": FeeRepository.count_by_status(tutor_id, "overdue", month, year),
            "pending_devices": DeviceRepository.count_pending(tutor_id),
            "recent_attendance": [
                {
                    "id": str(r["id"]),
                    "student_name": r.get("student_name"),
                    "class_name": r.get("class_name"),
                    "status": r["status"],
                    "marked_at": r["marked_at"].isoformat() if r.get("marked_at") else None,
                }
                for r in AttendanceRepository.get_recent(tutor_id, 5)
            ],
            "recent_fees": [
                {
                    "id": str(r["id"]),
                    "student_name": r.get("student_name"),
                    "class_name": r.get("class_name"),
                    "status": r["status"],
                    "amount_due": float(r["amount_due"]),
                    "amount_paid": float(r["amount_paid"]),
                }
                for r in FeeRepository.get_recent(tutor_id, 5)
            ],
        }


class ReportService:
    @staticmethod
    def get_report(tutor_id, report_type, month=None, year=None, class_id=None, student_id=None):
        if report_type == "attendance":
            rows, _ = AttendanceRepository.get_records(
                tutor_id, class_id=class_id, student_id=student_id,
                month=month, year=year, limit=1000,
            )
            return [{"student_name": r.get("student_name"), "class_name": r.get("class_name"),
                     "status": r["status"], "method": r["method"],
                     "marked_at": r["marked_at"].isoformat() if r.get("marked_at") else None} for r in rows]

        if report_type == "fees":
            rows, _ = FeeRepository.get_records(
                tutor_id, class_id=class_id, student_id=student_id,
                month=month, year=year, limit=1000,
            )
            return [{"student_name": r.get("student_name"), "class_name": r.get("class_name"),
                     "month": r["month"], "year": r["year"], "amount_due": float(r["amount_due"]),
                     "amount_paid": float(r["amount_paid"]), "status": r["status"]} for r in rows]

        if report_type == "unpaid":
            from app.services.fee_service import FeeService
            return FeeService.get_unpaid(tutor_id)

        if report_type == "student-history":
            if not student_id:
                return []
            attendance, _ = AttendanceRepository.get_records(tutor_id, student_id=student_id, limit=500)
            fees, _ = FeeRepository.get_records(tutor_id, student_id=student_id, limit=500)
            return {
                "attendance": [{"class_name": r.get("class_name"), "status": r["status"],
                                "marked_at": r["marked_at"].isoformat() if r.get("marked_at") else None} for r in attendance],
                "fees": [{"class_name": r.get("class_name"), "month": r["month"], "year": r["year"],
                          "status": r["status"], "amount_due": float(r["amount_due"]),
                          "amount_paid": float(r["amount_paid"])} for r in fees],
            }

        return []
