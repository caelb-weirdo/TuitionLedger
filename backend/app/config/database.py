import psycopg
from psycopg.rows import dict_row
from app.config.settings import Settings


def get_connection():
    if not Settings.SUPABASE_DB_URL:
        raise RuntimeError("SUPABASE_DB_URL is not configured")
    return psycopg.connect(Settings.SUPABASE_DB_URL, row_factory=dict_row)


def get_cursor(conn):
    return conn.cursor()
