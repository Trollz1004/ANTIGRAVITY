#!/usr/bin/env python3
"""Validate adapter packages and manifests.

Referenced by .github/workflows/policy-guard.yml and .pre-commit-config.yaml.
Two targets:

1. paperclip/packages/adapters/<name>/ — the live adapter packages. Each
   package.json must parse and carry name + version, and adapter runtime
   source must honor the AUTHORING.md no-remote-git contract (no `git push`
   from adapter runtime code; cross-run state lives in the local cwd).
2. adapters/ at repo root — YAML/JSON manifests, if that layout ever
   (re)appears: each must parse to a mapping with a name.

Exit codes: 0 = everything valid, 1 = failures.
"""

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

# PyYAML is only needed for YAML manifests under a root adapters/ directory.
# The pre-commit hook runs with `language: system`, so keep the import lazy
# to avoid ModuleNotFoundError in bare environments where nothing needs it.
try:
    import yaml
except ImportError:
    yaml = None

REPO_ROOT = Path(__file__).resolve().parents[1]
PACKAGES_DIR = REPO_ROOT / "paperclip" / "packages" / "adapters"
MANIFESTS_DIR = REPO_ROOT / "adapters"
CANONICAL_GIT_PUSH_CHECKER = REPO_ROOT / "paperclip" / "scripts" / "check-no-git-push.mjs"

# Fallback matcher only — the canonical checker below covers more forms
# (argument arrays like spawn("git", ["push"]), plus adapter-utils/server/cli).
GIT_PUSH_RE = re.compile(r"\bgit\s+push\b")


def fail(msg: str, failures: list) -> None:
    print(f"FAIL {msg}")
    failures.append(msg)


def validate_adapter_packages(failures: list) -> int:
    if not PACKAGES_DIR.is_dir():
        print("No paperclip/packages/adapters/ directory — skipping package checks.")
        return 0

    checked = 0
    for pkg_json in sorted(PACKAGES_DIR.glob("*/package.json")):
        rel = pkg_json.relative_to(REPO_ROOT)
        checked += 1
        try:
            data = json.loads(pkg_json.read_text(encoding="utf-8"))
        except Exception as exc:
            fail(f"{rel}: parse error: {exc}", failures)
            continue
        if not isinstance(data, dict) or not data.get("name"):
            fail(f"{rel}: missing required 'name'", failures)
        if isinstance(data, dict) and not data.get("version"):
            fail(f"{rel}: missing required 'version'", failures)

    # AUTHORING.md no-remote-git contract: adapter/runtime code must not push
    # to a git remote. Delegate to the canonical checker, which also catches
    # argument-array invocations (spawn("git", ["push", ...])) and scans
    # adapter-utils, server/src, and cli/src.
    node = shutil.which("node")
    if node and CANONICAL_GIT_PUSH_CHECKER.is_file():
        result = subprocess.run(
            [node, str(CANONICAL_GIT_PUSH_CHECKER)],
            cwd=CANONICAL_GIT_PUSH_CHECKER.parents[1],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            fail(
                "check-no-git-push.mjs found remote-mutating git invocations:\n"
                + (result.stdout + result.stderr).strip(),
                failures,
            )
        else:
            print("check-no-git-push.mjs: clean.")
    else:
        # Fallback (node or the canonical script unavailable): narrower
        # line-based scan of adapter src only.
        for pkg_json in sorted(PACKAGES_DIR.glob("*/package.json")):
            src_dir = pkg_json.parent / "src"
            if not src_dir.is_dir():
                continue
            for src in src_dir.rglob("*.ts"):
                if ".test." in src.name:
                    continue
                try:
                    text = src.read_text(encoding="utf-8")
                except OSError:
                    continue
                for lineno, line in enumerate(text.splitlines(), 1):
                    if GIT_PUSH_RE.search(line) and "Never" not in line:
                        fail(
                            f"{src.relative_to(REPO_ROOT)}:{lineno}: "
                            "adapter runtime code must not `git push` "
                            "(AUTHORING.md no-remote-git contract)",
                            failures,
                        )
    print(f"Checked {checked} adapter package(s) under {PACKAGES_DIR.relative_to(REPO_ROOT)}.")
    return checked


def validate_root_manifests(failures: list) -> int:
    if not MANIFESTS_DIR.is_dir():
        return 0
    checked = 0
    for manifest in sorted(MANIFESTS_DIR.rglob("*")):
        if manifest.suffix not in (".yml", ".yaml", ".json") or not manifest.is_file():
            continue
        checked += 1
        rel = manifest.relative_to(REPO_ROOT)
        if manifest.suffix != ".json" and yaml is None:
            fail(f"{rel}: PyYAML required to validate YAML manifests (pip install pyyaml)", failures)
            continue
        try:
            text = manifest.read_text(encoding="utf-8")
            data = json.loads(text) if manifest.suffix == ".json" else yaml.safe_load(text)
        except Exception as exc:
            fail(f"{rel}: parse error: {exc}", failures)
            continue
        if not isinstance(data, dict) or not data.get("name"):
            fail(f"{rel}: top level must be a mapping with a 'name'", failures)
    if checked:
        print(f"Checked {checked} manifest(s) under adapters/.")
    return checked


def main() -> int:
    failures: list = []
    total = validate_adapter_packages(failures) + validate_root_manifests(failures)
    if failures:
        print(f"{len(failures)} problem(s) found.")
        return 1
    if total == 0:
        print("Nothing to validate in this repo layout.")
    else:
        print("All adapter checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
