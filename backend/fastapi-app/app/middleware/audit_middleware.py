import json
from datetime import datetime

from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.audit_log import AuditLog  # Assuming audit_log.py is in app/
from app.database import SessionLocal  # Assuming database.py is in app/


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip GET requests and static files (e.g., /static/, /docs)
        if request.method == "GET" or request.url.path.startswith(
            ("/static/", "/docs", "/redoc")
        ):
            response = await call_next(request)
            return response

        # Capture request details before processing
        user_id = request.headers.get(
            "X-User-ID", "anonymous"
        )  # Or extract from JWT/session
        ip_address = request.client.host if request.client else "unknown"
        action = request.method
        table_name = "unknown"  # Will be determined based on endpoint/model
        record_id = None  # Will be determined based on payload/path
        before_values = None  # Will be captured before DB operation

        # Read the request body *before* call_next, as it might be consumed by the endpoint
        # Need to be careful here not to block the original request processing
        _request_body = None
        try:
            if (
                request.method in ["POST", "PUT", "PATCH"]
                and request.headers.get("content-type") == "application/json"
            ):
                request_body_bytes = await request.body()
                _request_body = json.loads(request_body_bytes.decode("utf-8"))
        except json.JSONDecodeError:
            _request_body = {"error": "Could not decode JSON body"}

        # Process the request
        response = await call_next(request)

        # Capture response details after processing
        after_values = None  # Will be captured after DB operation
        if (
            response.status_code < 400
            and response.headers.get("content-type") == "application/json"
        ):
            try:
                # This is tricky: response.body() consumes the stream.
                # We need to re-read it if we want to log it, or buffer it in call_next
                # For now, we'll assume response body can be read once.
                response_body_bytes = b""
                async for chunk in response.body_iterator:
                    response_body_bytes += chunk
                response.body_iterator = AsyncIteratorWrapper(
                    [response_body_bytes]
                )  # Restore body for subsequent readers
                after_values = json.loads(response_body_bytes.decode("utf-8"))
            except json.JSONDecodeError:
                after_values = {"error": "Could not decode JSON response body"}

        db: Session = SessionLocal()
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                table_name=table_name,  # Placeholder
                record_id=record_id,  # Placeholder
                before_values=before_values,  # Placeholder
                after_values=after_values,  # Placeholder - using response body for now
                ip_address=ip_address,
                timestamp=datetime.utcnow(),
            )
            db.add(audit_log)
            db.commit()
            db.refresh(audit_log)
        except Exception as e:
            print(f"Error saving audit log: {e}")
            db.rollback()
        finally:
            db.close()

        return response


class AsyncIteratorWrapper:
    def __init__(self, obj):
        self._obj = obj

    async def __aiter__(self):
        for item in self._obj:
            yield item
