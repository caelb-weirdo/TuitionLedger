from flask import Blueprint
from app.controllers.attendance_controller import AttendanceController
from app.middleware.auth_middleware import login_required, role_required

session_bp = Blueprint("attendance_sessions", __name__, url_prefix="/api/attendance-sessions")
attendance_bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")


@session_bp.route("", methods=["POST"])
@login_required
@role_required("tutor")
def create_session():
    return AttendanceController.create_session()


@session_bp.route("/<token>", methods=["GET"])
@login_required
def get_session(token):
    return AttendanceController.get_session(token)


@session_bp.route("/<session_id>/close", methods=["PUT"])
@login_required
@role_required("tutor")
def close_session(session_id):
    return AttendanceController.close_session(session_id)


@attendance_bp.route("/mark", methods=["POST"])
@login_required
@role_required("student")
def mark_attendance():
    return AttendanceController.mark_attendance()


@attendance_bp.route("/manual", methods=["POST"])
@login_required
@role_required("tutor")
def manual_attendance():
    return AttendanceController.manual_attendance()


@attendance_bp.route("", methods=["GET"])
@login_required
@role_required("tutor")
def list_records():
    return AttendanceController.list_records()
