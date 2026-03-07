"""
Platform policy for CodeX node automations.

As of 2026-03-07 the nodes do not live-post to third-party social networks.
They generate draft packs, handoff queues, and owned-property content only.
If a platform ever becomes eligible for node-side live posting, this file is
the only place that should be changed.
"""

from __future__ import annotations

LEGAL_SAFE_NODE_POLICY_VERSION = "2026-03-07-desktop-app-first"

POLICY_SUMMARY = (
    "CodeX nodes generate drafts, queues, reports, and owned-property content. "
    "Public social posting stays human-gated or external-tool-gated."
)

PLATFORM_POLICY = {
    "twitter": {
        "mode": "perplexity_only",
        "live_post_allowed": False,
        "owner": "Perplexity with Josh supervising",
        "reason": "X posting stays outside node automation.",
    },
    "facebook": {
        "mode": "perplexity_only",
        "live_post_allowed": False,
        "owner": "Perplexity with Josh supervising",
        "reason": "Facebook posting stays outside node automation.",
    },
    "reddit": {
        "mode": "devvit_or_manual",
        "live_post_allowed": False,
        "owner": "Devvit, Opus, or Perplexity",
        "reason": "No direct node posting to Reddit.",
    },
    "linkedin": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Josh manual review or future official API review",
        "reason": "LinkedIn stays draft-only on nodes.",
    },
    "instagram": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare assets and captions only.",
    },
    "threads": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare assets and captions only.",
    },
    "tiktok": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare assets and captions only.",
    },
    "pinterest": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare assets and copy only.",
    },
    "youtube": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare titles, descriptions, and clip notes only.",
    },
    "quora": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare answers only.",
    },
    "medium": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare article drafts only.",
    },
    "substack": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare newsletter drafts only.",
    },
    "producthunt": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Launch copy only; no autonomous posting.",
    },
    "indiehackers": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Community posting stays human-led.",
    },
    "nextdoor": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare local copy only.",
    },
    "bluesky": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "No autonomous posting from nodes.",
    },
    "mastodon": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "No autonomous posting from nodes.",
    },
    "discord": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare community updates only.",
    },
    "telegram": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare community updates only.",
    },
    "devto": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare article drafts only.",
    },
    "hashnode": {
        "mode": "draft_only",
        "live_post_allowed": False,
        "owner": "Manual",
        "reason": "Nodes can prepare article drafts only.",
    },
    "ebay": {
        "mode": "listing_pack_only",
        "live_post_allowed": False,
        "owner": "Manual listing publish",
        "reason": "Nodes build listing packs and exports only.",
    },
}

OWNED_AUTOMATION_TARGETS = {
    "owned_sites": [
        "youandinotai.com",
        "onlinerecycle.org",
        "dashboard.aidoesitall.website",
    ],
    "internal_outputs": [
        "CodeX/state/marketing",
        "data/local/onlinerecycle-worker",
        "CodeX/state",
    ],
    "safe_job_families": [
        "draft packs",
        "owned-site content queues",
        "asset and caption packaging",
        "compliance and drift reports",
        "revenue and intake summaries",
    ],
}


def get_policy(platform: str) -> dict:
    return PLATFORM_POLICY.get(
        platform,
        {
            "mode": "blocked",
            "live_post_allowed": False,
            "owner": "Manual",
            "reason": "Platform is not approved for node automation.",
        },
    )


def live_post_allowed(platform: str) -> bool:
    return bool(get_policy(platform).get("live_post_allowed", False))


def live_post_platforms() -> list[str]:
    return sorted(name for name in PLATFORM_POLICY if live_post_allowed(name))


def blocked_live_post_platforms() -> list[str]:
    return sorted(name for name in PLATFORM_POLICY if not live_post_allowed(name))
