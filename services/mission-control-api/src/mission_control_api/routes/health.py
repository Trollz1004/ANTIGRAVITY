from fastapi import APIRouter
from mission_control_api.logging_config import get_logger

logger = get_logger(__name__)

from ..probes import (
    http as http_probe_mod,
    tcp as tcp_probe_mod,
    shell as shell_probe_mod,
    paperclip as paperclip_mod,
    hermes as hermes_mod,
    ollama as ollama_mod,
    openclaw as openclaw_mod,
    public_sites as public_sites_mod,
    cloudflare as cloudflare_mod,
    square as square_mod,
    guardian as guardian_mod,
    repo as repo_mod,
    docker as docker_mod,
    treasury as treasury_mod,
    revenue_buckets as revenue_mod,
    stack as stack_mod,
    t5500 as t5500_mod,
)
from ..envelope import Envelope
import asyncio

router = APIRouter()

@router.get("/health")
async def self_health():
    # simple self health
    from datetime import datetime
    details = {"status": "ok", "version": "0.1.0", "started_at": datetime.utcnow().isoformat() + "Z", "uptime_s": 0}
    from ..envelope import make_envelope
    return make_envelope("ok", 0, details).dict()

# individual probe endpoints
@router.get("/health/paperclip")
async def health_paperclip():
    return (await paperclip_mod.paperclip_probe()).dict()

@router.get("/health/hermes")
async def health_hermes():
    return (await hermes_mod.hermes_probe()).dict()

@router.get("/health/ollama")
async def health_ollama():
    return (await ollama_mod.ollama_probe()).dict()

@router.get("/health/openclaw")
async def health_openclaw():
    return (await openclaw_mod.openclaw_probe()).dict()

@router.get("/health/youandinotai")
async def health_youandinotai():
    return (await public_sites_mod.youandinotai_site_probe()).dict()

@router.get("/health/api-youandinotai")
async def health_api_youandinotai():
    return (await public_sites_mod.api_youandinotai_probe()).dict()

@router.get("/health/cloudflare-pages")
async def health_cloudflare():
    return (await cloudflare_mod.cloudflare_probe()).dict()

@router.get("/health/square")
async def health_square():
    return (await square_mod.square_probe()).dict()

@router.get("/health/guardian")
async def health_guardian():
    return (await guardian_mod.guardian_probe()).dict()

@router.get("/health/repo")
async def health_repo():
    return (await repo_mod.repo_probe()).dict()

@router.get("/health/docker")
async def health_docker():
    return (await docker_mod.docker_probe()).dict()

@router.get("/health/treasury")
async def health_treasury():
    return (await treasury_mod.treasury_probe()).dict()

@router.get("/health/revenue-buckets")
async def health_revenue():
    return (await revenue_mod.revenue_buckets_probe()).dict()

@router.get("/health/stack-integrity")
async def health_stack():
    return (await stack_mod.stack_probe()).dict()


@router.get("/health/t5500")
async def health_t5500():
    return (await t5500_mod.t5500_stack_probe()).dict()


@router.get("/health/t5500/postgres")
async def health_t5500_postgres():
    return (await t5500_mod.t5500_postgres_probe()).dict()


@router.get("/health/t5500/qdrant")
async def health_t5500_qdrant():
    return (await t5500_mod.t5500_qdrant_probe()).dict()


@router.get("/health/t5500/redis")
async def health_t5500_redis():
    return (await t5500_mod.t5500_redis_probe()).dict()


@router.get("/health/t5500/openclaw")
async def health_t5500_openclaw():
    return (await t5500_mod.t5500_openclaw_probe()).dict()

@router.get("/health/all")
async def health_all():
    probes = [
        ("paperclip", paperclip_mod.paperclip_probe()),
        ("hermes", hermes_mod.hermes_probe()),
        ("ollama", ollama_mod.ollama_probe()),
        ("openclaw", openclaw_mod.openclaw_probe()),
        ("youandinotai", public_sites_mod.youandinotai_site_probe()),
        ("api_youandinotai", public_sites_mod.api_youandinotai_probe()),
        ("cloudflare", cloudflare_mod.cloudflare_probe()),
        ("square", square_mod.square_probe()),
        ("guardian", guardian_mod.guardian_probe()),
        ("repo", repo_mod.repo_probe()),
        ("docker", docker_mod.docker_probe()),
        ("treasury", treasury_mod.treasury_probe()),
        ("revenue", revenue_mod.revenue_buckets_probe()),
        ("stack", stack_mod.stack_probe()),
        ("t5500", t5500_mod.t5500_stack_probe()),
    ]
    results = {}
    summary = {"ok": 0, "degraded": 0, "unreachable": 0}
    for name, coro in probes:
        env = await coro
        results[name] = env.dict()
        st = env.status
        if st in summary:
            summary[st] += 1
    results["_summary"] = summary
    return results
