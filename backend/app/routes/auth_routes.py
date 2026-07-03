from flask import Blueprint
from app.controllers.auth_controller import AuthController
from app.middleware.auth_middleware import login_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    return AuthController.login()


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return AuthController.me()
