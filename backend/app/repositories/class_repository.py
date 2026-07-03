from app.repositories.base_repository import BaseRepository


class ClassRepository(BaseRepository):
    @staticmethod
    def find_all_by_tutor(tutor_id):
        return BaseRepository.execute_query(
            """SELECT * FROM classes
               WHERE tutor_id = %s AND is_active = true AND deleted_at IS NULL
               ORDER BY class_name""",
            (tutor_id,),
            fetchall=True,
        )

    @staticmethod
    def find_by_id(class_id, tutor_id=None):
        query = "SELECT * FROM classes WHERE id = %s AND is_active = true AND deleted_at IS NULL"
        params = [class_id]
        if tutor_id:
            query += " AND tutor_id = %s"
            params.append(tutor_id)
        return BaseRepository.execute_query(query, tuple(params), fetchone=True)

    @staticmethod
    def create(tutor_id, subject, class_name, schedule_day, start_time, end_time, fee_amount):
        return BaseRepository.execute_returning(
            """INSERT INTO classes (tutor_id, subject, class_name, schedule_day, start_time, end_time, fee_amount)
               VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
            (tutor_id, subject, class_name, schedule_day, start_time, end_time, fee_amount),
        )

    @staticmethod
    def update(class_id, tutor_id, fields):
        set_clause = ", ".join(f"{k} = %s" for k in fields)
        params = list(fields.values()) + [class_id, tutor_id]
        return BaseRepository.execute_returning(
            f"""UPDATE classes SET {set_clause}, updated_at = NOW()
                WHERE id = %s AND tutor_id = %s AND deleted_at IS NULL RETURNING *""",
            tuple(params),
        )

    @staticmethod
    def soft_delete(class_id, tutor_id):
        BaseRepository.execute_query(
            """UPDATE classes SET is_active = false, deleted_at = NOW(), updated_at = NOW()
               WHERE id = %s AND tutor_id = %s""",
            (class_id, tutor_id),
        )

    @staticmethod
    def get_students_in_class(class_id, tutor_id):
        return BaseRepository.execute_query(
            """SELECT s.* FROM students s
               JOIN class_enrollments ce ON ce.student_id = s.id
               WHERE ce.class_id = %s AND ce.tutor_id = %s AND ce.deleted_at IS NULL
               AND s.is_active = true AND s.deleted_at IS NULL""",
            (class_id, tutor_id),
            fetchall=True,
        )
