from flask import Blueprint
from app.controllers.class_controller import ClassController
from app.middleware.auth_middleware import login_required, role_required

class_bp = Blueprint("classes", __name__, url_prefix="/api/classes")
enrollment_bp = Blueprint("enrollments", __name__, url_prefix="/api/enrollments")


@class_bp.route("", methods=["GET"])
@login_required
@role_required("tutor")
def list_classes():
    return ClassController.list_classes()


@class_bp.route("/<class_id>", methods=["GET"])
@login_required
@role_required("tutor")
def get_class(class_id):
    return ClassController.get_class(class_id)


@class_bp.route("", methods=["POST"])
@login_required
@role_required("tutor")
def create_class():
    return ClassController.create_class()


@class_bp.route("/<class_id>", methods=["PUT"])
@login_required
@role_required("tutor")
def update_class(class_id):
    return ClassController.update_class(class_id)


@class_bp.route("/<class_id>", methods=["DELETE"])
@login_required
@role_required("tutor")
def delete_class(class_id):
    return ClassController.delete_class(class_id)


@enrollment_bp.route("", methods=["POST"])
@login_required
@role_required("tutor")
def create_enrollment():
    return ClassController.create_enrollment()
