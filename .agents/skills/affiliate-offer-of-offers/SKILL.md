---
name: affiliate-offer-of-offers
description: The Super Saiyan Marketing Strategy. 50% lifetime revenue share protocol for Tier-1 influencers via custom vanity URLs.
---

# ⚡️ PROJECT: LINK FORGE — THE "OFFER OF OFFERS"

This is the ultimate acquisition protocol for `youandinotai.com`.
**The Offer**: 50% of every subscriber, every month, for life. 
**The Target**: Tech/Dating/AI niche influencers (50k–1M+ subs) tired of bot noise and AI slop.

## 1. The Custom URL Tech (Vanity Routing)
Never use ugly affiliate codes (e.g., `?ref=987hjkjh988hkjhkh87`). 
**Implementation Rule:**
- The Express API and React Router must dynamically trap `youandinotai.com/:partnerId`.
- When hit, write `partnerId` to `localStorage` and `cookie`.
- When the user registers, lock the `partnerId` into the Postgres `User` record permanently.
- The UI should dynamically welcome the user: *"Welcome from [Partner Name]'s community. Let's get you verified."*

## 2. The Pitch (The "Lazy Human" Rule)
No corporate jargon. No long emails.
**Copy Template:**
"Hey look at this qr code its youandinotai.com branded for real humans 50% for you if you share math sells itself see ya."

## 3. Gemini Ultra / API Integration
Agents using this skill must:
1. **Analyze:** Search YouTube/X for creators complaining about "Tinder bots", "AI dating scams", or "dead internet theory".
2. **Generate:** Create vertical video scripts and visual overlays tailored to that specific creator's branding.
3. **Dispatch:** Generate the custom QR code that points to their dedicated URL, package it, and present it to Joshua for approval.

## 4. Operational Recycling Loop
Revenue generated from this affiliate loop funnels into:
1. **Online Recycle:** Hardware drop-offs and refurbishing infrastructure.
2. **Dedicated Merchant Operations:** Established merchant pipelines funding long-term server operations.
- House rules: `docs/house/HOUSE-MOTION-RULE.md` and `docs/standards/AGENT-STANDARD.md`. Read before any design, site, dashboard or header job. Pointers only; do not restate rules here.
- Current beats existing: fetch and pull main first; origin main wins over clone, cache, journal and definition file; a clone that cannot fast-forward stops and reports (`ops/handoffs/FABLE-HANDOFFS-2026-11-06.md` section 0).

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
