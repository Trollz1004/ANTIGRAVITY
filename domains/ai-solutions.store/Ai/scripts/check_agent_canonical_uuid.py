#!/usr/bin/env python3
"""Regression guard: lock Paperclip agent instruction bundles to canonical UUID roots.

BUS-138/BUS-143 invariant:
  Every agent instruction bundle must live at the canonical UUID path
    <PAPERCLIP_ROOT>/companies/<companyId>/agents/<agentId>/instructions/
  with the full file set: AGENTS.md, HEARTBEAT.md, SOUL.md, TOOLS.md, SKILLS.md.

Any sibling directory under <root>/agents/ whose name is not a UUID
is a urlKey alias mirror and indicates the agent creation/update path
drifted off the canonical managed bundle.

This script is meant to be wired into:
  - the pre-commit hook (.githooks/pre-commit)
  - a CI workflow step on push to main
so a regression of the duplicate alias path from BUS-138 fails the gate.

Usage:
  python3 scripts/check_agent_canonical_uuid.py
  python3 scripts/check_agent_canonical_uuid.py --paperclip-root /home/josh/.paperclip/instances/default
  python3 scripts/check_agent_canonical_uuid.py --company-id 36db18b2-7871-497e-8fd7-97526f81511a
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

# Files that must exist under every agent's instructions/ directory
# (per BUS-138 spec: auditable heartbeat files on first creation).
REQUIRED_FILES = (
    "AGENTS.md",
    "HEARTBEAT.md",
    "SOUL.md",
    "TOOLS.md",
    "SKILLS.md",
)

# Top-level files under <root>/agents/ that are not themselves agents.
ALLOWED_TOP_LEVEL = {"check_instruction_bundles.py"}


def check_root(paperclip_root: Path, company_id: str) -> tuple[int, list[str]]:
    """Walk the per-company agents directory and verify the canonical-UUID invariant.

    Returns (bundles_checked, errors). Empty errors list means pass.
    """
    agents_dir = paperclip_root / "companies" / company_id / "agents"
    if not agents_dir.is_dir():
        return 0, [f"agents dir not found: {agents_dir}"]

    bundles_checked = 0
    errors: list[str] = []

    for child in sorted(agents_dir.iterdir()):
        name = child.name
        # Skip helper files and hidden directories
        if name in ALLOWED_TOP_LEVEL or name.startswith("."):
            continue
        # A non-UUID entry is a urlKey alias mirror (regression)
        if not UUID_RE.match(name):
            errors.append(
                f"urlKey alias mirror detected: {child} (must be a UUID-format "
                f"agent directory under companies/{company_id}/agents/)"
            )
            continue
        instructions = child / "instructions"
        if not instructions.is_dir():
            errors.append(f"missing instructions/ under canonical agent dir {child}")
            continue
        bundles_checked += 1
        for required in REQUIRED_FILES:
            target = instructions / required
            if not target.is_file():
                errors.append(f"missing {required} in {target}")
    return bundles_checked, errors


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Lock Paperclip agent bundles to canonical UUID roots."
    )
    ap.add_argument(
        "--paperclip-root",
        default="/home/josh/.paperclip/instances/default",
        help="Paperclip instance root containing companies/<id>/agents/",
    )
    ap.add_argument(
        "--company-id",
        default="36db18b2-7871-497e-8fd7-97526f81511a",
        help="Company UUID to audit (default: current CEO company)",
    )
    args = ap.parse_args()

    root = Path(args.paperclip_root)
    bundles, errors = check_root(root, args.company_id)
    print(f"Canonical-UUID check: {bundles} bundles verified under "
          f"{root}/companies/{args.company_id}/agents/")
    if errors:
        for e in errors:
            print(f"ERROR: {e}")
        return 1
    print("OK: all agent bundles on canonical UUID roots with full file set.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
