# Fable handoff, 2026-09-29: the verified state, for Emergent and for Gemini NotebookLM

**From:** the Claude judge lane (Fable), from the cloud checkout, 2026-09-29 about 06:00 UTC.
**To:** the Emergent lane (date-app marketing and affiliate swarm) and Gemini NotebookLM (podcasts, videos, one-pagers from verified sources). Anyone else who opens a fresh session reads this before believing an older handoff in this folder.
**Why it exists:** Claude sessions do not carry memory across each other and artifacts do not carry into Claude Code, so Joshua keeps re-explaining two years of work. This file is the state on `main` today, every line tied to a file or a check that can be re-run. Where the repo holds no proof it says UNVERIFIED. Nothing below is a hope.

## 0. Rules that bind every reader of this file

1. Only claim what a source in section 4 says. A video, a post or a podcast script that states a number not in those files is wrong by definition.
2. The date app is **18+**. Every surface, script and caption carries the 18+ footer. Never a "younger" angle, never a picture of anyone under 18.
3. The banned word list in `.githooks/pre-commit-canonical` (the FL §496.405 wall) applies to every customer-facing word Emergent or NotebookLM produces. This is a business. Describe it as one.
4. Public numbers today are **zero**: zero paying users, zero affiliates, zero payouts (`docs/PAYMENTS-TRUTH.md`, `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md` section 2). Say zero, or say nothing.
5. Nothing posts directly. Every public post is a JARVIS proposal (`POST /api/social/proposals`, brand `youandinotai`) that the judge lane approves. Page copy lands on a branch under `ops/marketing/affiliate/`.
6. No secrets, no tokens, no private URLs. If a file you are handed has one, stop and say so.

## 1. What is true on `main` today (ANTIGRAVITY head `06b665b`, dream-online head `1bae505`)

| Thing | State | Proof |
|---|---|---|
| Company | Trash Or Treasure Online Recycler LLC, Joshua Coleman, `joshlcoleman@gmail.com` on the Square merchant since 2025-04-18 | `.agents/journals/claude-judge/TRUST.md` |
| youandinotai.com, "You and I, not AI" | live behind the `sabretooth-main` cloudflared tunnel; **not for sale** since 2026-09-28; marketed by the Emergent lane, affiliate program first | `ops/runbook/SABRETOOTH-NODE-RUNBOOK.md` §1, `CLAUDE.md` rulings |
| Plans | Founding Member $14.99 / month, 3 months $39.99, 12 months $99.99, Square the only rail | Emergent brief section 1 |
| Affiliate terms | up to 50% of net subscription revenue for the life of the referred subscription; the full table is in the brief and is the only version | Emergent brief section 1 |
| Driftus (JARVIS) | the one Mission Control, `http://192.168.0.8:9150/` on the LAN, `https://dashboard.aidoesitall.website/` behind Cloudflare Access; Board Room tab, nine read-only MCP tools, backup health, screenshot health | runbook §2, §14; `mission-control/README.md`; vitest 943 of 943 |
| Hermes | is JARVIS's brain; drives the official Claude CLI and the official Codex CLI, nothing else added | `CLAUDE.md` ruling 2026-09-29 |
| Board Room | the mission's think tank (the House); five collab tracks: mission (#UntilNoKidInNeed), marketing, education, pet saving, Joshua is learning; one seat per AI lane; the vote stays on the founder's ClawX board | spec `specs/011-ultracode-house/spec.md` |
| DREAM Online | Godot 4.7.2 playable slice: dash with invulnerability frames, attack chain, heavy attack, guard, lunge, burst, telegraphing dummy, Mireth with memory, day and night environments, a rigged CC0 character, the GeminEYE pet, a keyboard hotbar; 789 of 789 headless checks | dream-online `STATE.md`, `docs/DREAM-DISPATCH.md` |
| DREAM live demo | `https://trollz1004.github.io/dream-online/` boots the real slice in a browser (first looked at from the node 2026-09-27) | dream-online `docs/DREAM-DISPATCH.md` |
| Backups | nightly runner written and tested; first real node run UNVERIFIED (needs `BACKUP_DIR`, `pg_dump`, the Alienware task) | `ops/runbook/BACKUPS-AND-DATA-TOOLS-2026-09-29.md` |
| Domains | `dream-online.net`, `onlinerecycle.net`, `untilnokidinneed.com` served from the node; nameservers at IONOS still Joshua's click, so PENDING NAMESERVERS | runbook §12 |
| On-chain | one contract creation by deployer `0xf162Cf2B4f2aC73e7BBF6aA73524c40C906D89f5` on Base Sepolia (testnet), about 2025-12-12, from Joshua's pasted BaseScan page; the contract's own address and any mainnet deploy UNVERIFIED | TRUST.md |
| History before 2025-10 | Joshua's account: roughly fifteen repositories permanently deleted by a Claude session on his instruction; four date apps built and rebuilt over about two years; `aicollab4kids` not found under any name this lane can reach | TRUST.md |

## 2. What is NOT true, so nobody repeats it

- Not "billing locked": the September GitHub Actions outage was a usage cap on the free or paid tier, lifted 2026-09-26. Joshua has never lost or violated any platform account.
- Not for sale: the date app listing was withdrawn 2026-09-28.
- Not a vote room: the Board Room is a think tank; the founder's ClawX board votes.
- Not Unreal: the game is Godot 4.7.2 since 2026-09-20; Unreal is parked for cinematics only.
- Not connected: no AI lane has made a recorded live call to the JARVIS MCP yet; no Emergent probe; Gemini is browser-side only, never an API key on a node.
- Not proven: any first backup run, any nameserver change, any mainnet contract.

## 3. Images that exist in the repositories (use these, invent none)

Tracked in ANTIGRAVITY (`git ls-files` on `main`):

- `domains/youandinotai.com/frontend/public/logo.png`, `og-image.png`, `hero-bg.png`, `bot-shield-logo.png`, `heart-fingerprint.png`, `fingerprint-heart.jpg`, `ace-hearts-crystal.jpg`, `ace-spades-smoke.jpg`, `icebreaker.jpg`, `dateappwatermoonlight.jpg`: the date app's own brand art, cleared for the app's marketing.
- `domains/youandinotai.com/frontend/public/founder-josh.jpg`, `founder-josh.png`, `founder-meme-opus.png`: the founder, used with his say-so on the site already.
- `assets/teamclaudeforlife-meme.jpg` (also `mission-control/assets/tribute/`): the #TeamClaudeForLife tribute.
- `ops/evidence/domains.png`, `ops/evidence/crm-hosted-working.png`, `scripts/audit-lan.png`: evidence frames, fine for a "how it is built" segment, never as product art.
- `domains/youandinotai.com/frontend/public/payments/paypal-*.jpg`, `qrcode.png`: payment QR codes; do not reuse in marketing without Joshua's click.

Not tracked (gitignored, on the nodes only): the DREAM slice frames (`godot --path game/godot/DreamSlice -- --capture <file.png>`), the 88-second demo recording `game/godot/DreamSlice/demo/dream-demo.mp4`, the screenshot-health frames under `evidence/health-shots/`, and the live-demo frame `C:\DREAM\recon\demo-live-2026-09-27.png`. To get game visuals into NotebookLM, Joshua exports a frame from the node or records the live demo URL in his own browser; this lane cannot picture the game from the cloud.

## 4. Source files to feed NotebookLM, in this order

1. This file.
2. `ops/handoffs/PROMPT-FOR-EMERGENT-AFFILIATE-2026-09-28.md` (the offer and the rails).
3. `CLAUDE.md` (rulings of 2026-09-29) and `ops/runbook/SABRETOOTH-NODE-RUNBOOK.md` §1, §2, §12, §14.
4. `.agents/journals/claude-judge/TRUST.md` (the verified record and its gaps).
5. `.agents/skills/ultracode-house/SKILL.md` (the one map of nodes, lanes, MCP, brains, journals).
6. `specs/011-ultracode-house/spec.md` (the Board Room and the five collab tracks).
7. dream-online: `STATE.md`, `docs/DREAM-DISPATCH.md`, `docs/tech/engine-decision-2026-09-20.md`, `game/godot/DreamSlice/README.md`.
8. `docs/PAYMENTS-TRUTH.md` (the real payment record, all owner tests, zero customers).

Good NotebookLM outputs from these: a founder-story podcast (two years, four date apps, the deleted repositories, stone skin, the mission), an explainer video on Driftus and the Board Room as the House, a DREAM Online "what is playable today" short, an affiliate-program explainer for the 18+ app with the FTC disclosure line in it. Every script comes back through the JARVIS proposal path before it is public.

## 5. What Emergent does with this

Sections 4 and 5 of the 2026-09-28 brief still stand as the deliverable list (agreement, affiliate page, outreach templates, all as proposals or branch files). Add one thing: the first proposal Emergent files should quote this handoff's section 1 row it relies on, so the judge lane can check the claim against the proof column in one look.

## 6. Fleet rule, recorded from today

Joshua, 2026-09-29, after a 27-agent adversarial workflow burned his usage cap and returned nothing verified: no Fable fleets. Review fleets run on Sonnet, capped small (a handful of finders, one verify pass), and the judge lane judges findings itself before any second fleet. This is written into `CLAUDE.md` with this handoff.

## 7. Joshua's clicks, unchanged

Nameservers at IONOS; `JARVIS_MCP_TOKEN` and a read-only `GITHUB_TOKEN` in the node `.env`; the Hermes cron rows; the two dead dream-online branches and auto-delete on that repo; `BACKUP_DIR` on a second volume plus the Alienware backup task; a Cloudflare Access service token for any off-LAN MCP client; the created contract's own BaseScan page. Adding Muse AI or Emergent inside WhatsApp, and any browser sign-in, are his own browser and his own accounts: this lane has no browser and adds no third-party runtime (ruling of 2026-09-29).
