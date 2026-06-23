"""Tests for app.middleware.request_limits — JSON depth check and body size."""

from app.middleware.request_limits import (
    DEFAULT_MAX_BODY_SIZE,
    DEFAULT_MAX_FILE_UPLOAD_SIZE,
    DEFAULT_MAX_JSON_DEPTH,
    MaxBodySize,
    check_json_depth,
)


class TestCheckJsonDepth:
    def test_flat_dict(self):
        assert check_json_depth({"a": 1, "b": 2}) is True

    def test_flat_list(self):
        assert check_json_depth([1, 2, 3]) is True

    def test_scalar(self):
        assert check_json_depth("hello") is True
        assert check_json_depth(42) is True
        assert check_json_depth(None) is True

    def test_nested_within_limit(self):
        obj = {"a": {"b": {"c": "d"}}}
        assert check_json_depth(obj, max_depth=5) is True

    def test_exceeds_depth(self):
        # Build a deeply nested dict
        obj = "leaf"
        for _ in range(15):
            obj = {"nested": obj}
        assert check_json_depth(obj, max_depth=10) is False

    def test_list_nesting(self):
        obj = [[[[[["deep"]]]]]]
        assert check_json_depth(obj, max_depth=3) is False
        assert check_json_depth(obj, max_depth=10) is True

    def test_mixed_nesting(self):
        obj = {"a": [{"b": [{"c": "val"}]}]}
        assert check_json_depth(obj, max_depth=10) is True
        assert check_json_depth(obj, max_depth=2) is False

    def test_empty_structures(self):
        assert check_json_depth({}) is True
        assert check_json_depth([]) is True

    def test_exact_limit(self):
        obj = {"a": {"b": "c"}}
        assert check_json_depth(obj, max_depth=2) is True
        assert check_json_depth(obj, max_depth=1) is False


class TestConstants:
    def test_defaults(self):
        assert DEFAULT_MAX_BODY_SIZE == 1_048_576
        assert DEFAULT_MAX_FILE_UPLOAD_SIZE == 10_485_760
        assert DEFAULT_MAX_JSON_DEPTH == 10


class TestMaxBodySizeDecorator:
    def test_creates_decorator(self):
        decorator = MaxBodySize(5 * 1024 * 1024)
        assert callable(decorator)

    def test_wraps_function(self):
        @MaxBodySize(1024)
        async def my_endpoint():
            pass

        assert hasattr(my_endpoint, "_max_body_size")
        assert my_endpoint._max_body_size == 1024
