import json
import os
import sys
from functools import wraps
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import psycopg
from flask import g, jsonify, request
from psycopg.rows import dict_row


def response(data=None, message=None, status=200, **fields):
    body = {"success": status < 400}
    if data is not None:
        body["data"] = data
    if message:
        body["message"] = message
    body.update(fields)
    return jsonify(json.loads(json.dumps(body, default=str))), status


def database():
    app_module = sys.modules.get("app")
    injected = getattr(app_module, "database", None) if app_module else None
    if injected is not None and injected is not database:
        return injected()
    url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if not url:
        raise psycopg.OperationalError("Database is not configured")
    return psycopg.connect(url, row_factory=dict_row, sslmode="require")


def _auth_urlopen(*args, **kwargs):
    app_module = sys.modules.get("app")
    resolver = getattr(app_module, "urlopen", urlopen) if app_module else urlopen
    return resolver(*args, **kwargs)


def auth_required(handler):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        if not token:
            return response(message="Please sign in first.", status=401)
        url = os.getenv("SUPABASE_URL", "").rstrip("/")
        key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
        if not url.startswith(("https://", "http://")) or not key:
            return response(
                message="Authentication service is not configured.", status=503
            )
        try:
            auth_request = Request(
                f"{url}/auth/v1/user",
                headers={"apikey": key, "Authorization": f"Bearer {token}"},
            )
            with _auth_urlopen(auth_request, timeout=10) as result:
                g.user = json.loads(result.read().decode("utf-8"))
            g.token = token
            return handler(*args, **kwargs)
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
            return response(
                message="Your session has expired. Please sign in again.", status=401
            )

    return wrapper


def tutor_id():
    return g.user["id"]


def auth_call(path, payload):
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    req = Request(
        f"{url}{path}",
        data=json.dumps(payload).encode(),
        headers={"apikey": key, "Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(req, timeout=10) as result:
        return json.loads(result.read().decode())
