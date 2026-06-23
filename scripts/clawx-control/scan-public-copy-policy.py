#!/usr/bin/env python3
"""
Scan public-facing and generated copy for legal/copy drift markers.

This audit is report-only. It never edits files.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "CodeX" / "state" / "marketing"

TARGETS = [
    {"name": "_deploy", "root": ROOT / "_deploy"},
    {"name": "youandinotai_src", "root": ROOT / "youandinotai" / "src"},
    {
        "name": "youandinotai_policies",
        "root": ROOT / "youandinotai",
        "include_files": {
            "PRIVACY_POLICY.md",
            "REFUND_POLICY.md",
            "TERMS_OF_SERVICE.md",
        },
    },
    {"name": "content", "root": ROOT / "content"},
    {
        "name": "onlinerecycle_state",
        "root": ROOT / "CodeX" / "state",
        "include_files": {
            "onlinerecycle-marketing-pack.md",
            "onlinerecycle-response-templates.md",
            "ebay-ready-batch-latest.html",
        },
    },
    {
        "name": "ebay_output",
        "root": ROOT / "data" / "ewaste-intake" / "output",
        "include_files": {
            "latest-ebay-listings-batch.md",
        },
    },
]

TEXT_SUFFIXES = {
    ".md",
    ".txt",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".html",
    ".css",
}

SKIP_PARTS = {
    ".git",
    "node_modules",
    "target",
    "dist",
    "build",
    ".venv",
}

SKIP_FILES = {
    "package-lock.json",
}

RULES = [
    {
        "id": "florida_496_405_terms",
        "label": "Florida wording risk",
        "patterns": [
            r"\bdonat(e|ion|ions|ing)\b",
            r"\bfundraiser\b",
        ],
    },
    {
        "id": "payment_provider_drift",
        "label": "Legacy payment drift",
        "patterns": [
            r"\balternate processor\b",
        ],
    },
    {
        "id": "public-benefit_copy_drift",
        "label": "public-benefit copy drift",
        "patterns": [
            r"public-benefit impact",
            r"projected public-benefit",
            r"every dollar goes to",
        ],
    },
]


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def write_text(name: str, content: str) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / name
    path.write_text(content.rstrip() + "\n", encoding="utf-8")
    return path


def write_json(name: str, payload: dict) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / name
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return path


def should_scan(path: Path, target: dict) -> bool:
    if path.suffix.lower() not in TEXT_SUFFIXES:
        return False
    if path.name in SKIP_FILES:
        return False
    if any(part in SKIP_PARTS for part in path.parts):
        return False
    include_files = target.get("include_files")
    if include_files and path.name not in include_files:
        return False
    return True


def scan_file(path: Path, target_name: str) -> list[dict]:
    try:
        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
    except Exception:
        return []

    findings = []
    relative = str(path.relative_to(ROOT))
    for line_no, line in enumerate(lines, start=1):
        for rule in RULES:
            for pattern in rule["patterns"]:
                if re.search(pattern, line, flags=re.IGNORECASE):
                    findings.append(
                        {
                            "target": target_name,
                            "rule_id": rule["id"],
                            "rule_label": rule["label"],
                            "path": relative,
                            "line": line_no,
                            "excerpt": line.strip(),
                        }
                    )
                    break
    return findings


def scan_targets() -> list[dict]:
    findings = []
    for target in TARGETS:
        target_name = target["name"]
        target_root = target["root"]
        if not target_root.exists():
            continue
        for path in target_root.rglob("*"):
            if path.is_file() and should_scan(path, target):
                findings.extend(scan_file(path, target_name))
    return findings


def build_markdown(findings: list[dict]) -> str:
    generated_at = now_iso()
    counts = {}
    target_counts = {}
    for finding in findings:
        counts[finding["rule_id"]] = counts.get(finding["rule_id"], 0) + 1
        target_counts[finding["target"]] = target_counts.get(finding["target"], 0) + 1

    lines = [
        "# Public Copy Policy Audit",
        "",
        f"- Generated: {generated_at}",
        f"- Findings: {len(findings)}",
        "",
        "## Rule Counts",
    ]

    if counts:
        for rule in RULES:
            lines.append(f"- {rule['id']}: {counts.get(rule['id'], 0)}")
    else:
        lines.append("- No matches found.")

    lines.extend(["", "## Target Counts"])
    if target_counts:
        for target in TARGETS:
            lines.append(f"- {target['name']}: {target_counts.get(target['name'], 0)}")
    else:
        lines.append("- No scanned targets produced matches.")

    lines.extend(["", "## Findings"])
    if not findings:
        lines.append("- No banned terms or copy-drift markers were found in the scanned targets.")
        return "\n".join(lines)

    for finding in findings:
        lines.append(
            f"- [{finding['rule_id']}] {finding['path']}:{finding['line']} -> {finding['excerpt']}"
        )
    return "\n".join(lines)


def main() -> int:
    findings = scan_targets()
    payload = {
        "generated_at": now_iso(),
        "targets": {target["name"]: str(target["root"]) for target in TARGETS if target["root"].exists()},
        "findings": findings,
    }
    write_text("public-copy-policy-audit-latest.md", build_markdown(findings))
    write_json("public-copy-policy-audit-latest.json", payload)
    print(f"FINDINGS={len(findings)}")
    print(f"OUTPUT_DIR={OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
