"""Seed database with demo data. Run from backend/: python -m database.seed"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid
from datetime import datetime, timezone, date
from werkzeug.security import generate_password_hash

from app.config.database import get_connection, get_cursor


def seed():
    conn = get_connection()
    cur = get_cursor(conn)

    cur.execute("SELECT COUNT(*) as cnt FROM app_users WHERE role = 'tutor'")
    if cur.fetchone()["cnt"] > 0:
        print("Seed data already exists. Skipping.")
        conn.close()
        return

    tutor_id = str(uuid.uuid4())
    tutor_hash = generate_password_hash("Tutor@123")

    cur.execute(
        """INSERT INTO app_users (id, name, email, username, password_hash, role, phone_local)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (tutor_id, "Mr. Silva", "tutor@tuitionledger.com", "tutor_silva", tutor_hash, "tutor", "0771111111"),
    )

    cur.execute(
        """INSERT INTO tutor_settings (tutor_id, default_qr_minutes, whatsapp_template, phone_template)
           VALUES (%s, %s, %s, %s)""",
        (
            tutor_id,
            5,
            "Dear Parent, this is a reminder that {student_name}'s tuition class fee for {month} is still pending. Please complete the payment as soon as possible. Thank you.",
            "Call parent regarding pending fee for {student_name}.",
        ),
    )

    class_ids = []
    classes_data = [
        ("ICT", "Grade 10 ICT", "Saturday", "09:00", "11:00", 1500),
        ("Mathematics", "Grade 11 Maths", "Sunday", "14:00", "16:00", 2000),
        ("Science", "Grade 9 Science", "Friday", "16:00", "18:00", 1200),
    ]
    for subject, name, day, start, end, fee in classes_data:
        cid = str(uuid.uuid4())
        class_ids.append(cid)
        cur.execute(
            """INSERT INTO classes (id, tutor_id, subject, class_name, schedule_day, start_time, end_time, fee_amount)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (cid, tutor_id, subject, name, day, start, end, fee),
        )

    students_data = [
        ("Kamal Perera", "kamal001", "kamal@student.com", "Mr. Perera", "0771234567", "94771234567"),
        ("Nimal Fernando", "nimal002", "nimal@student.com", "Mrs. Fernando", "0772345678", "94772345678"),
        ("Sithara Jayawardena", "sithara003", "sithara@student.com", "Mr. Jayawardena", "0773456789", "94773456789"),
        ("Dilshan Wickramasinghe", "dilshan004", "dilshan@student.com", "Mrs. Wickramasinghe", "0774567890", "94774567890"),
        ("Anjali Rajapaksa", "anjali005", "anjali@student.com", "Mr. Rajapaksa", "0775678901", "94775678901"),
        ("Tharindu Bandara", "tharindu006", "tharindu@student.com", "Mrs. Bandara", "0776789012", "94776789012"),
        ("Ishara Gunasekara", "ishara007", "ishara@student.com", "Mr. Gunasekara", "0777890123", "94777890123"),
        ("Ruwan Dias", "ruwan008", "ruwan@student.com", "Mrs. Dias", "0778901234", "94778901234"),
    ]

    student_hash = generate_password_hash("Student@123")
    student_ids = []

    for i, (full_name, username, email, parent, phone, wa) in enumerate(students_data):
        user_id = str(uuid.uuid4())
        student_id = str(uuid.uuid4())
        student_ids.append(student_id)
        cur.execute(
            """INSERT INTO app_users (id, name, email, username, password_hash, role)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (user_id, full_name, email, username, student_hash, "student"),
        )
        cur.execute(
            """INSERT INTO students (id, user_id, tutor_id, student_code, full_name, parent_name,
               parent_phone_local, parent_phone_whatsapp)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (student_id, user_id, tutor_id, f"STU{i+1:03d}", full_name, parent, phone, wa),
        )
        class_id = class_ids[i % len(class_ids)]
        cur.execute(
            """INSERT INTO class_enrollments (tutor_id, student_id, class_id) VALUES (%s, %s, %s)""",
            (tutor_id, student_id, class_id),
        )

    # Devices: first 5 approved, 1 pending, 1 rejected, 1 pending
    device_statuses = ["approved"] * 5 + ["pending", "rejected", "pending"]
    for i, student_id in enumerate(student_ids):
        status = device_statuses[i] if i < len(device_statuses) else "pending"
        cur.execute(
            """INSERT INTO devices (tutor_id, student_id, device_token, device_name, status,
               approved_at, rejection_reason)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (
                tutor_id,
                student_id,
                f"device-token-{i+1}",
                f"Chrome Device {i+1}",
                status,
                datetime.now(timezone.utc) if status == "approved" else None,
                "Using another device" if status == "rejected" else None,
            ),
        )

    # Fee records
    fee_statuses = ["paid", "unpaid", "partial", "overdue", "paid", "unpaid", "partial", "overdue"]
    for i, student_id in enumerate(student_ids):
        class_id = class_ids[i % len(class_ids)]
        status = fee_statuses[i]
        amount_due = 1500 if i % 3 == 0 else 2000
        amount_paid = amount_due if status == "paid" else (750 if status == "partial" else 0)
        cur.execute(
            """INSERT INTO fee_payments (tutor_id, student_id, class_id, month, year,
               amount_due, amount_paid, status, payment_date)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (tutor_id, student_id, class_id, 7, 2026, amount_due, amount_paid, status,
             date(2026, 7, 1) if status == "paid" else None),
        )

    conn.commit()
    conn.close()
    print("Seed data created successfully!")
    print("Tutor login: tutor@tuitionledger.com / Tutor@123")
    print("Student login: kamal@student.com / Student@123")


if __name__ == "__main__":
    seed()
