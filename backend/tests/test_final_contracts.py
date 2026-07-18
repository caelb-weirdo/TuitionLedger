from pathlib import Path

import pytest

import app as api_app
from test_api import BROWSER_ID, FakeDB, FakeResponse, auth_headers


@pytest.fixture
def client(monkeypatch):
    api_app.app.config.update(TESTING=True)
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "test-key")
    monkeypatch.setattr(
        api_app,
        "urlopen",
        lambda *_args, **_kwargs: FakeResponse(
            {
                "id": "550e8400-e29b-41d4-a716-446655440099",
                "email": "tutor@example.com",
                "user_metadata": {},
            }
        ),
    )
    monkeypatch.setattr(api_app, "database", lambda: FakeDB(lambda _sql, _params: None))
    return api_app.app.test_client()


def test_protected_route_rejects_missing_token(client):
    assert client.get("/api/students").status_code == 401


@pytest.mark.parametrize("duration", [0, 6, 16, "five"])
def test_session_rejects_unapproved_duration(client, duration):
    result = client.post(
        "/api/attendance-sessions",
        headers=auth_headers(),
        json={
            "class_id": "550e8400-e29b-41d4-a716-446655440010",
            "attendance_date": "2026-07-16",
            "duration_minutes": duration,
        },
    )
    assert result.status_code == 422


def test_manual_correction_requires_reason(client):
    result = client.post(
        "/api/attendance/manual",
        headers=auth_headers(),
        json={
            "session_id": "550e8400-e29b-41d4-a716-446655440011",
            "class_id": "550e8400-e29b-41d4-a716-446655440012",
            "student_id": "550e8400-e29b-41d4-a716-446655440013",
            "status": "Present",
        },
    )
    assert result.status_code == 422
    assert "reason" in result.json["message"].lower()


def test_fee_ledger_rejects_non_month_value(client):
    result = client.get(
        "/api/fees/ledger?month=July%202026", headers=auth_headers()
    )
    assert result.status_code == 422


def test_browser_request_rejects_invalid_student_code(client):
    result = client.post(
        "/api/browser-requests",
        json={
            "student_code": "student one",
            "browser_id": BROWSER_ID,
            "tutor_id": "550e8400-e29b-41d4-a716-446655440014",
        },
    )
    assert result.status_code == 422


def test_class_rejects_end_before_start(client):
    result = client.post(
        "/api/classes",
        headers=auth_headers(),
        json={
            "grade": "Grade 11",
            "subject": "Maths",
            "class_name": "Grade 11 Mathematics",
            "day": 1,
            "start_time": "18:00",
            "end_time": "16:00",
            "monthly_fee": "2000",
        },
    )
    assert result.status_code == 422


def test_archive_student_uses_update_not_delete(client, monkeypatch):
    seen = []

    def execute(sql, _params):
        seen.append(sql.lower())
        if "update students set status='archived'" in sql.lower():
            return {"id": "student"}
        return None

    monkeypatch.setattr("app.database", lambda: FakeDB(execute))
    result = client.delete(
        "/api/students/550e8400-e29b-41d4-a716-446655440015",
        headers=auth_headers(),
    )
    assert result.status_code == 200
    assert not any("delete from students" in sql for sql in seen)


def test_migration_is_non_destructive_and_contains_required_guards():
    migration = (
        (
            Path(__file__).parents[2]
            / "supabase"
            / "migrations"
            / "20260716102500_final_requirements_foundation.sql"
        )
        .read_text(encoding="utf-8")
        .lower()
    )
    assert "drop table" not in migration
    assert "create table if not exists public.browser_requests" in migration
    assert "uq_pending_registration_browser" in migration
    assert "attendance_records_manual_reason_check" in migration
    assert "to authenticated" in migration


def test_schema_and_migration_allow_fifteen_minute_sessions():
    root = Path(__file__).parents[2]
    schema = (root / "supabase" / "schema.sql").read_text(encoding="utf-8")
    migration = root / "supabase" / "migrations" / "20260718080000_allow_fifteen_minute_sessions.sql"
    assert "duration_minutesin(5,10,15)" in schema.replace(" ", "").lower()
    assert migration.exists()
    migration_text = migration.read_text(encoding="utf-8").replace(" ", "").lower()
    assert "check(duration_minutesin(5,10,15))" in migration_text


def test_unknown_api_route_keeps_http_404(client):
    result = client.get("/api/does-not-exist")
    assert result.status_code == 404
    assert result.json["success"] is False
