from app.repositories.base_repository import BaseRepository


class ReminderRepository(BaseRepository):
    @staticmethod
    def create(tutor_id, student_id, fee_payment_id, parent_phone_local, parent_phone_whatsapp,
               reminder_type, message, created_by):
        return BaseRepository.execute_returning(
            """INSERT INTO reminders
               (tutor_id, student_id, fee_payment_id, parent_phone_local, parent_phone_whatsapp,
                reminder_type, message, created_by)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
            (tutor_id, student_id, fee_payment_id, parent_phone_local, parent_phone_whatsapp,
             reminder_type, message, created_by),
        )

    @staticmethod
    def confirm(reminder_id, tutor_id):
        return BaseRepository.execute_returning(
            """UPDATE reminders SET status = 'confirmed_sent', confirmed_at = NOW(), updated_at = NOW()
               WHERE id = %s AND tutor_id = %s RETURNING *""",
            (reminder_id, tutor_id),
        )

    @staticmethod
    def get_history(tutor_id, student_id=None, reminder_type=None, status=None,
                    month=None, year=None, page=1, limit=50):
        offset = (page - 1) * limit
        where = "r.tutor_id = %s AND r.deleted_at IS NULL"
        params = [tutor_id]
        if student_id:
            where += " AND r.student_id = %s"
            params.append(student_id)
        if reminder_type:
            where += " AND r.reminder_type = %s"
            params.append(reminder_type)
        if status:
            where += " AND r.status = %s"
            params.append(status)
        if month and year:
            where += " AND EXTRACT(MONTH FROM r.created_at) = %s AND EXTRACT(YEAR FROM r.created_at) = %s"
            params.extend([month, year])

        count = BaseRepository.execute_query(
            f"SELECT COUNT(*) as total FROM reminders r WHERE {where}",
            tuple(params),
            fetchone=True,
        )

        params.extend([limit, offset])
        rows = BaseRepository.execute_query(
            f"""SELECT r.*, s.full_name as student_name
                FROM reminders r JOIN students s ON s.id = r.student_id
                WHERE {where} ORDER BY r.created_at DESC LIMIT %s OFFSET %s""",
            tuple(params),
            fetchall=True,
        )
        return rows, count["total"]
