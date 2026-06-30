#!/usr/bin/env python3
"""YouAndINotAI lightweight growth automation helper.

Commands:
  today        Show today's suggested growth plan
  generate     Generate Discord/Reddit/social draft copy
  log E S      Log engagements and signups
  status       Show cumulative state
  prompts      Show reusable prompt/copy angles
  submissions  Show launch-directory checklist
  communities  Show community/channel targets
"""
from __future__ import annotations

import argparse
import json
from datetime import date, datetime
from pathlib import Path
from textwrap import dedent

ROOT = Path(__file__).resolve().parent
STATE_PATH = ROOT / "growth_state.json"
LAUNCH_DATE = date(2026, 6, 26)

COMMUNITIES = {
    "reddit": [
        "r/dating_advice",
        "r/OnlineDating",
        "r/datingoverthirty",
        "r/Tinder",
        "r/Bumble",
        "r/hingeapp",
    ],
    "discord": [
        "Social Paradise",
        "Dating Advice / relationship servers",
        "Local singles/social servers",
        "Founder/build-in-public communities",
    ],
    "facebook": [
        "local singles groups",
        "dating advice groups",
        "relationship support groups",
        "city/community social groups",
        "single parents dating groups",
        "30+ singles groups",
        "verified dating / safety groups",
        "events/social mixers groups",
    ],
}

HASHTAGS = {
    "tiktok": "#datingapp #onlinedating #datingadvice #singlelife #aitools #verifieddating",
    "instagram": "#DatingApp #OnlineDating #DatingTips #SingleLife #VerifiedDating #DatingSafety",
    "x": "#dating #onlinedating #startups #buildinpublic",
    "linkedin": "#datingapps #trustandsafety #startups #consumertech",
}

DIRECTORIES = [
    "Product Hunt",
    "BetaList",
    "Startup Stash",
    "Launching Next",
    "Indie Hackers launch post",
    "Hacker News Show HN (when demo is polished)",
]

CALENDAR = [
    "Introduce the problem: fake profiles, bots, and swipe fatigue.",
    "Explain what verified dating changes for normal people.",
    "Share a short founder/build-in-public update.",
    "safety-first dating tips and scam red flags.",
    "Ask: what makes people trust a dating profile?",
    "Share the 5-step YouAndINotAI flow.",
    "Compare verified-first vs swipe-first dating.",
    "Invite early users to try the beta.",
    "Share common dating-app scam red flags.",
    "Post a mini FAQ about verification/privacy.",
    "Ask communities for profile-review pain points.",
    "Share why real people should not have to prove they are not bots repeatedly.",
    "Post a short testimonial-style scenario.",
    "Share pricing/offer clarity without hard-selling.",
    "Ask: what would make you leave the big dating apps?",
    "Share a behind-the-scenes screenshot or product note.",
    "Post a Discord conversation starter for singles.",
    "Submit/update launch directories.",
    "Share metrics/learning from the launch week.",
    "Invite feedback on the landing page/value prop.",
    "Recap the 21-day push and next iteration.",
]

PROMPTS = [
    "A dating app for real people tired of bots, catfish, and ghost profiles.",
    "Verified dating that feels human: less performative swiping, more actual trust.",
    "If you have dating-app fatigue, what would make you try something new?",
    "Dating safety should be built in, not bolted on after someone gets hurt.",
]


def load_state() -> dict:
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {"logs": [], "totals": {"engagements": 0, "signups": 0}}
    return {"logs": [], "totals": {"engagements": 0, "signups": 0}}


def save_state(state: dict) -> None:
    STATE_PATH.write_text(json.dumps(state, indent=2), encoding="utf-8")


def campaign_day() -> int:
    return max(1, min(21, (date.today() - LAUNCH_DATE).days + 1))


def print_today() -> None:
    day = campaign_day()
    topic = CALENDAR[day - 1]
    print(f"YouAndINotAI growth plan - Day {day}/21 ({date.today().isoformat()})")
    print("\nPrimary angle:")
    print(f"- {topic}")
    print("\nSuggested cadence:")
    print("- Morning Reddit (8-10am ET): value-first comment/post; no hard sell.")
    print("- Afternoon social: short build-in-public or dating-safety post.")
    print("- Evening Discord (7-11pm ET): join conversations, answer naturally, mention only when relevant.")
    print("\nRun `generate` for draft copy and `log <engagements> <signups>` after outreach.")


def print_generate() -> None:
    day = campaign_day()
    angle = CALENDAR[day - 1]
    print_today()
    print("\nDrafts:\n")
    print("Reddit value post/comment:")
    print(dedent(f"""
    I've been thinking about this dating-app problem: {angle.lower()} The thing that keeps coming up is trust. Most dating apps optimize for volume, but the painful part is not knowing whether the person is real, serious, or safe.

    Curious for people here: what would make a new dating app feel trustworthy enough to try - verification, better moderation, slower matching, profile reviews, something else?
    """).strip())
    print("\nDiscord conversation starter:")
    print("What is the biggest thing that makes dating apps feel exhausting: fake profiles, low-effort chats, ghosting, or too many choices?")
    print("\nShort social post:")
    print("Dating apps should not make real people compete with bots. Building YouAndINotAI around verified-first dating: fewer fake profiles, more trust, better conversations. " + HASHTAGS["x"])
    print("\nTikTok/Reel hook:")
    print("POV: you open a dating app and everyone has actually been verified as a real person.")


def print_status() -> None:
    state = load_state()
    totals = state.get("totals", {})
    print("YouAndINotAI growth status")
    print(f"- Total engagements: {totals.get('engagements', 0)}")
    print(f"- Total signups: {totals.get('signups', 0)}")
    print(f"- Log entries: {len(state.get('logs', []))}")
    if state.get("logs"):
        print("- Last log:", state["logs"][-1])


def log_result(engagements: int, signups: int) -> None:
    state = load_state()
    state.setdefault("logs", []).append({
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "engagements": engagements,
        "signups": signups,
    })
    totals = state.setdefault("totals", {"engagements": 0, "signups": 0})
    totals["engagements"] = int(totals.get("engagements", 0)) + engagements
    totals["signups"] = int(totals.get("signups", 0)) + signups
    save_state(state)
    print(f"Logged {engagements} engagements and {signups} signups.")
    print_status()


def print_prompts() -> None:
    print("Prompt/copy angles:")
    for p in PROMPTS:
        print(f"- {p}")
    print("\nHashtags:")
    for platform, tags in HASHTAGS.items():
        print(f"- {platform}: {tags}")


def print_submissions() -> None:
    print("Launch-directory checklist:")
    for item in DIRECTORIES:
        print(f"- [ ] {item}")


def print_communities() -> None:
    print("Community targets:")
    for group, items in COMMUNITIES.items():
        print(f"\n{group.title()}:")
        for item in items:
            print(f"- {item}")


def main() -> None:
    parser = argparse.ArgumentParser(description="YouAndINotAI growth automation helper")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("today")
    sub.add_parser("generate")
    sub.add_parser("status")
    sub.add_parser("prompts")
    sub.add_parser("submissions")
    sub.add_parser("communities")
    log = sub.add_parser("log")
    log.add_argument("engagements", type=int)
    log.add_argument("signups", type=int)
    args = parser.parse_args()

    if args.command == "today":
        print_today()
    elif args.command == "generate":
        print_generate()
    elif args.command == "status":
        print_status()
    elif args.command == "prompts":
        print_prompts()
    elif args.command == "submissions":
        print_submissions()
    elif args.command == "communities":
        print_communities()
    elif args.command == "log":
        log_result(args.engagements, args.signups)


if __name__ == "__main__":
    main()
