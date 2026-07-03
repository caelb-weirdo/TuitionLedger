def build_whatsapp_link(phone_whatsapp: str, message: str) -> str:
    clean_phone = phone_whatsapp.replace("+", "").replace(" ", "").replace("-", "")
    from urllib.parse import quote
    return f"https://wa.me/{clean_phone}?text={quote(message)}"


def build_tel_link(phone_local: str) -> str:
    clean = phone_local.replace(" ", "").replace("-", "")
    return f"tel:{clean}"


def apply_template_variables(template: str, variables: dict) -> str:
    result = template
    for key, value in variables.items():
        result = result.replace(f"{{{key}}}", str(value))
    return result
