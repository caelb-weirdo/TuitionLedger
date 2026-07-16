import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import app  # noqa: F401 - Vercel WSGI entrypoint
