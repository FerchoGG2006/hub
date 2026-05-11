from typing import Any, Optional

def success_response(data: Any, message: str = "Success", meta: Optional[dict] = None):
    return {
        "success": True,
        "message": message,
        "data": data,
        "meta": meta or {}
    }

def error_response(message: str = "Internal server error", code: str = "SERVER_ERROR", status_code: int = 500):
    return {
        "success": False,
        "message": message,
        "code": code
    }
