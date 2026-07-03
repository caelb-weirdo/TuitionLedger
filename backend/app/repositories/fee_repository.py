from app.repositories.base_repository import BaseRepository


class FeeRepository(BaseRepository):
    @staticmethod
    def create(tutor_id, student_id, class_id, month, year, amount_due, amount_paid, status, payment_date, notes):
        return BaseRepository.execute_returning(
            """INSERT INTO fee_payments
               (tutor_id, student_id, class_id, month, year, amount_due, amount_paid, status, payment_date, notes)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
            (tutor_id, student_id, class_id, month, year, amount_due, amount_paid, status, payment_date, notes),
        )

    @staticmethod
    def find_duplicate(student_id, class_id, month, year):
        return BaseRepository.execute_query(
            """SELECT id FROM fee_payments
               WHERE student_id = %s AND class_id = %s AND month = %s AND year = %s AND deleted_at IS NULL""",
            (student_id, class_id, month, year),
            fetchone=True,
        )

    @staticmethod
    def find_by_id(fee_id, tutor_id):
        return BaseRepository.execute_query(
            """SELECT fp.*, s.full_name as student_name, c.class_name
               FROM fee_payments fp
               JOIN students s ON s.id = fp.student_id
               JOIN classes c ON c.id = fp.class_id
               WHERE fp.id = %s AND fp.tutor_id = %s AND fp.deleted_at IS NULL""",
            (fee_id, tutor_id),
            fetchone=True,
        )

    @staticmethod
    def update(fee_id, tutor_id, fields):
        set_clause = ", ".join(f"{k} = %s" for k in fields)
        params = list(fields.values()) + [fee_id, tutor_id]
        return BaseRepository.execute_returning(
            f"""UPDATE fee_payments SET {set_clause}, updated_at = NOW()
                WHERE id = %s AND tutor_id = %s AND deleted_at IS NULL RETURNING *""",
            tuple(params),
        )

    @staticmethod
    def get_records(tutor_id, student_id=None, class_id=None, month=None, year=None,
                    status=None, page=1, limit=50):
        offset = (page - 1) * limit
        where = "fp.tutor_id = %s AND fp.deleted_at IS NULL"
        params = [tutor_id]
        if student_id:
            where += " AND fp.student_id = %s"
            params.append(student_id)
        if class_id:
            where += " AND fp.class_id = %s"
            params.append(class_id)
        if month:
            where += " AND fp.month = %s"
            params.append(month)
        if year:
            where += " AND fp.year = %s"
            params.append(year)
        if status:
            where += " AND fp.status = %s"
            params.append(status)

        count = BaseRepository.execute_query(
            f"SELECT COUNT(*) as total FROM fee_payments fp WHERE {where}",
            tuple(params),
            fetchone=True,
        )

        params.extend([limit, offset])
        rows = BaseRepository.execute_query(
            f"""SELECT fp.*, s.full_name as student_name, c.class_name,
                s.parent_phone_local, s.parent_phone_whatsapp
                FROM fee_payments fp
                JOIN students s ON s.id = fp.student_id
                JOIN classes c ON c.id = fp.class_id
                WHERE {where} ORDER BY fp.year DESC, fp.month DESC LIMIT %s OFFSET %s""",
            tuple(params),
            fetchall=True,
        )
        return rows, count["total"]

    @staticmethod
    def get_unpaid(tutor_id):
        return BaseRepository.execute_query(
            """SELECT fp.*, s.full_name as student_name, c.class_name,
                s.parent_phone_local, s.parent_phone_whatsapp
                FROM fee_payments fp
                JOIN students s ON s.id = fp.student_id
                JOIN classes c ON c.id = fp.class_id
                WHERE fp.tutor_id = %s AND fp.status IN ('unpaid', 'partial', 'overdue')
                AND fp.deleted_at IS NULL ORDER BY fp.status, s.full_name""",
            (tutor_id,),
            fetchall=True,
        )

    @staticmethod
    def count_by_status(tutor_id, status, month, year):
        result = BaseRepository.execute_query(
            """SELECT COUNT(*) as total FROM fee_payments
               WHERE tutor_id = %s AND status = %s AND month = %s AND year = %s AND deleted_at IS NULL""",
            (tutor_id, status, month, year),
            fetchone=True,
        )
        return result["total"]

    @staticmethod
    def get_recent(tutor_id, limit=10):
        return BaseRepository.execute_query(
            """SELECT fp.*, s.full_name as student_name, c.class_name
               FROM fee_payments fp
               JOIN students s ON s.id = fp.student_id
               JOIN classes c ON c.id = fp.class_id
               WHERE fp.tutor_id = %s AND fp.deleted_at IS NULL
               ORDER BY fp.updated_at DESC LIMIT %s""",
            (tutor_id, limit),
            fetchall=True,
        )
