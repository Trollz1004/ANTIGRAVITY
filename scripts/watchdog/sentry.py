"""ANTIGRAVITY node sentry — health watchdog.

Runs continuously on every node (T5500, Sabretooth, 9020). Writes a status
JSON to the OneDrive Personal Vault every INTERVAL_SEC seconds. The
dashboard.html on the mini-ASUS display reads all sentry-*.json files and
renders a green/red grid Josh can glance at without unlocking anything.

Cross-node visibility = OneDrive sync. No HTTP server, no cloud auth, no
firewall holes. The file IS the bus.

Run via:
    python C:\\Antigravity\\scripts\\watchdog\\sentry.py

Or via bootstrap-claude-node.cmd at user logon (Windows Task Scheduler).
"""

from __future__ import annotations

import json
import os
import platform
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# ── Config ───────────────────────────────────────────────────────────────────
INTERVAL_SEC = 60
HTTP_TIMEOUT = 5
PORT_TIMEOUT = 2
DOCKER_TIMEOUT = 5

NODE = platform.node()
VAULT_DIR = Path(os.path.expanduser("~/OneDrive/Personal Vault"))
STATUS_FILE = VAULT_DIR / f"sentry-{NODE}.json"
LOG_FILE = VAULT_DIR / f"sentry-{NODE}.log"

# Ports we expect listening on every node where they're configured
PORT_CHECKS = {
    "ollama_11434": 11434,
    "hermes_router_11435": 11435,
    "brain_mcp_3900": 3900,
    "mission_mcp_3901": 3901,
    "postgres_5432": 5432,
    "qdrant_6333": 6333,
    "redis_6379": 6379,
    "openclaw_3200": 3200,
}

# Docker containers (only meaningful on T5500 where the prod stack runs)
DOCKER_CHECKS = [
    "uandinotai-app-prod",
    "uandinotai-postgres-prod",
    "uandinotai-redis-prod",
    "uandinotai-nginx-prod",
    "uandinotai-backup",
]

# Public surfaces (any node can reach these — useful for Josh's "is the site
# actually serving" question without claiming "200 = verified")
URL_CHECKS = {
    "apex_youandinotai": "https://youandinotai.com",
    "apex_onlinerecycle": "https://onlinerecycle.org",
    "apex_ai_solutions": "https://ai-solutions.store",
    "apex_dashboard": "https://dashboard.aidoesitall.website",
}

# Expected page-title fragments — verifies content, not just HTTP code
URL_TITLE_EXPECTATIONS = {
    "apex_youandinotai": [
        "YouAndiNotAi",  # both old "Verified Human Dating" and new "social platform" share this prefix
    ],
    "apex_onlinerecycle": ["OnlineRecycle", "Recycling"],
}


# ── Checks ───────────────────────────────────────────────────────────────────
def check_port(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=PORT_TIMEOUT):
            return True
    except OSError:
        return False


def check_url(url: str) -> dict:
    """Return {'reachable': bool, 'status': int|None, 'title_match': bool|None}."""
    out: dict = {"reachable": False, "status": None, "title_match": None}
    try:
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": "antigravity-sentry/1.0"})
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            out["status"] = resp.status
            out["reachable"] = 200 <= resp.status < 400
            try:
                body = resp.read(8192).decode("utf-8", errors="replace")
                # crude title extraction (no html parser dep)
                lower = body.lower()
                start = lower.find("<title>")
                end = lower.find("</title>")
                if start != -1 and end != -1:
                    out["title"] = body[start + 7 : end].strip()
            except Exception:
                pass
    except urllib.error.HTTPError as e:
        out["status"] = e.code
    except Exception as e:
        out["error"] = str(e)
    return out


def check_docker_container(name: str) -> bool:
    try:
        result = subprocess.run(
            ["docker", "inspect", "-f", "{{.State.Running}}", name],
            capture_output=True,
            text=True,
            timeout=DOCKER_TIMEOUT,
        )
        return result.returncode == 0 and result.stdout.strip() == "true"
    except (subprocess.SubprocessError, FileNotFoundError):
        return False


def check_docker_engine() -> bool:
    try:
        result = subprocess.run(
            ["docker", "version", "--format", "{{.Server.Version}}"],
            capture_output=True,
            text=True,
            timeout=DOCKER_TIMEOUT,
        )
        return result.returncode == 0 and bool(result.stdout.strip())
    except (subprocess.SubprocessError, FileNotFoundError):
        return False


# ── Main loop ────────────────────────────────────────────────────────────────
def gather_status() -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    ports = {name: check_port(port) for name, port in PORT_CHECKS.items()}
    docker_engine = check_docker_engine()
    docker_containers = (
        {name: check_docker_container(name) for name in DOCKER_CHECKS}
        if docker_engine
        else {name: False for name in DOCKER_CHECKS}
    )
    urls = {}
    for name, url in URL_CHECKS.items():
        result = check_url(url)
        # content verification: title must contain at least one expected fragment
        expectations = URL_TITLE_EXPECTATIONS.get(name, [])
        if expectations and "title" in result:
            result["title_match"] = any(
                frag.lower() in result["title"].lower() for frag in expectations
            )
        urls[name] = result

    return {
        "node": NODE,
        "captured": now,
        "interval_sec": INTERVAL_SEC,
        "ports": ports,
        "docker_engine": docker_engine,
        "docker_containers": docker_containers,
        "urls": urls,
    }


def write_atomic(path: Path, content: str) -> None:
    """Atomic write via temp file + rename (OneDrive-safe)."""
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(content, encoding="utf-8")
    tmp.replace(path)


def log(msg: str) -> None:
    line = f"{datetime.now(timezone.utc).isoformat(timespec='seconds')} {msg}\n"
    try:
        with LOG_FILE.open("a", encoding="utf-8") as f:
            f.write(line)
    except Exception:
        pass
    print(line.rstrip(), file=sys.stderr)


def main() -> int:
    if not VAULT_DIR.exists():
        log(f"VAULT_DIR not found: {VAULT_DIR}. Personal Vault must be unlocked + OneDrive synced.")
        # don't crash; write status to local fallback
        fallback = Path(os.path.expanduser("~/.antigravity-sentry"))
        fallback.mkdir(parents=True, exist_ok=True)
        globals()["STATUS_FILE"] = fallback / f"sentry-{NODE}.json"
        globals()["LOG_FILE"] = fallback / f"sentry-{NODE}.log"

    log(f"sentry starting on node={NODE} interval={INTERVAL_SEC}s status_file={STATUS_FILE}")

    while True:
        try:
            status = gather_status()
            write_atomic(STATUS_FILE, json.dumps(status, indent=2))
        except Exception as e:
            log(f"gather_status failed: {type(e).__name__}: {e}")
            err = {
                "node": NODE,
                "captured": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "error": str(e),
            }
            try:
                write_atomic(STATUS_FILE, json.dumps(err, indent=2))
            except Exception as e2:
                log(f"error write also failed: {e2}")
        time.sleep(INTERVAL_SEC)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        log("sentry stopped via KeyboardInterrupt")
        sys.exit(0)
