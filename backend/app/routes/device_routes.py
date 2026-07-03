from flask import Blueprint
from app.controllers.device_controller import DeviceController
from app.middleware.auth_middleware import login_required, role_required

device_bp = Blueprint("devices", __name__, url_prefix="/api/devices")


@device_bp.route("/request", methods=["POST"])
@login_required
@role_required("student")
def request_device():
    return DeviceController.request_device()


@device_bp.route("/status", methods=["GET"])
@login_required
@role_required("student")
def device_status():
    return DeviceController.device_status()


@device_bp.route("", methods=["GET"])
@login_required
@role_required("tutor")
def list_devices():
    return DeviceController.list_devices()


@device_bp.route("/<device_id>/approve", methods=["PUT"])
@login_required
@role_required("tutor")
def approve_device(device_id):
    return DeviceController.approve_device(device_id)


@device_bp.route("/<device_id>/reject", methods=["PUT"])
@login_required
@role_required("tutor")
def reject_device(device_id):
    return DeviceController.reject_device(device_id)
