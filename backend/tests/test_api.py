from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

import psycopg
import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))
import app as api_app


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        import json

        return json.dumps(self.payload).encode()


class FakeDB:
    def __init__(self, execute):
        self.execute_fn = execute
        self.calls = []
        self.rowcount = 1

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def execute(self, sql, params=()):
        self.calls.append((sql, params))
        self.value = self.execute_fn(sql, params)
        return self

    def fetchone(self):
        return self.value

    def fetchall(self):
        return self.value or []

    def commit(self):
        return None

    def rollback(self):
        return None


@pytest.fixture
def client(monkeypatch):
    api_app.app.config.update(TESTING=True)
    monkeypatch.setattr(api_app, "urlopen", lambda *_args, **_kwargs: FakeResponse({"id": "tutor-1", "email": "tutor@example.com", "user_metadata": {}}))
    return api_app.app.test_client()


def auth_headers():
    return {"Authorization": "Bearer test-token"}


def test_signup_requires_email_and_password(client):
    result = client.post("/api/auth/signup", json={})
    assert result.status_code == 422
    assert result.json["success"] is False


def test_expired_qr_is_rejected(client, monkeypatch):
    db = FakeDB(lambda _sql, _params: {"status": "Active", "expires_at": datetime.now(timezone.utc) - timedelta(minutes=1)})
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.post("/api/attendance/scan", json={"qr_token": "expired", "browser_id": "browser-1"})
    assert result.status_code == 410
    assert result.json["message"] == "QR code expired."


def test_wrong_browser_is_rejected(client, monkeypatch):
    now = datetime.now(timezone.utc) + timedelta(minutes=5)

    def execute(sql, _params):
        if "attendance_sessions" in sql:
            return {"id": "session-1", "class_id": "class-1", "tutor_id": "tutor-1", "status": "Active", "expires_at": now, "attendance_date": "2026-07-15"}
        return None

    db = FakeDB(execute)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.post("/api/attendance/scan", json={"qr_token": "valid", "browser_id": "unknown"})
    assert result.status_code == 403
    assert result.json["message"] == "This browser is not approved."


def test_duplicate_attendance_returns_conflict(client, monkeypatch):
    now = datetime.now(timezone.utc) + timedelta(minutes=5)

    def execute(sql, _params):
        if "attendance_sessions" in sql:
            return {"id": "session-1", "class_id": "class-1", "tutor_id": "tutor-1", "status": "Active", "expires_at": now, "attendance_date": "2026-07-15"}
        if "students where browser_id" in sql:
            return {"id": "student-1"}
        if "class_students" in sql:
            return {"student_id": "student-1"}
        raise psycopg.errors.UniqueViolation("duplicate attendance")

    db = FakeDB(execute)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.post("/api/attendance/scan", json={"qr_token": "valid", "browser_id": "approved"})
    assert result.status_code == 409
    assert result.json["message"] == "Attendance already marked."


def test_registration_approval_generates_student_id(client, monkeypatch):
    student = {"id": "student-1", "student_code": "STU001", "full_name": "Enus Caleb"}

    def execute(sql, _params):
        if "registration_requests where" in sql:
            return {"full_name": "Enus Caleb", "student_phone": "0789282834", "guardian_name": "Guardian", "guardian_whatsapp": "0710000000", "grade": "Grade 11", "browser_id": "browser-1"}
        if "next_student_code" in sql:
            return {"code": "STU001"}
        if "insert into students" in sql:
            return student
        return None

    db = FakeDB(execute)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.post("/api/registration-requests/request-1/approve", headers=auth_headers())
    assert result.status_code == 200
    assert result.json["data"]["student_code"] == "STU001"


def test_fee_update_returns_paid_record(client, monkeypatch):
    paid = {"id": "fee-1", "status": "Paid", "paid_at": "2026-07-15T00:00:00Z"}

    def execute(sql, _params):
        if "update fee_records" in sql:
            return paid
        return None

    db = FakeDB(execute)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.put("/api/fees/fee-1", headers=auth_headers(), json={"status": "Paid"})
    assert result.status_code == 200
    assert result.json["data"]["status"] == "Paid"
