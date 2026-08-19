# OmniRoute Dashboard Observations — 2026-08-19

**Source:** Live inspection through Joshua's connected browser. No dashboard controls, routing settings, keys, tunnels, or requests were changed.

| Observation | Status | Evidence |
|---|---|---|
| OmniRoute dashboard | VERIFIED | Dashboard identifies itself as OmniRoute v3.8.49 and reports a running local server. |
| LAN endpoint | VERIFIED | The dashboard advertises the local-server OpenAI-compatible endpoint on `192.168.0.8:20129/v1`. |
| Local endpoint | VERIFIED | The dashboard lists `http://localhost:20129/v1` as active. |
| Cloud endpoint | VERIFIED | The dashboard lists an active Cloudflare endpoint. The URL is intentionally not copied here because endpoint exposure belongs in runtime configuration, not repository documentation. |
| Model catalog | VERIFIED | The dashboard reports 1,393 models across 15 endpoints and exposes chat-completions, responses, completions, embeddings, image, audio, video, search, and rerank surfaces. |
| Gateway and MCP process | DISTINCT | The dashboard's API surface is running. An idle/offline `omniroute --mcp` process must be reported as a separate signal and must not be treated as gateway failure. |

## Implementation Implication

Mission Control and ClawX should use a configuration-name-only OpenAI-compatible base URL for normal cloud routing. The runtime-health contract must probe the configured endpoint, verify a deliberate expected response marker, and independently report optional MCP process health. No repository source, log, UI payload, or documentation should contain bearer tokens or tokenized compatibility URLs.

## Handling Restriction

The lower Endpoint-page compatibility section can display credential-bearing development aliases. It is excluded from inspection notes, implementation artifacts, commits, and user-facing reporting. Only non-sensitive operational capabilities may be described at a high level.

## API Catalog Observation

| Observation | Status | Safe implementation use |
|---|---|---|
| API catalog breadth | VERIFIED | The live API Endpoints page reports 318 endpoints across 31 categories. This supports building against the documented OpenAI-compatible request surfaces rather than provider-specific UI scraping. |
| Provider-specific routing surface | VERIFIED | The catalog exposes provider-specific variants for chat, embeddings, images, and models. ClawX can retain seat attribution while routing through a single OpenAI-compatible gateway seam. |
| Model discovery formats | VERIFIED | The catalog exposes standard OpenAI-compatible model discovery and a Gemini-compatible model discovery surface. Provider/model provenance should be recorded from the actual selected execution path. |
| Protected management plane | VERIFIED | Management, key, provider, routing-policy, and configuration endpoints are presented separately from normal inference endpoints. Mission Control must treat them as administration-only and must not use them for health probes. |

| Health-probe candidate | VERIFIED | The catalog includes a dedicated monitoring-health surface. Health monitoring should use a configured, low-risk probe rather than administrative, configuration, backup, restart, shutdown, cache-clearing, or evaluation routes. |
| Authenticated API-root status | VERIFIED | The API-v1 root returns basic API information and status when called with bearer authentication. The authorization value is runtime-only and intentionally excluded from every repository artifact. |
| Fallback interface | VERIFIED | An Ollama-compatible interface is available, but current project policy keeps local Ollama as an explicit fail-safe rather than ClawX's default route. |

The entire API catalog was scrolled read-only. YAML/JSON export links and credential-bearing compatibility entries were intentionally not opened or exported because they may include sensitive configuration values. The catalog is sufficient to confirm the gateway seam and does not change the requirement to keep secrets only in runtime configuration.
