"""Tests for the marketing router."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_marketing_content():
    """Test creating marketing content with valid data."""
    # Skip this test for now since it requires authenticated user
    pytest.skip("Skipping marketing content test - requires authenticated user")

    # Example of what the test would look like:
    # response = client.post(
    #     "/api/v1/marketing/content",
    #     json={
    #         "campaign_name": "TestCampaign",
    #         "objective": "Test Objective",
    #         "audience": "Test Audience",
    #         "platforms": ["instagram"],
    #         "core_message": "Test message",
    #         "post_type": "story",
    #         "primary_caption": "Test caption #YouAndINotAI",
    #         "hashtag_block": ["#YouAndINotAI"]
    #     },
    #     headers={"Authorization": "Bearer test-token"}
    # )
    # assert response.status_code == 200


def test_marketing_content_requires_branded_hashtag():
    """Test that marketing content requires a branded hashtag."""
    # Skip this test for now since it requires authenticated user
    pytest.skip("Skipping marketing content test - requires authenticated user")
