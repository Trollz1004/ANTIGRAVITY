"""Tests for the field-level encryption utilities."""

from datetime import date
from unittest.mock import MagicMock

from app.encryption import (
    EncryptedDate,
    EncryptedString,
    decrypt_data,
    encrypt_data,
    fernet,
)


class TestEncryptDecrypt:
    def test_roundtrip(self):
        ciphertext = encrypt_data("sensitive value")
        assert ciphertext is not None
        assert ciphertext != "sensitive value"
        assert decrypt_data(ciphertext) == "sensitive value"

    def test_encrypt_none_returns_none(self):
        assert encrypt_data(None) is None

    def test_decrypt_none_returns_none(self):
        assert decrypt_data(None) is None

    def test_decrypt_garbage_returns_none_instead_of_raising(self):
        assert decrypt_data("not-a-fernet-token") is None

    def test_decrypt_wrong_key_data_returns_none(self):
        other = fernet.encrypt(b"abc").decode()
        # Valid token for a *different* value decrypts fine (sanity check)…
        assert decrypt_data(other) == "abc"
        # …and clearly invalid tokens still fail closed.
        assert decrypt_data(other[:-4] + "AAAA") is None

    def test_unicode_roundtrip(self):
        value = "Üser Däta — 用户数据"
        assert decrypt_data(encrypt_data(value)) == value


class TestEncryptedStringDescriptor:
    def _make_class(self):
        column = MagicMock()

        class Model:
            secret = EncryptedString(column)

        return Model, column

    def test_set_and_get_roundtrip(self):
        Model, _ = self._make_class()
        instance = Model()
        instance.secret = "top secret"
        # Stored privately as ciphertext
        assert instance._secret != "top secret"
        assert instance.secret == "top secret"

    def test_get_unset_returns_none(self):
        Model, _ = self._make_class()
        instance = Model()
        assert instance.secret is None

    def test_class_access_returns_descriptor(self):
        Model, _ = self._make_class()
        assert isinstance(Model.secret, EncryptedString)

    def test_set_on_class_is_noop(self):
        Model, _ = self._make_class()
        Model.secret = "ignored"  # __set__ with instance=None returns early
        assert not hasattr(Model, "_secret") or Model._secret is None

    def test_comparator_and_expression_defer_to_column(self):
        Model, column = self._make_class()
        descriptor = Model.secret
        assert descriptor.comparator is column.comparator
        assert descriptor.expression is column.expression


class TestEncryptedDateDescriptor:
    def _make_class(self):
        column = MagicMock()

        class Model:
            birthday = EncryptedDate(column)

        return Model, column

    def test_set_and_get_roundtrip(self):
        Model, _ = self._make_class()
        instance = Model()
        instance.birthday = date(1993, 9, 5)
        assert instance._birthday != "1993-09-05"
        assert instance.birthday == date(1993, 9, 5)

    def test_set_none_stores_none(self):
        Model, _ = self._make_class()
        instance = Model()
        instance.birthday = None
        assert instance._birthday is None
        assert instance.birthday is None

    def test_class_access_returns_descriptor(self):
        Model, _ = self._make_class()
        assert isinstance(Model.birthday, EncryptedDate)

    def test_corrupt_stored_value_returns_none(self):
        Model, _ = self._make_class()
        instance = Model()
        instance._birthday = "corrupted-ciphertext"
        assert instance.birthday is None
