from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))
import app as api_app


class FakeResponse:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return b'{"id":"tutor-1","email":"tutor@example.com","user_metadata":{}}'


class FakeDB:
    def __init__(self):
        self.calls = []
        self.value = None

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def execute(self, sql, params=()):
        self.calls.append((sql, params))
        if "as total_students" in sql.lower():
            self.value = {
                "total_students": 14,
                "total_classes": 3,
                "pending_registrations": 0,
                "unpaid_fees": 12,
            }
        else:
            self.value = []
        return self

    def fetchone(self):
        return self.value

    def fetchall(self):
        return self.value or []


def test_dashboard_counts_unique_active_students_with_unpaid_fees(monkeypatch):
    api_app.app.config.update(TESTING=True)
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_PUBLISHABLE_KEY", "test-key")
    monkeypatch.setattr(api_app, "urlopen", lambda *_args, **_kwargs: FakeResponse())

    db = FakeDB()
    monkeypatch.setattr(api_app, "database", lambda: db)

    result = api_app.app.test_client().get(
        "/api/dashboard", headers={"Authorization": "Bearer test-token"}
    )

    summary_sql = db.calls[0][0].lower()
    assert result.status_code == 200
    assert "count(distinct f.student_id)" in summary_sql
    assert "join students s on s.id=f.student_id" in summary_sql
    assert "s.status='active'" in summary_sql
