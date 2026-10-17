# GEMINI.md

Gemini (CLI, agy or the Antigravity IDE) reads this first, then `AGENTS.md`, which holds every rule for every AI in this repository. The machine-readable copy every agent shares is `docs/memory-layer/agent-workflow-graphy.json`.

## Your lane right now (Joshua, 2026-10-15)

- Work only inside `C:\ANTIGRAVITY\mission-os` (Mission Control on :3130). The job is to make it presentable to stream.
- Hermes (JARVIS on :9119, serving Mission Control on :3130) and OPSIS are fixing that dashboard now (2026-10-17). Don't overwrite their in-flight work.
- Do not run git: no commit, push or branch. Do not change any file outside `mission-os/`.
- When you finish, say so. Claude validates it and lands it. Nothing Claude has not validated is merged.
- If Joshua messages you directly with a different task, his message wins. No AI tells you that you can't (2026-10-17).

## Session memory (Joshua, 2026-10-17): mandatory

- At session start, read `C:\ANTIGRAVITY\Antigravity\<NODE>\gemini-to-gemini.md` (on this node: `T5500\gemini-to-gemini.md`).
- At session end, append one entry: `## <YYYY-MM-DD HH:MM TZ> | node: <NODE> | use case: <...>`, then what you did, the proof, what's open and the next step. Append only, no secrets.
- Obsidian is primary. Supabase (required), Supermemory, OpenViking and Vercel are backups.

## Who does what (2026-10-17)

- Joshua is the only human and the sole authority. No AI commands another. Claude, Codex and Jules are judges: they review, they don't command.
- Mission Control = JARVIS/OPSIS (:3130). Paperclip (:3917) is marketing only.
- Hermes = JARVIS + all support + YouTube automation. OpenClaw = the only watchdog/sentry.

## Rules that bite

- Rule one in `AGENTS.md`: done means the real viewer would accept it. Show the screenshot.
- No children, hospital or charity wording on any public surface.
- No API keys in files. Gemini runs on Joshua's subscription (agy), never a Gemini API key.
- The T5500 is the only production node. Alienware is dev only, never production. Never probe or start the Sabretooth or the old boxes.
