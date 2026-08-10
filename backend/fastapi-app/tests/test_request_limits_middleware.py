"""Unit coverage for request size and JSON depth limiting middleware."""

import json

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from app.middleware.request_limits import (
    DEFAULT_MAX_JSON_DEPTH,
    JsonDepthLimitMiddleware,
    MaxBodySize,
    RequestSizeLimitMiddleware,
    check_json_depth,
)


def _nested(depth: int) -> dict:
    node: dict = {"leaf": True}
    for _ in range(depth):
        node = {"child": node}
    return node


def test_check_json_depth_accepts_shallow_structures():
    assert check_json_depth({"a": 1}) is True
    assert check_json_depth([1, 2, [3, [4]]]) is True
    assert check_json_depth("scalar") is True
    assert check_json_depth(_nested(DEFAULT_MAX_JSON_DEPTH - 1)) is True


def test_check_json_depth_rejects_deep_dicts_and_lists():
    assert check_json_depth(_nested(DEFAULT_MAX_JSON_DEPTH + 5)) is False

    deep_list: list = [1]
    for _ in range(DEFAULT_MAX_JSON_DEPTH + 5):
        deep_list = [deep_list]
    assert check_json_depth(deep_list) is False


def test_check_json_depth_honours_custom_limit():
    assert check_json_depth(_nested(3), max_depth=2) is False
    assert check_json_depth(_nested(3), max_depth=10) is True


@pytest.fixture()
def size_client() -> TestClient:
    app = FastAPI()
    app.add_middleware(
        RequestSizeLimitMiddleware,
        max_body_size=100,
        max_file_upload_size=1000,
        file_upload_prefixes=("/api/v1/uploads",),
    )

    @app.post("/api/v1/notes")
    async def notes(payload: dict) -> dict:
        return {"received": len(payload)}

    @app.post("/api/v1/uploads/file")
    async def upload(payload: dict) -> dict:
        return {"received": len(payload)}

    @app.get("/api/v1/notes")
    async def read_notes() -> dict:
        return {"ok": True}

    return TestClient(app)


def test_body_within_limit_is_accepted(size_client):
    response = size_client.post("/api/v1/notes", json={"a": "b"})
    assert response.status_code == 200


def test_oversized_body_is_rejected(size_client):
    response = size_client.post("/api/v1/notes", json={"a": "x" * 200})
    assert response.status_code == 413
    body = response.json()
    assert body["code"] == "PAYLOAD_TOO_LARGE"
    assert "100 bytes" in body["message"]


def test_upload_prefix_uses_larger_limit(size_client):
    response = size_client.post("/api/v1/uploads/file", json={"a": "x" * 200})
    assert response.status_code == 200


def test_upload_prefix_still_enforces_its_own_limit(size_client):
    response = size_client.post("/api/v1/uploads/file", json={"a": "x" * 2000})
    assert response.status_code == 413
    assert "1000 bytes" in response.json()["message"]


def test_get_requests_skip_size_check(size_client):
    response = size_client.get("/api/v1/notes")
    assert response.status_code == 200


def test_invalid_content_length_header_is_treated_as_zero(size_client):
    response = size_client.post(
        "/api/v1/notes",
        content=json.dumps({"a": "b"}),
        headers={"content-length": "not-a-number", "content-type": "application/json"},
    )
    assert response.status_code == 200


async def test_max_body_size_decorator_stamps_request_state():
    @MaxBodySize(4242)
    async def endpoint(request: Request) -> str:
        return "done"

    assert endpoint._max_body_size == 4242

    class _State:
        pass

    class _FakeRequest:
        def __init__(self):
            self.state = _State()

    request = _FakeRequest()
    assert await endpoint(request=request) == "done"
    assert request.state.max_body_size == 4242


async def test_max_body_size_decorator_finds_positional_request():
    @MaxBodySize(99)
    async def endpoint(request: Request) -> str:
        return "done"

    request = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/x",
            "headers": [],
            "query_string": b"",
        }
    )
    assert await endpoint(request) == "done"
    assert request.state.max_body_size == 99


async def test_max_body_size_decorator_tolerates_missing_request():
    @MaxBodySize(5)
    async def endpoint(value: int) -> int:
        return value * 2

    assert await endpoint(value=3) == 6


@pytest.fixture()
def depth_client() -> TestClient:
    app = FastAPI()
    app.add_middleware(JsonDepthLimitMiddleware, max_depth=3)

    @app.post("/api/v1/deep")
    async def deep(payload: dict) -> dict:
        return {"ok": True}

    return TestClient(app)


def test_shallow_json_passes_depth_check(depth_client):
    response = depth_client.post("/api/v1/deep", json={"a": {"b": 1}})
    assert response.status_code == 200


def test_deeply_nested_json_is_rejected(depth_client):
    response = depth_client.post("/api/v1/deep", json=_nested(8))
    assert response.status_code == 400
    body = response.json()
    assert body["code"] == "VALIDATION_ERROR"
    assert "maximum nesting depth of 3" in body["message"]


def test_malformed_json_is_left_to_fastapi(depth_client):
    response = depth_client.post(
        "/api/v1/deep",
        content=b"{not json",
        headers={"content-type": "application/json"},
    )
    assert response.status_code == 422


def test_non_json_content_type_skips_depth_check(depth_client):
    response = depth_client.post(
        "/api/v1/deep",
        content=json.dumps(_nested(8)).encode(),
        headers={"content-type": "text/plain"},
    )
    assert response.status_code == 422
