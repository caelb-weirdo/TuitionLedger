import secrets
from datetime import datetime, timedelta, timezone
from app.config.settings import Settings


def generate_secure_session_token() -> str:
    return secrets.token_urlsafe(32)


def generate_qr_link(session_token: str) -> str:
    base = Settings.FRONTEND_URL.rstrip("/")
    return f"{base}/mark-attendance?session_token={session_token}"


def calculate_expiry_time(minutes: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)
