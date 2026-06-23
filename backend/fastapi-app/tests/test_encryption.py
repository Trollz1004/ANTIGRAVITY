"""Tests for app.encryption — Fernet-based data encryption."""

import os

# Ensure encryption key is available before importing
os.environ.setdefault("ENCRYPTION_KEY", "test-encryption-key-for-ci-testing")
os.environ.setdefault("ENCRYPTION_SALT", "test-salt-for-ci")

from app.encryption import decrypt_data, encrypt_data


class TestEncryption:
    def test_round_trip(self):
        plaintext = "Hello, YouAndINotAI!"
        encrypted = encrypt_data(plaintext)
        assert encrypted != plaintext
        decrypted = decrypt_data(encrypted)
        assert decrypted == plaintext

    def test_different_inputs_different_ciphertext(self):
        a = encrypt_data("alpha")
        b = encrypt_data("bravo")
        assert a != b

    def test_same_input_different_ciphertext(self):
        # Fernet uses timestamp + random IV, so same plaintext yields different ciphertext
        a = encrypt_data("identical")
        b = encrypt_data("identical")
        assert a != b
        # But both decrypt to the same value
        assert decrypt_data(a) == decrypt_data(b) == "identical"

    def test_empty_string(self):
        encrypted = encrypt_data("")
        assert decrypt_data(encrypted) == ""

    def test_unicode_content(self):
        text = "こんにちは 🌸 ñ ü"
        assert decrypt_data(encrypt_data(text)) == text

    def test_long_content(self):
        text = "x" * 10_000
        assert decrypt_data(encrypt_data(text)) == text
