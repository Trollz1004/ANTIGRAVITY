"""Tests for the Link Forge channel-specific link generation service."""

import pytest

from app.link_forge import CHANNEL_BUILDERS, forge_link, ForgedLink


class TestLinkForgeService:
    def test_supports_all_target_channels(self):
        assert set(CHANNEL_BUILDERS.keys()) == {
            "youtube", "x", "facebook", "threads", "blog"
        }

    def test_each_channel_produces_forged_link(self):
        for channel in CHANNEL_BUILDERS:
            link = forge_link(channel, "test_ref_123")
            assert isinstance(link, ForgedLink)
            assert link.channel == channel
            assert "test_ref_123" in link.destination_url
            assert link.purpose
            assert link.presentation_copy

    def test_channel_sets_correct_utm_source(self):
        assert forge_link("youtube", "r1").utm_source == "youtube"
        assert forge_link("x", "r2").utm_source == "x"
        assert forge_link("facebook", "r3").utm_source == "facebook"
        assert forge_link("threads", "r4").utm_source == "threads"
        assert forge_link("blog", "r5").utm_source == "blog"

    def test_youtube_medium_is_video_description(self):
        link = forge_link("youtube", "yt1")
        assert link.utm_medium == "video-description"

    def test_blog_medium_is_referral_post(self):
        link = forge_link("blog", "b1")
        assert link.utm_medium == "referral-post"

    def test_ref_id_appears_in_url(self):
        link = forge_link("x", "mycustomref")
        assert "mycustomref" in link.destination_url

    def test_custom_campaign_overrides_default(self):
        link = forge_link("facebook", "r1", campaign="spring-launch")
        assert "spring-launch" in link.destination_url

    def test_unsupported_channel_raises_value_error(self):
        with pytest.raises(ValueError, match="Unsupported channel"):
            forge_link("tiktok", "r1")

    def test_youtube_presentation_copy_includes_url(self):
        link = forge_link("youtube", "yt1")
        assert link.destination_url in link.presentation_copy

    def test_all_channels_have_unique_presentation_copy(self):
        copies = set()
        for channel in CHANNEL_BUILDERS:
            link = forge_link(channel, "unique_test")
            copies.add(link.presentation_copy[:30])
        assert len(copies) == len(CHANNEL_BUILDERS)

    def test_forged_link_is_dataclass(self):
        link = forge_link("blog", "test")
        assert hasattr(link, "channel")
        assert hasattr(link, "destination_url")
        assert hasattr(link, "utm_source")
        assert hasattr(link, "utm_medium")
        assert hasattr(link, "utm_campaign")
        assert hasattr(link, "utm_term")
        assert hasattr(link, "utm_content")
        assert hasattr(link, "purpose")
        assert hasattr(link, "presentation_copy")
