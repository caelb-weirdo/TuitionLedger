from flask import jsonify


def success_response(message: str, data=None, status=200):
    return jsonify({"success": True, "message": message, "data": data or {}}), status


def error_response(message: str, error_code: str, status=400, errors=None):
    body = {"success": False, "message": message, "error": error_code}
    if errors:
        body["errors"] = errors
    return jsonify(body), status


def validation_error_response(errors: dict):
    return error_response("Validation failed", "VALIDATION_ERROR", 400, errors)
