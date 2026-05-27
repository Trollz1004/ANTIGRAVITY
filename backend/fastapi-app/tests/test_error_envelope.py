"""Regression tests for the standardized error envelope.

Guards against the Python 3.11+ behavior change where ``str(member)`` on a
``str``-mixed Enum returns ``"ErrorCode.X"`` instead of the member value
``"X"``. The API contract (see ``app/error_responses.py`` docstring) requires
the machine-readable ``code`` field to be the bare value.
"""

from app.error_responses import ErrorCode, api_exception
from app.main import _status_to_error_code


def test_api_exception_code_is_bare_value_not_enum_repr():
    exc = api_exception(400, ErrorCode.BAD_REQUEST, "Cannot swipe yourself")
    assert exc.detail["code"] == "BAD_REQUEST"
    assert exc.detail["message"] == "Cannot swipe yourself"


def test_api_exception_accepts_plain_string_code():
    exc = api_exception(400, "CUSTOM_CODE", "boom")
    assert exc.detail["code"] == "CUSTOM_CODE"


def test_status_to_error_code_returns_bare_values():
    assert _status_to_error_code(404) == "NOT_FOUND"
    assert _status_to_error_code(400) == "BAD_REQUEST"
    assert _status_to_error_code(401) == "INVALID_CREDENTIALS"
    assert _status_to_error_code(999) == "INTERNAL_ERROR"


def test_no_error_code_serializes_with_enum_prefix():
    for member in ErrorCode:
        exc = api_exception(400, member, "msg")
        assert not exc.detail["code"].startswith("ErrorCode.")
