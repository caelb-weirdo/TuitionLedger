from flask import request, g
from app.services.attendance_service import AttendanceService
from app.utils.response_utils import success_response, error_response, validation_error_response


class AttendanceController:
    @staticmethod
    def create_session():
        data = request.get_json() or {}
        result, message, error = AttendanceService.create_session(
            g.current_user["id"], data.get("class_id"), data.get("qr_time_limit_minutes", 5),
        )
        if error:
            return error_response(message, error, 400)
        return success_response(message, result, 201)

    @staticmethod
    def get_session(token):
        result, message, error = AttendanceService.get_session_by_token(token)
        if error:
            return error_response(message, error, 404)
        return success_response("Session retrieved", result)

    @staticmethod
    def close_session(session_id):
        _, message, error = AttendanceService.close_session(session_id, g.current_user["id"])
        if error:
            return error_response(message, error, 404)
        return success_response(message)

    @staticmethod
    def mark_attendance():
        data = request.get_json() or {}
        result, message, error = AttendanceService.mark_qr_attendance(
            g.current_user["id"], data.get("session_token"), data.get("device_token"),
        )
        if error:
            status = 400
            if error in ("SESSION_EXPIRED", "ATTENDANCE_ALREADY_MARKED", "DEVICE_NOT_APPROVED",
                         "DEVICE_PENDING", "DEVICE_REJECTED", "STUDENT_NOT_ENROLLED"):
                status = 400
            return error_response(message, error, status)
        return success_response(message, result)

    @staticmethod
    def manual_attendance():
        data, message, error, errors = AttendanceService.mark_manual_attendance(
            g.current_user["id"], request.get_json() or {},
        )
        if error == "VALIDATION_ERROR":
            return validation_error_response(errors)
        if error:
            return error_response(message, error, 400)
        return success_response(message, data)

    @staticmethod
    def list_records():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 50))
        month = request.args.get("month", type=int)
        year = request.args.get("year", type=int)
        records, total = AttendanceService.get_records(
            g.current_user["id"], class_id=request.args.get("class_id"),
            student_id=request.args.get("student_id"), month=month, year=year,
            status=request.args.get("status"), page=page, limit=limit,
        )
        return success_response("Attendance records retrieved",
                                {"records": records, "page": page, "limit": limit, "total": total})
