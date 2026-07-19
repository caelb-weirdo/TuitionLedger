from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo


COLOMBO = ZoneInfo("Asia/Colombo")
DAYS = ("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
NAMED_REASONS = {"Rescheduled class", "Replacement class", "Special class"}


def _time(value):
    if isinstance(value, time):
        return value.replace(tzinfo=None)
    return time.fromisoformat(str(value))


def _postgres_day(value):
    return (value.weekday() + 1) % 7


def _display_time(value):
    value = _time(value)
    hour = value.hour % 12 or 12
    return f"{hour}:{value.minute:02d} {'AM' if value.hour < 12 else 'PM'}"


def schedule_window(class_row, now=None):
    local_now = (now or datetime.now(timezone.utc)).astimezone(COLOMBO)
    class_day = int(class_row["day"])
    days_ahead = (class_day - _postgres_day(local_now.date())) % 7
    scheduled_date = local_now.date() + timedelta(days=days_ahead)
    if days_ahead == 0 and local_now.time().replace(tzinfo=None) > _time(class_row["end_time"]):
        scheduled_date += timedelta(days=7)
    start_local = datetime.combine(scheduled_date, _time(class_row["start_time"]), COLOMBO)
    end_local = datetime.combine(scheduled_date, _time(class_row["end_time"]), COLOMBO)
    current_date_start = datetime.combine(local_now.date(), _time(class_row["start_time"]), COLOMBO)
    current_date_end = datetime.combine(local_now.date(), _time(class_row["end_time"]), COLOMBO)
    is_class_day = _postgres_day(local_now.date()) == class_day
    allowed_from_local = current_date_start - timedelta(minutes=30)
    available = is_class_day and allowed_from_local <= local_now <= current_date_end
    if available:
        start_local, end_local = current_date_start, current_date_end
    return {
        "available_now": available,
        "attendance_date": local_now.date().isoformat(),
        "class_schedule": f"{DAYS[class_day]}, {_display_time(class_row['start_time'])}–{_display_time(class_row['end_time'])}",
        "allowed_from": (start_local - timedelta(minutes=30)).isoformat(),
        "allowed_until": end_local.isoformat(),
        "scheduled_start_at": start_local.astimezone(timezone.utc),
        "scheduled_end_at": end_local.astimezone(timezone.utc),
        "extra_session_allowed": True,
    }


def validate_override(is_extra, choice, other_reason):
    if not is_extra:
        return None
    choice = str(choice or "").strip()
    if choice in NAMED_REASONS:
        return choice
    if choice != "Other":
        raise ValueError("Choose a valid extra-session reason.")
    reason = str(other_reason or "").strip()
    if not 3 <= len(reason) <= 300:
        raise ValueError("Other reason must be between 3 and 300 characters.")
    return reason


def session_expiry(now, duration_minutes, window, is_extra):
    utc_now = now.astimezone(timezone.utc).replace(microsecond=0)
    requested = utc_now + timedelta(minutes=duration_minutes)
    return requested if is_extra else min(requested, window["scheduled_end_at"])
