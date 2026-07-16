import os
from urllib.request import urlopen  # noqa: F401 - test injection hook

import psycopg
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from core import database, response  # noqa: F401 - test injection hook
from routes.attendance import attendance_routes
from routes.auth import auth_routes
from routes.classes import class_routes
from routes.fees import fee_routes
from routes.students import student_routes
from validators import ValidationError

load_dotenv()


def create_app():
    application = Flask(__name__)
    configured = os.getenv("ALLOWED_ORIGINS", os.getenv("CORS_ORIGINS", ""))
    origins = [
        item.strip().rstrip("/") for item in configured.split(",") if item.strip()
    ]
    if not origins:
        origins = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:4173",
            "http://localhost:4174",
        ]
    CORS(application, origins=origins)
    for blueprint in (
        auth_routes,
        student_routes,
        class_routes,
        attendance_routes,
        fee_routes,
    ):
        application.register_blueprint(blueprint)

    @application.get("/health")
    def health():
        from datetime import datetime, timezone

        return response(
            {
                "service": "TuitionLedger API",
                "time": datetime.now(timezone.utc).isoformat(),
            }
        )

    @application.errorhandler(ValidationError)
    def validation_error(error):
        return response(message=str(error), status=422)

    @application.errorhandler(psycopg.OperationalError)
    def database_error(error):
        application.logger.exception(
            "Database operation failed: %s", type(error).__name__
        )
        return response(
            message="The data service is temporarily unavailable.", status=503
        )

    @application.errorhandler(Exception)
    def unknown_error(error):
        application.logger.exception("Unhandled API error: %s", type(error).__name__)
        return response(message="Something went wrong. Please try again.", status=500)

    return application


app = create_app()


if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", "8000")), debug=True)
