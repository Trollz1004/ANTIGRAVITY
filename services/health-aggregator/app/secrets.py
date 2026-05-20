from __future__ import annotations

from pathlib import Path

from .config import MASTER_ENV_NAME, SABRETOOTH_VAULT


class VaultEnv:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or SABRETOOTH_VAULT / MASTER_ENV_NAME
        self._values: dict[str, str] | None = None

    def exists(self) -> bool:
        return self.path.exists()

    def load(self) -> dict[str, str]:
        if self._values is not None:
            return self._values
        values: dict[str, str] = {}
        if not self.path.exists():
            self._values = values
            return values
        for raw in self.path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
        self._values = values
        return values

    def has_any(self, keys: tuple[str, ...]) -> bool:
        values = self.load()
        return all(bool(values.get(key)) for key in keys)

    def public_key_state(self, keys: tuple[str, ...]) -> dict[str, bool]:
        values = self.load()
        return {key: bool(values.get(key)) for key in keys}
