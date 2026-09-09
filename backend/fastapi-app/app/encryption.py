import logging
import os
from base64 import urlsafe_b64encode
from datetime import datetime

from cryptography.fernet import Fernet
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# This key should be loaded from a secure environment variable or KMS
# For development, you can generate one with Fernet.generate_key().decode()
# This is a placeholder and should NOT be used in production.
ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY", Fernet.generate_key().decode())
# Derive a key from the encryption key using PBKDF2 for consistent, strong keys
# This is mainly for demonstration; Fernet already handles key derivation from its key.
# However, if we were deriving from a password/passphrase, PBKDF2 is crucial.
SALT = os.environ.get("ENCRYPTION_SALT", "a_very_random_salt_for_encryption").encode()

logger = logging.getLogger(__name__)


def _derive_key(key_material: str) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=SALT,
        iterations=480000,
        backend=default_backend(),
    )
    return urlsafe_b64encode(kdf.derive(key_material.encode()))


_fernet_key = _derive_key(ENCRYPTION_KEY)
fernet = Fernet(_fernet_key)


def encrypt_data(data: str | None) -> str | None:
    """Encrypts a string using Fernet (AES-256-GCM)."""
    if data is None:
        return None
    encrypted_bytes = fernet.encrypt(data.encode("utf-8"))
    return encrypted_bytes.decode("utf-8")


def decrypt_data(encrypted_data: str | None) -> str | None:
    """Decrypts a string using Fernet (AES-256-GCM)."""
    if encrypted_data is None:
        return None
    try:
        decrypted_bytes = fernet.decrypt(encrypted_data.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except Exception:
        # Log the error, but don't re-raise to prevent app crashes on malformed data
        logger.warning("Decryption failed for stored value", exc_info=True)
        return None


class _EncryptedField:
    """
    Base descriptor for SQLAlchemy ORM attributes whose value is encrypted
    before saving and decrypted after reading from the database.

    Subclasses convert between the Python-side value and the plaintext string
    that is handed to Fernet via ``_to_plaintext`` / ``_from_plaintext``.
    """

    def __init__(self, mapped_column):
        self.mapped_column = mapped_column
        self.private_name = None

    def __set_name__(self, owner, name):
        self.public_name = name
        self.private_name = f"_{name}"
        setattr(owner, self.private_name, None)

    @staticmethod
    def _to_plaintext(value):
        return value

    @staticmethod
    def _from_plaintext(plaintext):
        return plaintext

    def __get__(self, instance, owner):
        if instance is None:
            return self

        decrypted = decrypt_data(getattr(instance, self.private_name))
        return None if decrypted is None else self._from_plaintext(decrypted)

    def __set__(self, instance, value):
        if instance is None:
            return

        plaintext = None if value is None else self._to_plaintext(value)
        setattr(instance, self.private_name, encrypt_data(plaintext))

    # Allow direct assignment of mapped_column for SQLAlchemy to pick up column type
    @property
    def comparator(self):
        return self.mapped_column.comparator

    @property
    def expression(self):
        return self.mapped_column.expression


class EncryptedDate(_EncryptedField):
    """Encrypted ORM attribute storing a ``date`` as an ISO-8601 string."""

    @staticmethod
    def _to_plaintext(value):
        return value.isoformat()

    @staticmethod
    def _from_plaintext(plaintext):
        if not plaintext:
            return None
        return datetime.strptime(plaintext, "%Y-%m-%d").date()


class EncryptedString(_EncryptedField):
    """Encrypted ORM attribute storing a plain string."""
