from flask import request, g
from app.services.auth_service import AuthService
from app.utils.response_utils import success_response, error_response, validation_error_response


class AuthController:
    @staticmethod
    def login():
        data = request.get_json() or {}
        result, message, error = AuthService.login(
            data.get("identifier"), data.get("password"),
        )
        if error:
            status = 401 if error == "INVALID_CREDENTIALS" else 400
            return error_response(message, error, status)
        return success_response(message, result)

    @staticmethod
    def me():
        user = AuthService.get_current_user(g.current_user["id"])
        if not user:
            return error_response("User not found", "USER_NOT_FOUND", 404)
        return success_response("Current user retrieved", user)
