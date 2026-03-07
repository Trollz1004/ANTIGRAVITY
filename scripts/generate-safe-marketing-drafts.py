#!/usr/bin/env python3
"""
Generate legal-safe marketing draft packs for CodeX nodes.

Outputs go under CodeX/state/marketing and are intended for human-gated use.
This script does not post to third-party platforms.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

from social_engine.platform_policy import (
    LEGAL_SAFE_NODE_POLICY_VERSION,
    OWNED_AUTOMATION_TARGETS,
    PLATFORM_POLICY,
    POLICY_SUMMARY,
    blocked_live_post_platforms,
    live_post_platforms,
)


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "CodeX" / "state" / "marketing"
CONTENT_DIR = ROOT / "content"
POST_QUEUE = ROOT / "data" / "post-queue.json"
LEGACY_FILES = [
    ROOT / "scripts" / "social-engine-24x7.py",
    ROOT / "scripts" / "daemon-start.py",
    ROOT / "scripts" / "daemon-login.py",
    ROOT / "scripts" / "social-engine-boot.bat",
    ROOT / "scripts" / "social-engine-login.bat",
    ROOT / "scripts" / "register-watchdog-task.ps1",
    ROOT / "scripts" / "opus-marketing-watchdog.ps1",
]
SEO_FILES = [
    CONTENT_DIR / "how-to-spot-fake-dating-profiles-2026.md",
    CONTENT_DIR / "v8-cloud-verification-explained.md",
    CONTENT_DIR / "why-dating-apps-have-bot-problem.md",
]
PRODUCT_URL = "https://youandinotai.com"

PROFILE_META = {
    "9020-content": {
        "node": "9020",
        "role": "Content factory",
        "focus": "Generate draft packs, handoff queues, and owned-content next actions.",
    },
    "t5500-audit": {
        "node": "T5500",
        "role": "Compliance and policy audit",
        "focus": "Verify legacy live-post paths stay disabled and publish the latest queue summary.",
    },
    "sabretooth-control": {
        "node": "SABRETOOTH",
        "role": "Control plane",
        "focus": "Review handoff packs and monitor which platforms remain human-gated.",
    },
}


def ensure_output_dir() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def today_stamp() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def write_text(name: str, content: str) -> Path:
    path = OUTPUT_DIR / name
    path.write_text(content.rstrip() + "\n", encoding="utf-8")
    return path


def write_json(name: str, payload: dict) -> Path:
    path = OUTPUT_DIR / name
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return path


def load_post_queue() -> dict:
    if not POST_QUEUE.exists():
        return {}
    try:
        return json.loads(POST_QUEUE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def parse_article(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="ignore")
    title = path.stem.replace("-", " ").title()
    summary = ""
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped[2:].strip()
            continue
        if stripped and not stripped.startswith("---") and not stripped.startswith("title:"):
            summary = stripped.replace("**", "")
            break
    return {
        "title": title,
        "summary": summary,
        "path": path,
    }


def load_articles() -> list[dict]:
    articles = []
    for path in SEO_FILES:
        if path.exists():
            articles.append(parse_article(path))
    return articles


def build_perplexity_handoff(articles: list[dict]) -> str:
    lines = [
        "# Perplexity Handoff",
        "",
        f"- Generated: {now_iso()}",
        "- Posting ownership: Perplexity with Josh supervising",
        "- Platforms: X and Facebook only",
        "- Node rule: CodeX nodes never live-post to these platforms",
        "",
        "## Draft Queue",
    ]

    drafts = [
        "Most apps still treat email verification like security. YouAndINotAI starts with real identity checks so actual people can stop wasting time on fake profiles. "
        f"{PRODUCT_URL}",
        "The goal is not more profiles. The goal is more real people. That is why YouAndINotAI treats identity verification as the front door instead of an afterthought. "
        f"{PRODUCT_URL}",
        "A social platform for good only works if the people on it are real. We are building the verification layer first so the community side can stay human. "
        f"{PRODUCT_URL}",
    ]

    for index, draft in enumerate(drafts, start=1):
        lines.append(f"{index}. {draft}")

    if articles:
        lines.extend(
            [
                "",
                "## Article Angles",
            ]
        )
        for article in articles:
            lines.append(f"- {article['title']}: {article['summary']}")

    lines.extend(
        [
            "",
            "## Guardrails",
            "- Keep tone human and non-spammy.",
            "- Avoid automation-looking reply chains or duplicate blasts.",
            "- Keep any 60/30/10 mention factual and avoid donation wording.",
        ]
    )
    return "\n".join(lines)


def build_reddit_handoff() -> str:
    lines = [
        "# Reddit And Devvit Handoff",
        "",
        f"- Generated: {now_iso()}",
        "- Posting ownership: Devvit, Opus, or Perplexity",
        "- Node rule: No direct Reddit posting from CodeX nodes",
        "",
        "## Post Angles",
        "1. Builder story: explain why fake profiles pushed the product toward identity verification first.",
        "2. Product feedback: ask which trust checks people actually want before they join a new community.",
        "3. Local community story: keep it educational and discussion-led, not launch spam.",
        "",
        "## Devvit Notes",
        "- Use subreddit-specific context and mod rules before any publish step.",
        "- Prefer discussion prompts and feedback requests over straight promotion.",
        "- Treat outbound posting as a human-reviewed action, not a node automation.",
    ]
    return "\n".join(lines)


def build_linkedin_drafts(articles: list[dict]) -> str:
    lines = [
        "# LinkedIn Drafts",
        "",
        f"- Generated: {now_iso()}",
        "- Status: Draft only",
        "- Node rule: No direct posting from CodeX nodes",
        "",
        "## Draft 1",
        "Trust is the product problem. Most social and dating platforms still verify the easy things instead of the important things. "
        "YouAndINotAI is being built around identity verification first so the community layer has a real foundation. "
        f"{PRODUCT_URL}",
        "",
        "## Draft 2",
        "Real people do not need more algorithmic noise. They need clearer trust signals. "
        "The current build direction is simple: reduce fake-profile friction before asking people to invest time in the platform. "
        f"{PRODUCT_URL}",
    ]
    if articles:
        lines.extend(["", "## Long-Form Anchors"])
        for article in articles:
            lines.append(f"- {article['title']} -> {article['path']}")
    return "\n".join(lines)


def build_owned_content_queue(articles: list[dict]) -> str:
    lines = [
        "# Owned Content Queue",
        "",
        f"- Generated: {now_iso()}",
        "- Safe automation target: owned properties and internal assets only",
        "",
        "## Allowed Targets",
    ]
    for site in OWNED_AUTOMATION_TARGETS["owned_sites"]:
        lines.append(f"- {site}")

    lines.extend(["", "## Next Actions"])
    if articles:
        for article in articles:
            lines.append(f"- Review and publish/update: {article['title']} ({article['path']})")
    else:
        lines.append("- No SEO article files were found in content/.")

    lines.extend(
        [
            "- Build image, caption, and CTA packs locally before any manual publishing step.",
            "- Store review outputs under CodeX/state/marketing so the nodes stay off third-party posting surfaces.",
        ]
    )
    return "\n".join(lines)


def build_audit(post_queue: dict) -> tuple[str, dict]:
    blocked_queue = {}
    for platform in blocked_live_post_platforms():
        queued = post_queue.get(platform)
        if isinstance(queued, list) and queued:
            blocked_queue[platform] = len(queued)

    manifest = {
        "generated_at": now_iso(),
        "policy_version": LEGAL_SAFE_NODE_POLICY_VERSION,
        "policy_summary": POLICY_SUMMARY,
        "blocked_live_post_platforms": blocked_live_post_platforms(),
        "live_post_platforms": live_post_platforms(),
        "blocked_platform_queue_counts": blocked_queue,
        "legacy_compatibility_files": [str(path.relative_to(ROOT)) for path in LEGACY_FILES if path.exists()],
        "owned_automation_targets": OWNED_AUTOMATION_TARGETS,
    }

    lines = [
        "# Safe Automation Audit",
        "",
        f"- Generated: {manifest['generated_at']}",
        f"- Policy version: {manifest['policy_version']}",
        f"- Live-post platforms enabled on nodes: {len(manifest['live_post_platforms'])}",
        "",
        "## Blocked Platforms",
    ]
    for platform in blocked_live_post_platforms():
        entry = PLATFORM_POLICY[platform]
        queue_note = blocked_queue.get(platform)
        suffix = f" | queued drafts: {queue_note}" if queue_note else ""
        lines.append(f"- {platform}: {entry['mode']} | {entry['reason']}{suffix}")

    lines.extend(["", "## Legacy Compatibility Files"])
    for relative_path in manifest["legacy_compatibility_files"]:
        lines.append(f"- {relative_path}")

    if not blocked_queue:
        lines.extend(["", "## Queue Status", "- No blocked platform queue entries were detected in data/post-queue.json."])
    else:
        lines.extend(["", "## Queue Status"])
        for platform, count in blocked_queue.items():
            lines.append(f"- {platform}: {count} queued draft(s) remain human-gated.")

    return "\n".join(lines), manifest


def build_master_pack(profile: str, articles: list[dict], manifest: dict) -> str:
    meta = PROFILE_META[profile]
    lines = [
        "# CodeX Safe Node Marketing Pack",
        "",
        f"- Generated: {manifest['generated_at']}",
        f"- Profile: {profile}",
        f"- Node: {meta['node']}",
        f"- Role: {meta['role']}",
        f"- Focus: {meta['focus']}",
        f"- Policy: {manifest['policy_version']}",
        "",
        "## Operating Rule",
        POLICY_SUMMARY,
        "",
        "## Human-Gated Platforms",
        "- X and Facebook -> Perplexity with Josh supervising",
        "- Reddit -> Devvit, Opus, or Perplexity",
        "- LinkedIn -> draft-only until a separately reviewed official API path is approved",
        "",
        "## Owned Automation Surface",
        "- Owned sites, internal queues, asset packaging, reporting, and revenue support packs",
    ]

    if articles:
        lines.extend(["", "## Content Anchors"])
        for article in articles:
            lines.append(f"- {article['title']}")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate legal-safe marketing draft packs for CodeX nodes.")
    parser.add_argument(
        "--profile",
        default="9020-content",
        choices=sorted(PROFILE_META),
        help="Node profile to generate.",
    )
    args = parser.parse_args()

    ensure_output_dir()
    post_queue = load_post_queue()
    articles = load_articles()
    audit_text, manifest = build_audit(post_queue)

    write_text("perplexity-handoff-latest.md", build_perplexity_handoff(articles))
    write_text("reddit-devvit-handoff-latest.md", build_reddit_handoff())
    write_text("linkedin-drafts-latest.md", build_linkedin_drafts(articles))
    write_text("owned-content-queue-latest.md", build_owned_content_queue(articles))
    write_text("safe-automation-audit-latest.md", audit_text)
    write_text("safe-node-marketing-pack-latest.md", build_master_pack(args.profile, articles, manifest))
    write_json("safe-node-marketing-manifest-latest.json", manifest)

    print(f"PROFILE={args.profile}")
    print(f"OUTPUT_DIR={OUTPUT_DIR}")
    print(f"GENERATED_AT={manifest['generated_at']}")
    print(f"POLICY_VERSION={LEGAL_SAFE_NODE_POLICY_VERSION}")
    print(f"BLOCKED_PLATFORMS={len(manifest['blocked_live_post_platforms'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
