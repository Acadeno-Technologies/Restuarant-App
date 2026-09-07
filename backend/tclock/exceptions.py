"""
T Clock — Custom DRF Exception Handler
Ensures all server errors and DRF exceptions return structured JSON responses instead of HTML error pages.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first to get the standard response.
    response = exception_handler(exc, context)

    if response is not None:
        return response

    # Log the unhandled exception details
    logger.error(f"Unhandled Exception at {context.get('request').path if context.get('request') else 'API'}: {exc}", exc_info=True)

    # Return structured JSON response for 500 Internal Server Error
    error_name = exc.__class__.__name__
    error_detail = str(exc) or "An internal server error occurred."

    return Response(
        {
            "detail": f"Server Error ({error_name}): {error_detail}",
            "error_type": error_name,
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
