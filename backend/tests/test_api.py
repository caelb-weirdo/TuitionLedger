from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))
import app as api_app
import routes.attendance as attendance_route

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
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "test-key")
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
            return {
                "student_id": "student-1",
                "class_grade": "Grade 10",
                "student_grade": "Grade 10",
            }
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
    monkeypatch.setattr(attendance_route, "current_time", lambda: datetime.fromisoformat("2026-07-16T10:00:00+00:00"))
    session = {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "class_id": "550e8400-e29b-41d4-a716-446655440010",
        "attendance_date": "2026-07-16",
        "qr_token": QR_TOKEN,
    }

    def execute(sql, _params):
        if "from classes" in sql:
            return {"id": session["class_id"], "tutor_id": "tutor-1", "day": 4, "start_time": "00:00", "end_time": "23:59"}
        if "status='Active'" in sql and "attendance_sessions" in sql and "select" in sql:
            return None
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


def _scheduled_db(session=None, active=None):
    class_row = {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "tutor_id": "tutor-1",
        "day": 1,
        "start_time": "16:00",
        "end_time": "18:00",
    }

    def execute(sql, _params):
        lowered = sql.lower()
        if "from classes" in lowered:
            return class_row
        if "from attendance_sessions" in lowered and "status='active'" in lowered:
            return active
        if "insert into attendance_sessions" in lowered:
            return session or {"id": "session-1", "qr_token": QR_TOKEN, "expires_at": "2026-07-20T12:30:00+00:00"}
        return None

    return FakeDB(execute)


def test_session_outside_schedule_returns_structured_override_details(client, monkeypatch):
    monkeypatch.setattr(attendance_route, "current_time", lambda: datetime.fromisoformat("2026-07-20T09:59:00+00:00"))
    monkeypatch.setattr(api_app, "database", lambda: _scheduled_db())
    result = client.post("/api/attendance-sessions", headers=auth_headers(), json={"class_id": "550e8400-e29b-41d4-a716-446655440010", "duration_minutes": 10})
    assert result.status_code == 409
    assert result.json["code"] == "OUTSIDE_CLASS_SCHEDULE"
    assert result.json["data"]["extra_session_allowed"] is True


def test_normal_session_rejects_arbitrary_client_date(client, monkeypatch):
    monkeypatch.setattr(attendance_route, "current_time", lambda: datetime.fromisoformat("2026-07-20T10:00:00+00:00"))
    monkeypatch.setattr(api_app, "database", lambda: _scheduled_db())
    result = client.post("/api/attendance-sessions", headers=auth_headers(), json={"class_id": "550e8400-e29b-41d4-a716-446655440010", "duration_minutes": 10, "attendance_date": "2026-07-19"})
    assert result.status_code == 422


def test_extra_session_requires_audited_reason(client, monkeypatch):
    monkeypatch.setattr(attendance_route, "current_time", lambda: datetime.fromisoformat("2026-07-21T10:00:00+00:00"))
    monkeypatch.setattr(api_app, "database", lambda: _scheduled_db())
    result = client.post("/api/attendance-sessions", headers=auth_headers(), json={"class_id": "550e8400-e29b-41d4-a716-446655440010", "duration_minutes": 10, "is_extra_session": True})
    assert result.status_code == 422


def test_active_session_is_returned_instead_of_replaced(client, monkeypatch):
    active = {"id": "existing-session", "expires_at": "2026-07-20T11:00:00+00:00"}
    monkeypatch.setattr(attendance_route, "current_time", lambda: datetime.fromisoformat("2026-07-20T10:00:00+00:00"))
    monkeypatch.setattr(api_app, "database", lambda: _scheduled_db(active=active))
    result = client.post("/api/attendance-sessions", headers=auth_headers(), json={"class_id": "550e8400-e29b-41d4-a716-446655440010", "duration_minutes": 10})
    assert result.status_code == 409
    assert result.json["code"] == "ACTIVE_SESSION_EXISTS"
    assert result.json["data"]["id"] == "existing-session"


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


def test_bulk_enrollment_accepts_multiple_students(client, monkeypatch):
    student_ids = [
        "550e8400-e29b-41d4-a716-446655440031",
        "550e8400-e29b-41d4-a716-446655440032",
    ]

    def execute(sql, _params):
        if "classes" in sql:
            return {"id": "class-1", "grade": "Grade 11"}
        if "class_students" in sql:
            if "insert" in sql:
                return [{"student_id": value, "inserted": True} for value in student_ids]
            return []
        if "students" in sql:
            return [{"id": value, "grade": "Grade 11"} for value in student_ids]
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


def test_protected_requests_do_not_upsert_tutor_profiles(client, monkeypatch):
    seen = []

    def execute(sql, _params):
        seen.append(sql.lower())
        return []

    monkeypatch.setattr(api_app, "database", lambda: FakeDB(execute))
    result = client.get("/api/students", headers=auth_headers())

    assert result.status_code == 200
    assert not any("insert into tutors" in sql for sql in seen)


def test_get_tutor_creates_missing_profile_once(client, monkeypatch):
    profile = {
        "id": "tutor-1",
        "full_name": "Tutor One",
        "email": "tutor@example.com",
    }
    seen = []

    def execute(sql, _params):
        lowered = sql.lower()
        seen.append(lowered)
        if "select * from tutors" in lowered:
            return None
        if "insert into tutors" in lowered:
            return profile
        return None

    monkeypatch.setattr(api_app, "database", lambda: FakeDB(execute))
    result = client.get("/api/tutor", headers=auth_headers())

    assert result.status_code == 200
    assert result.json["data"]["id"] == "tutor-1"
    profile_inserts = [sql for sql in seen if "insert into tutors" in sql]
    assert len(profile_inserts) == 1
    assert "returning *" in profile_inserts[0]


def test_protected_route_reports_missing_auth_configuration(client, monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_PUBLISHABLE_KEY", raising=False)

    result = client.get("/api/students", headers=auth_headers())

    assert result.status_code == 503
    assert "not configured" in result.json["message"].lower()


def test_dashboard_returns_one_combined_summary(client, monkeypatch):
    summary = {
        "total_students": 12,
        "total_classes": 3,
        "pending_registrations": 2,
        "unpaid_fees": 4,
    }
    today_classes = [
        {
            "id": "class-1",
            "class_name": "Grade 11 Maths",
            "grade": "Grade 11",
            "subject": "Maths",
            "start_time": "16:00",
            "end_time": "18:00",
        }
    ]
    registrations = [
        {"full_name": "Nimal", "status": "Pending", "submitted_at": "2026-07-18"}
    ]
    unpaid = [
        {"full_name": "Kamal", "status": "Unpaid", "month": "2026-07-01"}
    ]

    def execute(sql, _params):
        lowered = sql.lower()
        if "total_students" in lowered:
            return summary
        if "extract(dow" in lowered:
            return today_classes
        if "from registration_requests" in lowered:
            return registrations
        if "from fee_records" in lowered:
            return unpaid
        return None

    monkeypatch.setattr(api_app, "database", lambda: FakeDB(execute))
    result = client.get("/api/dashboard", headers=auth_headers())

    assert result.status_code == 200
    assert result.json["data"]["total_students"] == 12
    assert result.json["data"]["today_classes"][0]["class_name"] == "Grade 11 Maths"
    assert len(result.json["data"]["recent_activity"]) == 2


def test_class_list_includes_student_count(client, monkeypatch):
    class_row = {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "class_name": "Grade 11 Maths",
        "student_count": 24,
    }
    db = FakeDB(
        lambda sql, _params: [class_row] if "count(cs.student_id)" in sql.lower() else None
    )
    monkeypatch.setattr(api_app, "database", lambda: db)

    result = client.get("/api/classes", headers=auth_headers())

    assert result.status_code == 200
    assert result.json["data"][0]["student_count"] == 24


def test_single_class_endpoint_returns_owned_class(client, monkeypatch):
    class_row = {
        "id": "550e8400-e29b-41d4-a716-446655440030",
        "class_name": "Grade 11 Maths",
        "student_count": 24,
    }
    db = FakeDB(
        lambda sql, _params: class_row if "count(cs.student_id)" in sql.lower() else None
    )
    monkeypatch.setattr(api_app, "database", lambda: db)

    result = client.get(
        "/api/classes/550e8400-e29b-41d4-a716-446655440030",
        headers=auth_headers(),
    )

    assert result.status_code == 200
    assert result.json["data"]["class_name"] == "Grade 11 Maths"


def test_single_registration_request_endpoint_returns_owned_request(client, monkeypatch):
    registration = {
        "id": REQUEST_ID,
        "full_name": "Enus Caleb",
        "status": "Pending",
    }
    db = FakeDB(
        lambda sql, _params: registration
        if "from registration_requests" in sql.lower()
        else None
    )
    monkeypatch.setattr(api_app, "database", lambda: db)

    result = client.get(
        f"/api/registration-requests/{REQUEST_ID}", headers=auth_headers()
    )

    assert result.status_code == 200
    assert result.json["data"]["full_name"] == "Enus Caleb"


def test_fee_ledger_ensures_rows_before_selecting(client, monkeypatch):
    ledger = [
        {
            "student_id": "student-1",
            "student_code": "STU001",
            "full_name": "Enus Caleb",
            "grade": "Grade 11",
            "class_count": 1,
            "combined_amount": "2500.00",
            "payment_status": "Unpaid",
            "fees": [],
        }
    ]

    def execute(sql, _params):
        lowered = sql.lower()
        if "insert into fee_records" in lowered:
            return []
        if "json_agg" in lowered:
            return ledger
        return None

    db = FakeDB(execute)
    monkeypatch.setattr(api_app, "database", lambda: db)
    result = client.get("/api/fees/ledger?month=2026-07", headers=auth_headers())

    assert result.status_code == 200
    calls = [sql.lower() for sql, _params in db.calls]
    insert_index = next(i for i, sql in enumerate(calls) if "insert into fee_records" in sql)
    select_index = next(i for i, sql in enumerate(calls) if "json_agg" in sql)
    assert insert_index < select_index


def test_registration_qr_removes_old_expired_tokens(client, monkeypatch):
    def execute(sql, _params):
        if "insert into registration_tokens" in sql:
            return {
                "id": REQUEST_ID,
                "tutor_id": "tutor-1",
                "token": "registration_token_12345678901234567890",
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=24),
            }
        return None

    db = FakeDB(execute)
    monkeypatch.setattr(api_app, "database", lambda: db)

    result = client.post("/api/registration-qr", headers=auth_headers())

    assert result.status_code == 201
    assert "delete from registration_tokens" in db.calls[0][0].lower()
    assert "interval '7 days'" in db.calls[0][0].lower()


# --- Grade-mismatch enrollment tests ---


def test_single_enroll_same_grade_succeeds(client, monkeypatch):
    def execute(sql, _params):
        if "class_grade" in sql:
            return {"class_grade": "Grade 11", "student_grade": "Grade 11"}
        if "insert into class_students" in sql:
            return {"id": "cs-1", "class_id": "class-1", "student_id": "student-1"}
        return None

    monkeypatch.setattr(api_app, "database", lambda: FakeDB(execute))
    result = client.post(
        "/api/classes/550e8400-e29b-41d4-a716-446655440030/students",
        headers=auth_headers(),
        json={"student_id": "550e8400-e29b-41d4-a716-446655440031"},
    )
    assert result.status_code == 201
    assert result.json["message"] == "Student enrolled."


def test_single_enroll_wrong_grade_returns_422(client, monkeypatch):
    def execute(sql, _params):
        if "class_grade" in sql:
            return {"class_grade": "Grade 10", "student_grade": "Grade 11"}
        return None

    monkeypatch.setattr(api_app, "database", lambda: FakeDB(execute))
    result = client.post(
        "/api/classes/550e8400-e29b-41d4-a716-446655440030/students",
        headers=auth_headers(),
        json={"student_id": "550e8400-e29b-41d4-a716-446655440031"},
    )
    assert result.status_code == 422
    assert "grade does not match" in result.json["message"].lower()
def test_single_enroll_missing_returns_404(client, monkeypatch):
    monkeypatch.setattr(
        api_app, "database", lambda: FakeDB(lambda _sql, _params: None)
    )
    result = client.post(
        "/api/classes/550e8400-e29b-41d4-a716-446655440030/students",
        headers=auth_headers(),
        json={"student_id": "550e8400-e29b-41d4-a716-446655440031"},
    )
    assert result.status_code == 404


def test_single_enroll_already_enrolled_returns_409(client, monkeypatch):
    def execute(sql, _params):
        if "class_grade" in sql:
            return {"class_grade": "Grade 11", "student_grade": "Grade 11"}
        if "insert into class_students" in sql:
            return None
        return None

    monkeypatch.setattr(api_app, "database", lambda: FakeDB(execute))
    result = client.post(
        "/api/classes/550e8400-e29b-41d4-a716-446655440030/students",
        headers=auth_headers(),
        json={"student_id": "550e8400-e29b-41d4-a716-446655440031"},
    )
    assert result.status_code == 409


def test_bulk_enroll_filters_wrong_grade_students(client, monkeypatch):
    same_id = "550e8400-e29b-41d4-a716-446655440031"
    wrong_id = "550e8400-e29b-41d4-a716-446655440032"

    def execute(sql, _params):
        if "select id,grade from classes" in sql:
            return {"id": "class-1", "grade": "Grade 10"}
        if "select id,grade from students" in sql:
            return [
                {"id": same_id, "grade": "Grade 10"},
                {"id": wrong_id, "grade": "Grade 11"},
            ]
        if "select student_id from class_students" in sql:
            return []
        if "insert into class_students" in sql:
            return [{"student_id": same_id}]
        return None

    monkeypatch.setattr(api_app, "database", lambda: FakeDB(execute))
    result = client.post(
        "/api/classes/550e8400-e29b-41d4-a716-446655440030/students/bulk",
        headers=auth_headers(),
        json={"student_ids": [same_id, wrong_id]},
    )
    assert result.status_code == 200
    assert result.json["data"]["enrolled"] == 1
    assert wrong_id in result.json["data"]["wrong_grade"]
    assert result.json["data"]["failed"] == []


def test_bulk_enroll_mixed_request(client, monkeypatch):
    same_id = "550e8400-e29b-41d4-a716-446655440031"
    wrong_id = "550e8400-e29b-41d4-a716-446655440032"
    existing_id = "550e8400-e29b-41d4-a716-446655440033"
    invalid_id = "550e8400-e29b-41d4-a716-446655440034"

    def execute(sql, _params):
        if "select id,grade from classes" in sql:
            return {"id": "class-1", "grade": "Grade 10"}
        if "select id,grade from students" in sql:
            return [
                {"id": same_id, "grade": "Grade 10"},
                {"id": wrong_id, "grade": "Grade 11"},
                {"id": existing_id, "grade": "Grade 10"},
            ]
        if "select student_id from class_students" in sql:
            return [{"student_id": existing_id}]
        if "insert into class_students" in sql:
            return [{"student_id": same_id}]
        return None

    monkeypatch.setattr(api_app, "database", lambda: FakeDB(execute))
    result = client.post(
        "/api/classes/550e8400-e29b-41d4-a716-446655440030/students/bulk",
        headers=auth_headers(),
        json={"student_ids": [same_id, wrong_id, existing_id, invalid_id]},
    )
    data = result.json["data"]
    assert data["enrolled"] == 1
    assert data["already_enrolled"] == 1
    assert wrong_id in data["wrong_grade"]
    assert invalid_id in data["failed"]


def test_attendance_scan_rejects_wrong_grade_enrollment(client, monkeypatch):
    now = datetime.now(timezone.utc) + timedelta(minutes=5)

    def execute(sql, _params):
        if "attendance_sessions" in sql:
            return {
                "id": "session-1",
                "class_id": "class-1",
                "tutor_id": "tutor-1",
                "status": "Active",
                "expires_at": now,
                "attendance_date": "2026-07-18",
            }
        if "students where browser_id" in sql:
            return {"id": "student-1"}
        if "class_students cs" in sql:
            return {
                "id": "cs-1",
                "class_grade": "Grade 10",
                "student_grade": "Grade 11",
            }
        return None

    monkeypatch.setattr(api_app, "database", lambda: FakeDB(execute))
    result = client.post(
        "/api/attendance/scan", json={"qr_token": QR_TOKEN, "browser_id": BROWSER_ID}
    )
    assert result.status_code == 403
    assert result.json["data"]["result"] == "Wrong Grade"
    assert "grade does not match" in result.json["message"].lower()
