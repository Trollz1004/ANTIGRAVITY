# Mission Control — Cockpit Demo Brief

## What it is
Local ops dashboard for the ANTIGRAVITY mission stack.

## What you're seeing
- All-green health matrix across 12 services
- Live Hermes router model selection with 7 chips
- T5500 production stack status (postgres, qdrant, redis, openclaw)

## What it controls
- Paperclip Worker (localhost:3100) via tunnel health checks
- Hermes Router (localhost:11435) model routing
- Ollama (localhost:11434) + OpenClaw (localhost:18789) runtime
- T5500 production stack (192.168.0.15) service monitoring

## Local vs public
| Surface | Location |
|---------|----------|
| Cockpit | Sabretooth localhost:5173 |
| Product | youandinotai.com via T5500 |

## Elevator
Mission Control is a local-first operations dashboard for the ANTIGRAVITY mission stack. It aggregates health checks, model routing, and task dispatch into a single interface running on Sabretooth. Built for indie founders who need uptime visibility without cloud dependencies. The dashboard talks to local services (Paperclip, Hermes, Ollama) and the T5500 production node, providing real-time status and control for the #ForTheKids mission infrastructure.

## For skeptics
- Local only: avoids cloud latency and vendor lock-in for critical ops
- Uptime: relies on Sabretooth autostart chain (Docker → Hermes → watchdogs)
- More than status: dispatches tasks to Hermes, routes models, monitors revenue buckets
