from app.repositories.base_repository import BaseRepository
from app.config.settings import Settings


class SettingsRepository(BaseRepository):
    @staticmethod
    def get_by_tutor(tutor_id):
        result = BaseRepository.execute_query(
            "SELECT * FROM tutor_settings WHERE tutor_id = %s",
            (tutor_id,),
            fetchone=True,
        )
        if not result:
            return BaseRepository.execute_returning(
                """INSERT INTO tutor_settings (tutor_id, default_qr_minutes, whatsapp_template, phone_template)
                   VALUES (%s, %s, %s, %s) RETURNING *""",
                (tutor_id, 5, Settings.DEFAULT_WHATSAPP_TEMPLATE, "Call parent regarding pending fee."),
            )
        return result

    @staticmethod
    def update(tutor_id, fields):
        set_clause = ", ".join(f"{k} = %s" for k in fields)
        params = list(fields.values()) + [tutor_id]
        return BaseRepository.execute_returning(
            f"""UPDATE tutor_settings SET {set_clause}, updated_at = NOW()
                WHERE tutor_id = %s RETURNING *""",
            tuple(params),
        )
