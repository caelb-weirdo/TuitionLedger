from app.repositories.base_repository import BaseRepository


class DeviceRepository(BaseRepository):
    @staticmethod
    def find_by_student_and_token(student_id, device_token):
        return BaseRepository.execute_query(
            """SELECT * FROM devices
               WHERE student_id = %s AND device_token = %s AND deleted_at IS NULL
               ORDER BY created_at DESC LIMIT 1""",
            (student_id, device_token),
            fetchone=True,
        )

    @staticmethod
    def find_approved_by_student(student_id):
        return BaseRepository.execute_query(
            """SELECT * FROM devices
               WHERE student_id = %s AND status = 'approved' AND deleted_at IS NULL
               LIMIT 1""",
            (student_id,),
            fetchone=True,
        )

    @staticmethod
    def create(tutor_id, student_id, device_token, device_name, browser_info):
        return BaseRepository.execute_returning(
            """INSERT INTO devices (tutor_id, student_id, device_token, device_name, browser_info)
               VALUES (%s,%s,%s,%s,%s) RETURNING *""",
            (tutor_id, student_id, device_token, device_name, browser_info),
        )

    @staticmethod
    def find_all_by_tutor(tutor_id, status=None, student_id=None, page=1, limit=50):
        offset = (page - 1) * limit
        where = "d.tutor_id = %s AND d.deleted_at IS NULL"
        params = [tutor_id]
        if status:
            where += " AND d.status = %s"
            params.append(status)
        if student_id:
            where += " AND d.student_id = %s"
            params.append(student_id)

        count = BaseRepository.execute_query(
            f"SELECT COUNT(*) as total FROM devices d WHERE {where}",
            tuple(params),
            fetchone=True,
        )

        params.extend([limit, offset])
        rows = BaseRepository.execute_query(
            f"""SELECT d.*, s.full_name as student_name FROM devices d
                JOIN students s ON s.id = d.student_id
                WHERE {where} ORDER BY d.requested_at DESC LIMIT %s OFFSET %s""",
            tuple(params),
            fetchall=True,
        )
        return rows, count["total"]

    @staticmethod
    def find_by_id(device_id, tutor_id):
        return BaseRepository.execute_query(
            """SELECT d.*, s.full_name as student_name FROM devices d
               JOIN students s ON s.id = d.student_id
               WHERE d.id = %s AND d.tutor_id = %s AND d.deleted_at IS NULL""",
            (device_id, tutor_id),
            fetchone=True,
        )

    @staticmethod
    def approve(device_id, tutor_id, approved_by):
        return BaseRepository.execute_returning(
            """UPDATE devices SET status = 'approved', approved_at = NOW(),
               approved_by = %s, updated_at = NOW()
               WHERE id = %s AND tutor_id = %s AND status = 'pending' RETURNING *""",
            (approved_by, device_id, tutor_id),
        )

    @staticmethod
    def reject(device_id, tutor_id, reason):
        return BaseRepository.execute_returning(
            """UPDATE devices SET status = 'rejected', rejected_at = NOW(),
               rejection_reason = %s, updated_at = NOW()
               WHERE id = %s AND tutor_id = %s AND status = 'pending' RETURNING *""",
            (reason, device_id, tutor_id),
        )

    @staticmethod
    def count_pending(tutor_id):
        result = BaseRepository.execute_query(
            """SELECT COUNT(*) as total FROM devices
               WHERE tutor_id = %s AND status = 'pending' AND deleted_at IS NULL""",
            (tutor_id,),
            fetchone=True,
        )
        return result["total"]

    @staticmethod
    def reject_other_devices(student_id, approved_device_id):
        BaseRepository.execute_query(
            """UPDATE devices SET status = 'rejected', rejection_reason = 'Another device was approved',
               rejected_at = NOW(), updated_at = NOW()
               WHERE student_id = %s AND id != %s AND status IN ('pending', 'approved')""",
            (student_id, approved_device_id),
        )
