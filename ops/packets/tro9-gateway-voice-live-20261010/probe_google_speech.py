import json, os, urllib.request, urllib.error

SCRATCH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "raw")
BASE = "http://127.0.0.1:20128"
TEXT = (
    "Trollz news, October tenth. Nineteen provider connections in the backup, "
    "and not one of them makes speech. This is the gateway voice."
)

for voice in ("kore", "charon", "fenrir", "puck"):
    body = {"model": "google/gemini-2.5-flash-preview-tts", "input": TEXT, "voice": voice}
    req = urllib.request.Request(f"{BASE}/v1/audio/speech", data=json.dumps(body).encode())
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            raw = r.read()
            ct = r.headers.get("content-type")
            print(f"[{voice}] HTTP {r.status} bytes={len(raw)} ctype={ct}")
            if len(raw) > 2000:
                p = os.path.join(SCRATCH, f"gateway-google-{voice}.wav")
                open(p, "wb").write(raw)
                print("    SAVED", p)
            else:
                print("   ", raw[:300].decode("utf-8", "replace"))
    except urllib.error.HTTPError as e:
        print(f"[{voice}] HTTP {e.code} {e.read()[:300].decode('utf-8','replace')}")
    except Exception as e:
        print(f"[{voice}] ERR {type(e).__name__}: {e}")
