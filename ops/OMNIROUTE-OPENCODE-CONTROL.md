# OmniRoute + OpenCode Control Plane

## Goal

Keep the laptop free of model-processing load while still using OpenCode from the laptop.

## Shape

| Layer               | Runs on                             | Purpose                                                          |
| ------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| OpenCode            | Laptop and T5500 Paperclip adapters | Interactive coding UI/CLI                                        |
| OmniRoute           | Laptop and T5500                    | Lightweight router and policy control for local-node models only |
| Claude Code         | Laptop                              | Direct vendor CLI; keep off OmniRoute                            |
| Local model servers | Sabretooth and 9020 node            | Heavy inference                                                  |
| Paperclip           | T5500                               | Single clean-repo coordination app                               |

## Current Node Facts

| Node       |         LAN IP | Status         |
| ---------- | -------------: | -------------- |
| Laptop     | `192.168.0.13` | Control seat   |
| T5500      | `192.168.0.15` | Paperclip host |
| Sabretooth |  `192.168.0.8` | Compute node   |
| 9020 node  |  `192.168.0.5` | Compute node   |

## OpenCode

Laptop OpenCode should talk only to laptop OmniRoute:

```text
http://192.168.0.15:20128/api/v1
```

T5500 Paperclip `opencode_local` agents should talk only to T5500 OmniRoute at the same loopback URL from T5500's point of view:

```text
http://192.168.0.15:20128/api/v1
```

Do not point a T5500 Paperclip adapter at the laptop's `127.0.0.1`; loopback is machine-local.

OpenCode also needs the local OmniRoute API key in the shell environment:

```powershell
$env:OMNIROUTE_API_KEY = "<local-omniroute-key>"
```

Do not commit the real key.

If keys are staged in a local `opencode.txt` file, load them without printing values:

```powershell
powershell -ExecutionPolicy Bypass -File ops\T5500-LOAD-OPENCODE-SECRETS.ps1 -PersistUserEnv
```

The loader accepts both `OMNIROUTE_API_KEY` and the observed typo `OMNIRIOUTE_API`, then exports the correct `OMNIROUTE_API_KEY` variable.

The repo `opencode.json` defaults to T5500 OmniRoute only:

```text
omniroute/auto/best-coding
```

Do not point Claude Code at OmniRoute. It should stay direct so OmniRoute does not trigger extra vendor usage.

## Paperclip OpenCode Agents On T5500

Live Paperclip agents aligned to OmniRoute:

```text
CEO OmniRoute Local Models via OpenCode -> auto/best-coding -> http://192.168.0.15:20128/api/v1
Founding Engineer -> auto/best-coding -> http://192.168.0.15:20128/api/v1
OpenCode Self-Hosted Models -> auto/best-coding -> http://192.168.0.15:20128/api/v1
```

These are intentionally OmniRoute aliases, not Claude, OpenAI, Ollama Cloud, or OpenRouter model IDs.

Target model is the verified OmniRoute alias `auto/best-coding`.

## Remote Model Endpoints

Copy the template and fill any node-specific URLs locally:

```powershell
Copy-Item ops\omniroute-nodes.env.example .env.omniroute-nodes
```

Do not commit `.env.omniroute-nodes`.

Expected pattern:

```text
OpenCode on laptop -> OmniRoute on laptop -> Ollama/OpenAI-compatible endpoints on compute nodes
```

## Health Checks

```powershell
Invoke-WebRequest http://192.168.0.15:20128/api/v1/models -UseBasicParsing
Invoke-WebRequest http://192.168.0.8:11434/api/tags -UseBasicParsing
```

```powershell
Invoke-WebRequest http://192.168.0.5:11434/api/tags -UseBasicParsing
```
