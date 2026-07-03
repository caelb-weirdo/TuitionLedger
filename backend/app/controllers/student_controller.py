from flask import request, g
from app.services.student_service import StudentService
from app.utils.response_utils import success_response, error_response, validation_error_response


class StudentController:
    @staticmethod
    def list_students():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 50))
        students, total = StudentService.get_students(
            g.current_user["id"], request.args.get("search"),
            request.args.get("class_id"), page, limit,
        )
        return success_response("Students retrieved", {"students": students, "page": page, "limit": limit, "total": total})

    @staticmethod
    def get_student(student_id):
        data, message, error = StudentService.get_student(student_id, g.current_user["id"])
        if error:
            return error_response(message, error, 404)
        return success_response("Student retrieved", data)

    @staticmethod
    def create_student():
        data, message, error, errors = StudentService.create_student(g.current_user["id"], request.get_json() or {})
        if error == "VALIDATION_ERROR":
            return validation_error_response(errors)
        if error:
            return error_response(message, error, 400)
        return success_response(message, data, 201)

    @staticmethod
    def update_student(student_id):
        data, message, error, errors = StudentService.update_student(
            student_id, g.current_user["id"], request.get_json() or {},
        )
        if error == "VALIDATION_ERROR":
            return validation_error_response(errors)
        if error:
            return error_response(message, error, 404)
        return success_response(message, data)

    @staticmethod
    def delete_student(student_id):
        _, message, error = StudentService.delete_student(student_id, g.current_user["id"])
        if error:
            return error_response(message, error, 404)
        return success_response(message)
