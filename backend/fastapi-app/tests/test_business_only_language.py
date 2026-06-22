"""Business-only language guard for backend runtime surfaces."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_PARTS = {
    ".hypothesis",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "__pycache__",
    "alembic",
    "htmlcov",
    "migrations",
}
EXCLUDED_FILENAMES = {
    ".coverage",
    ".env.example",
    "coverage.xml",
    "test_business_only_language.py",
    "uv.lock",
}
TARGET_SUFFIXES = {
    ".json",
    ".md",
    ".py",
    ".sql",
    ".toml",
    ".yml",
    ".yaml",
}
FORBIDDEN_WORDS = (
    "cha" + "rity",
    "cha" + "rities",
    "cha" + "ritable",
    "ki" + "d",
    "ki" + "ds",
    "child" + "ren",
    "da" + "o",
    "govern" + "ance",
)
FORBIDDEN_PATTERN = re.compile(
    r"\b(?:" + "|".join(FORBIDDEN_WORDS) + r")\b",
    re.IGNORECASE,
)
ALLOWED_COMPATIBILITY_FILES = {
    Path("app/allocation_compat.py"),
}


def _iter_backend_text_files():
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if path.name in EXCLUDED_FILENAMES:
            continue
        if path.suffix.lower() not in TARGET_SUFFIXES:
            continue
        if any(part in EXCLUDED_PARTS for part in rel.parts):
            continue
        yield path, rel


def test_backend_runtime_language_is_business_only():
    violations: list[str] = []
    for path, rel in _iter_backend_text_files():
        if rel in ALLOWED_COMPATIBILITY_FILES:
            continue
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if FORBIDDEN_PATTERN.search(line):
                violations.append(f"{rel}:{line_number}: {line.strip()}")

    assert not violations, "Retired backend language remains:\n" + "\n".join(
        violations
    )
