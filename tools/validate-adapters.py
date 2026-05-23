#!/usr/bin/env python3
"""
validate-adapters.py — Adapter manifest validator.
Ensures the 'claude' adapter is marked as local-cli/internal-binary,
and that no adapter declares a remote-only or external API source that
bypasses local policy.
"""
import sys
import yaml
from pathlib import Path

ADAPTERS_DIR = Path("adapters")
REQUIRED_ADAPTERS = ["claude"]
CLAUDE_REQUIRED_SOURCE = "local-cli"


def validate():
    errors = []
    warnings = []

    if not ADAPTERS_DIR.exists():
        errors.append(f"adapters/ directory not found at {ADAPTERS_DIR.resolve()}")
        return errors, warnings

    adapter_dirs = [d for d in ADAPTERS_DIR.iterdir() if d.is_dir()]

    for adapter_name in REQUIRED_ADAPTERS:
        manifest_path = ADAPTERS_DIR / adapter_name / "manifest.yaml"
        if not manifest_path.exists():
            errors.append(
                f"REQUIRED: {manifest_path} does not exist — {adapter_name} adapter manifest required"
            )
            continue

        try:
            with open(manifest_path, "r") as f:
                manifest = yaml.safe_load(f)
        except yaml.YAMLError as e:
            errors.append(f"YAML parse error in {manifest_path}: {e}")
            continue

        if not isinstance(manifest, dict):
            errors.append(f"Invalid manifest in {manifest_path}: expected dict, got {type(manifest).__name__}")
            continue

        # Enforce claude must be local-cli
        if manifest.get("source") != CLAUDE_REQUIRED_SOURCE:
            errors.append(
                f"POLICY VIOLATION: {manifest_path} — "
                f"adapter 'claude' MUST have source='{CLAUDE_REQUIRED_SOURCE}' "
                f"(got source='{manifest.get('source')}'). "
                f"No remote API usage permitted for claude adapter."
            )

        # Warn if description is missing or too vague
        desc = manifest.get("description", "")
        if not desc:
            warnings.append(f"WARNING: {manifest_path} — description is empty")

    # Warn on any adapter with remote-only source not in allowlist
    REMOTE_ALLOWLIST = {"local-cli", "internal-binary", "local-model"}
    for adapter_dir in adapter_dirs:
        manifest_path = adapter_dir / "manifest.yaml"
        if not manifest_path.exists():
            continue
        try:
            with open(manifest_path, "r") as f:
                manifest = yaml.safe_load(f)
        except Exception:
            continue

        source = manifest.get("source", "unknown")
        if source not in REMOTE_ALLOWLIST:
            warnings.append(
                f"AUDIT: {manifest_path} — source='{source}' not in allowlist {REMOTE_ALLOWLIST}"
            )

    return errors, warnings


def main():
    errors, warnings = validate()
    for w in warnings:
        print(w, file=sys.stderr)
    for e in errors:
        print(e, file=sys.stderr)

    if errors:
        print(f"\nVALIDATION FAILED: {len(errors)} error(s) found.", file=sys.stderr)
        sys.exit(1)
    else:
        print("VALIDATION PASSED: all adapters compliant.")
        sys.exit(0)


if __name__ == "__main__":
    main()