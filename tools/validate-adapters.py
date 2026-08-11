#!/usr/bin/env python3
"""Validate adapter manifests under adapters/.

Referenced by .github/workflows/policy-guard.yml and .pre-commit-config.yaml
(files: ^adapters/). The adapters/ directory holds YAML/JSON adapter
manifests; each must parse and be a top-level mapping with a name.

Exit codes: 0 = all manifests valid (or none to validate), 1 = failures.
"""

import json
import sys
from pathlib import Path

import yaml

ADAPTERS_DIR = Path(__file__).resolve().parents[1] / "adapters"


def validate_manifest(path: Path) -> str | None:
    """Return an error string, or None if the manifest is valid."""
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        return f"unreadable: {exc}"

    try:
        if path.suffix == ".json":
            data = json.loads(text)
        else:
            data = yaml.safe_load(text)
    except Exception as exc:
        return f"parse error: {exc}"

    if not isinstance(data, dict):
        return "top level must be a mapping"
    if not data.get("name"):
        return "missing required 'name' key"
    return None


def main() -> int:
    if not ADAPTERS_DIR.is_dir():
        print("No adapters/ directory present — nothing to validate.")
        return 0

    manifests = sorted(
        p
        for p in ADAPTERS_DIR.rglob("*")
        if p.suffix in (".yml", ".yaml", ".json") and p.is_file()
    )
    if not manifests:
        print("adapters/ contains no manifest files — nothing to validate.")
        return 0

    failures = 0
    for manifest in manifests:
        error = validate_manifest(manifest)
        rel = manifest.relative_to(ADAPTERS_DIR.parent)
        if error:
            print(f"FAIL {rel}: {error}")
            failures += 1
        else:
            print(f"ok   {rel}")

    if failures:
        print(f"{failures} invalid manifest(s).")
        return 1
    print(f"All {len(manifests)} adapter manifest(s) valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
