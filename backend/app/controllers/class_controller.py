from flask import request, g
from app.services.class_service import ClassService
from app.utils.response_utils import success_response, error_response, validation_error_response


class ClassController:
    @staticmethod
    def list_classes():
        classes = ClassService.get_classes(g.current_user["id"])
        return success_response("Classes retrieved", {"classes": classes})

    @staticmethod
    def get_class(class_id):
        data, message, error = ClassService.get_class(class_id, g.current_user["id"])
        if error:
            return error_response(message, error, 404)
        return success_response("Class retrieved", data)

    @staticmethod
    def create_class():
        data, message, error, errors = ClassService.create_class(g.current_user["id"], request.get_json() or {})
        if error == "VALIDATION_ERROR":
            return validation_error_response(errors)
        if error:
            return error_response(message, error, 400)
        return success_response(message, data, 201)

    @staticmethod
    def update_class(class_id):
        data, message, error, errors = ClassService.update_class(
            class_id, g.current_user["id"], request.get_json() or {},
        )
        if error == "VALIDATION_ERROR":
            return validation_error_response(errors)
        if error:
            return error_response(message, error, 404)
        return success_response(message, data)

    @staticmethod
    def delete_class(class_id):
        _, message, error = ClassService.delete_class(class_id, g.current_user["id"])
        if error:
            return error_response(message, error, 404)
        return success_response(message)

    @staticmethod
    def create_enrollment():
        data = request.get_json() or {}
        result, message, error = ClassService.create_enrollment(
            g.current_user["id"], data.get("student_id"), data.get("class_id"),
        )
        if error:
            return error_response(message, error, 400)
        return success_response(message, result, 201)
