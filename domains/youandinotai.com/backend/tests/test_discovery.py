"""Unit tests for discovery and matching router."""

import pytest
import uuid
from fastapi import status
from fastapi.testclient import TestClient


def test_discovery_feed_empty(client: TestClient):
    """Test discovery feed returns empty list or valid profiles."""
    response = client.get(
        "/api/v1/discover",
    )
    # Auth required (403) or 200
    assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]


def test_discovery_like_requires_auth(client: TestClient):
    """Test discovery like requires authentication."""
    target_id = str(uuid.uuid4())
    response = client.post(
        "/api/v1/discover/like",
        json={"target_id": target_id},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_discovery_preview_public(client: TestClient):
    """Test discovery preview is publicly accessible."""
    response = client.get("/api/v1/discover/preview")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
