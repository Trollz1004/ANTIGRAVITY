# Handoff to Gemini: full audit and drift cleanup (Joshua, 2026-10-23)

Written by the Claude judge lane on Joshua's direct instruction. Joshua will have Gemini pull the repository and carry this out. It is Joshua's own assignment, so it stands even where an older ruling limited Gemini to `mission-os/`. Work on a branch and open a pull request; do not push to `main`. A judge (Claude, Codex or Jules) merges.

## What Joshua wants

A full audit of everything, with drift cleaned up, so that every agent reads the same facts. "Drift" means two files that disagree, or a file that still says something Joshua has since corrected. Nothing here is a reason to re-test payments or ask Joshua about them.

## What just landed (read these first)

1. Pull request 293 corrected the payments record. Two $1.00 Bot-Shield charges on the evening of 2026-09-17 Eastern (receipts v1nS and b3FM, 2026-09-18 in UTC) were paid by Heather, a friend Joshua asked to be the first customer. It is a real third-party card, so no file may say there are no outside payments. It is also not independent demand, so no file may present it as organic. The signed record is `docs/PAYMENTS-TRUTH.md`, anchored by hash; the re-computing rule is in its anchor line.
2. This pull request adds the account rule below to `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `agent.md`, the payments-related skills, and `docs/memory-layer/agent-workflow-graphy.json`. It also adds a `friend_first` payer type to the date app backend, so the two charges stop counting as ordinary customers.

## The account rule (Joshua, 2026-10-23)

- `ebaytrashortreasure@gmail.com` is the older, established email, and the Date App needs it. It is the sign-in for exactly two merchant accounts: Square and PayPal.
- Every other account, tool, connector and service uses `joshlcoleman@gmail.com`.
- Square's active location lists `joshlcoleman@gmail.com` in its business-contact field. That is a contact field, not the sign-in. Older notes had read it as the account email and were corrected in `.agents/journals/claude-judge/TRUST.md` and `ops/handoffs/FABLE-HANDOFF-2026-09-29.md`.

## The audit, in order

1. **Entry files agree.** Compare `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `agent.md`, `README.md`, every `.agents/skills/*/SKILL.md`, `agent-contracts/`, `.agents/journals/*/STATE.md` and every JSON file under `docs/memory-layer/`. For payments, the account rule, the node map, the judge roster and the Date App status, list each place where two files disagree.
2. **Stale claims.** Search for wording like "0 paid", "zero customers", "no paying", "no outside payment", "all test charges", and for any place where `joshlcoleman@gmail.com` is described as the Square or PayPal account, or `ebaytrashortreasure@gmail.com` as the address for anything else. Report each with file and line.
3. **Known disagreements I already saw, to settle with Joshua rather than guess.** `CLAUDE.md` says the Date App is not for sale (ruling 2026-09-28) while Joshua's chat preferences still say it is for sale. The Mission Control sections name `192.168.0.8` and :9150 as live in places, while the T5500 rulings say Sabretooth is retired. The Hermes memory token `PAYMENTS-VERIFIED-square-2026-07-14` may still carry the old "no outside payment" claim; that lives on the node, not in the repo.
4. **Customer surfaces.** Check the live pages and public API copy for children, hospital, charity or mission wording, and for either email appearing where a support address should be. The archived `terms.html` under `archive/root-cleanup-2026-08-16/` lists a personal address for refunds; confirm no live page does. The Square location description reads "Social Platform for good"; report it only, because Square is Joshua's to edit.
5. **Code that reads payer type.** The new `friend_first` value is in `domains/youandinotai.com/backend/app/revenue_allocation.py` and `app/routers/health.py`. Search the dashboards, Mission Control and the marketing digests for anything that sums `payer_type` and would miss it, and list them.
6. **The PDFs.** Joshua's OneDrive folder `claude-to-claude` holds PDFs with every transaction and fee. Read them, read-only, and compare against `docs/PAYMENTS-TRUTH.md`: 17 attempts, 14 completed, 3 declined, 1 refund, gross captured $45.99, refunded $10.00, net $35.99 before $5.54 in Square fees. Report only differences, with amounts and dates. Do not copy, quote or commit anything from the statements.

## Rules while you work

- Payments stay read-only. Do not create, refund or test any charge. Do not re-audit the past test charges.
- Only Claude edits Claude's files (`CLAUDE.md`, `.claude/`, Claude's journals and memory). If one needs a change, write the request in your report and the Claude lane makes it.
- `docs/PAYMENTS-TRUTH.md` is protected: any change needs a `PROTECTED-CHANGELOG` entry and a re-anchored hash. Propose it in the report instead.
- No secrets, tokens or card digits in any file. No Anthropic API key anywhere.
- Fix what is plainly drift in your own lane's files; report everything else. Do not fix by deleting evidence.

## What to hand back

One file, `ops/handoffs/GEMINI-AUDIT-REPORT-2026-10-23.md`, in plain complete sentences with the outcome first. Mark each finding VERIFIED, UNVERIFIED or BLOCKED, with the file and line. Keep lists short and parallel. Finish with one bounded next action for Joshua.
