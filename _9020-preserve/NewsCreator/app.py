import os
import json
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv


APP_DIR = Path(__file__).parent
DATA_DIR = APP_DIR / "data" / "memory"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Logging
LOG_DIR = APP_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "app.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("newscreator")


load_dotenv(APP_DIR / ".env")


def get_env(name: str, default: Optional[str] = None) -> str:
    return os.environ.get(name, default) if os.environ.get(name) else (default or "")


OLLAMA_BASE_URL = get_env("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = get_env("OLLAMA_MODEL", "llama3.1:8b")
TEMPERATURE = float(get_env("TEMPERATURE", "0.2") or 0.2)


class ChatRequest(BaseModel):
    session_id: str = Field(default="default", description="Conversation/session identifier")
    message: str = Field(description="User message")
    system_prompt: Optional[str] = Field(default=None, description="Optional system prompt override")
    temperature: Optional[float] = Field(default=None, description="Sampling temperature")
    model: Optional[str] = Field(default=None, description="Ollama model override")


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    model: str
    messages: List[Dict[str, str]]


def session_path(session_id: str) -> Path:
    safe = "".join(c for c in session_id if c.isalnum() or c in ("-", "_")) or "default"
    return DATA_DIR / f"{safe}.json"


def load_messages(session_id: str) -> List[Dict[str, str]]:
    p = session_path(session_id)
    if not p.exists():
        return []
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return []


def save_messages(session_id: str, messages: List[Dict[str, str]]) -> None:
    p = session_path(session_id)
    p.write_text(json.dumps(messages, ensure_ascii=False, indent=2), encoding="utf-8")


async def ollama_chat(model: str, messages: List[Dict[str, str]], temperature: float) -> str:
    url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat"
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": temperature},
    }
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(url, json=payload)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Ollama error: {r.status_code} {r.text[:200]}")
        data = r.json()
        # Ollama returns { message: { role: 'assistant', content: '...' }, ... }
        msg = data.get("message", {})
        content = msg.get("content")
        if not content:
            raise HTTPException(status_code=502, detail="Ollama returned empty content")
        return content


async def ollama_chat_stream(model: str, messages: List[Dict[str, str]], temperature: float):
    url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat"
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": True,
        "options": {"temperature": temperature},
    }
    async with httpx.AsyncClient(timeout=None) as client:
        async with client.stream("POST", url, json=payload) as r:
            if r.status_code != 200:
                text = await r.aread()
                raise HTTPException(status_code=502, detail=f"Ollama stream error: {r.status_code} {text[:200]}")
            async for line in r.aiter_lines():
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                msg = obj.get("message", {})
                chunk = msg.get("content")
                if chunk:
                    yield chunk


app = FastAPI(title="Self-Hosted Agent", version="0.2.0")

# Static and dashboard
app.mount("/static", StaticFiles(directory=str(APP_DIR / "static")), name="static")

# CORS (for local use and flexibility)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/dashboard")
async def dashboard():
    path = APP_DIR / "templates" / "dashboard.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="dashboard not found")
    return FileResponse(str(path))


@app.get("/")
async def root():
    return RedirectResponse(url="/dashboard")


@app.get("/health")
async def health():
    return {"status": "ok", "model": OLLAMA_MODEL}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    messages = load_messages(req.session_id)

    if req.system_prompt:
        # Ensure only one system at the start
        if messages and messages[0].get("role") == "system":
            messages[0] = {"role": "system", "content": req.system_prompt}
        else:
            messages = [{"role": "system", "content": req.system_prompt}] + messages

    messages.append({"role": "user", "content": req.message})

    temperature = req.temperature if req.temperature is not None else TEMPERATURE
    model = req.model or OLLAMA_MODEL
    reply = await ollama_chat(model, messages, temperature)

    messages.append({"role": "assistant", "content": reply})
    save_messages(req.session_id, messages)

    return ChatResponse(
        reply=reply,
        session_id=req.session_id,
        model=model,
        messages=messages,
    )


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    messages = load_messages(req.session_id)

    if req.system_prompt:
        if messages and messages[0].get("role") == "system":
            messages[0] = {"role": "system", "content": req.system_prompt}
        else:
            messages = [{"role": "system", "content": req.system_prompt}] + messages

    messages.append({"role": "user", "content": req.message})
    temperature = req.temperature if req.temperature is not None else TEMPERATURE

    model = req.model or OLLAMA_MODEL

    async def generator():
        full_parts: List[str] = []
        async for chunk in ollama_chat_stream(model, messages, temperature):
            full_parts.append(chunk)
            yield chunk
        reply = "".join(full_parts)
        messages.append({"role": "assistant", "content": reply})
        save_messages(req.session_id, messages)

    return StreamingResponse(generator(), media_type="text/plain; charset=utf-8")


@app.get("/models")
async def list_models():
    url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags"
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Ollama tags error: {r.status_code}")
        data = r.json()
        names = [m.get("name") for m in data.get("models", []) if m.get("name")]
        return {"models": names}


@app.get("/sessions")
async def list_sessions():
    items = []
    for p in sorted(DATA_DIR.glob("*.json")):
        try:
            messages = json.loads(p.read_text(encoding="utf-8"))
            last = messages[-1]["content"][:140] if messages else ""
        except Exception:
            last = ""
        items.append({"id": p.stem, "file": p.name, "last": last})
    return {"sessions": items}


@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    return {"id": session_id, "messages": load_messages(session_id)}


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    p = session_path(session_id)
    if p.exists():
        p.unlink()
    return {"deleted": session_id}


@app.delete("/sessions")
async def delete_all_sessions():
    count = 0
    for p in DATA_DIR.glob("*.json"):
        try:
            p.unlink()
            count += 1
        except Exception:
            pass
    return {"deleted": count}


if __name__ == "__main__":
    # Local run helper: uvicorn app:app --reload
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
