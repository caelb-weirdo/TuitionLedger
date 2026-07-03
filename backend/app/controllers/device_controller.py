from flask import request, g
from app.services.device_service import DeviceService
from app.utils.response_utils import success_response, error_response


class DeviceController:
    @staticmethod
    def request_device():
        data = request.get_json() or {}
        result, message, error = DeviceService.request_device(
            g.current_user["id"], data.get("device_token"),
            data.get("device_name"), data.get("browser_info"),
        )
        if error:
            return error_response(message, error, 400)
        return success_response(message, result, 201)

    @staticmethod
    def list_devices():
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 50))
        devices, total = DeviceService.get_devices(
            g.current_user["id"], request.args.get("status"),
            request.args.get("student_id"), page, limit,
        )
        return success_response("Devices retrieved", {"devices": devices, "page": page, "limit": limit, "total": total})

    @staticmethod
    def approve_device(device_id):
        result, message, error = DeviceService.approve_device(
            device_id, g.current_user["id"], g.current_user["id"],
        )
        if error:
            return error_response(message, error, 400)
        return success_response(message, result)

    @staticmethod
    def reject_device(device_id):
        data = request.get_json() or {}
        result, message, error = DeviceService.reject_device(
            device_id, g.current_user["id"], data.get("reason"),
        )
        if error:
            return error_response(message, error, 400)
        return success_response(message, result)

    @staticmethod
    def device_status():
        status = DeviceService.get_student_device_status(g.current_user["id"])
        return success_response("Device status retrieved", status or {"status": "none"})
