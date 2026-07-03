from functools import wraps
from flask import request, g
from app.utils.token_utils import decode_token
from app.utils.response_utils import error_response
import jwt


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return error_response("Authentication token is required", "TOKEN_MISSING", 401)
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
            g.current_user = {
                "id": payload["sub"],
                "role": payload["role"],
                "name": payload.get("name", ""),
            }
        except jwt.ExpiredSignatureError:
            return error_response("Token has expired", "TOKEN_EXPIRED", 401)
        except jwt.InvalidTokenError:
            return error_response("Invalid token", "TOKEN_INVALID", 401)
        return f(*args, **kwargs)
    return decorated


def role_required(role: str):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.current_user.get("role") != role:
                return error_response(
                    "You do not have permission to perform this action.",
                    "FORBIDDEN",
                    403,
                )
            return f(*args, **kwargs)
        return decorated
    return decorator
