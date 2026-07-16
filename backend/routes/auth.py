import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import quote

from flask import Blueprint, g, request

from core import auth_call, auth_required, database, response, tutor_id

auth_routes = Blueprint("auth", __name__)


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
    return response(
        dict(row) if row else {"id": tutor_id(), "email": g.user.get("email")}
    )


@auth_routes.put("/api/tutor")
@auth_required
def update_tutor():
    data = request.get_json(silent=True) or {}
    with database() as db:
        row = db.execute(
            """insert into tutors(id,full_name,email,phone,center_name) values(%s,%s,%s,%s,%s)
            on conflict(id) do update set full_name=excluded.full_name,phone=excluded.phone,center_name=excluded.center_name returning *""",
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
