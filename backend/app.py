import os
from datetime import datetime, timezone

import psycopg
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from psycopg.rows import dict_row

load_dotenv()
app = Flask(__name__)
CORS(app, origins=os.getenv("CORS_ORIGINS", "").split(","))


def database():
    return psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row)


@app.get("/health")
def health():
    return jsonify({"success": True, "data": {"service": "TuitionLedger API", "time": datetime.now(timezone.utc).isoformat()}})


@app.get("/api/classes")
def list_classes():
    with database() as connection:
        rows = connection.execute("""
            select id, grade, subject, name, day_of_week, start_time, end_time, monthly_fee
            from classes where archived_at is null order by name
        """).fetchall()
    return jsonify({"success": True, "data": [dict(row) for row in rows]})


@app.post("/api/classes")
def create_class():
    data = request.get_json(silent=True) or {}
    required = ["grade", "subject", "name", "day_of_week", "start_time", "end_time", "monthly_fee"]
    missing = [field for field in required if not str(data.get(field, "")).strip()]
    if missing:
        return jsonify({"success": False, "message": f"Missing: {', '.join(missing)}"}), 422
    with database() as connection:
        row = connection.execute("""
            insert into classes(grade, subject, name, day_of_week, start_time, end_time, monthly_fee)
            values (%s,%s,%s,%s,%s,%s,%s)
            returning id, grade, subject, name, day_of_week, start_time, end_time, monthly_fee
        """, tuple(data[field] for field in required)).fetchone()
        connection.commit()
    return jsonify({"success": True, "data": dict(row)}), 201


@app.errorhandler(Exception)
def handle_error(error):
    app.logger.exception("Unhandled API error", exc_info=error)
    return jsonify({"success": False, "message": "Something went wrong. Try again."}), 500


if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", "8000")), debug=True)
