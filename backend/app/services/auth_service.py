from app.repositories.user_repository import UserRepository
from app.utils.password_utils import hash_password, verify_password
from app.utils.token_utils import create_token


class AuthService:
    @staticmethod
    def login(identifier, password):
        if not identifier or not password:
            return None, "Identifier and password are required", "VALIDATION_ERROR"

        user = UserRepository.find_by_identifier(identifier)
        if not user or not verify_password(password, user["password_hash"]):
            return None, "Invalid login credentials", "INVALID_CREDENTIALS"

        token = create_token(str(user["id"]), user["role"], user["name"])
        user_data = {
            "id": str(user["id"]),
            "name": user["name"],
            "role": user["role"],
            "email": user.get("email"),
            "username": user.get("username"),
        }
        return {"token": token, "user": user_data}, "Login successful", None

    @staticmethod
    def get_current_user(user_id):
        user = UserRepository.find_by_id(user_id)
        if not user:
            return None
        return {
            "id": str(user["id"]),
            "name": user["name"],
            "role": user["role"],
            "email": user.get("email"),
            "username": user.get("username"),
        }
