import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("api")

_SLOW_MS = 500


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = (time.perf_counter() - start) * 1000
        if elapsed >= _SLOW_MS:
            logger.warning(
                "SLOW %s %s %d %.1fms",
                request.method,
                request.url.path,
                response.status_code,
                elapsed,
            )
        else:
            logger.info(
                "%s %s %d %.1fms",
                request.method,
                request.url.path,
                response.status_code,
                elapsed,
            )
        return response
