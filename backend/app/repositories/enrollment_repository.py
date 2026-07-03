from app.repositories.base_repository import BaseRepository


class EnrollmentRepository(BaseRepository):
    @staticmethod
    def create(tutor_id, student_id, class_id):
        return BaseRepository.execute_returning(
            """INSERT INTO class_enrollments (tutor_id, student_id, class_id)
               VALUES (%s, %s, %s) RETURNING *""",
            (tutor_id, student_id, class_id),
        )

    @staticmethod
    def exists(student_id, class_id):
        return BaseRepository.execute_query(
            """SELECT id FROM class_enrollments
               WHERE student_id = %s AND class_id = %s AND deleted_at IS NULL""",
            (student_id, class_id),
            fetchone=True,
        )

    @staticmethod
    def is_enrolled(student_id, class_id):
        return EnrollmentRepository.exists(student_id, class_id) is not None
