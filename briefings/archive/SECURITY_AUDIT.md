# Third-Party Security Audit

**Generated**: 2026-05-18  
**Scope**: Full ANTIGRAVITY repository dependency and supply chain audit

## Executive Summary

This audit covers all third-party dependencies (npm and PyPI), CDN scripts, and external service integrations in the ANTIGRAVITY repository. The goal is to identify supply chain risks, insecure script loading, and missing Subresource Integrity (SRI) protections.

### Key Findings

| Category | Count | Risk |
|----------|-------|------|
| npm dependencies | ~370 across 23 packages | Low-Medium |
| PyPI dependencies | 34 across 3 requirements files | Low |
| CDN scripts | 12 found | Medium |
| CDN without SRI | 12 (100%) | Medium |
| Insecure HTTP scripts | 0 | None |

## Recommendations

1. **Add SRI hashes to all CDN scripts** — 12 CDN scripts lack Subresource Integrity attributes, making them vulnerable to supply chain attacks
2. **Lock dependency versions** — Use exact versions (`==`) in requirements.txt and `npm ci` in production
3. **Enable Dependabot** — Automated dependency update PRs for security patches
4. **Review unused dependencies** — Several large dependency trees may include unused packages

## CDN Scripts Audit

| File | URL | SRI | Risk |
|------|-----|-----|------|
| `apps/antigravity-cockpit/_design/project/AntiGravity Prototype.html` | unpkg.com/react@18.3.1 | ❌ | Medium |
| `apps/antigravity-cockpit/_design/project/AntiGravity Prototype.html` | unpkg.com/react-dom@18.3.1 | ❌ | Medium |
| `apps/antigravity-cockpit/_design/project/AntiGravity Prototype.html` | unpkg.com/@babel/standalone@7.29.0 | ❌ | Medium |
| `briefings/GEMINI-DAO-VISUALIZATION-2026-04-19.html` | cdn.tailwindcss.com | ❌ | Medium |
| `briefings/GEMINI-DAO-VISUALIZATION-2026-04-19.html` | cdn.jsdelivr.net/npm/chart.js | ❌ | Medium |
| `ClawX/src/client/index.html` | cdn.tailwindcss.com | ❌ | Medium |
| `teamclaudeforlife/project/Mission Control.html` | unpkg.com/react@18.3.1 | ❌ | Medium |
| `teamclaudeforlife/project/Mission Control.html` | unpkg.com/react-dom@18.3.1 | ❌ | Medium |
| `teamclaudeforlife/project/Mission Control.html` | unpkg.com/@babel/standalone@7.29.0 | ❌ | Medium |
| `teamclaudeforlife/project/Mission Control.html` | cdn.tailwindcss.com | ❌ | Medium |

**Note**: `cdn-cgi` paths are Cloudflare internal scripts and are not third-party risks.

## Third-Party Services

| Service | Purpose | Data Shared | Config Location |
|---------|---------|-------------|-----------------|
| Stripe | Payment processing | Billing info, tokens | `backend/fastapi-app/app/routers/billing.py` |
| Google OAuth | Authentication | Email, profile | `backend/fastapi-app/app/routers/google_auth.py` |
| Sentry | Error monitoring | Stack traces, env | `backend/fastapi-app/app/monitoring.py` |
| Cloudflare | CDN, hosting, tunnels | Traffic metadata | `cloudflare-tunnel-*.json` |
| Ollama (local) | LLM inference | None (local) | `litellm-config.yaml` |

## Running the Audit

```bash
# Full audit with JSON output
python scripts/audit-dependencies.py --output security-report.json

# Print to stdout
python scripts/audit-dependencies.py
```
