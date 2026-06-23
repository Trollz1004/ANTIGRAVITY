"""Tests for app.feature_flags — in-memory flag store."""

from app.feature_flags import get_all_flags, get_flag, set_flag


class TestFeatureFlags:
    def test_get_flag_default(self):
        assert get_flag("nonexistent_flag_xyz") is False

    def test_get_flag_custom_default(self):
        assert get_flag("nonexistent_flag_xyz", default="hello") == "hello"

    def test_set_and_get_flag(self):
        set_flag("_test_flag_123", True)
        assert get_flag("_test_flag_123") is True
        # cleanup
        set_flag("_test_flag_123", False)

    def test_get_all_flags_returns_dict(self):
        flags = get_all_flags()
        assert isinstance(flags, dict)

    def test_get_all_flags_is_copy(self):
        flags = get_all_flags()
        flags["injected"] = True
        # Should not mutate the internal store
        assert get_flag("injected") is False

    def test_known_flags_exist(self):
        flags = get_all_flags()
        assert "lovebot_enabled" in flags
        assert "video_rooms_enabled" in flags
        assert "double_dates_enabled" in flags
        assert "volunteer_matching_enabled" in flags

    def test_set_flag_overwrite(self):
        set_flag("_overwrite_test", 1)
        set_flag("_overwrite_test", 2)
        assert get_flag("_overwrite_test") == 2
        set_flag("_overwrite_test", False)
