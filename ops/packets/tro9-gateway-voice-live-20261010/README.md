# TRO-9 — the OmniRoute speech route is live, as of 2026-10-10

Two separate findings in this packet. They point opposite directions, so read both.

1. The attached legacy backup contains **no speech credential of any kind**, and the
   one Google key in it is dead. It cannot unblock anything.
2. Re-probing the live router today found `/v1/audio/speech` **returning `200` and real
   audio** on the `google/*` route. The original TRO-9 blocker is gone — but the
   pipeline's auto-probe still rejects it for an unrelated reason (see
   *The one-character bug*).

---

## 1. What the backup actually holds

`omniroute-legacy-backup-2026-08-21T17-24-49-808Z.json`, 53,456 bytes, exported
2026-08-21T17:24:49Z, `omniroute-v3-legacy-export`.

| Section | Count |
|---|---|
| `providerConnections` | 19 |
| `providerNodes` | 0 |
| `combos` | 1 (`coder-cascade`) |
| `apiKeys` | 2 (`PRODUCTION`, `FABLE`) |
| `settings` | 99 keys |

A full-text scan of the file for every speech vendor and keyword returns **zero hits**:

```
tts 0   speech 0   audio 0   voice 0
elevenlabs 0   deepgram 0   azure 0   polly 0   cartesia 0   playht 0   11labs 0
openai 1   <- the word only, inside a qdrant embedding model id
```

So there is no ElevenLabs, OpenAI, Deepgram, Azure or Polly credential in the backup,
and never was one. Of the 19 connections, 12 are OAuth coding-assistant seats
(`claude`, `codex`, `kimi-coding`, `grok-cli`, `kilocode`, `kiro`, `cline`, `amazon-q`,
`agy`, `antigravity`, `xai-oauth`, `github`) and 7 are API keys
(`openrouter`, `ollama-cloud`, `opencode`, `groq`, `nvidia`, `nous-research`, `gemini`).
None of those providers sells text-to-speech on the credential type held here.

### The one Google key in the backup is dead

`gemini` — "Gemini (Google AI Studio) Primary". The backup records its own verdict:

```
testStatus     = error
errorCode      = auth_failed
lastError      = Invalid API key
lastErrorType  = upstream_auth_error
lastTested     = 2026-08-21T06:35:29.969Z
```

I tested it live anyway today, four ways, against
`https://generativelanguage.googleapis.com` — see `probe_gemini.py`:

| Call | Result |
|---|---|
| `GET /v1beta/models?key=…` | **401** UNAUTHENTICATED |
| `GET /v1beta/models` + `x-goog-api-key` | **401** UNAUTHENTICATED |
| `GET /v1beta/models` + `Authorization: Bearer` | **401** UNAUTHENTICATED |
| `POST …/gemini-2.5-flash-preview-tts:generateContent` | **401** UNAUTHENTICATED |

All four return the identical message: *"Request had invalid authentication credentials.
Expected OAuth 2 access token, login cookie or other valid authentication credential."*
That is **word for word the 401 the OmniRoute `google/` speech route used to return**, which
closes that loop: the old failure was never a router bug, it was this key.

The key's shape also explains it — it is 53 characters starting `AQ.A`, not the 39-character
`AIza…` an AI Studio key uses, so it was stored in the wrong field from the start.

### And the two Google OAuth seats carry no speech scope

Confirming the 2026-09-09 read, now from the backup itself:

```
agy          scope: cclog  cloud-platform  experimentsandconfigs  userinfo.email  userinfo.profile  openid
antigravity  scope: cclog  cloud-platform  userinfo.profile  experimentsandconfigs  userinfo.email  openid
```

Both expired 2026-08-21T17:49Z. `cloud-platform` + `cclog` is a code-tool scope set.

### The two router API keys in the backup no longer authenticate

The router now requires a key on `/v1/models` where it did not in September
(`401 Invalid API key`). Both backup keys are rejected:

```
[PRODUCTION /v1/models] HTTP 401 {"error":{"message":"Invalid API key",...}}
[FABLE      /v1/models] HTTP 401 {"error":{"message":"Invalid API key",...}}
```

`/v1/audio/speech` does **not** enforce the key — it answered on an invalid one.

---

## 2. The live router moved. The speech route works now.

| Endpoint | 2026-10-10 |
|---|---|
| `http://127.0.0.1:20128/v1` | **up** (`/v1/models` → 401, needs a key; `/v1/audio/speech` → works) |
| `http://192.168.0.8:20128/v1` | **unreachable** (`WinError 10060`, timeout) |
| `http://localhost:20129/v1` | **unreachable** (connection refused) |
| `http://192.168.0.8:9140` (Fable's Sentry) | **unreachable** |

So the LAN address and the old `20129` port are both gone; `127.0.0.1:20128` is the
live door. The pipeline already tries `127.0.0.1:20128` first, so it is pointed correctly.

### Speech probe, `POST http://127.0.0.1:20128/v1/audio/speech`

| Model | Result |
|---|---|
| `google/gemini-2.5-flash-preview-tts` | **200, `audio/wav`, 534,330 bytes** ✅ |
| `openai/tts-1` | 400 — No credentials for provider: openai |
| `openai/gpt-4o-mini-tts` | 400 — No credentials for provider: openai |
| `elevenlabs/eleven_turbo_v2_5` | 400 — No credentials for provider: elevenlabs |
| `deepgram/aura-asteria-en` | 400 — No credentials for provider: deepgram |
| `gemini/gemini-2.5-flash-preview-tts` | 400 — not a registered speech provider |

One route works, and it is the sanctioned one the original plan assumed. The Google
credential behind it is evidently fresh — a different, working credential from the dead
`AQ.A…` key in the backup.

The route takes **30 Gemini voice names**, not OpenAI's: `achernar, achird, algenib,
algieba, alnilam, aoede, autonoe, callirrhoe, charon, despina, enceladus, erinome, fenrir,
gacrux, iapetus, kore, laomedeia, leda, orus, puck, pulcherrima, rasalgethi, sadachbia,
sadaltager, schedar, sulafat, umbriel, vindemiatrix, zephyr, zubenelgenubi`.

### The one-character bug keeping the pipeline off it

`newsvideo.tts.omniroute_available(model)` probes the route with the voice hardcoded to
`alloy`. The Google route rejects `alloy`, so the probe fails, so `--backend auto`
skips the gateway and falls through to edge:

```
tts-1-hd                            -> (False, 'HTTP 400: No credentials for provider: openai')
google/gemini-2.5-flash-preview-tts -> (False, 'HTTP 400: Voice name alloy is not supported...')
edge_available                      -> (True, 'edge-tts 7.2.8')
```

Two things need to change for `auto` to pick the gateway: the default omniroute model
(`tts-1-hd`, an OpenAI id that can never work here) and the probe voice (`alloy`).
**Both live in `newsvideo/tts.py`, which no longer exists** — `newsvideo/` is
`.pyc` only. This change is gated behind the source rebuild.

### The function itself works today, unmodified

`synth_omniroute` takes `voice` as an argument, so it bypasses the broken probe:

```python
tts.synth_omniroute(text, out, "google/gemini-2.5-flash-preview-tts", "kore")
# Clip(path=..., seconds=6.650958, backend='omniroute',
#      voice='google/gemini-2.5-flash-preview-tts/kore')
```

---

## 3. A/B evidence — listen to these

Same text both halves (real Oct 9 intro + story 1 copy, 253 characters), today's shipping
edge voice first, 0.8s of silence, then the gateway voice:

- `AB-edge-vs-google-charon.wav` — **start here**; closest pacing match to the current read
- `AB-edge-vs-google-orus.wav`
- `AB-edge-vs-google-kore.wav`
- `AB-edge-vs-google-sulafat.wav`

Single-voice files are in `raw/`. Measurements in `measurements.json`.

| Backend | Voice | Sample rate | ffprobe duration | Bytes |
|---|---|---|---|---|
| edge | en-US-ChristopherNeural +12% | 22050 | **16.776s** | 739,900 |
| omniroute | google/…-tts / charon | 24000 | **16.531s** | 793,530 |
| omniroute | google/…-tts / orus | 24000 | **16.971s** | 814,650 |
| omniroute | google/…-tts / kore | 24000 | **17.571s** | 843,450 |
| omniroute | google/…-tts / sulafat | 24000 | **17.371s** | 833,850 |

Pacing is a non-issue: `charon` runs **1.5% shorter** than the current edge read and `orus`
**1.2% longer**. That is a far better match than the raw edge `+0%` read ever was, so no
rate tuning would be needed.

---

## 4. The one real integration cost: sample rate

The gateway returns **24000 Hz**; `synth_omniroute` does not normalise it. Every day
folder shipped so far is **22050 Hz** (`work/20261008/audio/intro.wav`,
`work/20261004/audio/intro.wav`, both `pcm_s16le / 22050 / mono`), and `render` concatenates
segments by ffmpeg stream copy.

- A day where **every** segment comes from the gateway is fine — uniform 24000 concatenates
  cleanly, and the final mux re-encodes to `aac / 48000 / stereo` regardless
  (`work/20261009/manifest.json`).
- A day that **mixes** backends — gateway for most segments, edge fallback for one that
  failed — produces a mixed-rate concat, which stream copy will garble. Today's auto-probe
  chain can do exactly that.

So switching to the gateway wants a resample to 22050 inside `synth_omniroute`, which is
again in the missing `tts.py`.

---

## 5. Recommendation: keep edge-tts as the default

The gateway working is good news, and it should become the primary once the source is back.
It should not become the primary today:

| | edge-tts Christopher | OmniRoute google/…-tts |
|---|---|---|
| Works right now via `auto` | **yes**, shipping since 2026-09-09 | no — `alloy` probe bug |
| Survived today's outage | **yes** | the router's LAN door and `:20129` were both down |
| Rate control | **yes** (`--edge-rate`) | none exposed |
| Sample rate vs pipeline | **22050, matches** | 24000, needs resample |
| Credential risk | none — no key, no account | depends on a Google credential that has died once |
| Code change needed | **none** | two defaults in a file that does not exist |

`192.168.0.8:20128`, `:20129` and Sentry were all unreachable during this very probe while
edge-tts synthesised fine. That is the argument: the gateway is the better voice when it is
up, and edge is the one that is always up.

**Proposed:** edge stays the default, the gateway becomes the documented first choice in the
`auto` chain as part of the source rebuild, with the `alloy` → Gemini-voice fix and the
22050 resample landing in the same change.

---

## Reproduce

```
python probe_gemini.py          # the backup's Google key, 4 ways -> 401 x4
python probe_router_keyed.py    # backup router keys + every speech provider
python probe_google_speech.py   # the route that works, 4 voices -> 200 x4
python build_ab.py              # regenerates every wav and measurements.json here
```

`probe_gemini.py` and `probe_router_keyed.py` read the credential out of the backup JSON at
run time and redact it from their own output; neither the key nor the router keys are
written into this packet. The backup itself is **not** copied here — it stays where the
board put it.
