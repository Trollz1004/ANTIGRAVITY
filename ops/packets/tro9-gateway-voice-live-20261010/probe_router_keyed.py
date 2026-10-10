import json, os, urllib.request, urllib.error

BACKUP = os.path.expanduser(
    "~/Downloads/omniroute-legacy-backup-2026-08-21T17-24-49-808Z.json"
)
d = json.load(open(BACKUP, encoding="utf-8"))
keys = {a["name"]: a["key"] for a in d["apiKeys"]}
BASE = "http://127.0.0.1:20128"


def call(label, url, key, body=None):
    req = urllib.request.Request(url, data=(json.dumps(body).encode() if body else None))
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", "Bearer " + key)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            print(f"[{label}] HTTP {r.status} bytes={len(raw)} ctype={r.headers.get('content-type')}")
            if "json" in (r.headers.get("content-type") or ""):
                print("   ", raw[:200].decode("utf-8", "replace"))
            return raw
    except urllib.error.HTTPError as e:
        print(f"[{label}] HTTP {e.code} {e.read()[:300].decode('utf-8','replace')}")
    except Exception as e:
        print(f"[{label}] ERR {type(e).__name__}: {e}")
    return None


for name, key in keys.items():
    call(f"{name} /v1/models", f"{BASE}/v1/models", key)

good = keys.get("PRODUCTION")
for model in (
    "google/gemini-2.5-flash-preview-tts",
    "gemini/gemini-2.5-flash-preview-tts",
    "openai/tts-1",
    "openai/gpt-4o-mini-tts",
    "elevenlabs/eleven_turbo_v2_5",
    "deepgram/aura-asteria-en",
):
    raw = call(
        f"speech {model}",
        f"{BASE}/v1/audio/speech",
        good,
        {"model": model, "input": "Trollz voice credential recheck, October tenth.", "voice": "alloy"},
    )
    if raw and len(raw) > 2000:
        here = os.path.join(os.path.dirname(os.path.abspath(__file__)), "raw")
        p = os.path.join(here, "router-speech-" + model.replace("/", "_") + ".bin")
        open(p, "wb").write(raw)
        print("    SAVED", p)
