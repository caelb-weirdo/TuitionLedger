import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
    JWT_EXPIRY_HOURS = 24
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL", "")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")

    ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        FRONTEND_URL,
        "https://tuitionledger.netlify.app",
    ]

    DEFAULT_WHATSAPP_TEMPLATE = (
        "Dear Parent, this is a reminder that {student_name}'s tuition class fee "
        "for {month} is still pending. Please complete the payment as soon as possible. Thank you."
    )
