from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository):
    @staticmethod
    def find_by_identifier(identifier):
        return BaseRepository.execute_query(
            """SELECT * FROM app_users
               WHERE (email = %s OR username = %s) AND is_active = true AND deleted_at IS NULL""",
            (identifier, identifier),
            fetchone=True,
        )

    @staticmethod
    def find_by_id(user_id):
        return BaseRepository.execute_query(
            """SELECT id, name, email, username, role, phone_local, phone_whatsapp, is_active, created_at
               FROM app_users WHERE id = %s AND is_active = true AND deleted_at IS NULL""",
            (user_id,),
            fetchone=True,
        )

    @staticmethod
    def create_user(name, email, username, password_hash, role):
        return BaseRepository.execute_returning(
            """INSERT INTO app_users (name, email, username, password_hash, role)
               VALUES (%s, %s, %s, %s, %s) RETURNING *""",
            (name, email, username, password_hash, role),
        )

    @staticmethod
    def soft_delete(user_id):
        BaseRepository.execute_query(
            """UPDATE app_users SET is_active = false, deleted_at = NOW(), updated_at = NOW()
               WHERE id = %s""",
            (user_id,),
        )
