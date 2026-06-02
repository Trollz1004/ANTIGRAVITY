"""
Multi-platform chat fan-out + broadcast hub.

Every AI surface Joshua named (Hermes, OpenClaw, Emergent universal, Claude,
OpenAI, Gemini, Genspark, Grok, Perplexity, OpenRouter, Manus) routes through
a single contract: POST /api/chat/send {provider, model, messages[]}.

Broadcast (Telegram / WhatsApp) takes the latest assistant reply and
mirrors it to Joshua's groups — same shape as ClawX in the JoshuaClaw repo.
No fabrication: if a BYOK key is missing, the endpoint returns 503 with the
exact env var name to set.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import time
import uuid
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

from hermes_models import HERMES_VIRTUAL_MODELS

logger = logging.getLogger("hub")

# ── platform registry ─────────────────────────────────────────────────── #
# tier:
#   "emergent"  → bridged through Emergent Universal LLM key (works OOTB)
#   "byok"      → needs a BYOK key in /app/backend/.env
#   "local"     → only reachable from Joshua's workstation
TIER_EMERGENT = "emergent"
TIER_BYOK = "byok"
TIER_LOCAL = "local"

PLATFORMS: List[Dict[str, Any]] = [
    {
        "id": "e1", "label": "E1 · Build Agent", "tier": TIER_EMERGENT,
        "color": "#fb923c",
        "models": ["e1-gemini", "e1-gpt", "e1-opus"],
        "description": "The agent that built this surface — Emergent's full-stack engineer.",
        "persona": (
            "You are E1, the build agent that constructed this Mission Control "
            "for OpusPawClaw. You speak as the maker — direct, technical, warm, "
            "no fluff. You hold the doctrine: Opus conducts, agents execute; "
            "no fast-tier Anthropic label; no request-for-funds language; "
            "honest mirrors only; #UntilNoKidInNeed. "
            "When Joshua asks for changes, propose the smallest viable edit. "
            "When Joshua asks for opinions, give them — short, specific, useful. "
            "When you say 'we' you mean Joshua + the agents on this surface. "
            "Quote his motto only when it lands: "
            "'Gravity keeps us grounded — AI built ANTIGRAVITY to lift us up.'"
        ),
        "bridge_provider_default": "gemini",
        "bridge_models": {
            "e1-opus":   ("anthropic", "claude-opus-4-5-20251101"),
            "e1-gpt":    ("openai",    "gpt-5.1"),
            "e1-gemini": ("gemini",    "gemini-2.5-pro"),
        },
    },
    {
        "id": "hermes", "label": "Hermes Router", "tier": TIER_EMERGENT,
        "color": "#00d4ff",
        "models": ["hermes", "hermes-deep", "cfo", "code", "marketing", "kimi", "fast"],
        "description": "Joshua's virtual-model layer — bridged via Emergent.",
    },
    {
        "id": "emergent", "label": "Emergent Universal", "tier": TIER_EMERGENT,
        "color": "#e040fb",
        "models": ["claude-opus-4-5-20251101", "gpt-5.1", "gemini-2.5-pro", "gemini-2.5-flash"],
        "description": "Direct multiplex via Emergent Universal LLM key.",
    },
    {
        "id": "claude", "label": "Claude · Opus", "tier": TIER_EMERGENT,
        "color": "#b200ff",
        "models": ["claude-opus-4-5-20251101", "claude-sonnet-4-6", "claude-opus-4-6"],
        "description": "Anthropic conductor (only 'Opus' surface label).",
    },
    {
        "id": "openai", "label": "OpenAI", "tier": TIER_EMERGENT,
        "color": "#00e676",
        "models": ["gpt-5.2", "gpt-5.1", "gpt-5", "gpt-5-mini", "o3", "o4-mini"],
        "description": "OpenAI line via Emergent universal key.",
    },
    {
        "id": "gemini", "label": "Gemini · Google", "tier": TIER_EMERGENT,
        "color": "#ffb300",
        "models": ["gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-2.5-pro", "gemini-2.5-flash"],
        "description": "Google Gemini family.",
    },
    {
        "id": "grok", "label": "Grok · xAI", "tier": TIER_BYOK,
        "color": "#ec4899", "env": "XAI_API_KEY",
        "endpoint": "https://api.x.ai/v1/chat/completions",
        "models": ["grok-4", "grok-4-fast", "grok-3"],
        "description": "Adversarial review · X-platform.",
    },
    {
        "id": "perplexity", "label": "Perplexity · Comet", "tier": TIER_BYOK,
        "color": "#22d3ee", "env": "PERPLEXITY_API_KEY",
        "endpoint": "https://api.perplexity.ai/chat/completions",
        "models": ["sonar-pro", "sonar", "sonar-reasoning-pro"],
        "description": "Source-grounded research.",
    },
    {
        "id": "openrouter", "label": "OpenRouter", "tier": TIER_BYOK,
        "color": "#3b82f6", "env": "OPENROUTER_API_KEY",
        "endpoint": "https://openrouter.ai/api/v1/chat/completions",
        "models": ["moonshotai/kimi-k2-1205", "qwen/qwen-3-coder-480b", "x-ai/grok-4-fast", "anthropic/claude-opus-4.5"],
        "description": "Universal model market.",
    },
    {
        "id": "genspark", "label": "Genspark", "tier": TIER_BYOK,
        "color": "#f59e0b", "env": "GENSPARK_API_KEY",
        "endpoint": "https://api.genspark.ai/v1/chat/completions",
        "models": ["genspark-default", "genspark-pro"],
        "description": "Spreadsheet & research agent surface.",
    },
    {
        "id": "manus", "label": "Manus", "tier": TIER_BYOK,
        "color": "#a78bfa", "env": "MANUS_API_KEY",
        "endpoint": "https://api.manus.im/v1/chat/completions",
        "models": ["manus-default"],
        "description": "Computer-use agent surface.",
    },
    {
        "id": "openclaw", "label": "OpenClaw · Local", "tier": TIER_LOCAL,
        "color": "#00d4ff",
        "endpoint": "http://localhost:11434/api/chat",
        "models": ["openclaw", "openclaw-elite"],
        "description": "Local Ollama agent — workstation only.",
    },
    {
        "id": "ollama", "label": "Ollama · Local", "tier": TIER_LOCAL,
        "color": "#10b981",
        "endpoint": "http://localhost:11434/api/chat",
        "models": ["gemma3:1b", "qwen2.5-coder:480b", "korpohermes-prime"],
        "description": "Local Ollama runtime.",
    },
]

PLATFORM_BY_ID = {p["id"]: p for p in PLATFORMS}


def _emergent_chat(provider: str, model: str, messages: List[Dict[str, str]], session_id: str) -> str:
    """Sync helper that calls emergentintegrations on a worker thread."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY missing")

    system = next((m["content"] for m in messages if m["role"] == "system"), "")
    last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), None)
    if last_user is None:
        raise RuntimeError("no user message")

    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system or "You are Opus on Mission Control. Direct, brief, mission-forward. #UntilNoKidInNeed.",
    ).with_model(provider, model)

    return asyncio.run(chat.send_message(UserMessage(text=last_user)))  # type: ignore


async def _byok_chat(p: Dict[str, Any], model: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """OpenAI-compatible BYOK request to the platform's endpoint."""
    key = os.environ.get(p["env"], "")
    if not key:
        raise HTTPException(status_code=503, detail=f"{p['label']}: set {p['env']} in /app/backend/.env to enable")

    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    if p["id"] == "openrouter":
        headers["HTTP-Referer"] = "https://opuspawclaw.youandinotai.com"
        headers["X-Title"] = "OpusPawClaw Mission Control"

    payload = {"model": model, "messages": messages, "stream": False}
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(p["endpoint"], json=payload, headers=headers)
        r.raise_for_status()
        return r.json()


async def _local_chat(p: Dict[str, Any], model: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """Ollama-style local chat — only reachable from Joshua's workstation."""
    payload = {"model": model, "messages": messages, "stream": False}
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            r = await client.post(p["endpoint"], json=payload)
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"{p['label']}: {p['endpoint']} unreachable from cloud preview ({e}). Run on your workstation.") from e
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"{p['label']}: {r.text[:200]}")
        return r.json()


# ── router & models ───────────────────────────────────────────────────── #
router = APIRouter(prefix="/api")


class ChatMessage(BaseModel):
    role: str
    content: str


class UnifiedChatRequest(BaseModel):
    provider: str
    model: str
    messages: List[ChatMessage]
    session_id: Optional[str] = None
    broadcast: Optional[List[str]] = None  # subset of ["telegram", "whatsapp"]


@router.get("/providers")
async def list_providers():
    """Public registry — every AI surface, with honest tier + readiness state."""
    out = []
    SAFE_KEYS = {"id", "label", "tier", "color", "models", "description", "env"}
    for p in PLATFORMS:
        copy = {k: v for k, v in p.items() if k in SAFE_KEYS}
        if p["tier"] == TIER_BYOK:
            copy["ready"] = bool(os.environ.get(p["env"], "").strip())
        elif p["tier"] == TIER_EMERGENT:
            copy["ready"] = bool(os.environ.get("EMERGENT_LLM_KEY", "").strip())
        else:
            copy["ready"] = False  # local — never ready from cloud preview
        out.append(copy)
    return {"providers": out, "broadcast": _broadcast_status()}


@router.post("/chat/send")
async def chat_send(body: UnifiedChatRequest, response: Response):
    """Unified send. Routes by provider id; surfaces real model + latency headers."""
    p = PLATFORM_BY_ID.get(body.provider)
    if not p:
        raise HTTPException(status_code=400, detail=f"unknown provider '{body.provider}'")

    start = time.perf_counter()
    session_id = body.session_id or f"{body.provider}-{uuid.uuid4().hex[:8]}"
    msgs = [{"role": m.role, "content": m.content} for m in body.messages]
    real_model = body.model

    try:
        if body.provider == "e1":
            e1 = PLATFORM_BY_ID["e1"]
            # Default to Gemini per "no Claude/Anthropic on third-party platforms".
            # Opus stays available as an explicit pick when Joshua wants it.
            bridge_provider, bridge_model = e1["bridge_models"].get(
                body.model, ("gemini", "gemini-2.5-flash")
            )
            real_model = f"e1 · {body.model} · bridged via {bridge_provider}/{bridge_model}"
            has_system = any(m["role"] == "system" for m in msgs)
            if not has_system:
                msgs = [{"role": "system", "content": e1["persona"]}] + msgs
            reply = await asyncio.to_thread(_emergent_chat, bridge_provider, bridge_model, msgs, session_id)
        elif body.provider == "hermes":
            conf = HERMES_VIRTUAL_MODELS.get(body.model)
            if conf is None:
                raise HTTPException(status_code=400, detail=f"unknown hermes virtual model '{body.model}'")
            reply = await asyncio.to_thread(
                _emergent_chat, conf["bridge_provider"], conf["bridge_model"], msgs, session_id,
            )
            real_model = f"{conf['real_model']} · bridged via {conf['bridge_provider']}/{conf['bridge_model']}"
        elif body.provider in ("emergent", "claude", "openai", "gemini"):
            bridge_provider = (
                "anthropic" if body.provider == "claude"
                else "openai" if body.provider == "openai"
                else "gemini" if body.provider == "gemini"
                # 'emergent' = direct: infer provider from model prefix
                else ("anthropic" if body.model.startswith("claude")
                      else "gemini" if body.model.startswith("gemini")
                      else "openai")
            )
            reply = await asyncio.to_thread(_emergent_chat, bridge_provider, body.model, msgs, session_id)
        elif p["tier"] == TIER_BYOK:
            data = await _byok_chat(p, body.model, msgs)
            reply = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
        elif p["tier"] == TIER_LOCAL:
            data = await _local_chat(p, body.model, msgs)
            reply = (data.get("message") or {}).get("content") or data.get("response") or ""
        else:
            raise HTTPException(status_code=500, detail=f"unhandled tier {p['tier']}")
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("chat send failed")
        raise HTTPException(status_code=502, detail=f"{p['label']} bridge error: {exc}") from exc

    latency_ms = int((time.perf_counter() - start) * 1000)

    # Optional broadcast — fan out to telegram/whatsapp if requested
    broadcast_results = {}
    if body.broadcast:
        for channel in body.broadcast:
            if channel == "telegram":
                broadcast_results["telegram"] = await _telegram_send(
                    f"💠 *{p['label']} · {body.model}*\n\n{reply}\n\n_via OpusPawClaw Mission Control · #UntilNoKidInNeed_"
                )
            elif channel == "whatsapp":
                broadcast_results["whatsapp"] = await _whatsapp_send(
                    f"*{p['label']} · {body.model}*\n\n{reply}\n\n— OpusPawClaw Mission Control · #UntilNoKidInNeed"
                )

    response.headers["X-Hermes-Provider"] = p["id"]
    response.headers["X-Hermes-Real-Model"] = real_model
    response.headers["X-Hermes-Latency-Ms"] = str(latency_ms)
    response.headers["Access-Control-Expose-Headers"] = "X-Hermes-Provider, X-Hermes-Real-Model, X-Hermes-Latency-Ms"

    return {
        "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
        "provider": p["id"],
        "platform_label": p["label"],
        "real_model": real_model,
        "latency_ms": latency_ms,
        "choices": [{"index": 0, "message": {"role": "assistant", "content": reply}, "finish_reason": "stop"}],
        "broadcast": broadcast_results,
    }


# ── Broadcast (Telegram + WhatsApp) ───────────────────────────────────── #
def _broadcast_status() -> Dict[str, Any]:
    return {
        "telegram": {
            "configured": bool(os.environ.get("TELEGRAM_BOT_TOKEN")) and bool(os.environ.get("TELEGRAM_CHAT_ID")),
            "missing": [v for v in ("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID") if not os.environ.get(v)],
        },
        "whatsapp": {
            "configured": all(bool(os.environ.get(v)) for v in ("WHATSAPP_PHONE_ID", "WHATSAPP_TOKEN", "WHATSAPP_TO")),
            "missing": [v for v in ("WHATSAPP_PHONE_ID", "WHATSAPP_TOKEN", "WHATSAPP_TO") if not os.environ.get(v)],
        },
    }


@router.get("/broadcast/status")
async def broadcast_status():
    return _broadcast_status()


class BroadcastRequest(BaseModel):
    text: str
    source: Optional[str] = "Mission Control"


@router.post("/broadcast/telegram")
async def broadcast_telegram(body: BroadcastRequest):
    return await _telegram_send(f"💠 *{body.source}*\n\n{body.text}\n\n_via OpusPawClaw Mission Control · #UntilNoKidInNeed_")


@router.post("/broadcast/whatsapp")
async def broadcast_whatsapp(body: BroadcastRequest):
    return await _whatsapp_send(f"*{body.source}*\n\n{body.text}\n\n— OpusPawClaw Mission Control · #UntilNoKidInNeed")


async def _telegram_send(text: str) -> Dict[str, Any]:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return {"ok": False, "configured": False,
                "hint": "Set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in /app/backend/.env. Get a bot from @BotFather, add it to your group, then call https://api.telegram.org/bot<TOKEN>/getUpdates to find chat_id."}

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown", "disable_web_page_preview": True}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.post(url, json=payload)
        except httpx.RequestError as e:
            return {"ok": False, "configured": True, "error": str(e)}
    data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text[:200]}
    return {"ok": r.status_code == 200 and data.get("ok", False), "configured": True, "status": r.status_code, "data": data}


async def _whatsapp_send(text: str) -> Dict[str, Any]:
    phone_id = os.environ.get("WHATSAPP_PHONE_ID", "").strip()
    token = os.environ.get("WHATSAPP_TOKEN", "").strip()
    to = os.environ.get("WHATSAPP_TO", "").strip()
    if not (phone_id and token and to):
        return {"ok": False, "configured": False,
                "hint": "Set WHATSAPP_PHONE_ID + WHATSAPP_TOKEN + WHATSAPP_TO in /app/backend/.env. Get them from Meta Business Suite > WhatsApp Business API."}

    url = f"https://graph.facebook.com/v21.0/{phone_id}/messages"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": text}}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.post(url, json=payload, headers=headers)
        except httpx.RequestError as e:
            return {"ok": False, "configured": True, "error": str(e)}
    data = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text[:200]}
    return {"ok": r.status_code in (200, 201), "configured": True, "status": r.status_code, "data": data}
