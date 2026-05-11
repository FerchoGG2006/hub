from fastapi import Request
from fastapi.responses import JSONResponse
from src.shared.errors.app_error import AppError
from src.shared.utils.responses import error_response
import logging

logger = logging.getLogger("platorin")

async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(message=exc.message, code=exc.code)
        )
    
    # Log unexpected errors
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content=error_response(message="Internal server error", code="INTERNAL_SERVER_ERROR")
    )
