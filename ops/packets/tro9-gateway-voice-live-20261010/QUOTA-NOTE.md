# Note on the Google samples in this folder: they cost the whole day's quota

Added 2026-10-10 21:02 UTC by a second (unassigned) heartbeat run, `6e04b13c`.
Nothing in this folder was changed — this file only adds a measurement its
`README.md` does not have.

## What happened

The four `AB-edge-vs-google-*.wav` files here are real. They were generated at
20:50 UTC and the Google route genuinely returned 200 with real audio.

Two minutes later, at 20:52, the same route returned **429**:

```
Quota exceeded for metric:
  generativelanguage.googleapis.com/generate_content_free_tier_requests
  limit: 10, model: gemini-2.5-flash-tts
Please retry in 3h6m56s
```

Re-probed at 21:02 with voice `charon` (the exact voice that worked at 20:50):
still **429**.

Both observations are correct and in sequence. The explanation is the point:

**Generating four comparison samples exhausted the day's entire Google TTS
allowance.** The free tier is 10 requests per day on `gemini-2.5-flash-tts`.

## Why this matters more than it sounds

This is the strongest available argument for the recommendation this folder's
README already makes — keep Edge — and it is a harder argument than "the LAN door
died once":

- One daily video narrates in **~7 segments** = 7 requests.
- The free tier is **10 requests/day**.
- So a morning run fits only if *nothing else* touches the route that day. One
  retry, one test, one re-render, or one afternoon of A/B sampling and the 06:30
  job has no narration left.
- An afternoon of sampling is exactly what just happened.

A 7-of-10 margin is not a budget an unattended daily job can run on. Lifting it
requires enabling billing on the Google project, which costs money and is the
user's decision. Nothing was enabled.

So: Google's voice may well sound better, but it cannot carry the channel on the
free tier. Edge has no cap and no key. **Keep Edge** — and if the samples here
sound better to you, the thing to change is not the provider but whether you want
to pay for Google.

## One lead the backup scan missed

The TRO-9 write-up concludes the legacy backup "had nothing" after scanning it for
`tts`, `speech`, `voice`, `elevenlabs`, `deepgram`, `azure` — all zero, which is
correct. But OmniRoute's speech route distinguishes two different failures:

```
nvidia/*       400 "No credentials for provider: nvidia"   <- registered, key missing
elevenlabs/*   400 "No credentials for provider: elevenlabs"
groq/*         400 "Invalid speech model"                  <- not a speech provider
openrouter/*   400 "Invalid speech model"
ollama/*       400 "Invalid speech model"
```

"No credentials" means OmniRoute **has a speech adapter registered for that
provider and only lacks the key**. `nvidia` is in that group — and the backup does
carry an `nvidia` API key (70 chars, `apikey` auth, created 2026-07-19). Unlike the
ten OAuth connections in that file, which all lapsed in July/August, an API key
does not expire on its own.

That makes **nvidia the one untested free path** with more headroom than 10/day.
It is a lead, not a result: the 400 proves OmniRoute registers an nvidia speech
adapter, not that the key is still valid or that the model ids will match.

Not installed here. OmniRoute's admin routes (`/api/admin/providers`,
`/api/providers`) return 401, the configured management token is being rejected as
invalid, and installing a credential into a shared service should not be a side
effect of a run that cannot record it on the board. Needs the user or the run that
holds TRO-9.

## Also in the branch

A wider voice comparison — 9 Edge voices against the SAPI baseline, same sentence,
`ffprobe` durations in a manifest — is at
`ops/hermes/_voice/samples-20261010/` with its own README. That one is all free and
uncapped, and includes `en-US-AndrewNeural` and `en-US-BrianNeural`, which are
newer than the pipeline's current `en-US-ChristopherNeural` default.
