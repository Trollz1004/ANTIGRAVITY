import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, field_validator

from mission_control_api.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/memory", tags=["memory"])

REPO_ROOT = Path(__file__).resolve().parents[5]
MEMORY_DIR = REPO_ROOT / "memory"
MEMORY_LOG = MEMORY_DIR / "mission-control-agent-memory.jsonl"
BOOTSTRAP_FILE = MEMORY_DIR / "MISSION-CONTROL-AGENT-MEMORY.md"

ALLOWED_AGENTS = {
    "codex",
    "openai",
    "claude",
    "gemini",
    "hermes",
    "meta-llama",
    "manus",
    "fcc",
    "opencode",
    "ollama",
    "nvidia",
    "openclaw",
    "grok",
}
ALLOWED_NODES = {"sabretooth", "t5500", "9020"}
ALLOWED_SCOPES = {"global", "repo", "node", "agent", "support", "deployment", "customer-surface"}
CONTROL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
SECRET_HINTS = (
    "api_key=",
    "secret=",
    "password=",
    "private_key=",
    "-----begin",
    "sk-",
    "xoxb-",
    "sq0a",
    "sq0c",
)

AI_LANES = [
    {
        "id": "codex",
        "label": "Codex / OpenAI",
        "provider": "OpenAI",
        "access": "repo files, Mission Control API, shared memory",
        "status": "ready",
    },
    {
        "id": "claude",
        "label": "Claude",
        "provider": "Anthropic",
        "access": "AGENTS.md, CLAUDE.md, shared memory",
        "status": "ready",
    },
    {
        "id": "gemini",
        "label": "Gemini",
        "provider": "Google",
        "access": "repo prompt files and shared memory bootstrap",
        "status": "manual",
    },
    {
        "id": "hermes",
        "label": "Hermes",
        "provider": "local router",
        "access": "Hermes route plus shared memory bootstrap",
        "status": "ready",
    },
    {
        "id": "meta-llama",
        "label": "Meta / Llama",
        "provider": "local model lane",
        "access": "repo prompt files and shared memory bootstrap",
        "status": "manual",
    },
    {
        "id": "fcc",
        "label": "FCC",
        "provider": "worker lane",
        "access": "evidence/proposal lane plus shared memory bootstrap",
        "status": "manual",
    },
    {
        "id": "opencode",
        "label": "OpenCode",
        "provider": "worker lane",
        "access": "repo checkout plus shared memory bootstrap",
        "status": "manual",
    },
    {
        "id": "ollama",
        "label": "Ollama",
        "provider": "local inference",
        "access": "local models plus shared memory bootstrap",
        "status": "ready",
    },
    {
        "id": "nvidia",
        "label": "NVIDIA",
        "provider": "GPU/local tooling",
        "access": "worker lane plus shared memory bootstrap",
        "status": "manual",
    },
    {
        "id": "manus",
        "label": "Manus",
        "provider": "external agent",
        "access": "handoff prompt plus shared memory bootstrap",
        "status": "manual",
    },
    {
        "id": "openclaw",
        "label": "OpenClaw",
        "provider": "support-only",
        "access": "support memory only; no doctrine/payment control",
        "status": "support",
    },
]

NODE_ACCESS = [
    {
        "id": "sabretooth",
        "label": "Sabretooth",
        "host": "192.168.0.8",
        "role": "brain/operator node",
        "api": "http://127.0.0.1:8787/memory/bootstrap",
        "memory_path": r"C:\antigravity\memory\mission-control-agent-memory.jsonl",
    },
    {
        "id": "t5500",
        "label": "T5500",
        "host": "192.168.0.15",
        "role": "public front-door/runtime node",
        "api": "http://192.168.0.15:8787/memory/bootstrap",
        "memory_path": r"C:\antigravity\memory\mission-control-agent-memory.jsonl",
    },
    {
        "id": "9020",
        "label": "9020",
        "host": "192.168.0.5",
        "role": "dev/support checkout",
        "api": "http://192.168.0.5:8787/memory/bootstrap",
        "memory_path": r"C:\antigravity\memory\mission-control-agent-memory.jsonl",
    },
]


class MemoryEntry(BaseModel):
    id: str
    created_at: str
    title: str
    body: str
    scope: str
    source_agent: str
    agents: List[str] = Field(default_factory=list)
    nodes: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    visibility: str = "all-agents"


class MemoryWrite(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    body: str = Field(..., min_length=5, max_length=2400)
    scope: str = "global"
    source_agent: str = "codex"
    agents: List[str] = Field(default_factory=list)
    nodes: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    visibility: str = "all-agents"

    @field_validator("title", "body", mode="before")
    @classmethod
    def clean_text(cls, value):
        if not isinstance(value, str):
            raise ValueError("must be text")
        cleaned = CONTROL_CHAR_PATTERN.sub("", value).strip()
        lowered = cleaned.lower()
        if any(hint in lowered for hint in SECRET_HINTS):
            raise ValueError("memory entries must not contain secrets or secret-looking values")
        return cleaned

    @field_validator("scope")
    @classmethod
    def validate_scope(cls, value):
        if value not in ALLOWED_SCOPES:
            raise ValueError(f"scope must be one of: {', '.join(sorted(ALLOWED_SCOPES))}")
        return value

    @field_validator("source_agent")
    @classmethod
    def validate_source_agent(cls, value):
        if value not in ALLOWED_AGENTS:
            raise ValueError(f"source_agent must be one of: {', '.join(sorted(ALLOWED_AGENTS))}")
        return value

    @field_validator("agents")
    @classmethod
    def validate_agents(cls, value):
        for agent in value:
            if agent not in ALLOWED_AGENTS:
                raise ValueError(f"agent must be one of: {', '.join(sorted(ALLOWED_AGENTS))}")
        return value

    @field_validator("nodes")
    @classmethod
    def validate_nodes(cls, value):
        for node in value:
            if node not in ALLOWED_NODES:
                raise ValueError(f"node must be one of: {', '.join(sorted(ALLOWED_NODES))}")
        return value

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise ValueError("tags must be a list")
        out = []
        for item in value[:10]:
            if not isinstance(item, str):
                continue
            tag = re.sub(r"[^a-zA-Z0-9_-]", "", item.lower())[:32]
            if tag and tag not in out:
                out.append(tag)
        return out


def _default_entry() -> MemoryEntry:
    return MemoryEntry(
        id="seed-active-lead-rule",
        created_at="2026-06-26T00:00:00+00:00",
        title="Mission Control shared memory is non-Paperclip",
        body=(
            "Use AGENTS.md, CLAUDE.md, agent.md, and this shared memory. "
            "Joshua's direct assignment chooses the active lead. "
            "This memory mesh is direct Mission Control state, not a Paperclip dependency."
        ),
        scope="global",
        source_agent="codex",
        agents=sorted(ALLOWED_AGENTS),
        nodes=sorted(ALLOWED_NODES),
        tags=["mission-control", "memory", "active-lead"],
    )


def _read_entries(limit: int = 50) -> List[MemoryEntry]:
    if not MEMORY_LOG.exists():
        return [_default_entry()]

    entries: List[MemoryEntry] = []
    for line in MEMORY_LOG.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            entries.append(MemoryEntry(**json.loads(line)))
        except Exception as exc:
            logger.warning("skipping invalid memory line", extra={"error": str(exc)})
            continue
    if not entries:
        entries.append(_default_entry())
    return entries[-limit:]


def _write_entry(entry: MemoryEntry) -> None:
    MEMORY_LOG.parent.mkdir(parents=True, exist_ok=True)
    with MEMORY_LOG.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry.model_dump(), ensure_ascii=True) + "\n")


def _bootstrap_text(entries: List[MemoryEntry]) -> str:
    if BOOTSTRAP_FILE.exists():
        base = BOOTSTRAP_FILE.read_text(encoding="utf-8").strip()
    else:
        base = (
            "# Mission Control Agent Memory\n\n"
            "Read AGENTS.md, CLAUDE.md, agent.md, then load /memory/bootstrap before acting."
        )

    recent = "\n".join(
        f"- [{entry.created_at}] {entry.title} ({entry.scope}; {entry.source_agent}): {entry.body}"
        for entry in reversed(entries[-8:])
    )
    return f"{base}\n\n## Recent Shared Memory\n\n{recent}\n"


@router.get("/status")
async def memory_status():
    entries = _read_entries(limit=200)
    return {
        "ok": True,
        "memory_log": str(MEMORY_LOG),
        "bootstrap_file": str(BOOTSTRAP_FILE),
        "entries": len(entries),
        "nodes": NODE_ACCESS,
        "lanes": AI_LANES,
        "scopes": sorted(ALLOWED_SCOPES),
        "paperclip_excluded": True,
    }


@router.get("/entries")
async def list_memory_entries(
    limit: int = Query(50, ge=1, le=200),
    agent: Optional[str] = None,
    node: Optional[str] = None,
    tag: Optional[str] = None,
):
    entries = list(reversed(_read_entries(limit=200)))
    if agent:
        entries = [entry for entry in entries if agent == entry.source_agent or agent in entry.agents or not entry.agents]
    if node:
        entries = [entry for entry in entries if node in entry.nodes or not entry.nodes]
    if tag:
        entries = [entry for entry in entries if tag.lower() in entry.tags]
    return {"entries": [entry.model_dump() for entry in entries[:limit]]}


@router.post("/entries")
async def create_memory_entry(payload: MemoryWrite):
    entry = MemoryEntry(
        id=uuid.uuid4().hex[:12],
        created_at=datetime.now(timezone.utc).isoformat(),
        title=payload.title,
        body=payload.body,
        scope=payload.scope,
        source_agent=payload.source_agent,
        agents=payload.agents,
        nodes=payload.nodes,
        tags=payload.tags,
        visibility=payload.visibility,
    )
    try:
        _write_entry(entry)
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"unable to write memory entry: {exc}") from exc
    logger.info("memory entry created", extra={"memory_id": entry.id, "scope": entry.scope, "source_agent": entry.source_agent})
    return {"entry": entry.model_dump(), "stored": True}


@router.get("/bootstrap")
async def memory_bootstrap(limit: int = Query(12, ge=1, le=50)):
    entries = _read_entries(limit=limit)
    return {
        "text": _bootstrap_text(entries),
        "entries": [entry.model_dump() for entry in reversed(entries)],
        "nodes": NODE_ACCESS,
        "lanes": AI_LANES,
        "source_files": ["AGENTS.md", "CLAUDE.md", "agent.md", "memory/MISSION-CONTROL-AGENT-MEMORY.md"],
    }
