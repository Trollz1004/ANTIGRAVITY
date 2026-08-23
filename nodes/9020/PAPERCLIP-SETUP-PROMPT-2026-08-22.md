# PAPERCLIP SETUP + MISSION CONTROL LINK — 9020 node task

Issued by the judge lane (Claude Code, Sabretooth) under Joshua's direction, 2026-08-22.
Assigned harness: OpenCode on node 9020 (192.168.0.5). Execute the steps below in order.
Companion contract: `ops/marketing-inbox/README.md` (the drop format this task wires up).

You are on node 9020 (support sandbox). Joshua authorizes exactly this scope: finish
setting up Paperclip on this node for MARKETING ONLY (Date App marketing and general
marketing) and link its output to Mission Control's approval queue on Sabretooth. Work
only under `C:\ANTIGRAVITY` — the one repo root on every node. Report VERIFIED /
UNVERIFIED / BLOCKED per step, with file paths and command output as evidence.

## Hard limits (doctrine, non-negotiable)

- Paperclip owns NO repository authority, no task governance, no git delivery. Never run
  git push/merge/branch-delete from this node — the judge lane on Sabretooth is the only
  actor that lands anything.
- Paperclip's model access goes through OmniRoute ONLY: base URL
  `http://192.168.0.8:20129/v1`, auth via env var `OMNIROUTE_KEY` (Joshua pastes it into
  Paperclip's env; never hardcode it, never write it into the repo). NEVER configure a
  raw OpenAI or Anthropic API key, and NEVER wire anything that spawns claude.exe or
  bills the Claude Max subscription — these are the exact failure modes that got the old
  Paperclip retired.
- Public/customer-facing copy is business-only framing. Banned vocabulary on any public
  surface: donate, donation, solicitation, charity, charitable, giving back,
  disbursement, tax-deductible. Date App checkout is Square-only; never mention or wire
  any other rail.
- Do not touch existing .env files except to add the vars named here. No secrets in
  chat, logs, or the repo.
- FCC is formally retired. If you find FCC artifacts on this node (e.g. the broken
  `fcc-codex.exe` proxy wrapper), do NOT use or repair them — record their exact paths
  in the Step 5 record so the judge lane can schedule removal.

## Step 1 — Verify what exists

Paperclip was previously installed on this node by Fable. Locate the install (where its
config/agents/provider settings live), and report: install path, version, current LLM
provider config, and whether any raw API key or claude.exe reference exists in it. If a
raw key or claude.exe hook exists, remove it and report what was removed.

## Step 2 — Point it at OmniRoute

Configure Paperclip's LLM provider as an OpenAI-compatible endpoint: base URL
`http://192.168.0.8:20129/v1`, API key from env `OMNIROUTE_KEY`, model
`auto/best-coding` (fallback `auto/best-fast`). Verify with one live completion and
paste the response metadata (model that answered, latency). If the gateway rejects
auth, report AUTH MISSING/REJECTED and stop — do not fall back to any direct provider.

## Step 3 — Wire the marketing output contract

Paperclip never publishes directly. Every piece of marketing work it produces must be
written as a JSON drop:

- location: `C:\ANTIGRAVITY\ops\marketing-inbox\` (this node's checkout; see its README)
- format: `{"source":"paperclip-9020","platform":"<instagram|tiktok|youtube|ebay|...>","kind":"<post|reply|campaign|listing|other>","title":"<=300 chars","body":"full copy exactly as it would publish"}`
- one object or an array per file, filename `<topic>-<timestamp>.json`

Configure whatever Paperclip calls its output/publish step to write these files instead
of posting anywhere. Prove it: generate ONE sample drop (a Date App marketing post
draft) and show the file content.

## Step 4 — Transport to Sabretooth (report, don't improvise)

Mission Control on Sabretooth is loopback-only by design — do NOT try to POST to
192.168.0.8:3151. Check whether a Sabretooth share is reachable
(`Test-Path \\192.168.0.8\marketing-inbox` and `Test-Path \\SABRETOOTH\marketing-inbox`).
If YES: write drops there additionally and mark the link VERIFIED. If NO: leave drops in
the local inbox, and report BLOCKED-on-transport with these two options for Joshua to
choose: (a) Sabretooth shares `ops\marketing-inbox` over SMB, or (b) the judge lane adds
a small authed relay. Do not invent a third path.

## Step 5 — Local record

Write `nodes/9020/PAPERCLIP-LINK-STATE.md` in the local checkout: what was configured,
provider verification evidence, the sample drop filename, transport status. Do NOT
commit or push it — the judge lane will collect it. End your report with the full text
of that file.

## The loop being joined

Your drops appear in Mission Control → `http://localhost:3151/paperweight/` →
🔔 Approvals tab, where Joshua approves/denies with a response. Nothing you produce
publishes without that recorded approval.
