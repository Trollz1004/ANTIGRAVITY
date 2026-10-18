# Hermes pipeline: recovery state (2026-10-09)

Read this before touching `ops/hermes/` or `scripts/hermes-youtube/`.

**Status: the pipeline renders end to end again, and it is scheduled again.**

Verified 2026-10-09 01:58 — `--date 20261008 --upload off` exited 0, 23 gates
passed, and produced a real playable mp4 (`ffprobe`: h264 / yuv420p / 1080x1920
/ aac / 83.619s / 11,516,379 bytes).

Then verified 2026-10-09 02:09 through **Task Scheduler**, cold start, with the
repo day folder moved aside so `stage source` had to do real work:
`logs/daily-20261009-020959.log` — sourced 20261008 from the generator, 23 gates
passed, exit 3 (upload not armed). `HermesDailyVideo` is registered and the
re-arm script exists again. See `UNATTENDED.md`.

The only thing now between this and a shipped streak is TRO-3 (YouTube OAuth).

## What happened

On **2026-09-13 ~12:50** something deleted every file under `ops/hermes/`,
`scripts/hermes-youtube/`, `ops/hermes/out/*`, `ops/hermes/_work/*` and
`ops/packets/hermes-youtube-*/` **except** `.pyc` and `.log` files. The Python
site-packages was emptied in the same period, and the `HermesDailyVideo`
scheduled task was removed.

`ops/hermes` is untracked and gitignored, so there is nothing to `git restore`.
A search of `C:\Users\joshi\Documents\ANTIGRAVITY-RUNTIME`, OneDrive, `D:\`,
`.scratch` and `Documents` found no surviving `.py` or `.ps1` copies.

Last pre-wipe run: `logs/daily-20260913-063001.log` (rendered 20260912,
94.003s, 23 gates passed, publish blocked on TRO-3 only).

## What was restored

The code runs again, but **only as bytecode**. The `.pyc` files in each
`__pycache__/` were copied up one level as `<module>.pyc`, which Python still
imports via the sourceless path:

- `ops/hermes/newsvideo/` — `__init__`, `daily`, `design`, `gates`, `meta`,
  `parse`, `render`, `tts`
- `scripts/hermes-youtube/` — `assemble`, `clean_script`, `gen_avatar`,
  `narrate`, `omniroute`, `run_pipeline`, `visuals`, `write_packet`

This works **only on CPython 3.13** (the magic is `cpython-313`; verified on
3.13.15). A Python upgrade will break every one of these modules with no way
to recompile.

The third-party dependency list was recovered by walking the `IMPORT_NAME`
opcodes in the surviving bytecode and is in `requirements-recovered.txt`:
`Pillow`, `edge-tts`, `requests`. All three were reinstalled.

## Corrections to the first pass of this document

The first version of this file (written earlier the same morning) got three
things wrong. Corrected here so nobody chases the wrong blocker:

1. **ffmpeg is installed — but it was genuinely absent until 2026-10-09 ~01:50,
   not merely hidden behind a stale PATH.** Both readings have been true on this
   machine the same morning, so be precise about which one you are looking at:

   - Until ~01:50, `Gyan.FFmpeg` was **not installed at all**. `Get-Command
     ffmpeg` found nothing, and `WinGet\Links` held only `agy.exe`. It was
     installed during TRO-7 with `winget install --id Gyan.FFmpeg`, which
     reported a fresh download of 9.0.2 and "Path environment variable
     modified" — not a no-op on an existing install.
   - *After* that install, the stale-PATH effect described here is real and is
     the thing to watch: winget edits the persisted user PATH, but an
     already-running process keeps its old environment block and still sees no
     ffmpeg.

   `run-daily.ps1` handles both cases: it rebuilds PATH from the registry, then
   falls back to searching `WinGet\Packages` for `ffmpeg.exe`, and hard-fails
   with exit 4 before the chain starts if it still cannot find it.
2. **The story source is not stale.** `yesterday-news-today.py` generates the
   day folder on demand; `stage source` wrote `20261008` without complaint. The
   earlier "content ends at 20260912" reading was just the folders that happened
   to be cached at the time.
3. **OmniRoute being down does not block rendering.** The render completed with
   all 23 gates while OmniRoute was unreachable. Narration falls back to the
   local `edge` backend and the visuals stage still produced passing frames.

## What is actually still missing

1. ~~**Nothing is scheduled.**~~ **Fixed 2026-10-09 (TRO-7).** This was the one
   real cause of the `NO RUN` mornings. `HermesDailyVideo` is registered again,
   06:30 daily, with `StartWhenAvailable` so a morning missed to sleep runs late
   rather than never. `register-daily-task.ps1` and a new `run-daily.ps1`
   wrapper were written from scratch; the wrapper pins PATH, tees a log to
   `logs/daily-<stamp>.log`, and passes the pipeline exit code through to Task
   Scheduler's "Last Run Result".

   Also fixed in the same pass: the missing pip dependencies (`feedparser`,
   `httpx`, `numpy`, `google-auth`, `google-auth-oauthlib`,
   `google-api-python-client`), and the **generator lookup path**. The generator
   was never lost — `stage_source` looks for it at
   `<runtime root>/yesterday-news/yesterday-news-today.py` and only that copy was
   wiped, while the real one is tracked in git at
   `scripts/dashboard-aidoesitall/yesterday-news-today.py`, outside the blast
   zone. A launcher now sits at the expected path and delegates to it. It is a
   launcher rather than a copy on purpose: the generator resolves `REPO_DIR` as
   `Path(__file__).parents[2]`, so a copy under the runtime root would resolve
   that to `C:\Users\joshi` and miss the repo `.env`. `newsvideo` is bytecode,
   so the lookup path itself cannot be repointed.

   The gates are proven again by `tests/test_gates_negative.py` — 7/7: 0-byte
   mp4, truncated mp4, silent audio, flat-black frames, empty `script.txt` and
   malformed `metadata.json` all rejected, and a real rendered video still
   passes. The pre-wipe evidence for these cases died with the artifacts it
   referenced, so this test replaces it.

2. **No readable source** for the eight original modules. They execute but
   cannot be edited or debugged. Python 3.13 has no working decompiler. Options:
   restore `.py` files from a backup that has not been found yet, or rewrite
   from `.agents/skills/hermes-youtube-faceless-news/SKILL.md` using the
   bytecode as reference. The disassembly under `_recovery/bytecode/` is
   readable enough to recover exact call contracts — that is how the generator
   path above was found.

   **Rebuild started 2026-10-09 23:30.** The first module back in real source is
   `newsvideo/status.py`, with `newsvideo/test_status.py` (18 tests, stdlib
   `unittest` because pytest is not installed). It replaces
   `daily --status`, which **misreported healthy mornings as failures**: a run
   with `--upload off` records upload stage `SKIPPED` and `exit_code 0`, and the
   old reader called that `FAILED -- stages: unknown` (seen on 20261004). Both
   TRO-7's done-condition and the task watchdog's close rule read that output,
   so a false `FAILED` would keep a healthy chain from ever closing out.

   The new reader distinguishes five states and only `SHIPPED` counts toward the
   streak:

   | result | meaning |
   |---|---|
   | `SHIPPED` | published; counts toward the three-morning streak |
   | `NOT ARMED` | rendered + verified, no YouTube credentials (TRO-3) |
   | `LOCAL ONLY` | rendered + verified, `--upload off` by choice |
   | `FAILED` | a stage or gate actually failed; names which |
   | `NO RUN` | no packet — the scheduled task did not fire |

   A real stage or gate failure outranks the publishing state, so a 0-byte or
   silent render can never be dressed up as `NOT ARMED` (covered by
   `test_zero_byte_mp4_cannot_pass_as_not_armed`). A `*` marks mornings that
   Task Scheduler fired rather than a human — which is the actual evidence
   TRO-7 asks for. Run it with:

       cd C:/ANTIGRAVITY/ops/hermes && python -m newsvideo.status
       cd C:/ANTIGRAVITY/ops/hermes && python -m unittest newsvideo.test_status

   Exit 0 still means "three consecutive shipped mornings", so it is a drop-in
   replacement for the watchdog's check. **The watchdog instructions on TRO-7
   still name `daily --status` and should be repointed at `newsvideo.status`.**

2b. **The bytecode is still not in git.** `.gitignore` line 6 (`*.pyc`) matches
   it, so the working tree plus whatever `backup-pipeline.ps1` has written are
   the only copies. Force-adding it is a repo-policy call for the user and has
   not been made. Until then, run
   `scripts/hermes-youtube/backup-pipeline.ps1` after any change; it writes a
   timestamped copy to `~/Documents/ANTIGRAVITY-RUNTIME/hermes-pipeline-backup/`
   (first backup taken 2026-10-09 02:14, 88 files).
3. **OmniRoute is back up, but has no OpenAI provider credential.**
   *Updated 2026-10-09 23:20 — the earlier "nothing is listening" reading in
   this file is stale.* Something is now listening on `0.0.0.0:20128` (pid
   25940); `GET /v1/models` returns `401 Authentication required` without the
   key, which is correct behaviour, and `127.0.0.1` and `192.168.0.15` both
   answer (`192.168.0.8` does not — that address appears to be wrong in the
   TRO issue descriptions). The remaining gap is narrower than "down": the
   06:30 run logged `HTTP 400: No credentials for provider: openai`, so
   narration still silently falls back to the local `edge` backend instead of
   the intended `tts-1-hd`. That missing provider credential is TRO-10, not
   TRO-7. Note `omniroute` is still absent from the npm global dir, so whatever
   is serving :20128 is being started some other way.
4. **Publishing is still blocked on TRO-3** — no
   `ops/youtube/.credentials/youtube-oauth.json`. Predates the wipe; expected.
5. **All pre-wipe rendered mp4s and packet `run.json` files were lost.** Only
   `run.log` survived in each old `ops/packets/hermes-youtube-*/`, which is why
   `--status` reports `NO RUN` for mornings that did in fact render before the
   wipe.

## Do not delete the `__pycache__` directories

They are currently the only copy of this pipeline's logic.
