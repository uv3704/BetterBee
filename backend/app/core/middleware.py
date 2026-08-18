"""
BetterBee — Middleware.

Request ID generation, latency tracking, and error context enrichment.
Every request gets a unique ID for end-to-end tracing through logs.
"""

import time
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

logger = structlog.get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Assigns a unique request ID to every incoming request.

    The ID is:
    - Bound to structlog context (appears in all log entries for this request)
    - Returned in the X-Request-ID response header
    - Extracted from incoming X-Request-ID header if present (for distributed tracing)
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Use existing request ID (forwarded from gateway/proxy) or generate new
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

        # Bind to structlog context for all logs during this request
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)

        # Store on request state for access in route handlers
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response


class LatencyMiddleware(BaseHTTPMiddleware):
    """Tracks request duration and logs slow requests.

    - Adds X-Response-Time header (milliseconds)
    - Logs warning for requests exceeding 2 seconds
    - Logs info for all requests with method, path, status, and duration
    """

    SLOW_REQUEST_THRESHOLD_MS = 2000

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

        log_data = {
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
        }

        if duration_ms > self.SLOW_REQUEST_THRESHOLD_MS:
            logger.warning("Slow request detected", **log_data)
        else:
            logger.info("Request completed", **log_data)

        return response


class AuthMiddleware(BaseHTTPMiddleware):
    """Extracts and verifies Clerk JWT tokens from the Authorization header.

    Attaches the verified `clerk_id` to `request.state.clerk_id`.
    If authentication fails, the request is still passed through, allowing
    optional auth routes. Protected routes will enforce authentication via the
    `get_current_user_id` dependency.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path

        # Skip verification for documented public endpoints
        if (
            path.startswith("/docs")
            or path.startswith("/redoc")
            or path.startswith("/openapi")
            or path.endswith("/health")
        ):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                from app.core.auth import verify_clerk_token

                clerk_id = await verify_clerk_token(token)
                request.state.clerk_id = clerk_id

                # Bind user context to logger
                structlog.contextvars.bind_contextvars(clerk_id=clerk_id)
            except Exception:
                # Let request pass through. Any handler requiring authentication
                # will fail with 401 via dependency injection.
                pass

        return await call_next(request)

