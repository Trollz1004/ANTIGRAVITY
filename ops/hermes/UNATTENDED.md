# Hermes: the unattended daily video

Rebuilt 2026-10-09. Read `RECOVERY-STATE.md` first for what the 2026-09-13 wipe
destroyed and what is still only bytecode.

## What fires, and when

| | |
|---|---|
| Scheduled task | `HermesDailyVideo` |
| Time | 06:30 local, daily |
| Runs | `scripts/hermes-youtube/run-daily.ps1` |
| Which runs | `python -m newsvideo.daily --unattended` (cwd `ops/hermes`) |
| Log | `ops/hermes/logs/daily-<YYYYMMDD-HHMMSS>.log` |
| Summary | `ops/hermes/DAILY-SUMMARY.md`, newest first |

`StartWhenAvailable` is on, so a morning missed because the machine was asleep
or off runs when it next wakes instead of being skipped. A late video is
recoverable; a missing one is not.

## Reading the result without opening anything

Task Scheduler's **Last Run Result** is the pipeline's exit code:

| Code | Meaning |
|---|---|
| 0 | video produced and shipped |
| 2 | a stage or a gate failed — nothing shipped |
| 3 | video produced and verified, but upload is not armed (no credentials) |
| 4 | bad invocation or environment (no ffmpeg, no day folder, …) |

Or ask the pipeline:

```powershell
cd C:\ANTIGRAVITY\ops\hermes
python -m newsvideo.daily --status
```

`--status` reports the last five mornings and counts the consecutive shipped
streak. It reports mornings that did **not** run, which a log directory cannot.

## The chain

```
preflight → source → parse → voice → render → verify → upload → summary
```

One process, one exit code, one packet per morning in
`ops/packets/hermes-youtube-<YYYYMMDD>/`. Every stage is verified against the
file it claims to have written before the next stage may start, so the chain
stops at the first broken artifact instead of carrying it forward.

**source** runs the story generator at
`<ANTIGRAVITY_RUNTIME_ROOT>/yesterday-news/yesterday-news-today.py`, which is a
launcher that delegates to the tracked generator at
`scripts/dashboard-aidoesitall/yesterday-news-today.py`. The generator pulls
yesterday's stories from RSS (Good News Network, Reasons to be Cheerful) and
writes `script.txt` + `metadata.json`; `source` then copies them into the repo
day folder and verifies them there. It only ever produces *yesterday* — any
other date must use `--no-source` against an existing day folder.

**voice** prefers OmniRoute TTS and falls back to local `edge-tts`
(`en-US-ChristopherNeural`). OmniRoute is currently unreachable on every
endpoint, so every run takes the edge path and logs a WARN. That warning is
expected and is not a failure.

## The gates

`ops/hermes/tests/test_gates_negative.py` proves the gates reject a 0-byte mp4,
a truncated mp4, silent audio, flat-black frames, an empty `script.txt`, and
malformed `metadata.json` — and that a real rendered video still passes. Run it
after any change to the chain or after a Python upgrade:

```powershell
cd C:\ANTIGRAVITY\ops\hermes
python tests\test_gates_negative.py
```

## Operating it

```powershell
# re-arm, or move the time
.\scripts\hermes-youtube\register-daily-task.ps1 -Time 06:30
.\scripts\hermes-youtube\register-daily-task.ps1 -Unregister

# run this morning's video now, exactly as the scheduler would
Start-ScheduledTask -TaskName HermesDailyVideo

# re-render one past day from its existing folder, no upload
cd C:\ANTIGRAVITY\ops\hermes
python -m newsvideo.daily --date 20261004 --no-source --upload off

# copy the pipeline somewhere a wipe cannot reach
.\scripts\hermes-youtube\backup-pipeline.ps1
```

## Known gaps

1. **Upload is not armed.** No `ops/youtube/.credentials/youtube-oauth.json`,
   so every morning ends at exit 3: rendered and verified, not published. This
   is TRO-3 and it is the only thing between here and a shipped streak.
2. **`newsvideo` is bytecode only** and locked to CPython 3.13. A Python
   upgrade breaks every module with no way to recompile. See
   `RECOVERY-STATE.md`.
3. **The bytecode is not in git** — `.gitignore` matches `*.pyc`, so the only
   copies are the working tree and whatever `backup-pipeline.ps1` has written.
4. **OmniRoute is down**, so narration is always the edge fallback and the
   generated-imagery path for thumbnails is untested (TRO-10, TRO-12).
