import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import quote

from flask import Blueprint, g, request

from core import auth_call, auth_required, database, response, tutor_id

auth_routes = Blueprint("auth", __name__)


def ensure_tutor_profile(user):
    metadata = user.get("user_metadata") or {}
    with database() as db:
        row = db.execute(
            """insert into tutors(id,full_name,email)
            values(%s,%s,%s)
            on conflict(id) do update set email=excluded.email
            returning *""",
            (
                user["id"],
                str(metadata.get("full_name", "")).strip(),
                user.get("email", ""),
            ),
        ).fetchone()
        db.commit()
    return dict(row)


@auth_routes.post("/api/auth/signup")
def signup():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))
    if not email or len(password) < 8:
        return response(
            message="Use an email and a password with at least 8 characters.",
            status=422,
        )
    redirect = os.getenv(
        "AUTH_REDIRECT_URL", f"{os.getenv('TUTOR_APP_URL', '')}/#login"
    )
    try:
        result = auth_call(
            f"/auth/v1/signup?redirect_to={quote(redirect, safe='')}",
            {"email": email, "password": password},
        )
        if result.get("user"):
            ensure_tutor_profile(result["user"])
        return response(
            {
                "user": result.get("user"),
                "access_token": result.get("access_token"),
                "refresh_token": result.get("refresh_token"),
            },
            "Account created. Check your email if confirmation is enabled.",
            201,
        )
    except HTTPError as error:
        detail = json.loads(error.read().decode()) if error.fp else {}
        return response(
            message=detail.get("msg")
            or detail.get("error_description")
            or "That email could not be registered.",
            status=400,
        )
    except (URLError, TimeoutError):
        return response(message="Supabase Auth could not be reached.", status=502)


@auth_routes.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip()
    password = str(data.get("password", ""))
    if not email or not password:
        return response(message="Email and password are required.", status=422)
    try:
        result = auth_call(
            "/auth/v1/token?grant_type=password", {"email": email, "password": password}
        )
        if result.get("user"):
            ensure_tutor_profile(result["user"])
        return response(
            {
                key: result.get(key)
                for key in ("access_token", "refresh_token", "expires_in", "user")
            }
        )
    except HTTPError:
        return response(message="Invalid email or password.", status=401)
    except (URLError, TimeoutError):
        return response(message="Supabase Auth could not be reached.", status=502)


@auth_routes.post("/api/auth/request-password-reset")
def request_password_reset():
    email = str((request.get_json(silent=True) or {}).get("email", "")).strip()
    if not email:
        return response(message="Email is required.", status=422)
    redirect = os.getenv(
        "AUTH_PASSWORD_RESET_REDIRECT_URL",
        f"{os.getenv('TUTOR_APP_URL', '').rstrip('/')}/?recovery=true",
    )
    try:
        auth_call(
            f"/auth/v1/recover?redirect_to={quote(redirect, safe='')}",
            {"email": email},
        )
    except HTTPError:
        pass
    except (URLError, TimeoutError):
        return response(message="Supabase Auth could not be reached.", status=502)
    return response(
        message="If that email is registered, a recovery link has been sent."
    )


@auth_routes.post("/api/auth/reset-password")
def reset_password():
    data = request.get_json(silent=True) or {}
    token = str(data.get("token", "")).strip()
    password = str(data.get("password", ""))
    if not token or len(password) < 8:
        return response(
            message="Use a valid recovery link and a password with at least 8 characters.",
            status=422,
        )
    try:
        auth_call("/auth/v1/user", {"password": password}, method="PUT", token=token)
        return response(message="Password updated. Sign in with your new password.")
    except HTTPError:
        return response(
            message="That recovery link is invalid or expired. Request a new one.",
            status=400,
        )
    except (URLError, TimeoutError):
        return response(message="Supabase Auth could not be reached.", status=502)


@auth_routes.post("/api/auth/refresh")
def refresh():
    token = str((request.get_json(silent=True) or {}).get("refresh_token", "")).strip()
    if not token:
        return response(message="Refresh token is required.", status=422)
    try:
        result = auth_call(
            "/auth/v1/token?grant_type=refresh_token", {"refresh_token": token}
        )
        return response(
            {
                key: result.get(key)
                for key in ("access_token", "refresh_token", "expires_in", "user")
            }
        )
    except (HTTPError, URLError, TimeoutError):
        return response(
            message="Your session has expired. Please sign in again.", status=401
        )


@auth_routes.get("/api/tutor")
@auth_required
def get_tutor():
    with database() as db:
        row = db.execute("select * from tutors where id=%s", (tutor_id(),)).fetchone()
    return response(dict(row) if row else ensure_tutor_profile(g.user))


@auth_routes.put("/api/tutor")
@auth_required
def update_tutor():
    data = request.get_json(silent=True) or {}
    with database() as db:
        row = db.execute(
            """insert into tutors(id,full_name,email,phone,center_name) values(%s,%s,%s,%s,%s)
            on conflict(id) do update set full_name=excluded.full_name,email=excluded.email,phone=excluded.phone,center_name=excluded.center_name returning *""",
            (
                tutor_id(),
                str(data.get("full_name", "")).strip(),
                g.user.get("email", ""),
                str(data.get("phone", "")).strip(),
                str(data.get("center_name", "")).strip(),
            ),
        ).fetchone()
        db.commit()
    return response(dict(row))
