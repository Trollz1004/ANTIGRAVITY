# NewsCreator
- Operate as two distinct business managers, each generating a different script for every task. - Each script must be fact-checked by the other, and both must agree on the best script before proceeding. - All operations must be completed in preview mode first, then deployed after each script with no exceptions. - After every task, provide visual proof of work done, not just text confirmation. - Do not provide explanations or error details. - Do not proceed to the next step unless the prior step is fully completed, error checked, and running as it should. - Maintain 24/7 oversight for business management and error checking.

## Self-Hosted Agent (Ollama)

This repo now includes a self-hosted agent service and CLI that talk to a local Ollama instance, with a web dashboard. It keeps per-session JSON conversation memory and supports live streaming.

### Prerequisites

- Install Python 3.10+
- Install [Ollama](https://ollama.com) and pull a model, e.g.:
  - `ollama pull llama3.1:8b`
- Ensure Ollama is running locally (default: `http://127.0.0.1:11434`).

### Setup

```
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
copy .env.example .env   # optional; edit values
```

### Run the API

```
uvicorn app:app --reload --port 8000
```

- Health: `GET http://127.0.0.1:8000/health`
- Chat: `POST http://127.0.0.1:8000/chat`

Example request body:

```
{
  "session_id": "demo",
  "message": "Summarize today's top tech news.",
  "system_prompt": "You are a helpful news assistant.",
  "temperature": 0.2
}
```

### Dashboard (One-Click)

- Use the Desktop shortcut: `NewsCreator Dashboard.lnk`.
- Or run: `start_dashboard.bat` (auto-creates venv and installs deps, then opens the dashboard).

Dashboard features:
- Model selection (populated from local Ollama models).
- Temperature slider.
- Session manager (list, load, clear all).
- Live streaming responses into preview cards.

### Run the CLI

```
python cli.py --session demo --system "You are a helpful news assistant."
```

Type your message and press Enter. Conversations persist under `data/memory/`.

### Configuration

- `OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (default `llama3.1:8b`)
- `TEMPERATURE` (default `0.2`)

Configure via environment variables or `.env` (copy `.env.example`).

### Admin/Owner Utilities

- Create Desktop shortcut (already created): `scripts/create_desktop_shortcut.ps1`
- Auto-start on login (Windows):
  - `powershell -ExecutionPolicy Bypass -File scripts/setup_autostart.ps1`
  - This registers a Scheduled Task to run `start_dashboard.bat` at user logon.

### API Endpoints

- `GET /` → Dashboard redirect
- `GET /dashboard` → Dashboard HTML
- `GET /health` → Health + current model
- `GET /models` → List local Ollama models
- `POST /chat` → Non-streaming chat
- `POST /chat/stream` → Streaming chat (text stream)
- `GET /sessions` → List sessions
- `GET /sessions/{id}` → Get session messages
- `DELETE /sessions/{id}` → Delete session
- `DELETE /sessions` → Delete all sessions
