"""Tests for app.middleware.cache_headers — cache control helpers and tier matching."""

from app.middleware.cache_headers import (
    CACHE_TIERS,
    DEFAULT_CACHE_CONTROL,
    DEFAULT_MAX_AGE,
    STATIC_ASSET_EXTENSIONS,
    _compute_etag,
    _match_cache_tier,
)


class TestMatchCacheTier:
    def test_health_no_cache(self):
        cc, age = _match_cache_tier("/api/v1/health")
        assert "no-cache" in cc
        assert age == 0

    def test_auth_no_cache(self):
        cc, age = _match_cache_tier("/api/v1/auth/login")
        assert "no-cache" in cc

    def test_profiles_private(self):
        cc, age = _match_cache_tier("/api/v1/profiles/123")
        assert "private" in cc
        assert age == 60

    def test_boards_public(self):
        cc, age = _match_cache_tier("/api/v1/boards")
        assert "public" in cc
        assert age == 300

    def test_static_long_cache(self):
        cc, age = _match_cache_tier("/static/image.png")
        assert "immutable" in cc
        assert age == 31536000

    def test_unmatched_returns_default(self):
        cc, age = _match_cache_tier("/unknown/path")
        assert cc == DEFAULT_CACHE_CONTROL
        assert age == DEFAULT_MAX_AGE

    def test_messages_short_cache(self):
        cc, age = _match_cache_tier("/api/v1/messages")
        assert "private" in cc
        assert age == 30

    def test_metrics_no_cache(self):
        cc, age = _match_cache_tier("/api/v1/metrics")
        assert "no-cache" in cc
        assert age == 0


class TestComputeEtag:
    def test_produces_quoted_string(self):
        etag = _compute_etag(b"hello world")
        assert etag.startswith('"')
        assert etag.endswith('"')

    def test_consistent(self):
        assert _compute_etag(b"data") == _compute_etag(b"data")

    def test_different_content_different_etag(self):
        assert _compute_etag(b"alpha") != _compute_etag(b"bravo")

    def test_empty_content(self):
        etag = _compute_etag(b"")
        assert len(etag) > 2


class TestCacheTiersConfig:
    def test_tiers_non_empty(self):
        assert len(CACHE_TIERS) > 0

    def test_all_tiers_are_tuples(self):
        for tier in CACHE_TIERS:
            assert len(tier) == 3
            prefix, cc, age = tier
            assert isinstance(prefix, str)
            assert isinstance(cc, str)
            assert isinstance(age, int)

    def test_static_extensions(self):
        assert ".js" in STATIC_ASSET_EXTENSIONS
        assert ".css" in STATIC_ASSET_EXTENSIONS
        assert ".png" in STATIC_ASSET_EXTENSIONS
