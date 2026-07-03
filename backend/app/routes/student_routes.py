from flask import Blueprint
from app.controllers.student_controller import StudentController
from app.middleware.auth_middleware import login_required, role_required

student_bp = Blueprint("students", __name__, url_prefix="/api/students")


@student_bp.route("", methods=["GET"])
@login_required
@role_required("tutor")
def list_students():
    return StudentController.list_students()


@student_bp.route("/<student_id>", methods=["GET"])
@login_required
@role_required("tutor")
def get_student(student_id):
    return StudentController.get_student(student_id)


@student_bp.route("", methods=["POST"])
@login_required
@role_required("tutor")
def create_student():
    return StudentController.create_student()


@student_bp.route("/<student_id>", methods=["PUT"])
@login_required
@role_required("tutor")
def update_student(student_id):
    return StudentController.update_student(student_id)


@student_bp.route("/<student_id>", methods=["DELETE"])
@login_required
@role_required("tutor")
def delete_student(student_id):
    return StudentController.delete_student(student_id)
