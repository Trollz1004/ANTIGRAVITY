## Watchdog review for TRO-7 — chain is NOT shipping; root cause found

**Disposition: TRO-7 stays open, and the blocker has changed.** `--status` exits 1, streak 0.

```
morning      result         detail
2026-10-08   NO RUN         no packet at C:\ANTIGRAVITY\ops\packets\hermes-youtube-20261008
2026-10-07   NO RUN         no packet ...20261007
2026-10-06   NO RUN         no packet ...20261006
2026-10-05   NO RUN         no packet ...20261005
2026-10-04   NO RUN         no packet ...20261004

consecutive shipped mornings, counting back from yesterday: 0
```

### Why NO RUN — the environment was wiped, not a stage failure

The watchdog instructions read NO RUN as "the scheduled task did not fire." It is worse than that. Four separate things the pipeline depends on are gone:

1. **The `HermesDailyVideo` scheduled task does not exist.** `schtasks /Query /TN HermesDailyVideo` returns "cannot find the file specified"; sweeping all 224 registered tasks matches nothing on `hermes`.
2. **The pipeline source tree was deleted on 2026-09-13 ~12:50.** Every `.py`, `.json`, `.ps1`, `.md` and `.mp4` under `ops/hermes/`, `scripts/hermes-youtube/`, `ops/hermes/out/*`, `ops/hermes/_work/*` and `ops/packets/hermes-youtube-*/` is gone. Only `.pyc` and `.log` files survived. `register-daily-task.ps1` is among the casualties, so the documented re-arm path no longer exists.
3. **Python's site-packages was emptied.** Only `asyncpg` and `pip` remain in CPython 3.13.15.
4. **`ffmpeg` and `ffprobe` are no longer installed.** Not on PATH and not present under `C:\ffmpeg`, `C:\Program Files\ffmpeg`, `C:\ANTIGRAVITY\tools`, scoop shims, chocolatey bin, or WinGet links. The shared context in this issue states ffmpeg is on PATH; that is no longer true.

None of it is recoverable from git — `ops/hermes` is untracked/ignored, so there is no commit to restore from.

### Last known-good state, for comparison

The chain itself was healthy right up to the wipe. `ops/hermes/logs/daily-20260913-063001.log` is the final run and it cleared every stage:

```
stage parse:  OK -- 5 stories
stage voice:  OK -- backend=edge (omniroute: HTTP 400: No credentials for provider: openai; edge: ok)
stage render: OK -- 20260912.mp4 (94.003s, 12727510 bytes)
stage verify: OK -- 23 gates passed: 94.003s, 1080x1920, mean audio -19.3 dB, min luma stddev 39.11
stage upload: BLOCKED -- no YouTube credentials (TRO-3)
exit 3
```

So the pre-wipe failure was only the expected NOT ARMED / TRO-3 publish gate — which the watchdog instructions correctly say is not a chain failure. Mornings 09-14 through 10-08 produced nothing at all because the code, the dependencies, the renderer and the schedule were all gone.

### Recovery completed this heartbeat

- **Restored executable modules from the surviving bytecode** via Python's sourceless import path: copied `__pycache__/*.cpython-313.pyc` to `<module>.pyc` in `ops/hermes/newsvideo/` (8 modules: `__init__`, `daily`, `design`, `gates`, `meta`, `parse`, `render`, `tts`) and in `scripts/hermes-youtube/` (8 modules: `assemble`, `clean_script`, `gen_avatar`, `narrate`, `omniroute`, `run_pipeline`, `visuals`, `write_packet`). The interpreter on PATH is CPython 3.13.15, matching the `cpython-313` magic, so the bytecode loads and runs.
- **Recovered the dependency list out of the bytecode itself** by walking `IMPORT_NAME` opcodes: `Pillow`, `edge-tts`, `requests`. Reinstalled all three — free PyPI packages, no SaaS and no spend.
- `python -m newsvideo.daily --status` and `--help` execute again; the status table above is real output, not a reconstruction.

### Verification attempt and where it stopped

I ran a real render of yesterday with publishing disabled to test the restored chain:

```
$ python -m newsvideo.daily --date 20261008 --upload off
01:41:26 [INFO] hermes daily run for 20261008 (upload=off, tts=auto)
01:41:26 [ERROR] stage preflight: FAILED -- ffmpeg is not on PATH
01:41:26 [INFO] packet (log only): C:\ANTIGRAVITY\ops\packets\hermes-youtube-20261008
01:41:26 [INFO] exit 4
```

Preflight is doing its job and failing loudly, which is exactly the behaviour step 2 of this issue asked for. It cannot get past ffmpeg.

### What is still broken, and who owns each piece

1. **ffmpeg/ffprobe must be reinstalled.** Nothing renders without it. This is the top blocker. Installing it is a machine-level change, so I am not doing it unprompted — say the word and I will, or install it yourself and I will pick up from there.
2. **Nothing is scheduled.** Re-arming the morning run means registering a fresh scheduled task, since `register-daily-task.ps1` is gone. I have not created one: registering a system task that renders and — once TRO-3 lands — publishes to YouTube is your call, not something to silently re-add.
3. **No readable source.** The pipeline executes but cannot be edited or debugged. Python 3.13 has no working decompiler, so the realistic options are (a) restore the `.py` files from a backup, Recycle Bin or File History copy, or (b) rewrite the modules from the surviving `SKILL.md` spec, using the bytecode as reference. A search of likely backup locations is still running; I will report what it finds.
4. **The done-condition is at least three mornings out** from whenever items 1 and 2 are fixed, since it needs three consecutive shipped mornings.

### Separate flag: TRO-9 may be closed prematurely

TRO-9 ("Get a real narration voice") is marked **done**, but the last real run shows OmniRoute TTS still returning `HTTP 400: No credentials for provider: openai` and the pipeline silently falling back to the `edge` backend. TRO-10 (the OmniRoute TTS credential) is still blocked. The narration that actually shipped was edge, not the intended tts-1-hd.

---

### Addendum — two more dependencies are down

Checked after the render attempt failed:

- **OmniRoute is unreachable on both endpoints.** `http://127.0.0.1:20128/v1/models`
  and `http://192.168.0.8:20128/v1/models` both fail to connect. The visuals
  stage (`/images/generations`) needs it. Narration survives via the local
  `edge` fallback, which is how 20260912 actually shipped.
- **The upstream story source has stopped too.**
  `C:\Users\joshi\Documents\ANTIGRAVITY-RUNTIME\yesterday-news\content\` ends at
  `20260912`, the same date as the wipe. Even with ffmpeg restored there is no
  story data for any morning after that until the generator is running again.

So the re-arm checklist is: install ffmpeg/ffprobe, bring OmniRoute back up,
restart the story generator, register a new scheduled task, then let three
mornings run. TRO-3 (YouTube OAuth) is still needed for the publish step but
does not block the render chain.

### Control-plane note

This heartbeat fired as a bare timer with no task binding, and TRO-13 is checked
out by a different run (`1ce2c478-851d-4b2c-8941-8fde5d3cdc8d`), so comment and
status writes were rejected — first with
`cross_issue_influence_run_context_required`, then with
`Issue run ownership conflict`. That is why this review is on disk rather than in
the issue thread. It should be carried into TRO-7 and TRO-13 on the next
task-bound run.
