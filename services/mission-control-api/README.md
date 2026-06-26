# Mission Control API

FastAPI service providing health probes, deploy runners, test execution, task dispatch, and shared agent memory for the Antigravity mission control dashboard.

## Local Startup

From a clean clone, build the GUI first if you want this API to serve the dashboard from `http://127.0.0.1:8787`:

```powershell
cd C:\antigravity\apps\mission-control
npm install
npm run build
```

Then start the API and memory endpoints:

```powershell
cd C:\antigravity\services\mission-control-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
python -m uvicorn mission_control_api.main:app --host 127.0.0.1 --port 8787
```

Open `http://127.0.0.1:8787`. If you only need the bundled Node memory server, use `npm start` from `apps/mission-control` instead.

## Shared Agent Memory

The direct Mission Control memory path does not depend on Paperclip.

- `GET /memory/status` - nodes, AI lanes, memory file path, and available scopes.
- `GET /memory/bootstrap` - copyable boot context for agents on any node.
- `GET /memory/entries` - recent shared memory records.
- `POST /memory/entries` - append a short operational memory record to `memory/mission-control-agent-memory.jsonl`.

Agents should also read `memory/MISSION-CONTROL-AGENT-MEMORY.md`.
