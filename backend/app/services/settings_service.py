from app.repositories.settings_repository import SettingsRepository


class SettingsService:
    @staticmethod
    def get_settings(tutor_id):
        settings = SettingsRepository.get_by_tutor(tutor_id)
        return {
            "default_qr_minutes": settings.get("default_qr_minutes", 5),
            "whatsapp_template": settings.get("whatsapp_template", ""),
            "phone_template": settings.get("phone_template", ""),
        }

    @staticmethod
    def update_settings(tutor_id, data):
        fields = {}
        for key in ["default_qr_minutes", "whatsapp_template", "phone_template"]:
            if key in data:
                fields[key] = data[key]
        if not fields:
            return SettingsService.get_settings(tutor_id), "No changes", None
        updated = SettingsRepository.update(tutor_id, fields)
        return {
            "default_qr_minutes": updated.get("default_qr_minutes"),
            "whatsapp_template": updated.get("whatsapp_template"),
            "phone_template": updated.get("phone_template"),
        }, "Settings updated successfully", None
