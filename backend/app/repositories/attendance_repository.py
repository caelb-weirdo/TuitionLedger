from app.repositories.base_repository import BaseRepository


class AttendanceRepository(BaseRepository):
    @staticmethod
    def create_session(tutor_id, class_id, session_token, start_time, expires_at, qr_minutes):
        return BaseRepository.execute_returning(
            """INSERT INTO attendance_sessions
               (tutor_id, class_id, session_token, start_time, expires_at, qr_time_limit_minutes)
               VALUES (%s,%s,%s,%s,%s,%s) RETURNING *""",
            (tutor_id, class_id, session_token, start_time, expires_at, qr_minutes),
        )

    @staticmethod
    def find_by_token(session_token):
        return BaseRepository.execute_query(
            """SELECT s.*, c.class_name, c.subject FROM attendance_sessions s
               JOIN classes c ON c.id = s.class_id
               WHERE s.session_token = %s AND s.deleted_at IS NULL""",
            (session_token,),
            fetchone=True,
        )

    @staticmethod
    def find_by_id(session_id, tutor_id=None):
        query = "SELECT * FROM attendance_sessions WHERE id = %s AND deleted_at IS NULL"
        params = [session_id]
        if tutor_id:
            query += " AND tutor_id = %s"
            params.append(tutor_id)
        return BaseRepository.execute_query(query, tuple(params), fetchone=True)

    @staticmethod
    def close_session(session_id, tutor_id):
        return BaseRepository.execute_returning(
            """UPDATE attendance_sessions SET status = 'closed', updated_at = NOW()
               WHERE id = %s AND tutor_id = %s RETURNING *""",
            (session_id, tutor_id),
        )

    @staticmethod
    def mark_attendance(tutor_id, student_id, class_id, session_id, status, method,
                        device_id=None, updated_by=None, manual_reason=None):
        return BaseRepository.execute_returning(
            """INSERT INTO attendance_records
               (tutor_id, student_id, class_id, session_id, status, method, device_id, updated_by, manual_reason)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
            (tutor_id, student_id, class_id, session_id, status, method, device_id, updated_by, manual_reason),
        )

    @staticmethod
    def find_existing(student_id, session_id):
        return BaseRepository.execute_query(
            """SELECT * FROM attendance_records
               WHERE student_id = %s AND session_id = %s AND deleted_at IS NULL""",
            (student_id, session_id),
            fetchone=True,
        )

    @staticmethod
    def update_manual(record_id, status, manual_reason, updated_by):
        return BaseRepository.execute_returning(
            """UPDATE attendance_records SET status = %s, method = 'manual',
               manual_reason = %s, updated_by = %s, updated_at = NOW()
               WHERE id = %s RETURNING *""",
            (status, manual_reason, updated_by, record_id),
        )

    @staticmethod
    def count_present_in_session(session_id):
        result = BaseRepository.execute_query(
            """SELECT COUNT(*) as total FROM attendance_records
               WHERE session_id = %s AND status IN ('present', 'late') AND deleted_at IS NULL""",
            (session_id,),
            fetchone=True,
        )
        return result["total"]

    @staticmethod
    def get_records(tutor_id, class_id=None, student_id=None, month=None, year=None,
                    status=None, page=1, limit=50):
        offset = (page - 1) * limit
        where = "ar.tutor_id = %s AND ar.deleted_at IS NULL"
        params = [tutor_id]
        if class_id:
            where += " AND ar.class_id = %s"
            params.append(class_id)
        if student_id:
            where += " AND ar.student_id = %s"
            params.append(student_id)
        if status:
            where += " AND ar.status = %s"
            params.append(status)
        if month and year:
            where += " AND EXTRACT(MONTH FROM ar.marked_at) = %s AND EXTRACT(YEAR FROM ar.marked_at) = %s"
            params.extend([month, year])

        count = BaseRepository.execute_query(
            f"SELECT COUNT(*) as total FROM attendance_records ar WHERE {where}",
            tuple(params),
            fetchone=True,
        )

        params.extend([limit, offset])
        rows = BaseRepository.execute_query(
            f"""SELECT ar.*, s.full_name as student_name, c.class_name
                FROM attendance_records ar
                JOIN students s ON s.id = ar.student_id
                JOIN classes c ON c.id = ar.class_id
                WHERE {where} ORDER BY ar.marked_at DESC LIMIT %s OFFSET %s""",
            tuple(params),
            fetchall=True,
        )
        return rows, count["total"]

    @staticmethod
    def count_today_by_status(tutor_id, status):
        result = BaseRepository.execute_query(
            """SELECT COUNT(*) as total FROM attendance_records
               WHERE tutor_id = %s AND status = %s AND deleted_at IS NULL
               AND DATE(marked_at) = CURRENT_DATE""",
            (tutor_id, status),
            fetchone=True,
        )
        return result["total"]

    @staticmethod
    def get_recent(tutor_id, limit=10):
        return BaseRepository.execute_query(
            """SELECT ar.*, s.full_name as student_name, c.class_name
               FROM attendance_records ar
               JOIN students s ON s.id = ar.student_id
               JOIN classes c ON c.id = ar.class_id
               WHERE ar.tutor_id = %s AND ar.deleted_at IS NULL
               ORDER BY ar.marked_at DESC LIMIT %s""",
            (tutor_id, limit),
            fetchall=True,
        )
