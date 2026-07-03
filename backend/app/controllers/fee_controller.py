from flask import request, g
from app.services.fee_service import FeeService
from app.services.reminder_service import ReminderService
from app.services.dashboard_service import DashboardService, ReportService
from app.services.settings_service import SettingsService
from app.utils.response_utils import success_response, error_response, validation_error_response


class FeeController:
    @staticmethod
    def list_fees():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 50))
        fees, total = FeeService.get_fees(
            g.current_user["id"], student_id=request.args.get("student_id"),
            class_id=request.args.get("class_id"),
            month=request.args.get("month", type=int),
            year=request.args.get("year", type=int),
            status=request.args.get("status"), page=page, limit=limit,
        )
        return success_response("Fee records retrieved", {"fees": fees, "page": page, "limit": limit, "total": total})

    @staticmethod
    def create_fee():
        data, message, error, errors = FeeService.create_fee(g.current_user["id"], request.get_json() or {})
        if error == "VALIDATION_ERROR":
            return validation_error_response(errors)
        if error:
            return error_response(message, error, 400)
        return success_response(message, data, 201)

    @staticmethod
    def update_fee(fee_id):
        data, message, error, errors = FeeService.update_fee(fee_id, g.current_user["id"], request.get_json() or {})
        if error == "VALIDATION_ERROR":
            return validation_error_response(errors)
        if error:
            return error_response(message, error, 404)
        return success_response(message, data)

    @staticmethod
    def unpaid_students():
        students = FeeService.get_unpaid(g.current_user["id"])
        return success_response("Unpaid students retrieved", {"students": students})


class ReminderController:
    @staticmethod
    def prepare_whatsapp():
        data = request.get_json() or {}
        result, message, error, errors = ReminderService.prepare_whatsapp(
            g.current_user["id"], data.get("student_id"),
            data.get("fee_payment_id"), g.current_user["id"],
        )
        if error:
            return error_response(message, error, 400)
        return success_response(message, result)

    @staticmethod
    def prepare_phone():
        data = request.get_json() or {}
        result, message, error, errors = ReminderService.prepare_phone(
            g.current_user["id"], data.get("student_id"),
            data.get("fee_payment_id"), g.current_user["id"],
        )
        if error:
            return error_response(message, error, 400)
        return success_response(message, result)

    @staticmethod
    def confirm_reminder(reminder_id):
        result, message, error = ReminderService.confirm_reminder(reminder_id, g.current_user["id"])
        if error:
            return error_response(message, error, 404)
        return success_response(message, result)

    @staticmethod
    def list_reminders():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 50))
        reminders, total = ReminderService.get_history(
            g.current_user["id"], student_id=request.args.get("student_id"),
            reminder_type=request.args.get("type"), status=request.args.get("status"),
            month=request.args.get("month", type=int),
            year=request.args.get("year", type=int), page=page, limit=limit,
        )
        return success_response("Reminders retrieved",
                                {"reminders": reminders, "page": page, "limit": limit, "total": total})


class DashboardController:
    @staticmethod
    def summary():
        data = DashboardService.get_summary(
            g.current_user["id"],
            request.args.get("month", type=int),
            request.args.get("year", type=int),
        )
        return success_response("Dashboard summary retrieved", data)


class ReportController:
    @staticmethod
    def get_report():
        data = ReportService.get_report(
            g.current_user["id"], request.args.get("type"),
            request.args.get("month", type=int),
            request.args.get("year", type=int),
            request.args.get("class_id"), request.args.get("student_id"),
        )
        return success_response("Report generated", {"report": data, "type": request.args.get("type")})


class SettingsController:
    @staticmethod
    def get_settings():
        data = SettingsService.get_settings(g.current_user["id"])
        return success_response("Settings retrieved", data)

    @staticmethod
    def update_settings():
        data, message, error = SettingsService.update_settings(g.current_user["id"], request.get_json() or {})
        if error:
            return error_response(message, error, 400)
        return success_response(message, data)
