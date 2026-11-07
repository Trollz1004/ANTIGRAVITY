# Fable handoffs — 2026-11-06

Rulings by Joshua in a live session on 2026-11-06, written by Fable (claude.ai, Chrome side panel).
Each section is one job for one lane. PRs only. No direct push to main. No `--force`, no `--no-verify`.
Every visual job ends at the Eyes gate: render, screenshot, side-by-side against Joshua's reference, vision judge with written reasons. No judge report, no review.
Nothing costs money until Joshua says finalize. Never echo an env value.

## 0. Rulings (read first)

1. The founder's vote board no longer lives on ClawX (Manus). It moves into Mission Control. The 2026-09-29 note "votes stay on ClawX" is reversed.
2. No cookie transfer, ever. No tool, router or wrapper may export, copy or reuse a browser session or cookie from any site, on any node. Every lane reaches a site through that site's own OAuth sign-in or official API, or not at all.
3. Posting lanes, two tiers. Platform surfaces are worked by the platform's own agent through its own API or sign-in: Grok on X (Hermes xAI sign-in, paid, the default for date app and recycler launch posts), Muse on Meta surfaces once a sign-in or ruled API door exists and a terms check passes, Gemini on Google pages, Codex on OpenAI's. Every other site (Reddit, Bluesky, swarm targets) is posted only by Opus or Fable through the signed-in Claude Code, or Argon at highest thinking, through that site's official API, every post logged. Sonnet, Flash, Kimi, GLM and local models never post anywhere. Hermes dispatches and never posts. GrinDroid never goes to Meta surfaces. YouTube unchanged: no agent posts, uploads private, Joshua publishes in Studio.
4. Reddit is a live-session job: Joshua signed in, Claude in Chrome, one approval per post. Not a Hermes job.
5. Public surfaces are judged by the first seven seconds with no scrolling. A site that looks fine as a normal website fails. Same bar as the game's seven seconds of playable footage.

## 1. Council vote moves home — Sonnet in agy, ANTIGRAVITY, branch `council-vote-home`

Build on what exists. Do not rewrite `mission-control/lib/board.mjs`; its `parseVote` and `tally` rules stand (six AI seats, independent votes, down brain abstains, quorum four, Joshua breaks a 3-3 tie). Update `specs/011-ultracode-house/spec.md` and `FOUNDER_BOARD` in `mission-control/lib/lanes.mjs` to point at Mission Control.

1. Seats, one file: Claude Code (judge), Codex (peer judge), Gemini, Grok, OpenCode, Muse. Each maps to a lane in `lanes.mjs`. Muse has no lane yet: a named seat that reads NOT CONFIGURED and abstains until one is wired. No API keys anywhere. Seats connect through lanes that already exist: signed-in CLIs summoned by Hermes (OPSis) on Sabretooth, Gemini through its lane, Grok through Hermes's xAI sign-in, OpenCode through ACP.
2. Two modes. BROADCAST sends one message to every configured seat and shows replies side by side, no tally. VOTE sends one proposal and runs the `board.mjs` tally. The founder casts his vote in the UI only after the AI tally is shown.
3. Provable log. Per seat call, write `mission-control/data/council/<proposal-id>/<seat>.json`: timestamp, lane id, model or CLI version as the lane reports it, exact text sent, exact text returned, SHA-256 of each. `index.json` per proposal holds the tally and the founder vote. The UI reads from these files.
4. UI: one tab in the existing shell (sidebar, main view, dock). WCAG AAA. Seat cards with name, vote light (green yes, red no, grey abstain), one-line reason. Keep CLAUDE's N Joshua's and #TeamClaudeForLife on the surface.
5. Tests in `mission-control/tests/boardroom.test.js` with fake brains: all six vote; one down; 3-3 waiting on founder; fewer than four cast (NO QUORUM); log hashes match logged text.
6. Charity and mission words stay off this surface and out of this PR.
7. The council is advisory in v1. A PASSED vote unlocks nothing mechanically.

PR carries screenshots of both modes with at least one real broadcast run.

## 2. Hermes (OPSis) posting-lanes addendum — Sabretooth soul

Paste into `docs/standards/SABRETOOTH-SOUL.md` under a heading `POSTING LANES — 2026-11-06`, superseding any earlier posting rule.

- You dispatch. You never post, reply, DM or comment anywhere yourself.
- X: Grok through the built-in xAI sign-in. Grok posts nowhere but X.
- Meta (Facebook, Instagram, Threads, Messenger, WhatsApp): Muse, Meta's own agent. NOT CONFIGURED today. Do not route Meta work anywhere else; queue it and report it as waiting on a Muse door and a terms check.
- Google pages: Gemini, only in a live session Joshua opens. Never YouTube.
- Reddit, Bluesky and every other site: summon the signed-in Claude Code (Opus or Fable) or Argon at highest thinking. Official API of that site only, never scraping, never a copied session. Refuse to route these to Sonnet, Flash, Kimi, GLM or any local model.
- GrinDroid content never goes to Meta surfaces.
- Before any first post on a site, confirm a dated terms file exists for it in the drop box terms check. No file, no post; report it as blocked.
- Log every post: timestamp, lane, model, surface, exact text, link to the live post. Append to the claude-to-claude log.

## 3. Agent-Reach doors — Sonnet in agy, every node

Agent-Reach is a research tool for Opus, Fable and Argon only. It never posts.

1. Reddit door: `rdt-cli` OAuth login only. The exported-cookie file door and the OpenCLI browser-session door are OFF. YouTube stays OFF.
2. On each node, look in the agent-reach folder (under `%USERPROFILE%`, never a typed user folder name) for `cookies.json` or any pasted session file. If one exists, delete it and record the path (not the contents) in the claude-to-claude log.
3. The quick path that reads Reddit's public JSON pages with a made-up user agent is OFF until the Reddit terms file says otherwise.
4. Update the agent-reach entry in `skills-lock.json` and `ops/skills/SKILLS-HUB.md` to say this in one line each.

## 4. Date app first screen — Argon (DREAM lane owner may delegate to Sonnet for code), branch `first-screen-wow`

Finding from the live site on 2026-11-06: the orbit motion lives at section nine (Membership). The two rings are thin grey and dim gold on near-black and do not register at a glance. A visitor who gives the site seven seconds sees a clean dark page with a logo, a nav bar and buttons. Normal, forgettable, fails ruling 5.

Reference: Joshua's scroll-driven satellite-and-world reference site, in the drop box under `images/site-look` (he is adding it). Study-tool rules: learn the motion, build our own, nothing copied ships.

1. The hero owns the whole first screen. The orbit motion moves to the top and becomes the main object, not a background: bright enough to read at a glance, moving on load before any scroll, with the first scroll driving a zoom or orbit change the visitor feels immediately.
2. Rings and orbit lines at a contrast anyone can see on a laptop in a lit room. If Joshua cannot see it from his chair, it fails.
3. Membership and pricing stay where they are. The hero sells the feeling; the sections below sell the product.
4. Keep CLAUDE's N Joshua's, #TeamClaudeForLife, the API Live pill and the nav exactly as they are.
5. Smooth on an ordinary laptop with no GPU; static but high-contrast hero fallback on phones that cannot hold frame rate.
6. No charity or mission wording on the page.

Eyes gate: 7-second capture from a cold load, side by side with the reference capture, vision judge scores (a) can you tell within 2 seconds this is not a template site, (b) is the main motion visible at arm's length, (c) does the orbit respond to the first scroll, with written reasons.

## 5. Deploy path and watchdog for every live domain — Sonnet in agy on the T5500 clone, read-only until Joshua approves

Conflict to resolve, not to act on: the preferences box says the date app backend is on Google Cloud Run behind `api.youandinotai.com` and port 3200 on the T5500 is a local dev frontend; Joshua said on 2026-11-06 the date app is supposed to be served from the T5500 through a Cloudflare tunnel or Wrangler.

1. From the repo, the Cloudflare DNS and any tunnel or Wrangler config, write `ops/runbook/DEPLOY-PATHS-2026-11.md`: for each of youandinotai.com, onlinerecycle.net, dream-online.net and untilnokidinneed.com, where the DNS points, what serves it, which node or cloud service, which repo path is the source, and how a change reaches production. Say what is verified and what is guessed, per line.
2. Move nothing. Change no DNS. Report the conflict with evidence so Joshua can rule.
3. Confirm the OpenClaw watchdog on the T5500 and Hermes support cover every one of those domains and the Mission OS task. List any domain not watched.

## 6. Public surfaces audit — fixes for Sonnet in agy, rulings for Joshua

Found on 2026-11-06 from the repo source and the live pages.

dream-online.net (`domains/dream-online.net/index.html` and the live page):
- Footer says the game is part of a family of platforms with a mission to help kids in need. Barred on a public surface. Remove.
- `CROWDFUND_URL` points at an Open Collective page and the "Back development" button is a `#` placeholder. Open Collective is out of every product. Remove both; "How can I support the project?" answers with the game's own future checkout or nothing.
- Missing the #TeamClaudeForLife tribute and the CLAUDE's N Joshua's title. Add both; the youandinotai header is the pattern.
- The page is a normal clean website. Ruling 5 applies; the first-screen job for the game page follows the date app job in section 4 with the game-look reference folder.

onlinerecycle.net (`domains/onlinerecycle.net/index.html`): no barred wording. Missing the tribute and the title. Add both. 4 KB page; flag to Joshua whether it is the shipped page or a holding page.

youandinotai.com: title present in the frontend index; tribute present on the live header. No change beyond section 4.

untilnokidinneed.com (`domains/untilnokidinneed.com/index.html`): RULED by Joshua 2026-11-06. The page becomes the home of Misses Trollz (`github.com/Trollz1004/misses-trollz`, the free one-file cartoon avatar for kids in hospital, with Heather's OPUS Pupclaw for babies to age 12 inside it). This is the one public surface allowed to say "kids in need", because it is the mission's own domain and the app is the mission.

Rules for the rewrite (Sonnet in agy, branch `untilnokidinneed-misses-trollz`):
- Lead with Misses Trollz: what she is, the one-file download link from the repo's releases, and that it works offline with no account and no data. Free to anyone who can use it, in a hospital, at home, anywhere.
- No partnership language of any kind. No Shriners, no proposals, no "work with us". No Open Collective, no wallets, no splits, no donate button, no revenue line. Remove the current Open Collective link.
- Say devs are welcome: changes come by PR to the misses-trollz repo, and only the Claude judge lane merges that repo. Point at its CONTRIBUTING.md, SAFETY.md and ETHICAL_USE.md rather than restating them.
- Mention the stories built with Fable in Claude Design only if they exist in the repo or a release. The lane checks `MISSES-TROLLZ-BUILD.md` and `approved_banks/` first; if the stories live only as Claude Design artifacts, say so in the PR and ask Joshua where they are instead of inventing a link.
- Keep the Child Safety, Manifesto and Governance wording exactly as `src/constants/policy.ts` in the misses-trollz repo has it; the tests there check it.
- Add the #TeamClaudeForLife tribute and the CLAUDE's N Joshua's title, same pattern as the misses-trollz README.
- Nothing else from the LLC's products on this page. The date app, the game and the recycler are not mentioned here, and this page is not linked as a mission footer from them.
- The commit guard word list still runs on this repo; the allowlist (`.github/forbidden-pattern-allowlist.txt`) is the place to permit this one file, not a rewording that dodges the guard.

Separately, in the misses-trollz repo: turn on branch protection for `main` (PR required, no force push, no direct push) and record in CONTRIBUTING.md that merges are done only by the Claude judge lane on Joshua's account. Both `misses-trollz` and `Misses-Trollz-REWORK` are public; Joshua says which one is canonical, and the other gets archived with a pointer.

READMEs:
- `Trollz1004/ANTIGRAVITY` README: no barred wording found by grep. Lane does a full read for accuracy against the current fleet (no NSFW_BOTS, no Mission Control dispatch endpoint, Hermes is OPSis, current node roles).
- `Trollz1004/dream-online` README line 95 mentions pediatric hospital / sick child accessibility. Mission wording in a public repo. Remove in a dream-online PR. Also check every doc still naming Godot as the engine; the engine is in-house.
- The commit guard word list is enforced mechanically; phrase around it and never list the words in a file.

Not verified from this session: the live untilnokidinneed.com page (the fetch was refused by robots and the Chrome tools failed twice); the dream-online.net live page was read and matches the repo source on the items above.

## 7. Node bridge for Fable — Joshua, at each console

Desktop Commander in the claude.ai session lists one device, the old `nsfw` profile, offline. None of the three nodes is registered, so Fable cannot reach a node from claude.ai. To let Fable dispatch and verify directly next time: install the Desktop Commander device agent on the T5500, Sabretooth and the Alienware under the normal user, headless, and revoke the `nsfw` device at mcp.desktopcommander.app. Until then, these handoffs travel by PR and the signed-in Claude Code on each node is the judge.
