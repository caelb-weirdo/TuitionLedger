from app.repositories.base_repository import BaseRepository


class StudentRepository(BaseRepository):
    @staticmethod
    def find_all_by_tutor(tutor_id, search=None, class_id=None, page=1, limit=50):
        offset = (page - 1) * limit
        params = [tutor_id]
        where = "s.tutor_id = %s AND s.is_active = true AND s.deleted_at IS NULL"
        if search:
            where += " AND (s.full_name ILIKE %s OR s.student_code ILIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])
        if class_id:
            where += " AND EXISTS (SELECT 1 FROM class_enrollments ce WHERE ce.student_id = s.id AND ce.class_id = %s AND ce.deleted_at IS NULL)"
            params.append(class_id)

        count = BaseRepository.execute_query(
            f"SELECT COUNT(*) as total FROM students s WHERE {where}",
            tuple(params),
            fetchone=True,
        )

        params.extend([limit, offset])
        rows = BaseRepository.execute_query(
            f"""SELECT s.*, u.email, u.username
                FROM students s JOIN app_users u ON s.user_id = u.id
                WHERE {where} ORDER BY s.full_name LIMIT %s OFFSET %s""",
            tuple(params),
            fetchall=True,
        )
        return rows, count["total"]

    @staticmethod
    def find_by_id(student_id, tutor_id=None):
        query = """SELECT s.*, u.email, u.username FROM students s
                   JOIN app_users u ON s.user_id = u.id
                   WHERE s.id = %s AND s.is_active = true AND s.deleted_at IS NULL"""
        params = [student_id]
        if tutor_id:
            query += " AND s.tutor_id = %s"
            params.append(tutor_id)
        return BaseRepository.execute_query(query, tuple(params), fetchone=True)

    @staticmethod
    def find_by_user_id(user_id):
        return BaseRepository.execute_query(
            """SELECT s.* FROM students s
               WHERE s.user_id = %s AND s.is_active = true AND s.deleted_at IS NULL""",
            (user_id,),
            fetchone=True,
        )

    @staticmethod
    def create(tutor_id, user_id, student_code, full_name, parent_name, parent_phone_local,
               parent_phone_whatsapp, parent_email, address, notes):
        return BaseRepository.execute_returning(
            """INSERT INTO students (tutor_id, user_id, student_code, full_name, parent_name,
               parent_phone_local, parent_phone_whatsapp, parent_email, address, notes)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
            (tutor_id, user_id, student_code, full_name, parent_name, parent_phone_local,
             parent_phone_whatsapp, parent_email, address, notes),
        )

    @staticmethod
    def update(student_id, tutor_id, fields):
        set_clause = ", ".join(f"{k} = %s" for k in fields)
        params = list(fields.values()) + [student_id, tutor_id]
        return BaseRepository.execute_returning(
            f"""UPDATE students SET {set_clause}, updated_at = NOW()
                WHERE id = %s AND tutor_id = %s AND deleted_at IS NULL RETURNING *""",
            tuple(params),
        )

    @staticmethod
    def soft_delete(student_id, tutor_id):
        BaseRepository.execute_query(
            """UPDATE students SET is_active = false, deleted_at = NOW(), updated_at = NOW()
               WHERE id = %s AND tutor_id = %s""",
            (student_id, tutor_id),
        )

    @staticmethod
    def count_by_tutor(tutor_id):
        result = BaseRepository.execute_query(
            """SELECT COUNT(*) as total FROM students
               WHERE tutor_id = %s AND is_active = true AND deleted_at IS NULL""",
            (tutor_id,),
            fetchone=True,
        )
        return result["total"]

    @staticmethod
    def get_enrolled_classes(student_id):
        return BaseRepository.execute_query(
            """SELECT c.* FROM classes c
               JOIN class_enrollments ce ON ce.class_id = c.id
               WHERE ce.student_id = %s AND ce.deleted_at IS NULL AND c.deleted_at IS NULL""",
            (student_id,),
            fetchall=True,
        )
