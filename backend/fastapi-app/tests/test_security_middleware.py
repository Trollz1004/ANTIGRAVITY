"""Unit coverage for the input validation and security header middleware."""

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from starlette.requests import Request

from app.security import (
    InputValidationMiddleware,
    SecurityHeadersMiddleware,
    require_auth,
)


def _build_app(*middleware) -> FastAPI:
    app = FastAPI()
    for cls in middleware:
        app.add_middleware(cls)

    @app.get("/echo")
    async def echo() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/echo")
    async def echo_post() -> dict[str, str]:
        return {"status": "ok"}

    return app


@pytest.fixture()
def validation_client() -> TestClient:
    return TestClient(_build_app(InputValidationMiddleware))


@pytest.mark.parametrize(
    "payload",
    [
        "' OR 1=1",
        "UNION SELECT",
        "<script>",
        "javascript:",
        "DROP TABLE",
        "DELETE FROM",
        "../../../",
        "%3Cscript%3E",
        "{{7*7}}",
        "${7*7}",
    ],
)
def test_suspicious_patterns_are_detected_case_insensitively(payload):
    middleware = InputValidationMiddleware(app=None)
    assert middleware._contains_suspicious_pattern(payload) is True
    assert middleware._contains_suspicious_pattern(payload.lower()) is True
    assert middleware._contains_suspicious_pattern(f"prefix {payload} suffix") is True


def test_benign_and_empty_text_is_not_suspicious():
    middleware = InputValidationMiddleware(app=None)
    assert middleware._contains_suspicious_pattern("") is False
    assert middleware._contains_suspicious_pattern("hello world") is False


def test_clean_request_passes_through(validation_client):
    response = validation_client.get("/echo", params={"q": "hello"})
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_suspicious_query_value_is_rejected(validation_client):
    with pytest.raises(HTTPException) as exc:
        validation_client.get("/echo", params={"q": "UNION SELECT password"})
    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid input detected"


def test_suspicious_query_key_is_rejected(validation_client):
    with pytest.raises(HTTPException) as exc:
        validation_client.get("/echo", params={"<script>": "1"})
    assert exc.value.status_code == 400


async def test_suspicious_path_is_rejected():
    middleware = InputValidationMiddleware(app=None)
    request = Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/api/v1/../../../etc/passwd",
            "raw_path": b"/api/v1/../../../etc/passwd",
            "query_string": b"",
            "headers": [],
            "client": ("127.0.0.1", 1234),
            "scheme": "http",
            "server": ("testserver", 80),
        }
    )

    async def call_next(_request):  # pragma: no cover - must not be reached
        raise AssertionError("request should have been rejected")

    with pytest.raises(HTTPException) as exc:
        await middleware.dispatch(request, call_next)
    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid path"


def test_suspicious_body_is_logged_but_not_blocked(validation_client, caplog):
    with caplog.at_level("WARNING", logger="youandinotai.security"):
        response = validation_client.post(
            "/echo", json={"bio": "<script>alert(1)</script>"}
        )

    assert response.status_code == 200
    assert "Suspicious pattern detected in request body" in caplog.text


def test_clean_body_passes_through(validation_client):
    response = validation_client.post("/echo", json={"bio": "just a normal bio"})
    assert response.status_code == 200


def test_oversized_content_length_is_rejected(validation_client):
    oversized = InputValidationMiddleware.MAX_CONTENT_LENGTH + 1
    with pytest.raises(HTTPException) as exc:
        validation_client.post(
            "/echo",
            content=b"{}",
            headers={
                "content-length": str(oversized),
                "content-type": "application/json",
            },
        )
    assert exc.value.status_code == 413


def test_non_numeric_content_length_is_ignored(validation_client):
    response = validation_client.request(
        "GET", "/echo", headers={"content-length": "not-a-number"}
    )
    assert response.status_code == 200


def test_security_headers_are_applied():
    client = TestClient(_build_app(SecurityHeadersMiddleware))
    headers = client.get("/echo").headers

    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["X-XSS-Protection"] == "1; mode=block"
    assert "max-age=31536000" in headers["Strict-Transport-Security"]
    assert "frame-ancestors 'none'" in headers["Content-Security-Policy"]
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert headers["Permissions-Policy"] == "geolocation=(), microphone=(), camera=()"


def test_require_auth_returns_supplied_credentials():
    sentinel = object()
    assert require_auth(sentinel) is sentinel
