from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))
import app as api_app

REQUEST_ID = "550e8400-e29b-41d4-a716-446655440001"
FEE_ID = "550e8400-e29b-41d4-a716-446655440002"
BROWSER_ID = "550e8400-e29b-41d4-a716-446655440003"
QR_TOKEN = "valid_attendance_token_1234567890"


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
    monkeypatch.setattr(
        api_app,
        "urlopen",
        lambda *_args, **_kwargs: FakeResponse(
            {"id": "tutor-1", "email": "tutor@example.com", "user_metadata": {}}
        ),
    )
    return api_app.app.test_client()


def auth_headers():
    return {"Authorization": "Bearer test-token"}


def test_health_returns_standard_response(client):
    result = client.get("/health")
    assert result.status_code == 200
    assert result.json["success"] is True
    assert result.json["data"]["service"] == "TuitionLedger API"


def test_signup_requires_email_and_password(client):
    result = client.post("/api/auth/signup", json={})
    assert result.status_code == 422
    assert result.json["success"] is False


def test_login_requires_email_and_password(client):
    result = client.post("/api/auth/login", json={"email": "", "password": "short"})
    assert result.status_code == 422
    assert result.json["message"] == "Email and password are required."


def test_expired_qr_is_rejected(client, monkeypatch):
    db = FakeDB(
        lambda _sql, _params: {
            "status": "Active",
            "expires_at": datetime.now(timezone.utc) - timedelta(minutes=1),
        }
    )
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.post(
        "/api/attendance/scan", json={"qr_token": QR_TOKEN, "browser_id": BROWSER_ID}
    )
    assert result.status_code == 410
    assert result.json["message"] == "QR code expired."


def test_wrong_browser_is_rejected(client, monkeypatch):
    now = datetime.now(timezone.utc) + timedelta(minutes=5)

    def execute(sql, _params):
        if "attendance_sessions" in sql:
            return {
                "id": "session-1",
                "class_id": "class-1",
                "tutor_id": "tutor-1",
                "status": "Active",
                "expires_at": now,
                "attendance_date": "2026-07-15",
            }
        return None

    db = FakeDB(execute)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.post(
        "/api/attendance/scan", json={"qr_token": QR_TOKEN, "browser_id": BROWSER_ID}
    )
    assert result.status_code == 403
    assert result.json["message"] == "This browser is not approved for attendance."


def test_duplicate_attendance_returns_already_marked(client, monkeypatch):
    now = datetime.now(timezone.utc) + timedelta(minutes=5)

    def execute(sql, _params):
        if "attendance_sessions" in sql:
            return {
                "id": "session-1",
                "class_id": "class-1",
                "tutor_id": "tutor-1",
                "status": "Active",
                "expires_at": now,
                "attendance_date": "2026-07-15",
            }
        if "students where browser_id" in sql:
            return {"id": "student-1"}
        if "class_students" in sql:
            return {"student_id": "student-1"}
        if "update attendance_records" in sql:
            return None
        if "select * from attendance_records" in sql:
            return {"id": "attendance-1", "status": "Present"}
        return None

    db = FakeDB(execute)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.post(
        "/api/attendance/scan", json={"qr_token": QR_TOKEN, "browser_id": BROWSER_ID}
    )
    assert result.status_code == 200
    assert result.json["data"]["result"] == "Already Marked"


def test_new_session_reuses_daily_attendance_record(client, monkeypatch):
    session = {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "class_id": "550e8400-e29b-41d4-a716-446655440010",
        "attendance_date": "2026-07-16",
        "qr_token": QR_TOKEN,
    }

    def execute(sql, _params):
        if "select 1 from classes" in sql:
            return {"owned": True}
        if "insert into attendance_sessions" in sql:
            return session
        return None

    db = FakeDB(execute)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.post(
        "/api/attendance-sessions",
        headers=auth_headers(),
        json={
            "class_id": "550e8400-e29b-41d4-a716-446655440010",
            "attendance_date": "2026-07-16",
            "duration_minutes": 5,
        },
    )

    attendance_insert = next(
        sql.lower()
        for sql, _params in db.calls
        if "insert into attendance_records" in sql.lower()
    )
    assert result.status_code == 201
    assert "on conflict(class_id,student_id,attendance_date)" in attendance_insert
    assert "session_id=excluded.session_id" in attendance_insert


def test_registration_approval_generates_student_id(client, monkeypatch):
    student = {"id": "student-1", "student_code": "STU001", "full_name": "Enus Caleb"}

    def execute(sql, _params):
        if "registration_requests where" in sql:
            return {
                "full_name": "Enus Caleb",
                "student_phone": "0789282834",
                "guardian_name": "Guardian",
                "guardian_whatsapp": "0710000000",
                "grade": "Grade 11",
                "browser_id": "browser-1",
            }
        if "next_student_code" in sql:
            return {"code": "STU001"}
        if "insert into students" in sql:
            return student
        return None

    db = FakeDB(execute)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.post(
        f"/api/registration-requests/{REQUEST_ID}/approve", headers=auth_headers()
    )
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
    result = client.put(
        f"/api/fees/{FEE_ID}", headers=auth_headers(), json={"status": "Paid"}
    )
    assert result.status_code == 200
    assert result.json["data"]["status"] == "Paid"


def test_bulk_enrollment_accepts_multiple_students(client, monkeypatch):
    student_ids = [
        "550e8400-e29b-41d4-a716-446655440031",
        "550e8400-e29b-41d4-a716-446655440032",
    ]

    def execute(sql, _params):
        if "select 1 from classes" in sql:
            return {"owned": True}
        if "select id from students" in sql:
            return [{"id": value} for value in student_ids]
        if "insert into class_students" in sql:
            return [{"student_id": value, "inserted": True} for value in student_ids]
        return None

    db = FakeDB(execute)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.post(
        "/api/classes/550e8400-e29b-41d4-a716-446655440030/students/bulk",
        headers=auth_headers(),
        json={"student_ids": student_ids},
    )
    assert result.status_code == 200
    assert result.json["data"]["enrolled"] == 2
    assert result.json["data"]["failed"] == []


def test_monthly_fee_toggle_updates_all_student_rows(client, monkeypatch):
    db = FakeDB(
        lambda sql, _params: (
            [{"id": "fee-1"}, {"id": "fee-2"}] if "update fee_records" in sql else None
        )
    )
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.put(
        "/api/students/550e8400-e29b-41d4-a716-446655440031/fees/2026-07",
        headers=auth_headers(),
        json={"status": "Paid"},
    )
    assert result.status_code == 200
    assert result.json["data"]["updated"] == 2


def test_fee_ensure_is_idempotent_insert(client, monkeypatch):
    db = FakeDB(lambda sql, _params: [] if "insert into fee_records" in sql else None)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.post(
        "/api/fees/ensure", headers=auth_headers(), json={"month": "2026-07"}
    )
    insert = next(
        sql.lower()
        for sql, _params in db.calls
        if "insert into fee_records" in sql.lower()
    )
    assert result.status_code == 200
    assert "on conflict(student_id,class_id,month) do nothing" in insert


def test_fee_ledger_returns_one_row_per_student(client, monkeypatch):
    ledger = [
        {
            "student_id": "student-1",
            "student_code": "STU001",
            "full_name": "Enus Caleb",
            "grade": "Grade 11",
            "class_count": 2,
            "combined_amount": "5500.00",
            "payment_status": "Unpaid",
            "fees": [],
        }
    ]
    db = FakeDB(lambda sql, _params: ledger if "json_agg" in sql else None)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.get("/api/fees/ledger?month=2026-07", headers=auth_headers())
    assert result.status_code == 200
    assert len(result.json["data"]) == 1
    assert result.json["data"][0]["combined_amount"] == "5500.00"
