# ANTIGRAVITY Dashboard — Agency × AIRI × OmniRoute

A self-contained web dashboard combining an agency agent catalog, Obsidian-style
knowledge graph, AIRI 3D avatar viewer, and OmniRoute-powered widgets / scenes /
image / video generation.

The **app** is pure static HTML/CSS/JS — no build step, open it and it runs.
There is now also a **test harness** (vitest + npm), which is the only part that
needs `npm install`.

*Last verified against the running system: 2026-09-09.*

## Layout

```
ops/dashboard-airi/
├── index.html          # App shell, all 8 tabs, three.js CDN import map
├── css/style.css       # Dark cyberpunk theme (CSS variables)
├── js/app.js           # Three.js avatar, graph sim, OmniRoute API calls
├── package.json        # vitest only — the app itself needs no install
├── vitest.config.js    # node env, aliases three/@pixiv to tests/mocks/
└── tests/
    ├── app.test.js     # 35 tests
    ├── setup.js
    └── mocks/          # OrbitControls, GLTFLoader, three-vrm stubs
```

## Key Commands

```bash
# Serve locally (any static server)
cd ops/dashboard-airi && python3 -m http.server 8080
# Then open http://localhost:8080

# Or just open the file directly
start ops/dashboard-airi/index.html

# Tests (35 passing as of 2026-09-09)
cd ops/dashboard-airi && npm install && npm test   # vitest run
npm run dev                                        # vitest watch
```

No build, no lint. Tests run in node with three.js mocked — they never touch a
browser or the network.

## Architecture

- **Tabs**: dashboard, agents, graph, avatar, widgets, scenes, image, video
- **OmniRoute API**: `http://127.0.0.1:20128/v1` (`OMNI_ROUTE`, `js/app.js:14`)
- **3D Avatar**: three.js + `@pixiv/three-vrm` (VRM), OrbitControls, GLTFLoader
- **Knowledge Graph**: SVG force-directed simulation (no library)
- **Widgets**: Chat, Search, Summarize, TTS — all proxied through OmniRoute

## Conventions

- All state lives in the `state` object at the top of `js/app.js`
- DOM helpers: `$()` (querySelector), `$$()` (querySelectorAll), `el()` (createElement wrapper)
- Tab switching: add `.nav-tab` elements with `data-tab` attribute, matching `tab-<name>` section IDs
- OmniRoute calls go through `omniFetch()` / `omniChat()` / `omniImageGen()` / `omniTTS()`
- Activity log entries use `logActivity(msg)` — prepends timestamped items to `#activity-log`

## OmniRoute Integration — current live status

Endpoints the dashboard calls, and what each one actually does today:

| Endpoint | Used by | Status |
| --- | --- | --- |
| `GET /v1/models` | sidebar model count | **Works** — 3166 models |
| `POST /v1/chat/completions` | chat + summarize widgets | **Works** |
| `POST /v1/images/generations` | scene / image tabs | **Works but quota-capped** |
| `POST /v1/audio/speech` | TTS widget | **Broken** — no credentials |

### Ports: 20128 and 20129 are the same router

Both `http://127.0.0.1:20128/v1` and `:20129/v1` return an identical 3166-model
list **when no API key is sent**. The port is not the thing that matters — the
key is. See the auth pitfall below.

### TTS is down — do not build on `/v1/audio/speech`

The speech route accepts exactly **four** provider prefixes. Everything else —
including `gemini/`, `groq/`, `azure/`, `edge/` — is rejected with
`Invalid speech model … Use format: provider/model`, which is a misleading way of
saying "unknown speech provider". Probed 2026-09-09:

| Speech model prefix | Result |
| --- | --- |
| `openai/…` | `400 No credentials for provider: openai` |
| `elevenlabs/…` | `400 No credentials for provider: elevenlabs` |
| `deepgram/…` | `400 No credentials for provider: deepgram` |
| `google/…` | `401` from Google — credential rejected |

`google/` is the only one with a credential attached, and it is the wrong kind:
the route picks up a Google **OAuth** connection (`agy` / `antigravity`, scoped
to `cloud-platform` / `cclog` for IDE assist), and Google's TTS API refuses it.

The router *does* hold a `gemini` **apikey** connection ("Gemini (Google AI
Studio) Primary") that serves chat fine — but the speech route does not map
`google/` onto it, and that key's health record shows 1 request / 1 failure /
0 successes. Check `GET /api/providers` for the current connection list.

**Net: no working TTS credential exists on this machine.** The fix is an owner
action — add a valid Google AI Studio, ElevenLabs, OpenAI or Deepgram key to
OmniRoute under one of the four prefixes above. Until then the TTS widget fails.

**Working fallback:** Windows SAPI (`System.Speech.Synthesis.SpeechSynthesizer`
via PowerShell) generates a valid wav locally with no credentials, and
ffmpeg/ffprobe are on PATH to check it. It sounds robotic — fine for a pipeline
smoke test, not for anything published.

### Image gen: one valid route, and it rate-limits

`antigravity/gemini-3.1-flash-image` is the route to use. It returns `429` with a
multi-hour reset once the quota is spent, so **batch work must reuse a generated
background set** rather than generating one image per item. Note `js/app.js:135`
defaults `omniImageGen()` to `auto/best-vision` — a vision model, not an image
model. Pass an explicit image model id.

## Pitfalls

- **The API key is the trap, not the port.** `OMNI_KEY` is `''` by default and
  that is correct — unauthenticated calls get the full 3166-model catalog.
  Sending a *stale or wrong* key collapses the same endpoint to a 59-model
  chat-only subset with no media routes, which looks like "the router is
  broken." If media routes vanish, clear `OMNI_KEY` first.
- **three.js version drift.** `index.html` loads three `0.170.0` and three-vrm
  `3.4.0` from CDN, while `package.json` pins `^0.186.0` / `^3.5.5` for the test
  mocks. The browser and the tests are not running the same versions. Bump both
  together or the mocks stop reflecting reality.
- **CORS** — if serving from `file://`, some browsers block fetch to
  `127.0.0.1`. Use a local HTTP server.
- **VRM loading** — `@pixiv/three-vrm` comes from the CDN import map. Requires
  internet access or a local mirror.
- **No build step for the app** — editing is just editing. Refresh the browser.
  `npm install` is only needed to run the tests.
- **innerHTML usage** — safe because all content is hardcoded UI or the user's
  own API responses. Don't add untrusted third-party content without
  sanitization.
- **Three.js avatar** — renders a placeholder capsule until you load a real VRM
  via the file input.
