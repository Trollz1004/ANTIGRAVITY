import json, os, urllib.request, urllib.error

BACKUP = os.path.expanduser(
    "~/Downloads/omniroute-legacy-backup-2026-08-21T17-24-49-808Z.json"
)
d = json.load(open(BACKUP, encoding="utf-8"))
key = None
for c in d["providerConnections"]:
    if c.get("provider") == "gemini":
        key = c.get("apiKey")
if not key:
    raise SystemExit("no gemini key in backup")


def probe(label, url, body=None, headers=None):
    req = urllib.request.Request(url, data=(json.dumps(body).encode() if body else None))
    req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            raw = r.read()
            print(f"[{label}] HTTP {r.status} bytes={len(raw)}")
            print("   ", raw[:300].decode("utf-8", "replace").replace(key, "<KEY>"))
    except urllib.error.HTTPError as e:
        raw = e.read()
        print(f"[{label}] HTTP {e.code}")
        print("   ", raw[:400].decode("utf-8", "replace").replace(key, "<KEY>"))
    except Exception as e:
        print(f"[{label}] ERR {type(e).__name__}: {str(e).replace(key, '<KEY>')}")


BASE = "https://generativelanguage.googleapis.com"

# 1. key as ?key= query param (AI Studio style)
probe("models?key=", f"{BASE}/v1beta/models?key={key}")

# 2. key as x-goog-api-key header
probe("models x-goog-api-key", f"{BASE}/v1beta/models", headers={"x-goog-api-key": key})

# 3. key as bearer token
probe("models bearer", f"{BASE}/v1beta/models", headers={"Authorization": "Bearer " + key})

# 4. TTS generateContent
tts_body = {
    "contents": [{"parts": [{"text": "Trollz news. Voice credential test."}]}],
    "generationConfig": {
        "responseModalities": ["AUDIO"],
        "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Kore"}}},
    },
}
probe(
    "tts gemini-2.5-flash-preview-tts",
    f"{BASE}/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key={key}",
    body=tts_body,
)
