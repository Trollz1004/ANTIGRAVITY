#!/usr/bin/env python3
"""Seed the ANTIGRAVITY Master Plan setup tree into Paperweight (kanban).

Idempotent: skips any item whose title already exists on the board, so the
script can be re-run safely (e.g. after a partial failure) without duplicating
cards. T5500 is marked blocked/untouched per doctrine.

Run against a live board:  python apps/paperweight/seed_masterplan.py
"""
from __future__ import annotations

import json
import urllib.request

BASE = "http://127.0.0.1:4200"

# Full roster — no agent idle (Master Plan: max agents, no hiring without Josh).
ROSTER = ["Opus", "Codex", "Hermes", "CEO", "CFO", "CMO",
          "CTO", "INTERN", "Gemini", "Perplexity", "Grok"]


def _req(method: str, path: str, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        BASE + path, data=data,
        headers={"Content-Type": "application/json"}, method=method,
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())


def existing_titles() -> set[str]:
    try:
        d = _req("GET", "/api/state?company=all")
        return {i["title"].strip().lower() for i in d.get("items", [])}
    except Exception:
        return set()


def create(title, company, kind="task", status="todo", priority=3,
           assignee=None, body="", parent_id=None, seen=None):
    if seen is not None and title.strip().lower() in seen:
        print(f"  = exists (skip) {title}")
        return None
    b = {"title": title, "company": company, "kind": kind, "status": status,
         "priority": priority, "assignee": assignee, "body": body}
    if parent_id:
        b["parent_id"] = parent_id
    res = _req("POST", "/api/items", b)
    if res.get("id"):
        print(f"  + [{kind}] {title} -> {res['id']} ({assignee})")
        if seen is not None:
            seen.add(title.strip().lower())
        return res["id"]
    print(f"  ! FAILED {title}: {res}")
    return None


print("Seeding ANTIGRAVITY Master Plan setup tree into Paperweight...")
seen = existing_titles()

# ---- WEEK ONE milestone (goal) ------------------------------------------
w1 = create("Week One: D1-D7 ANTIGRAVITY bring-up", "marketing", kind="goal",
            priority=1, assignee="CEO",
            body="Master Plan handoff 2026-07-19. Verify live health on each node before marking done. Real or zero.",
            seen=seen)

# ---- D1-D7 day goals (children of W1) -----------------------------------
days = [
    ("D1", "Node bring-up + OmniRoute cascade verify", "hermes-sideworld", "CTO",
     "Laptop: verify OmniRoute dashboard :20128 / API :20129 + Command Center running. Nodes: back up Sabretooth drives, pull ornith:9b on both, register into OmniRoute."),
    ("D2", "Fix SSH aliases + stand up Scout/Forge workers", "hermes-sideworld", "Codex",
     "Fix SSH aliases laptop->Sabretooth/9020. Stand up queue + Scout/Forge workers. Load approved-links doc as the only link source."),
    ("D3", "First 50-creator prospect list (real channels)", "marketing", "CMO",
     "Scout real YouTube/IG creators (dating, safety, advice niches). Forge outreach drafts into Command Center queue. Josh approves first batch by hand."),
    ("D4", "Posting lane live (jittered cadence)", "marketing", "Grok",
     "Approved outreach ships on jittered cadence. X threads + first 20 creator emails/DMs. Grok X / Meta Manus / browser others."),
    ("D5", "Founding-member push on every surface", "youandinotai", "CMO",
     "Checkout is DONE (Square) — traffic only. Recycler funnel posts locally. Founding-member push across all surfaces."),
    ("D6", "Track: clicks/applies/first payments into CRM", "ai-solutions", "Perplexity",
     "Track real clicks/applies/first payments into Agent Hub CRM (Supabase :3130). Kill losers, double winners. Real or zero."),
    ("D7", "Weekly review to Josh", "hermes-sideworld", "CEO",
     "Weekly review: numbers, blockers, next 100 tasks queued. Decide swarm scale-up only if revenue moved."),
]
for code, title, comp, owner, body in days:
    create(f"{code}: {title}", comp, kind="goal", priority=2, assignee=owner,
           body=body, parent_id=w1, seen=seen)

# ---- NODE SETUPS ---------------------------------------------------------
create("Paperclip Laptop — control plane bring-up", "hermes-sideworld",
       assignee="Hermes",
       body="OmniRoute :20128 dash / :20129 API (cloud models ONLY, zero local inference). Paperclip :3101. Hermes dash :9119. Repo discipline. LAN 192.168.0.13.",
       priority=2, seen=seen)
create("Sabretooth — affiliate node 1 setup", "hermes-sideworld",
       assignee="Opus",
       body="Scout/ornith:9b via Ollama registered into OmniRoute. Back up C: dev drive. DREAM E: before repurpose. Fix SSH alias from laptop.",
       priority=2, seen=seen)
create("9020 — affiliate node 2 setup", "business-exchange",
       assignee="Codex",
       body="Same worker stack as Sabretooth. Paperclip runtime already confirmed on-screen. Fix SSH alias/auth from laptop. NewsCreator remnants preserved.",
       priority=2, seen=seen)
create("T5500 — PRODUCTION / UNTOUCHED (do not modify)", "youandinotai",
       status="blocked", assignee="INTERN",
       body="Date app serves /affiliate /go/. Bonsai :8080 stays local unless Josh exposes it. No swarm binaries. Board item stays BLOCKED — watch only.",
       priority=1, seen=seen)

# ---- 5-STAGE AFFILIATE PIPELINE -----------------------------------------
pipe = [
    ("01", "Scout — find creators + niche communities", "marketing", "Perplexity",
     "Find YouTube creators + niche communities (dating safety, anti-bot, advice). Build prospect list with real channel data only."),
    ("02", "Forge — draft outreach posts", "marketing", "Gemini",
     "Draft posts per surface in caveman-chill voice. Links ONLY from approved set (/affiliate/, /go/). Disclosure line baked in before the click."),
    ("03", "Approve — Command Center approval desk", "marketing", "CMO",
     "Everything lands in Command Center. Josh or rules-pass approves; hard-rule fails auto-block. Nothing skips this gate."),
    ("04", "Post — approved content ships", "marketing", "Grok",
     "Grok X / Meta Manus via API or extension / browser via agent-browser + cookie-sync. Jittered human cadence, one CTA."),
    ("05", "Track — record real clicks/applies/payments", "ai-solutions", "CFO",
     "Clicks, applies, first payments recorded real or zero. Losers killed, winners doubled. Weekly review to Josh."),
]
for code, title, comp, owner, body in pipe:
    create(f"{code} {title}", comp, assignee=owner, body=body, priority=3, seen=seen)

# ---- SUPPORT LAYER ------------------------------------------------------
create("Memory — Pieces LTM (MCP) + brain-mcp", "hermes-sideworld",
       assignee="Hermes",
       body="Shared cross-lane memory. Load memory at every session start. One canonical memory per fact, no duplicates.",
       priority=4, seen=seen)
create("Data — Supabase Agent Hub :3130 CRM", "ai-solutions",
       assignee="CTO",
       body="Agent Hub :3130 backend — leads CRM. Affiliate tracking (creators, applies, first payments) lives here. Migrations in repo. Real rows or none.",
       priority=4, seen=seen)
create("MCP — mission-mcp board bridge", "hermes-sideworld",
       assignee="Opus",
       body="MCP server for Mission Control — the tool bridge Claude/agents use for board + task ops instead of raw HTTP.",
       priority=4, seen=seen)
create("Deploy — Vercel + Cloudflare Wrangler tunnels", "ai-solutions",
       assignee="Codex",
       body="Command Center deploys to Vercel (or Docker). Cloudflare Wrangler tunnels/DNS on T5500; quick tunnel exposes OmniRoute :20128 (ephemeral URL, rotate in config).",
       priority=4, seen=seen)
create("Ops — Slack channel (daily check-ins, approval pings)", "hermes-sideworld",
       assignee="CEO",
       body="Ops channel for daily check-ins, approval pings, weekly review. Agents post real status; escalations also go to Telegram/WhatsApp (approved number, reactive only).",
       priority=4, seen=seen)
create("Glue — Zapier optional (Square event -> Slack)", "hermes-sideworld",
       assignee="INTERN",
       body="OPTIONAL, not in repo today. Only for edges with no first-party path (e.g. Square payment event -> Slack ping). Never for posting, never holding provider keys. Human-posting stays the law.",
       priority=5, seen=seen)

print("Done. Roster used:", ", ".join(ROSTER))
