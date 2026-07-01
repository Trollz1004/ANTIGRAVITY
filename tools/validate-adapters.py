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
REQUIRED_ADAPTERS = ["claude", "hermes", "pi", "codex", "gemini"]
CLAUDE_REQUIRED_SOURCE = "local-cli"
LOCAL_ONLY_ADAPTERS = {"claude", "hermes", "pi"}


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

        adapter_name = manifest.get("name", adapter_name)
        source = manifest.get("source", "unknown")

        # Enforce local-only adapters must be local-cli
        if adapter_name in LOCAL_ONLY_ADAPTERS and source != CLAUDE_REQUIRED_SOURCE:
            errors.append(
                f"POLICY VIOLATION: {manifest_path} — "
                f"adapter '{adapter_name}' MUST have source='{CLAUDE_REQUIRED_SOURCE}' "
                f"(got source='{source}'). "
                f"No remote API usage permitted for {adapter_name} adapter."
            )

        # Warn if description is missing or too vague
        desc = manifest.get("description", "")
        if not desc:
            warnings.append(f"WARNING: {manifest_path} — description is empty")

    # Warn on any adapter with source not in allowlist
    SOURCE_ALLOWLIST = {"local-cli", "internal-binary", "local-model", "auth-signin", "browser-auth"}
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
        if source not in SOURCE_ALLOWLIST:
            warnings.append(
                f"AUDIT: {manifest_path} — source='{source}' not in allowlist {SOURCE_ALLOWLIST}"
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