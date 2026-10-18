# Narration voice comparison — 2026-10-10

TRO-9's Done criterion asks for "a side-by-side sample against the SAPI baseline so
the user can hear the difference before we commit." This is it. Ten wavs, same
sentence, same format as the pipeline (mono 22050 Hz pcm_s16le).

Regenerate with `python ops/hermes/_voice/make_samples.py`.

## Listen in this order

| # | file | what it is | seconds |
|---|---|---|---|
| 1 | `sapi-BASELINE.wav` | the robotic fallback, for contrast | 22.356 |
| 2 | `edge-christopher-DEFAULT.wav` | **what ships today** | 21.648 |
| 3 | `edge-andrew-NEW.wav` | Microsoft's newer conversational voice | 19.512 |
| 4 | `edge-brian-NEW.wav` | newer, warmer read | 20.616 |
| 5 | `edge-guy.wav` | classic news-anchor read | 20.856 |
| 6 | `edge-eric.wav` | | 21.984 |
| 7 | `edge-steffan.wav` | | 22.056 |
| 8 | `edge-roger.wav` | slowest of the set | 23.184 |
| 9 | `edge-aria.wav` | female, news-styled | 22.056 |
| 10 | `edge-michelle.wav` | female, warmer | 20.784 |

Durations are `ffprobe` readings, recorded in `manifest.json`. #1 vs #2 is the
comparison the issue actually asked for; #3 and #4 are the free upgrade worth
considering. All ten files are byte-distinct (verified by hash — `steffan` and
`aria` happen to share a size, not content).

The text is real copy from `content/yesterday-news/20261009/script.txt`, with the
feed's HTML stripped the way `newsvideo/parse.strip_html` does it.

## The OmniRoute finding: the Google key now works, the quota does not

TRO-9's description says the Google speech route returns `401 — credential missing
or expired`, and that it is "one valid key away from working". **That is out of
date.** Probed 2026-10-10 20:52 UTC against `http://127.0.0.1:20128/v1/audio/speech`:

```
google/gemini-2.5-flash-preview-tts   429  quota exceeded
  "Quota exceeded for metric:
   generativelanguage.googleapis.com/generate_content_free_tier_requests,
   limit: 10, model: gemini-2.5-flash-tts
   Please retry in 3h6m56s"

openai/tts-1                          400  "No credentials for provider: openai"
```

A 429 on a free-tier metric means the request **authenticated**. The Google
credential is present and valid; what is missing is quota. So option 1 in TRO-9 is
no longer blocked on a key — it is blocked on a **free-tier cap of 10 TTS requests
per day**.

That cap is the problem. A single daily video narrates in ~7 segments, so one
morning's run fits under 10 only if nothing else touches the route that day — no
retry, no test, no second render. Today's 10 are already spent. Lifting it means
enabling billing on the Google project, **which costs money and is the user's call.**
I did not enable anything.

`openai/tts-1` is still genuinely credential-less, which is also why the daily log
line `omniroute tts unavailable: HTTP 400: No credentials for provider: openai`
keeps appearing — the chain asks for the OpenAI route first, fails, and falls back
to Edge. That fallback is working as designed and is not a failure.

## The legacy backup the user attached: what is and is not in it

The user attached `omniroute-legacy-backup-2026-08-21T17-24-49-808Z.json` to TRO-9
("old data but same data pretty much"). Inspected it. 19 provider connections,
2 API keys. Values were never printed or logged.

**It does not contain an `openai` provider at all** — so it cannot fix
`No credentials for provider: openai`. There is no OpenAI credential to restore.

**Every OAuth connection in it is expired** (claude, codex, kimi-coding, grok-cli,
kiro, cline, amazon-q, agy, antigravity, xai-oauth — all lapsed between
2026-07-29 and 2026-08-24, ~7 weeks ago). Those are coding-assistant logins, not
speech providers, so they are irrelevant here either way.

**The seven API-key providers have no expiry** and are the only live part:
openrouter, ollama-cloud, opencode, groq, nvidia, nous-research, gemini.

### The one real lead: nvidia

Probing which providers OmniRoute's speech route actually recognises:

```
google/*       429 quota exceeded        -> credential works, free tier capped at 10/day
openai/*       400 no credentials
nvidia/*       400 no credentials        <- registered speech provider, just unconfigured
elevenlabs/*   400 no credentials        <- registered, no key anywhere
groq/*         400 invalid speech model  -> not a speech provider here
openrouter/*   400 invalid speech model
ollama/*       400 invalid speech model
```

`nvidia` answers "no credentials" rather than "invalid speech model", which means
**OmniRoute already registers it as a speech provider and only lacks the key** —
and the backup carries an `nvidia` API key (70 chars, `apikey` auth, created
2026-07-19). API keys do not lapse the way those OAuth tokens did, so it is
plausibly still good. NVIDIA's build platform serves TTS on a free tier with far
more headroom than Google's 10 requests/day.

**This is the highest-value next action for TRO-9 and TRO-10: install the nvidia
key from the backup into OmniRoute, then re-probe `nvidia/<model>` on
`/v1/audio/speech`.**

I did not install it. Three reasons: OmniRoute's admin routes return 401 to me
(`/api/admin/providers`, `/api/providers`), the configured management token is
being rejected as invalid, and installing a credential into a shared service is
not something to do as a side effect of a run that cannot even record it on the
board. It needs a valid management token — the user, or the run that holds TRO-9.

`elevenlabs` is also registered and keyless, but there is no ElevenLabs key in the
backup, so that path means a new account and needs approval.

## Recommendation

**Stay on edge-tts.** It is free, needs no credential, has no daily cap, and is
already the proven default (today's run: 86.176s of narration, 23 gates passed).
Google's TTS at 10 requests/day cannot carry a daily channel without billing, and
it would be a strict downgrade in reliability for an unattended 06:30 job.

The free win available right now is the **voice choice, not the provider**: compare
#2 against #3 and #4. If Andrew or Brian reads better to you, it is a one-line
change to `EDGE_DEFAULT_VOICE` in `newsvideo/tts.py` — no credential, no spend, no
new dependency. I did not change the default, because which voice fronts the
channel is a brand decision, not a technical one.

## What needs the user

1. **Listen to #1 → #2 → #3 → #4 and pick the voice.** That closes TRO-9's Done
   criterion.
2. **Decide on Google billing** — only if you want OmniRoute carrying narration
   instead of Edge. My recommendation is no; Edge is better suited to an unattended
   daily job. This is the same question as TRO-10.

Not done here: nothing was committed to git, no default was changed, no credential
or billing was touched. No spend.
