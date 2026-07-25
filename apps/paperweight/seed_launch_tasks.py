#!/usr/bin/env python3
"""Seed Paperweight with launch goals for date app 1k subs + DAO sale. Compliant per doctrine."""
import sys
sys.path.insert(0, ".")
import paperweight as pw

items = [
    {
        "title": "Achieve 1,000 real subscriptions / founding members on YouAndINotAI date app",
        "kind": "goal",
        "company": "youandinotai",
        "body": "Primary revenue: subs via Square. Market Bot-Shield ($1 proof real), Founding Member $14.99/mo featured + prepaid plans. Product-only copy. Drive to https://youandinotai.com . Track conversions and report LIVE on board.",
        "status": "doing",
        "priority": 1,
        "assignee": "Hermes",
        "meta": {"target": "1000 subscriptions", "metric": "active paid members"}
    },
    {
        "title": "X/Twitter + social marketing campaign (Grok specialist)",
        "kind": "task",
        "company": "marketing",
        "body": "Create 5-10 ready-to-post threads highlighting #NoBots #BotShield #HumanVerified #RealConnections. CTAs direct to youandinotai.com for signup/checkout. Use locked Founding Member pricing. Amplify existing @YouAndiNotAi voice. Track engagement to subs.",
        "status": "todo",
        "priority": 1,
        "assignee": "Grok"
    },
    {
        "title": "Funnel optimization & landing page launch polish (Codex)",
        "kind": "task",
        "company": "youandinotai",
        "body": "Edit Next.js frontend and static: prominent Founding Member CTAs, clearer benefits (verification, safety, real matching, account access), compliant copy only. Add social share, referral hooks, DAO transparency link. Improve onboarding to paid. Ensure Square flows smooth.",
        "status": "doing",
        "priority": 2,
        "assignee": "Codex"
    },
    {
        "title": "DAO for sale launch prep & transparency materials",
        "kind": "goal",
        "company": "dao",
        "body": "Prepare compliant public sale/transparency assets per doctrine (BUSINESS-ONLY). LLC facts only: Trash Or Treasure Online Recycler LLC · FL #L25000158401. Real-or-zero only. No investment/payment/securities language in public. Update dashboards/pages. Seed actionable steps. Integrate paperweight dao board + mission-control/public-stream. Private 506(c) prep stays internal.",
        "status": "doing",
        "priority": 1,
        "assignee": "Hermes"
    },
    {
        "title": "Audit & update all public dashboards/pages for full doctrine compliance (LLC facts, real-or-zero, product-only)",
        "kind": "task",
        "company": "dao",
        "body": "Scan youandinotai-frontend, static, dashboards/, mission-control/public-stream, paperweight static. Remove/update any legacy sale/investor/mission framing. Ensure every public surface states LLC entity + real-or-zero + links to product. Update DAOMetrics, Transparency, public surfaces list if needed. Verify no 'investor seats', '49% sale', 'perpetual mission DAO' in customer/public copy.",
        "status": "todo",
        "priority": 1,
        "assignee": "Hermes"
    },
    {
        "title": "Create compliant public transparency materials (LLC entity disclosure + status)",
        "kind": "task",
        "company": "dao",
        "body": "Create/edit files: briefings/DAO-PUBLIC-TRANSPARENCY-STATEMENT-2026-07.md and a static html in mission-control/public-stream/ or apps/youandinotai-static/ for public visibility. Content: exact LLC name + FL#, current product metrics (real or 0), public surfaces, guardrails, no sale language. Link to paperweight board (dao company) and mission-control. Prepare for public sale readiness without promoting sale.",
        "status": "todo",
        "priority": 1,
        "assignee": "Hermes"
    },
    {
        "title": "Update DAOMetrics.tsx + Transparency.tsx + constants for entity transparency",
        "kind": "task",
        "company": "dao",
        "body": "Add explicit 'Trash Or Treasure Online Recycler LLC · FL #L25000158401' disclosure. Add real-or-zero banner. Note private capital activities do not affect public product surfaces. Keep all values 0 or verified. Add link to transparency statement.",
        "status": "todo",
        "priority": 2,
        "assignee": "Codex"
    },
    {
        "title": "Private data room & counsel prep (internal only)",
        "kind": "task",
        "company": "dao",
        "body": "Per term sheet: prepare data room (financials from Square, user metrics business-only, platform descriptions, roadmap). Engage FL securities counsel for 506(c) 49% block. Form D prep notes. All private; do not leak to public dashboards. Track in paperweight dao only.",
        "status": "todo",
        "priority": 1,
        "assignee": "Hermes"
    },
    {
        "title": "Integrate paperweight 'dao' board with mission-control public stream",
        "kind": "task",
        "company": "dao",
        "body": "Ensure mission-control/public-stream references or embeds live status from paperweight dao company. Update public-stream/template.html or new dao-transparency.html to pull or link board items (high-level status only). Post LIVE updates on board.",
        "status": "todo",
        "priority": 2,
        "assignee": "Hermes"
    },
    {
        "title": "YouTube + content engine for dating app growth",
        "kind": "task",
        "company": "youtube",
        "body": "Gemini: scripts for bot-free dating stories, app walkthrough, member value, verification process. Descriptions/tags optimized. Thumbnails. Drive to site membership. Focus retention and organic reach.",
        "status": "todo",
        "priority": 2,
        "assignee": "Gemini"
    },
    {
        "title": "Maintain LIVE STATUS updates on paperweight for subs/DAO",
        "kind": "routine",
        "company": "marketing",
        "body": "Daily/periodic board updates on campaign progress, sub counts (when measurable), blockers. Use omni router for specialist input. Keep all customer-facing 100% business product compliant.",
        "status": "todo",
        "priority": 3,
        "assignee": "Hermes"
    },
]

for item in items:
    code, row = pw.create_item(item)
    print(f"[{code}] {row.get('id', 'N/A')}: {item['title'][:70]}")

print("Launch tasks seeded successfully into paperweight (with expanded DAO transparency next steps).")
