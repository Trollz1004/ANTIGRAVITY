"""Tests for app.utils — shared utility helpers."""

from unittest.mock import MagicMock

from pydantic import BaseModel

from app.utils import patch_model


class SampleUpdate(BaseModel):
    name: str | None = None
    age: int | None = None
    bio: str | None = None


class TestPatchModel:
    def test_applies_set_fields_only(self):
        db_obj = MagicMock()
        db_obj.name = "old"
        db_obj.age = 25
        db_obj.bio = "old bio"

        update = SampleUpdate.model_validate({"name": "new"})
        patch_model(db_obj, update)

        # Only name was explicitly set, so only name should change
        assert db_obj.name == "new"

    def test_explicit_fields_argument(self):
        db_obj = MagicMock()
        db_obj.name = "old"
        db_obj.age = 25

        update = SampleUpdate(name="new", age=30, bio="new bio")
        patch_model(db_obj, update, fields={"age"})

        # Only age should be patched
        assert db_obj.age == 30

    def test_skips_nonexistent_attribute(self):
        db_obj = MagicMock(spec=["name"])
        db_obj.name = "old"

        update = SampleUpdate.model_validate({"name": "new", "age": 99})
        # age doesn't exist on db_obj (using spec), but patch_model checks hasattr
        patch_model(db_obj, update)
        assert db_obj.name == "new"
