# OpenClaw Node Reachability Report
**Date:** 2026-03-19
**Authority:** Josh Coleman
**Primary Control Plane:** Sabretooth (http://127.0.0.1:18789)

---

## Executive Summary

This document defines the node topology for OpenClaw multi-node orchestration. Sabretooth is the **sole orchestration entrypoint** — all commands originate here and reach other nodes via SSH.

**Topology:**
- **1 Primary:** Sabretooth (OpenClaw gateway + orchestration)
- **2 Remote Nodes:** 9020 (marketing), T5500 (build)
- **0 Remote OpenClaw Gateways:** None discovered/verified

---

## Node Reachability Matrix

### Sabretooth-Local Services (Primary)

| Service | URL | Status | Purpose |
|---------|-----|--------|---------|
| OpenClaw Gateway | http://127.0.0.1:18789 | ✅ Live | Primary control plane |
| Ollama | http://127.0.0.1:11434 | ✅ Live | Local LLM inference |
| Social Engine | C:\ANTIGRAVITY\scripts\social_engine | ✅ Configured | Platform posters |
| Telegram Bot | @CLAUDEsMiniBot | ✅ Live | Control channel |

### 9020 Reachable Services (via SSH)

| Service | Access Method | Status | Purpose |
|---------|---------------|--------|---------|
| Crossfire Backend | SSH → curl http://localhost:8000/api/health | ✅ Available | Marketing API |
| Crossfire Frontend | SSH → curl http://localhost:5173 | ✅ Available | Marketing UI |
| Ollama | SSH → http://127.0.0.1:11434 | ✅ Available | Remote inference |
| Redis | SSH → port 6379 | ✅ Available | Session cache |
| OpenClaw Gateway | Not configured | ⛔ None | No independent gateway |

**SSH Access:**
```bash
ssh 9020
# or
ssh -i ~/.ssh/krakken_ed25519 joshl@192.168.0.5
```

### T5500 Reachable Services (via SSH)

| Service | Access Method | Status | Purpose |
|---------|---------------|--------|---------|
| Ollama | SSH → http://127.0.0.1:11434 | ⚠️ Cold | Build node inference |
| Git Repo | SSH → C:\ANTIGRAVITY | ✅ Available | Build/backup |
| OpenClaw Gateway | Not configured | ⛔ None | No independent gateway |

**SSH Access:**
```bash
ssh t5500
# or
ssh -i ~/.ssh/krakken_ed25519 joshl@192.168.0.15
```

### Remote OpenClaw-Capable Lanes

| Node | OpenClaw URL | Status | Notes |
|------|--------------|--------|-------|
| 9020 | None | ⛔ Not configured | SSH only |
| T5500 | None | ⛔ Not configured | SSH only |

**Policy:** Remote OpenClaw gateways are only treated as real if explicitly discovered and verified. Currently none are configured.

### SSH-Only Lanes

| Node | SSH Alias | IP | Identity File | Status |
|------|-----------|----|---------------|--------|
| 9020 | `9020` | 192.168.0.5 | ~/.ssh/krakken_ed25519 | ✅ Configured |
| T5500 | `t5500` | 192.168.0.15 | ~/.ssh/krakken_ed25519 | ✅ Configured |

**SSH Config Location:** `C:\Users\joshl\.ssh\config`

---

## Routing Rules

### Primary Rule: Sabretooth-Only Orchestration

```
Josh → Sabretooth OpenClaw → SSH to node → Execute → Report back
```

- All commands originate from Sabretooth
- Sabretooth is the only OpenClaw gateway
- Other nodes are reached via SSH, not OpenClaw protocol

### SSH-First Rule

1. Use existing SSH aliases from `~/.ssh/config`
2. Do not invent new hostnames
3. Use `krakken_ed25519` key for all nodes
4. `StrictHostKeyChecking no` for local network

### No Remote OpenClaw Rule

- 9020 and T5500 do NOT run OpenClaw gateways
- They are SSH-accessible compute nodes only
- If remote OpenClaw is needed, it must be explicitly configured and verified

### Telegram Heartbeat Rule

- **ONE** Telegram control path on Sabretooth only
- NO separate Telegram notification loops on 9020 or T5500
- Heartbeat config in `C:\Users\joshl\.openclaw\openclaw.json`

---

## Node Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `node-targets.json` | Node topology definition | `C:\Users\joshl\.openclaw\node-targets.json` |
| `social-platforms.env` | Platform credentials | `C:\Users\joshl\.openclaw\social-platforms.env` |
| `openclaw.json` | Master config | `C:\Users\joshl\.openclaw\openclaw.json` |
| SSH config | SSH aliases | `C:\Users\joshl\.ssh\config` |

---

## Verification Commands

### Test Sabretooth Local Services

```powershell
# OpenClaw Gateway
curl http://127.0.0.1:18789/status

# Ollama
curl http://127.0.0.1:11434/api/tags
```

### Test 9020 via SSH

```powershell
# SSH and check services
ssh 9020 "curl -s http://localhost:8000/api/health"
ssh 9020 "curl -s http://localhost:11434/api/tags"
```

### Test T5500 via SSH

```powershell
# SSH and check Ollama
ssh t5500 "curl -s http://localhost:11434/api/tags"
```

---

## Security Boundaries

| Boundary | Enforcement |
|----------|-------------|
| ENIGMA ≠ OMEGA | Separate credential paths, no cross-contamination |
| No vault access | OneDrive Personal Vault not accessed by OpenClaw |
| No secrets in repo | All credentials in `.openclaw/` directory |
| SSH key isolation | `krakken_ed25519` used only for node access |
| Local-only configs | Node topology in local `.openclaw/` only |

---

## Troubleshooting

### SSH Connection Issues

```powershell
# Test SSH connectivity
test-netconnection 192.168.0.5 -port 22
test-netconnection 192.168.0.15 -port 22

# Verbose SSH test
ssh -v 9020
```

### Ollama Unreachable

```powershell
# Check if Ollama is running on remote node
ssh 9020 "tasklist | findstr ollama"
ssh 9020 "curl http://localhost:11434/api/tags"
```

### Crossfire Services Down

```powershell
# Check from 9020 node
ssh 9020 "curl -s http://localhost:8000/api/health"
```

---

**Report Generated:** 2026-03-19
**Authority:** Josh Coleman
**Next Review:** On topology change or node addition
