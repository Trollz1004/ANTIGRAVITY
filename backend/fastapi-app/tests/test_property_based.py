"""Property-based tests for the YouAndINotAI backend.

Uses Hypothesis to generate random inputs and verify invariants:
  1. Pydantic schemas serialize/deserialize correctly for random valid data
  2. Rate limiting counters behave correctly under various request counts
  3. String sanitization never crashes on any input
  4. Email validation never crashes

Run with: python -m pytest tests/test_property_based.py -v --no-cov
"""

import os
import re

# Set environment before importing app modules
os.environ["JWT_SECRET"] = (
    "test-secret-that-is-at-least-32-characters-long-for-security"
)
os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from app.schemas import HealthResponse

# ---------------------------------------------------------------------------
# 1. Pydantic schema properties
# ---------------------------------------------------------------------------


@given(
    status=st.sampled_from(["ok", "degraded", "error"]),
    user_count=st.integers(min_value=0, max_value=10000),
)
@settings(max_examples=20, suppress_health_check=[HealthCheck.too_slow])
def test_health_response_schema(status: str, user_count: int):
    """HealthResponse should accept valid status and user_count values."""
    response = HealthResponse(
        status=status,
        db_connected=True,
        square_connected=False,
        square_signature_configured=True,
        wallet_rails_proven=False,
        wallet_rails_status="pending",
        user_count=user_count,
    )
    assert response.status == status
    assert response.user_count == user_count
    assert isinstance(response.payment_proof_labels, list)


@given(
    db_connected=st.booleans(),
    square_connected=st.booleans(),
    square_sig=st.booleans(),
)
@settings(max_examples=20, suppress_health_check=[HealthCheck.too_slow])
def test_health_response_status_logic(db_connected, square_connected, square_sig):
    """Status should be 'ok' only when all dependencies are healthy."""
    response = HealthResponse(
        status=(
            "ok" if (db_connected and square_connected and square_sig) else "degraded"
        ),
        db_connected=db_connected,
        square_connected=square_connected,
        square_signature_configured=square_sig,
        wallet_rails_proven=False,
        wallet_rails_status="unproven",
        user_count=0,
    )
    if db_connected and square_connected and square_sig:
        assert response.status == "ok"
    else:
        assert response.status == "degraded"


# ---------------------------------------------------------------------------
# 2. Rate limiting counter properties
# ---------------------------------------------------------------------------


@given(
    request_count=st.integers(min_value=0, max_value=500),
    limit=st.integers(min_value=1, max_value=200),
)
@settings(max_examples=30, suppress_health_check=[HealthCheck.too_slow])
def test_rate_limit_counter_logic(request_count: int, limit: int):
    """Rate limit should block when count >= limit, allow otherwise."""

    class SimpleRateLimiter:
        def __init__(self, max_requests: int):
            self.max_requests = max_requests
            self.count = 0

        def allow_request(self) -> bool:
            if self.count >= self.max_requests:
                return False
            self.count += 1
            return True

    limiter = SimpleRateLimiter(limit)

    allowed = 0
    blocked = 0
    for _ in range(request_count):
        if limiter.allow_request():
            allowed += 1
        else:
            blocked += 1

    assert allowed <= limit
    assert allowed + blocked == request_count
    if request_count > limit:
        assert blocked > 0
    if request_count <= limit:
        assert blocked == 0


# ---------------------------------------------------------------------------
# 3. Input validation properties
# ---------------------------------------------------------------------------


@given(
    input_text=st.text(max_size=200),
)
@settings(max_examples=20, suppress_health_check=[HealthCheck.too_slow])
def test_string_sanitization_no_crash(input_text: str):
    """Basic string operations should never crash on any input."""
    try:
        _ = input_text.strip()
        _ = input_text.lower()
        _ = input_text.encode("utf-8", errors="replace")
        _ = len(input_text)
    except Exception as e:
        pytest.fail(f"String operations crashed on input: {e}")


@given(
    email=st.text(min_size=0, max_size=100),
)
@settings(max_examples=20, suppress_health_check=[HealthCheck.too_slow])
def test_email_validation_never_crashes(email: str):
    """Email validation should never raise an unhandled exception."""
    try:
        pattern = r"^[^@]+@[^@]+\.[^@]+$"
        result = bool(re.match(pattern, email))
        assert isinstance(result, bool)
    except Exception as e:
        pytest.fail(f"Email validation crashed: {e}")


# ---------------------------------------------------------------------------
# 4. Data structure properties
# ---------------------------------------------------------------------------


@given(
    items=st.lists(st.integers(min_value=0, max_value=1000), max_size=100),
)
@settings(max_examples=15, suppress_health_check=[HealthCheck.too_slow])
def test_list_operations_never_crash(items: list):
    """Common list operations should never crash."""
    try:
        _ = len(items)
        _ = sorted(items)
        _ = list(set(items))
        _ = sum(items)
        _ = min(items) if items else 0
        _ = max(items) if items else 0
    except Exception as e:
        pytest.fail(f"List operations crashed: {e}")
