from flask import Flask
from flask_cors import CORS
from app.config.settings import Settings
from app.routes.auth_routes import auth_bp
from app.routes.student_routes import student_bp
from app.routes.class_routes import class_bp, enrollment_bp
from app.routes.device_routes import device_bp
from app.routes.attendance_routes import session_bp, attendance_bp
from app.routes.fee_routes import fee_bp, reminder_bp, dashboard_bp, report_bp, settings_bp
from app.utils.response_utils import success_response


def create_app():
    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False

    CORS(app, origins=Settings.ALLOWED_ORIGINS, supports_credentials=True)

    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(class_bp)
    app.register_blueprint(enrollment_bp)
    app.register_blueprint(device_bp)
    app.register_blueprint(session_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(fee_bp)
    app.register_blueprint(reminder_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(settings_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return success_response("TuitionLedger API is running", {"status": "ok"})

    return app
