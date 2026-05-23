# ANTIGRAVITY Health Aggregator

Sabretooth-local FastAPI service for the MINI-ASUS-PC sentry display.

Run locally:

```powershell
cd C:\ANTIGRAVITY\services\health-aggregator
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 11436
```

Endpoint:

- `GET /health/all`
- `GET /events/tail`

Optional Microsoft Graph device-list credentials are read from the Sabretooth vault at runtime if present:

- `MICROSOFT_GRAPH_TENANT_ID`
- `MICROSOFT_GRAPH_CLIENT_ID`
- `MICROSOFT_GRAPH_CLIENT_SECRET`

The service reads only metadata for vault health checks. It must never log or return credential values.

