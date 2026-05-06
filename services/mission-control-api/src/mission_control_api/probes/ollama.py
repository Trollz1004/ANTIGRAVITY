import asyncio
from .http import http_probe

async def ollama_probe():
    resp = await http_probe("http://127.0.0.1:11434/api/tags")
    # augment details with model_count if possible
    if resp.status == "ok":
        try:
            models = resp.details.get("models", [])
            resp.details["model_count"] = len(models)
        except Exception:
            pass
    return resp
