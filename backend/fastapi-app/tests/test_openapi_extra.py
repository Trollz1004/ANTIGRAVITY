"""Tests for app.openapi_extra — OpenAPI metadata, tags, and custom Swagger UI."""

from app.openapi_extra import (
    API_DESCRIPTION,
    CONTACT_INFO,
    LICENSE_INFO,
    SERVERS,
    TAGS_METADATA,
    get_custom_swagger_html,
)


class TestTagsMetadata:
    def test_is_list(self):
        assert isinstance(TAGS_METADATA, list)
        assert len(TAGS_METADATA) > 0

    def test_each_tag_has_name(self):
        for tag in TAGS_METADATA:
            assert "name" in tag
            assert isinstance(tag["name"], str)

    def test_each_tag_has_description(self):
        for tag in TAGS_METADATA:
            assert "description" in tag


class TestApiDescription:
    def test_non_empty(self):
        assert isinstance(API_DESCRIPTION, str)
        assert len(API_DESCRIPTION) > 100  # should be a substantial description

    def test_mentions_youandinotai(self):
        assert "YouAndINotAI" in API_DESCRIPTION or "youandinotai" in API_DESCRIPTION.lower()


class TestContactInfo:
    def test_has_keys(self):
        assert "name" in CONTACT_INFO
        assert isinstance(CONTACT_INFO["name"], str)


class TestLicenseInfo:
    def test_has_name(self):
        assert "name" in LICENSE_INFO
        assert isinstance(LICENSE_INFO["name"], str)


class TestServers:
    def test_is_list(self):
        assert isinstance(SERVERS, list)
        assert len(SERVERS) > 0

    def test_each_has_url(self):
        for server in SERVERS:
            assert "url" in server


class TestGetCustomSwaggerHtml:
    def test_returns_html(self):
        html = get_custom_swagger_html()
        assert isinstance(html, str)
        assert "<html" in html.lower() or "<!doctype" in html.lower() or "swagger" in html.lower()

    def test_non_empty(self):
        assert len(get_custom_swagger_html()) > 100
