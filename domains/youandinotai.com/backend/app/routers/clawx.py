"""ClawX 6-AI operator integration router.

Provides endpoints for managing and monitoring the ClawX operator group
API keys. All endpoints require authentication.

GET    /api/v1/clawx/agents              — list registered agents
POST   /api/v1/clawx/agents/{name}/rotate — rotate an agent's API key
GET    /api/v1/clawx/health              — check ClawX service connectivity
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.clawx_integration import (
    ClawxClient,
    InvalidKeyError,
    KeyNotFoundError,
)
from app.config import get_settings
from app.error_responses import bad_request, not_found
from app.models import User

router = APIRouter(prefix="/clawx", tags=["clawx"])

# Module-level client instance (lazy-initialised on first use).
_clawx_client: ClawxClient | None = None


def _get_client() -> ClawxClient:
    """Return (or create) the module-level ClawX client."""
    global _clawx_client
    if _clawx_client is None:
        _clawx_client = ClawxClient()
    return _clawx_client


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------


class KeyRotateRequest(BaseModel):
    new_key: str = Field(
        ...,
        min_length=16,
        description="The new API key to assign to the agent.",
        examples=["sk-ant-new-secret-key-here"],
    )


class AgentInfo(BaseModel):
    name: str
    configured: bool
    key_prefix: str | None = None


class AgentListResponse(BaseModel):
    agents: list[AgentInfo]
    total: int
    configured_count: int


class RotateResponse(BaseModel):
    name: str
    status: str = "rotated"


class HealthCheckResponse(BaseModel):
    enabled: bool
    base_url: str
    reachable: bool | None = None
    status_code: int | None = None
    agent: str | None = None
    error: str | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/agents", response_model=AgentListResponse, summary="List ClawX agents")
async def list_clawx_agents(
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Return all 6 ClawX operator agents and their configuration status.

    Keys are never returned — only a masked prefix for configured agents.
    """
    client = _get_client()
    agents_raw = client.list_agents()
    agents = [AgentInfo(**a) for a in agents_raw]
    return {
        "agents": [a.model_dump() for a in agents],
        "total": len(agents),
        "configured_count": sum(1 for a in agents if a.configured),
    }


@router.post(
    "/agents/{agent_name}/rotate",
    response_model=RotateResponse,
    summary="Rotate an agent's API key",
)
async def rotate_agent_key(
    agent_name: str,
    body: KeyRotateRequest,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Replace the API key for *agent_name* with the provided ``new_key``.

    The new key must be at least 16 characters long and contain only
    alphanumeric characters, hyphens, underscores, dots, or colons.
    """
    client = _get_client()
    try:
        client.rotate_key(agent_name, body.new_key)
    except KeyNotFoundError as exc:
        raise not_found(str(exc))
    except InvalidKeyError as exc:
        raise bad_request(str(exc))
    return {"name": agent_name.lower().strip(), "status": "rotated"}


@router.get("/health", response_model=HealthCheckResponse, summary="ClawX health check")
async def clawx_health(
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Check connectivity to the ClawX service.

    Tests the ClawX base URL with a round-robin selected agent key.
    Returns whether the service is reachable and any error details.
    """
    settings = get_settings()
    enabled = bool(getattr(settings, "clawx_enabled", False))
    base_url = str(getattr(settings, "clawx_base_url", "") or "")

    if not enabled:
        return {
            "enabled": False,
            "base_url": base_url,
            "reachable": None,
            "status_code": None,
            "agent": None,
            "error": "ClawX integration is disabled.",
        }

    client = _get_client()
    result = await client.check_connectivity()
    return {
        "enabled": True,
        "base_url": base_url,
        **result,
    }
