"""Tests for the /api/v1/metrics router — PII isolation surface.

Coverage targets:
  - GET /api/v1/metrics/impact        — aggregate platform metrics
  - GET /api/v1/metrics/security-audit — security audit endpoint

PII contract: NONE of the following may appear in any /metrics response:
  email, display_name, date_of_birth, password_hash, google_id,
  square_customer_id, any individual user identifier beyond aggregate counts.

Auth: X-Metrics-Key header (NOT user JWT).
"""

import asyncio
import uuid
from datetime import date, datetime, timezone

from app.models import User

# ── Helpers ──────────────────────────────────────────────────────────────────

_PII_FIELDS = {
    "email",
    "display_name",
    "date_of_birth",
    "password_hash",
    "google_id",
    "square_customer_id",
}

# JWT secret is set in conftest — the fallback key for metrics auth
_TEST_METRICS_KEY = "test-secret-that-is-at-least-32-characters-long-for-security"


def _metrics_headers(key: str = _TEST_METRICS_KEY) -> dict[str, str]:
    return {"X-Metrics-Key": key}


def _seed(*items, db_session_factory):
    async def _run():
        async with db_session_factory() as session:
            for item in items:
                session.add(item)
            await session.commit()

    asyncio.run(_run())


def _make_user(email: str = "metrics_user@example.com") -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="hashed_pw",
        display_name="Metrics User",
        date_of_birth=date(1988, 4, 20),
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


# ── Auth boundary ─────────────────────────────────────────────────────────────


def test_metrics_impact_missing_key_returns_403(client):
    resp = client.get("/api/v1/metrics/impact")
    assert resp.status_code == 403


def test_metrics_impact_wrong_key_returns_403(client):
    resp = client.get(
        "/api/v1/metrics/impact",
        headers={"X-Metrics-Key": "definitely-wrong-key"},
    )
    assert resp.status_code == 403


def test_metrics_security_audit_missing_key_returns_403(client):
    resp = client.get("/api/v1/metrics/security-audit")
    assert resp.status_code == 403


# ── Happy path ────────────────────────────────────────────────────────────────


def test_metrics_impact_happy_path(client):
    resp = client.get("/api/v1/metrics/impact", headers=_metrics_headers())
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "generated_at" in data
    assert "revenue" in data
    assert "users" in data
    assert "engagement" in data
    assert "verification" in data


def test_metrics_security_audit_happy_path(client):
    resp = client.get("/api/v1/metrics/security-audit", headers=_metrics_headers())
    assert resp.status_code == 200, resp.text


# ── PII isolation — non-negotiable ───────────────────────────────────────────


def test_metrics_impact_contains_no_pii(client, db_session_factory):
    """Core PII contract: /metrics/impact must NEVER return individual user data."""
    # Seed a real user so there's at least one row to aggregate
    user = _make_user("pii_check@example.com")
    _seed(user, db_session_factory=db_session_factory)

    resp = client.get("/api/v1/metrics/impact", headers=_metrics_headers())
    assert resp.status_code == 200, resp.text

    def _scan_for_pii(obj, path="root"):
        """Recursively walk the JSON response looking for any PII values."""
        violations = []
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k in _PII_FIELDS:
                    violations.append(f"PII key '{k}' found at {path}.{k}")
                violations.extend(_scan_for_pii(v, path=f"{path}.{k}"))
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                violations.extend(_scan_for_pii(item, path=f"{path}[{i}]"))
        elif isinstance(obj, str) and "@" in obj and "." in obj and len(obj) < 200:
            # Flag if any string value looks like an email address
            violations.append(
                f"Possible email address found at {path}: '{obj[:40]}...'"
            )
        return violations

    data = resp.json()
    violations = _scan_for_pii(data)
    assert not violations, "PII detected in /metrics/impact response:\n" + "\n".join(
        violations
    )


def test_metrics_impact_users_field_is_aggregate_only(client, db_session_factory):
    """users dict must contain only integer counts — no lists of user objects."""
    user = _make_user("aggregate_check@example.com")
    _seed(user, db_session_factory=db_session_factory)

    resp = client.get("/api/v1/metrics/impact", headers=_metrics_headers())
    assert resp.status_code == 200

    users_data = resp.json()["users"]
    # Every value in users dict must be an integer (count), not a list or dict
    for field, value in users_data.items():
        assert isinstance(value, int), (
            f"users.{field} is {type(value).__name__}, expected int (aggregate count only). "
            "Individual user data must not be returned."
        )


def test_metrics_impact_engagement_is_aggregate_only(client):
    """engagement dict must contain only integer counts."""
    resp = client.get("/api/v1/metrics/impact", headers=_metrics_headers())
    assert resp.status_code == 200

    engagement = resp.json()["engagement"]
    for field, value in engagement.items():
        assert isinstance(
            value, int
        ), f"engagement.{field} is {type(value).__name__}, expected int"


def test_metrics_impact_revenue_has_no_individual_payment_details(client):
    """Revenue block must be aggregate totals only — no per-transaction records."""
    resp = client.get("/api/v1/metrics/impact", headers=_metrics_headers())
    assert resp.status_code == 200

    revenue = resp.json()["revenue"]
    # Expected aggregate fields only
    allowed_revenue_fields = {
        "total_revenue_cents",
        "reserve_cents",
        "operating_cents",
        "reserve_percent",
    }
    actual_fields = set(revenue.keys())
    unexpected = actual_fields - allowed_revenue_fields
    assert (
        not unexpected
    ), f"Unexpected fields in revenue block (may contain PII / individual records): {unexpected}"
    # All values must be integers
    for k, v in revenue.items():
        assert isinstance(v, int), f"revenue.{k} = {v!r}, expected int"


def test_metrics_response_contains_no_user_ids(client, db_session_factory):
    """No UUID user identifiers should leak into the metrics response."""
    user = _make_user("uuid_leak_check@example.com")
    _seed(user, db_session_factory=db_session_factory)

    resp = client.get("/api/v1/metrics/impact", headers=_metrics_headers())
    assert resp.status_code == 200

    raw = resp.text
    # The seeded user's ID should NOT appear anywhere in the response
    assert (
        str(user.id) not in raw
    ), f"User UUID {user.id} leaked into /metrics/impact response"


# ── Revenue policy labels — TOS-safe ─────────────────────────────────────────


def test_metrics_response_contains_no_forbidden_revenue_labels(client):
    """Response must not contain retired revenue split labels or solicitation language."""
    forbidden_terms = [
        "don" + "ate",
        "don" + "ation",
        "solicitation",
        "tax-deductible",
        "char" + "ity_percent",
    ]
    resp = client.get("/api/v1/metrics/impact", headers=_metrics_headers())
    assert resp.status_code == 200

    raw_lower = resp.text.lower()
    for term in forbidden_terms:
        assert (
            term not in raw_lower
        ), f"Forbidden revenue label '{term}' found in /metrics/impact response"
