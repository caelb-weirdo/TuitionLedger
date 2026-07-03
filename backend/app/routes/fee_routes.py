from flask import Blueprint
from app.controllers.fee_controller import (
    FeeController, ReminderController, DashboardController,
    ReportController, SettingsController,
)
from app.middleware.auth_middleware import login_required, role_required

fee_bp = Blueprint("fees", __name__, url_prefix="/api/fees")
reminder_bp = Blueprint("reminders", __name__, url_prefix="/api/reminders")
dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")
report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")
settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")


@fee_bp.route("", methods=["GET"])
@login_required
@role_required("tutor")
def list_fees():
    return FeeController.list_fees()


@fee_bp.route("", methods=["POST"])
@login_required
@role_required("tutor")
def create_fee():
    return FeeController.create_fee()


@fee_bp.route("/<fee_id>", methods=["PUT"])
@login_required
@role_required("tutor")
def update_fee(fee_id):
    return FeeController.update_fee(fee_id)


@fee_bp.route("/unpaid", methods=["GET"])
@login_required
@role_required("tutor")
def unpaid_students():
    return FeeController.unpaid_students()


@reminder_bp.route("/whatsapp/prepare", methods=["POST"])
@login_required
@role_required("tutor")
def prepare_whatsapp():
    return ReminderController.prepare_whatsapp()


@reminder_bp.route("/phone/prepare", methods=["POST"])
@login_required
@role_required("tutor")
def prepare_phone():
    return ReminderController.prepare_phone()


@reminder_bp.route("/<reminder_id>/confirm", methods=["PUT"])
@login_required
@role_required("tutor")
def confirm_reminder(reminder_id):
    return ReminderController.confirm_reminder(reminder_id)


@reminder_bp.route("", methods=["GET"])
@login_required
@role_required("tutor")
def list_reminders():
    return ReminderController.list_reminders()


@dashboard_bp.route("/summary", methods=["GET"])
@login_required
@role_required("tutor")
def summary():
    return DashboardController.summary()


@report_bp.route("", methods=["GET"])
@login_required
@role_required("tutor")
def get_report():
    return ReportController.get_report()


@settings_bp.route("", methods=["GET"])
@login_required
@role_required("tutor")
def get_settings():
    return SettingsController.get_settings()


@settings_bp.route("", methods=["PUT"])
@login_required
@role_required("tutor")
def update_settings():
    return SettingsController.update_settings()
