# DREAM STUDIO — Hermes YouTube Automation Editor/Creator (Design)

Status: PROPOSED (awaiting Josh approval before build)

## Intent & why

Hermes's flagship YouTube automation. The epic tools are otherwise called one-at-a-time. DREAM STUDIO
chains them into one visible loop — research a site, make a video, publish it, learn from it — on a
GUI Josh can watch, with every stage proven by a real screenshot/render, never "200 OK".

## Goals / non-goals / anti-goals

- GOAL: one end-to-end run — research one site -> produce one Short (<=59s) -> show it rendered in the GUI.
- GOAL: AI (Hermes + Gemini via agy) verifies VISUALLY at every gate (thumbnail, script, video frame, GUI).
- NON-GOAL: replace the YouTube Data API gate, the <=59s Shorts rule, or the natural-female-voice rule.
- ANTI-GOAL (failure even if it works): publishes anything Josh hasn't seen rendered. Slop. Fake "done".

## The pipeline (4 loops)

1. **RESEARCH** — `REA` reverse-engineers a site (analyze_web_bundle, capture_web_screenshot) + `remake`
   captures a reference layout for clean-room feature study + `last30days`/`agent-reach` (run by official Claude/Gemini lanes only) for trends. Output: insight cards
   (hook, angle, headline patterns) with a screenshot of the source.
2. **PRODUCE** — script via `humanizer` + `non-slop-marketing-content` -> avatar (ComfyUI image ->
   video_gen talking head, or Kokoro/Gemini natural female TTS) -> `hyperframes` renders the video
   (motion, captions, transitions) -> `Dreamforge` generates world-art B-roll. Output: playable preview.
3. **PUBLISH** — YouTube Data API v3 `videos.insert` (`private` only), multi-channel (DREAM Online / Online Recycle Tech /
   AI Dream Team Studio), <=59s gate, one-click Josh approval. Output: thumbnail + private upload waiting for Studio review.
4. **ANALYZE** — REA inspects performance + competitor response -> loops back to RESEARCH.

## The "CLI anything" / visual-verification gate (the key requirement)

Every artifact emits a real pixel: screenshot or rendered frame. The AI must SEE it before it calls
anything done. Rule One: done = Josh would accept the live rendered view.

- Research -> screenshot of the source site + the extracted insight.
- Produce -> a rendered video frame (not "video ready").
- Publish -> the actual thumbnail image + the upload's YouTube ID.
- GUI -> a live screenshot of every panel.

Tooling for this already exists here: `browser_exec` (CDP screenshot), `vision_analyze`, REA
`capture_web_screenshot`, HyperFrames frame extraction. "CLI anything" (Gemini's Alienware skill) is
the same idea; once I get its name/repo I'll wire it in — but the gate does not block on it.

## GUI — approach B (fresh cross-node web dashboard)

A web dashboard served locally on Sabretooth (host address in the node env file). Drives the existing
`youtube-shorts-podcast-engine` + `apps/hermes-leadgen` server; does not fork them.

- **Research panel** — site capture + insight cards (with source screenshots).
- **Produce panel** — script editor -> avatar picker -> HyperFrames render -> playable preview.
- **Publish panel** — channel select, <=59s indicator, thumbnail preview, one-click approve (`private` upload only).
- **Analyze panel** — performance + loop-back suggestions.

High-contrast (Josh's rule): #121316 bg, #F5F7FA text, >=18px body, #00E5A3 one-click buttons, no dense tables.

## CLI-Anything bridge (AI's interface — the text-in/text-out layer)

DREAM STUDIO mirrors the DREAM-Engine pattern: a CLI-Anything-compliant CLI
(`ops/cli-anything/dream-studio-cli.ts` -> `executeCliAnythingCommand`) so any AI (Hermes, Gemini
via agy, Claude) drives it text-in/text-out — no Playwright, no guessing. Same contract: returns
`{ textOut, jsonOut, exitCode }`, `--json` for machine output.

Command set maps to the 4 loops, one verb each:

- `studio inspect --url <site> --json` -> research (REA + remake) -> `jsonOut`: insight cards + source screenshot path.
- `studio produce --script <file> --avatar <id> --style <n> --json` -> script -> avatar -> HyperFrames render -> `jsonOut`: preview path, duration, <=59s status.
- `studio publish --channel <slug> --approve --json` -> YouTube Data API (`private` only) -> `jsonOut`: videoId + thumbnail path.
- `studio analyze --video <id> --json` -> metrics + loop-back suggestion -> `jsonOut`.
- `studio gui --json` -> dashboard URL + a fresh screenshot path.

"Seeing" = every `jsonOut` carries artifact paths (screenshot / render / thumbnail / videoId); the
AI reads the path and vision-checks the pixel. The GUI is the same engine's human mirror — Josh and
the AI look at the same render, from two interfaces.

## The skill

`dream-studio-youtube-automation` — encodes the loop as a reusable Hermes skill (which tool skills to
load, the visual gates, the <=59s + female-voice rules), so any node can run it.

## Build order (after approval)

1. Spike the web dashboard skeleton + the visual-gate helper (emit a screenshot per stage).
2. One end-to-end run: research one real site -> script -> avatar -> HyperFrames render -> show it.
3. Wire publish (YouTube Data API, existing gate) + the analyze loop.
4. Encode the skill + the GUI, and hand Josh a live screenshot of every panel.

## Blocked on

- The "CLI anything" skill name/repo (Alienware node address in the node env file).
- Josh picking the GUI approach (recommended B) — already asked, awaiting word.
