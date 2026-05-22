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
    except Exception as e:
        # Log the error, but don't re-raise to prevent app crashes on malformed data
        print(f"Decryption failed: {e}")
        return None


class EncryptedDate:
    """
    A descriptor for SQLAlchemy ORM that encrypts date data before saving
    and decrypts it after reading from the database.
    """

    def __init__(self, mapped_column):
        self.mapped_column = mapped_column
        self.private_name = None

    def __set_name__(self, owner, name):
        self.public_name = name
        self.private_name = f"_{name}"
        setattr(owner, self.private_name, None)

    def __get__(self, instance, owner):
        if instance is None:
            return self

        encrypted_value = getattr(instance, self.private_name)
        decrypted_str = decrypt_data(encrypted_value)
        if decrypted_str:
            return datetime.strptime(decrypted_str, "%Y-%m-%d").date()
        return None

    def __set__(self, instance, value):
        if instance is None:
            return

        encrypted_value = encrypt_data(value.isoformat()) if value else None
        setattr(instance, self.private_name, encrypted_value)

    @property
    def comparator(self):
        return self.mapped_column.comparator

    @property
    def expression(self):
        return self.mapped_column.expression


class EncryptedString:
    """
    A descriptor for SQLAlchemy ORM that encrypts string data before saving
    and decrypts it after reading from the database.
    """

    def __init__(self, mapped_column):
        self.mapped_column = mapped_column
        self.private_name = None

    def __set_name__(self, owner, name):
        self.public_name = name
        self.private_name = f"_{name}"
        setattr(owner, self.private_name, None)

    def __get__(self, instance, owner):
        if instance is None:
            return self

        encrypted_value = getattr(instance, self.private_name)
        return decrypt_data(encrypted_value)

    def __set__(self, instance, value):
        if instance is None:
            return

        encrypted_value = encrypt_data(value)
        setattr(instance, self.private_name, encrypted_value)

    # Allow direct assignment of mapped_column for SQLAlchemy to pick up column type
    @property
    def comparator(self):
        return self.mapped_column.comparator

    @property
    def expression(self):
        return self.mapped_column.expression
