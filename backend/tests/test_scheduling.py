from datetime import datetime, timezone
from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))

from scheduling import COLOMBO, session_expiry, schedule_window, validate_override


CLASS = {"day": 1, "start_time": "16:00:00", "end_time": "18:00:00"}


@pytest.mark.parametrize(
    ("local_time", "allowed"),
    [
        ("2026-07-20T15:30:00+05:30", True),
        ("2026-07-20T15:29:00+05:30", False),
        ("2026-07-20T17:20:00+05:30", True),
        ("2026-07-20T18:00:00+05:30", True),
        ("2026-07-20T18:00:01+05:30", False),
        ("2026-07-21T16:00:00+05:30", False),
    ],
)
def test_normal_schedule_boundaries(local_time, allowed):
    result = schedule_window(CLASS, datetime.fromisoformat(local_time))
    assert result["available_now"] is allowed
    assert result["attendance_date"] == "2026-07-20" if allowed else result["attendance_date"]


def test_colombo_day_is_used_across_utc_midnight_boundary():
    now = datetime(2026, 7, 19, 19, 0, tzinfo=timezone.utc)
    result = schedule_window(CLASS, now)
    assert now.astimezone(COLOMBO).isoformat().startswith("2026-07-20T00:30")
    assert result["attendance_date"] == "2026-07-20"


def test_normal_expiry_is_capped_at_class_end_but_extra_is_not():
    now = datetime.fromisoformat("2026-07-20T17:55:00+05:30")
    window = schedule_window(CLASS, now)
    assert session_expiry(now, 15, window, False) == window["scheduled_end_at"]
    assert session_expiry(now, 15, window, True) == now.astimezone(timezone.utc).replace(second=0) + __import__("datetime").timedelta(minutes=15)


@pytest.mark.parametrize("choice", ["Rescheduled class", "Replacement class", "Special class"])
def test_named_extra_session_reasons_are_audited(choice):
    assert validate_override(True, choice, None) == choice


@pytest.mark.parametrize("reason", [None, "", "ab", "x" * 301])
def test_invalid_other_reason_is_rejected(reason):
    with pytest.raises(ValueError):
        validate_override(True, "Other", reason)


def test_other_reason_is_trimmed():
    assert validate_override(True, "Other", "  School event  ") == "School event"


def test_normal_session_ignores_override_reason():
    assert validate_override(False, "Special class", "unused") is None
