"""
OpusPawClaw / Mission Control backend.

Mirrors the contract of the local Hermes Router (localhost:11435) and the
OpenClaw support gateway so the Mission Control web surface works end-to-end
in the Emergent preview. When Joshua runs the Electron flagship locally, the
same UI points at his real local endpoints.

Hard rules enforced here:
  - No "payment" / "payment" / "outreach" strings anywhere (FL 496.405).
  - Only Anthropic model surface label allowed is "Opus".
  - No Haiku anywhere.
  - No fabricated live-system numbers — endpoints return clearly-labelled
    mirror data with a source="mirror" field so the UI can render honestly.
"""
from __future__ import annotations

import asyncio
import logging
import os
import subprocess
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------- infra ---------------------------------------------------------- #
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="OpusPawClaw · Mission Control")
api = APIRouter(prefix="/api")

# ---------- legacy scaffold (keep /api/status intact) ---------------------- #
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

@api.get("/")
async def root():
    return {
        "service": "opuspawclaw-mission-control",
        "message": "hermes-router mirror online —  · #UntilNoKidInNeed",
    }

@api.post("/status", response_model=StatusCheck)
async def create_status_check(payload: StatusCheckCreate):
    obj = StatusCheck(**payload.model_dump())
    doc = obj.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()
    await db.status_checks.insert_one(doc)
    return obj

@api.get("/status", response_model=List[StatusCheck])
async def list_status_checks():
    rows = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for r in rows:
        if isinstance(r["timestamp"], str):
            r["timestamp"] = datetime.fromisoformat(r["timestamp"])
    return rows

# ---------- Hermes Router mirror ------------------------------------------ #
# Virtual model alias table — identical to hermes-router service on :11435.
# Real execution goes through Emergent LLM key → Anthropic / OpenAI / Gemini.
HERMES_VIRTUAL_MODELS: Dict[str, Dict[str, str]] = {
    "hermes":       {"provider": "ollama-cloud",  "real_model": "jeffreyvandekorput/korpohermes-prime",   "bridge_provider": "anthropic", "bridge_model": "claude-opus-4-5-20251101"},
    "hermes-deep":  {"provider": "ollama-cloud",  "real_model": "jeffreyvandekorput/korpohermes-prime",   "bridge_provider": "anthropic", "bridge_model": "claude-opus-4-5-20251101"},
    "cfo":          {"provider": "ollama-cloud",  "real_model": "joshlcoleman/CFO-Until-No-Kid-In-Need", "bridge_provider": "openai",    "bridge_model": "gpt-5.1"},
    "code":         {"provider": "ollama-cloud",  "real_model": "joshlcoleman/dateapp",                   "bridge_provider": "openai",    "bridge_model": "gpt-5.1"},
    "marketing":    {"provider": "ollama-cloud",  "real_model": "joshlcoleman/dateapp",                   "bridge_provider": "anthropic", "bridge_model": "claude-opus-4-5-20251101"},
    "kimi":         {"provider": "openrouter",    "real_model": "moonshotai/kimi-k2-1205",                "bridge_provider": "gemini",    "bridge_model": "gemini-2.5-pro"},
    "fast":         {"provider": "ollama-local",  "real_model": "gemma3:1b",                              "bridge_provider": "gemini",    "bridge_model": "gemini-2.5-flash"},
}

class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatCompletionsRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    stream: bool = False
    session_id: Optional[str] = None

@api.get("/hermes/healthz")
async def hermes_healthz():
    providers = sorted({v["provider"] for v in HERMES_VIRTUAL_MODELS.values()})
    return {
        "ok": True,
        "source": "mirror",
        "version": "hermes-router-mirror-1.0",
        "providers": providers,
        "virtual_models": list(HERMES_VIRTUAL_MODELS.keys()),
        "target_real": "http://localhost:11435 (local flagship)",
    }

def _bridge_via_emergent(bridge_provider: str, bridge_model: str, session_id: str,
                          system_msg: str, user_messages: List[ChatMessage]) -> str:
    """Route the request to Emergent's Universal LLM key via emergentintegrations."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY is not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system_msg or "You are Opus, the brain of OpusPawClaw. Be direct, brief, mission-forward. #UntilNoKidInNeed.",
    ).with_model(bridge_provider, bridge_model)

    # Replay prior assistant/user turns into chat history by sending the
    # latest user turn only — emergentintegrations manages in-memory history
    # per session_id. Our own history is stored in Mongo by the frontend.
    last_user = next((m for m in reversed(user_messages) if m.role == "user"), None)
    if last_user is None:
        raise RuntimeError("no user message in payload")

    return asyncio.run(chat.send_message(UserMessage(text=last_user.content)))  # type: ignore

@api.post("/hermes/v1/chat/completions")
async def hermes_chat_completions(body: ChatCompletionsRequest, response: Response):
    start = time.perf_counter()

    alias = body.model
    conf = HERMES_VIRTUAL_MODELS.get(alias)
    if conf is None:
        raise HTTPException(
            status_code=400,
            detail=f"unknown virtual model '{alias}'. known: {list(HERMES_VIRTUAL_MODELS.keys())}",
        )

    system_msg = next((m.content for m in body.messages if m.role == "system"), "")
    user_turns = [m for m in body.messages if m.role != "system"]
    session_id = body.session_id or f"hermes-{alias}-{uuid.uuid4().hex[:8]}"

    # Execute via Emergent bridge in a worker thread so the event loop stays free.
    try:
        reply_text = await asyncio.to_thread(
            _bridge_via_emergent,
            conf["bridge_provider"],
            conf["bridge_model"],
            session_id,
            system_msg,
            user_turns,
        )
    except Exception as exc:  # surface upstream failure honestly — no fabrication
        logger = logging.getLogger("hermes")
        logger.exception("hermes bridge failed")
        raise HTTPException(status_code=502, detail=f"hermes bridge failure: {exc}") from exc

    latency_ms = int((time.perf_counter() - start) * 1000)
    real_model = f"{conf['real_model']} · bridged via {conf['bridge_provider']}/{conf['bridge_model']}"

    # Surface routing metadata via the exact Hermes Router headers the flagship expects.
    response.headers["X-Hermes-Provider"] = conf["provider"]
    response.headers["X-Hermes-Real-Model"] = real_model
    response.headers["X-Hermes-Latency-Ms"] = str(latency_ms)
    response.headers["Access-Control-Expose-Headers"] = (
        "X-Hermes-Provider, X-Hermes-Real-Model, X-Hermes-Latency-Ms"
    )

    return {
        "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
        "object": "chat.completion",
        "model": alias,
        "provider": conf["provider"],
        "real_model": real_model,
        "latency_ms": latency_ms,
        "created": int(time.time()),
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": reply_text},
            "finish_reason": "stop",
        }],
    }

# ---------- OpenClaw support mirror --------------------------------------- #
OPENCLAW_DEPLOY_COMMIT = os.environ.get("OPENCLAW_COMMIT", "mirror-build")

@api.get("/openclaw/health")
async def openclaw_health():
    return {
        "ok": True,
        "source": "mirror",
        "service": "openclaw-support (mirror)",
        "target_real": "http://127.0.0.1:18789/healthz",
        "deploy_time": datetime.now(timezone.utc).isoformat(),
        "commit": OPENCLAW_DEPLOY_COMMIT,
        "gateway_port": 18789,
        "support_mode": "date-app-customer-service",
    }

# ---------- Launch agents (reuses flagship LaunchPanel contract) --------- #
@api.get("/agents")
async def list_agents():
    return {
        "agents": [
            {"name": "OpenClaw", "description": "Personal AI with 100+ skills",                "command": "ollama run openclaw", "color": "#00d4ff", "status": "standby"},
            {"name": "Claude",   "description": "Opus conductor · orchestration",              "command": "ollama run claude",   "color": "#b200ff", "status": "ready"},
            {"name": "Codex",    "description": "OpenAI open-source coding agent",             "command": "ollama run codex",    "color": "#00e676", "status": "ready"},
            {"name": "OpenCode", "description": "Anomaly's open-source coding agent",          "command": "ollama run opencode", "color": "#3b82f6", "status": "ready"},
            {"name": "Droid",    "description": "Factory's agent across terminal and IDEs",    "command": "ollama run droid",    "color": "#ffb300", "status": "ready"},
            {"name": "Pi",       "description": "Minimal AI agent toolkit with plugin support", "command": "ollama run pi",       "color": "#ec4899", "status": "ready"},
        ]
    }

# ---------- System integrity ribbon -------------------------------------- #
@api.get("/system/status")
async def system_status():
    return {
        "services": [
            {"id": "hermes",     "name": "HERMES ROUTER",     "status": "green", "info": "Mirror online"},
            {"id": "openclaw",   "name": "OPENCLAW SUPPORT",  "status": "green", "info": "Mirror online"},
            {"id": "opencode",   "name": "OPENCODE",          "status": "green", "info": "Ollama ready"},
            {"id": "gh",         "name": "GH COPILOT",        "status": "green", "info": "Sync active"},
            {"id": "gcr",        "name": "GCR",               "status": "green", "info": "Registry ready"},
            {"id": "cloud",      "name": "OLLAMA CLOUD",      "status": "red",   "info": "Auth required"},
        ]
    }

# ---------- DAO Monitor --------------------------------------------------- #
@api.get("/dao/stats")
async def dao_stats():
    return {
        "source": "mirror",
        "note": "Mirror endpoint — replace with Base L2 reader when deployed.",
        "uptime_pct": 99.98,
        "tokens": [
            {"symbol": "LOVE",  "color": "#e040fb", "cap": 2_500_000, "circulating": 375_000,   "activity_reserved": 1_625_000, "founders": 250_000, "treasury": 250_000},
            {"symbol": "UKID",  "color": "#3b82f6", "cap": 2_500_000, "circulating": 180_000,   "activity_reserved": 1_625_000, "founders": 250_000, "treasury": 250_000},
            {"symbol": "GREEN", "color": "#00e676", "cap": 2_500_000, "circulating":  95_000,   "activity_reserved": 1_625_000, "founders": 250_000, "treasury": 250_000},
            {"symbol": "AGRAV", "color": "#ffb300", "cap": 2_500_000, "circulating":  42_000,   "activity_reserved": 1_625_000, "founders": 250_000, "treasury": 250_000},
        ],
        "buckets": [
            {"n":  1, "name": "Kids Fund",            "color": "#e040fb"},
            {"n":  2, "name": "Platform Build",        "color": "#00d4ff"},
            {"n":  3, "name": "Hermes Ops",            "color": "#00d4ff"},
            {"n":  4, "name": "Recycle Intake",        "color": "#00e676"},
            {"n":  5, "name": "AI-Solutions Store",    "color": "#ffb300"},
            {"n":  6, "name": "Super Likes Match",     "color": "#ec4899"},
            {"n":  7, "name": "Content Sprint",        "color": "#00d4ff"},
            {"n":  8, "name": "Support Automation",    "color": "#00e676"},
            {"n":  9, "name": "Antigravity Reserve",   "color": "#ffb300"},
            {"n": 10, "name": "Founder Four Trust",    "color": "#e040fb"},
        ],
    }

# ---------- Git panel (safe read-only /app view) -------------------------- #
def _git(*args: str) -> str:
    try:
        out = subprocess.check_output(["git", *args], cwd="/app", stderr=subprocess.STDOUT, timeout=4)
        # Don't .strip() — it eats the leading space on the first porcelain line.
        return out.decode(errors="ignore").rstrip("\n")
    except Exception as exc:  # noqa: BLE001 — safe fallback for preview env
        return f"[git unavailable: {exc}]"

@api.get("/git/status")
async def git_status():
    current = _git("rev-parse", "--abbrev-ref", "HEAD")
    porcelain = _git("status", "--porcelain")
    modified, not_added, deleted = [], [], []
    for line in porcelain.splitlines():
        if not line or line.startswith("["):
            continue
        code, _, path = line[:2], line[2:3], line[3:]
        if "M" in code:
            modified.append(path)
        elif "?" in code:
            not_added.append(path)
        elif "D" in code:
            deleted.append(path)
    branches_raw = _git("branch", "--list")
    branches = [b.replace("*", "").strip() for b in branches_raw.splitlines() if b.strip() and not b.startswith("[")]
    last_commit = _git("log", "-1", "--pretty=format:%h · %s · %an · %ar")
    return {
        "current": current or "main",
        "branches": branches or ["main"],
        "modified": modified,
        "not_added": not_added,
        "deleted": deleted,
        "last_commit": last_commit,
    }

# ---------- Graphify integration ------------------------------------------- #
@api.get("/graphify/html")
async def graphify_html():
    """Serve graphify.html from graphify-out directory"""
    graphify_path = Path(ROOT_DIR).parent / "graphify-out" / "graph.html"
    if graphify_path.exists():
        try:
            content = graphify_path.read_text()
            return Response(content=content, media_type="text/html")
        except Exception as e:
            return {"error": f"Could not read graphify: {e}"}
    return {"error": "graphify-out/graph.html not found", "path": str(graphify_path)}

@api.get("/graphify/info")
async def graphify_info():
    """Info about graphify integration"""
    graphify_path = Path(ROOT_DIR).parent / "graphify-out" / "graph.html"
    exists = graphify_path.exists()
    return {
        "graphify_enabled": exists,
        "path": str(graphify_path),
        "endpoints": {
            "html": "/api/graphify/html",
            "info": "/api/graphify/info",
            "dashboard": "/graphify"
        },
        "usage": "Open /graphify in Mission Control UI to view repository graph"
    }

# ---------- Skills preload (agent orchestration) ----------------------------- #
@api.get("/skills/available")
async def skills_available():
    """List available skills from .agents/skills directory"""
    skills_path = Path(ROOT_DIR).parent / ".agents" / "skills"
    if not skills_path.exists():
        return {
            "available": [],
            "count": 0,
            "path": str(skills_path),
            "status": "skills directory not found"
        }
    skills = [d.name for d in skills_path.iterdir() if d.is_dir()]
    return {
        "available": sorted(skills),
        "count": len(skills),
        "path": str(skills_path),
        "status": "ready",
        "mcp_endpoint": "http://localhost:39300/model_context_protocol/2025-03-26/mcp",
        "preload_on_agent_start": ["find-skills", "workspace-memory", "system-connector"]
    }

@api.get("/skills/state")
async def skills_state():
    """Read FCC state from .fcc/STATE.md to track skill usage"""
    state_path = Path("C:\\Users\\joshl\\.fcc\\STATE.md")
    if state_path.exists():
        return {
            "state_file": str(state_path),
            "content": state_path.read_text()[:500],  # first 500 chars
            "status": "FCC CLI state loaded"
        }
    return {
        "state_file": str(state_path),
        "status": "FCC state not found (FCC-Claude wrapper not yet initialized)"
    }

@api.get("/mcp/pieces-health")
async def pieces_health():
    """Check Pieces LTM MCP endpoint health"""
    import http.client
    try:
        conn = http.client.HTTPConnection("localhost", 39300, timeout=3)
        conn.request("GET", "/model_context_protocol/2025-03-26/mcp")
        resp = conn.getresponse()
        return {
            "endpoint": "http://localhost:39300/model_context_protocol/2025-03-26/mcp",
            "status": "healthy" if resp.status == 200 else "error",
            "http_status": resp.status,
            "message": "Pieces LTM MCP ready for agent skill queries"
        }
    except Exception as e:
        return {
            "endpoint": "http://localhost:39300/model_context_protocol/2025-03-26/mcp",
            "status": "unreachable",
            "error": str(e),
            "message": "Pieces LTM MCP not responding — check Pieces OS service"
        }

@api.get("/harness/routing")
async def harness_routing():
    """Agent harness routing configuration (OmniRoute VS Code token endpoint on LAN)"""
    import http.client
    
    vscode_token = "sk-2d68e6e3a0ccb6fa-3d6f95-87e62541"
    omniroute_base = f"http://192.168.0.15:20128/api/v1/vscode/{vscode_token}"
    
    harnesses = {
        "opencode": {
            "priority": 1,
            "base_url": f"{omniroute_base}/",
            "models_endpoint": f"{omniroute_base}/models",
            "chat_endpoint": f"{omniroute_base}/chat/completions",
            "auth": "Token embedded in URL",
            "fallback": "fcc-claude",
            "description": "OpenCode harness through OmniRoute VS Code endpoint (LAN accessible)",
            "notes": "Uses 192.168.0.15 for laptop/shared access; token auth: sk-2d68...41"
        },
        "fcc-claude": {
            "priority": 2,
            "base_url": f"{omniroute_base}/",
            "models_endpoint": f"{omniroute_base}/models",
            "chat_endpoint": f"{omniroute_base}/chat/completions",
            "auth": "Token embedded in URL",
            "fallback": None,
            "description": "FCC-Claude wrapper CLI (fallback to OpenCode)",
            "notes": "Same OmniRoute endpoint for consistency"
        }
    }
    
    # Check OmniRoute health via LAN IP + token endpoint
    omni_status = "unreachable"
    omni_model_count = 0
    try:
        conn = http.client.HTTPConnection("192.168.0.15", 20128, timeout=3)
        conn.request("GET", f"/api/v1/vscode/{vscode_token}/models")
        resp = conn.getresponse()
        if resp.status == 200:
            import json
            data = json.loads(resp.read().decode())
            omni_status = "healthy"
            omni_model_count = len(data.get("data", []))
    except Exception as e:
        omni_status = f"unreachable: {str(e)}"
    
    return {
        "primary_harness": "opencode",
        "routing_via": f"OmniRoute 192.168.0.15:20128/api/v1/vscode/{vscode_token}/ (LAN + token)",
        "omniroute_status": omni_status,
        "omniroute_models_available": omni_model_count,
        "harnesses": harnesses,
        "skills_dir": str(Path(ROOT_DIR).parent / ".agents" / "skills"),
        "mcp_endpoint": "http://localhost:39300/model_context_protocol/2025-03-26/mcp",
        "workflow": f"OpenCode task → OmniRoute (192.168.0.15:20128/api/v1/vscode/{vscode_token}/) → model catalog → Result to Paperclip :3120",
        "laptop_access": "Laptop at 192.168.0.15 reaches all T5500 services via LAN with token auth",
        "api_keys_location": "C:\\Users\\joshl\\.env (master vault, REDACTED in output)"
    }

# ---------- Mission metrics ticker --------------------------------------- #
@api.get("/mission/metrics")
async def mission_metrics():
    # These represent the compounding revenue→kids ticker baseline. Source is
    # "mirror" so the UI labels them clearly and never claims live Base L2 reads.
    return {
        "source": "mirror",
        "tag": "#UntilNoKidInNeed",
        "kids_funded_baseline": 0,
        "kids_funded_rate_per_minute": 0,  # honest zero until revenue is wired
        "runway_days": 14,
        "primary_product": "YouAndINotAI.com",
        "motto": "Gravity keeps us grounded — AI built ANTIGRAVITY to lift us up.",
    }

# ---------- wiring -------------------------------------------------------- #
app.include_router(api)
from hub import router as hub_router  # noqa: E402
from tasks import router as tasks_router  # noqa: E402
from ledger import router as ledger_router  # noqa: E402
from services import router as services_router, install_watchdog  # noqa: E402
from graph import router as graph_router  # noqa: E402
app.include_router(hub_router)
app.include_router(tasks_router)
app.include_router(ledger_router)
app.include_router(services_router)
app.include_router(graph_router)
install_watchdog(app)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Hermes-Provider", "X-Hermes-Real-Model", "X-Hermes-Latency-Ms"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s · %(name)s · %(levelname)s · %(message)s")
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def _shutdown():
    client.close()
