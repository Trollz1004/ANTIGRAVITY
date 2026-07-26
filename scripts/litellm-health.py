#!/usr/bin/env python3
"""
Worker-3: Litellm Health Monitor + Discord Alert
Monitors http://127.0.0.1:4000/health/all every 5 minutes.
Sends Discord notification when any endpoint goes unhealthy.
Logs to C:\Antigravity\logs\litellm-health.log

Usage:
  python litellm-health.py

To enable Discord alerts:
  echo "https://discord.com/api/webhooks/YOUR/WEBHOOK" > C:\Antigravity\logs\discord-webhook-url.txt
"""

import urllib.request
import urllib.error
import json
import os
import sys
import time
from datetime import datetime

LOG_DIR = r'C:\Antigravity\logs'
LOG_FILE = os.path.join(LOG_DIR, 'litellm-health.log')
DISCORD_WEBHOOK_FILE = os.path.join(LOG_DIR, 'discord-webhook-url.txt')
LITELLM_HEALTH_URL = 'http://127.0.0.1:4000/health/all'
PORT = 4000
CHECK_INTERVAL = 300  # 5 minutes

os.makedirs(LOG_DIR, exist_ok=True)

def log(msg):
    line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_FILE, 'a') as f:
            f.write(line + '\n')
    except Exception:
        pass

def rotate_log():
    try:
        if os.path.exists(LOG_FILE) and os.path.getsize(LOG_FILE) > 10 * 1024 * 1024:
            with open(LOG_FILE, 'r') as f:
                lines = f.readlines()
            half = len(lines) // 2
            with open(LOG_FILE + '.1', 'w') as f:
                f.writelines(lines[half:])
            with open(LOG_FILE, 'w') as f:
                f.writelines(lines[:half])
    except Exception:
        pass

def test_port(host, port, timeout=2000):
    """Test TCP port connectivity."""
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout / 1000)
        result = s.connect_ex((host, port))
        s.close()
        return result == 0
    except Exception:
        return False

def check_litellm_health():
    """Fetch /health/all from Litellm proxy."""
    try:
        req = urllib.request.Request(
            LITELLM_HEALTH_URL,
            headers={'User-Agent': 'Antigravity-Health-Monitor/1.0'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        log(f"HTTP error {e.code} from Litellm health endpoint")
        return None
    except Exception as e:
        log(f"Could not reach Litellm at {LITELLM_HEALTH_URL}: {e}")
        return None

def get_webhook():
    """Load Discord webhook URL from file."""
    try:
        with open(DISCORD_WEBHOOK_FILE, 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return None
    except Exception as e:
        log(f"Error reading webhook file: {e}")
        return None

def send_discord_alert(summary: str, unhealthy: list):
    """Send alert to Discord webhook."""
    webhook_url = get_webhook()
    if not webhook_url:
        log("DISCORD ALERT: no webhook URL configured — skipping notification.")
        return

    color = 0xFF4444  # red
    fields = []
    for u in unhealthy[:10]:  # cap at 10 fields
        model = u.get('model', 'unknown')
        error = str(u.get('error', ''))[:200]
        fields.append({
            "name": f"Model: {model}",
            "value": f"```\n{error}\n```",
            "inline": False
        })

    payload = {
        "username": "Antigravity Health Monitor",
        "embeds": [{
            "title": "Litellm Unhealthy Endpoints Alert",
            "description": summary,
            "color": color,
            "fields": fields,
            "footer": {"text": "Antigravity 24/7 Autonomous Operations"},
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }]
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        webhook_url,
        data=data,
        headers={'Content-Type': 'application/json', 'User-Agent': 'Antigravity/1.0'}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 204:
                log("Discord alert sent successfully.")
            else:
                log(f"Discord alert response: {resp.status}")
    except Exception as e:
        log(f"Failed to send Discord alert: {e}")

def send_discord_healthy():
    """Send recovery notification."""
    webhook_url = get_webhook()
    if not webhook_url:
        return

    payload = {
        "username": "Antigravity Health Monitor",
        "embeds": [{
            "title": "Litellm All Endpoints Healthy",
            "description": "All Litellm model endpoints are responding correctly.",
            "color": 0x44FF44,  # green
            "footer": {"text": "Antigravity 24/7 Autonomous Operations"},
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }]
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        webhook_url,
        data=data,
        headers={'Content-Type': 'application/json', 'User-Agent': 'Antigravity/1.0'}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == 204:
                log("Discord healthy notification sent.")
    except Exception:
        pass

def fix_litellm_models(health_data):
    """
    Attempt self-healing for common Litellm issues:
    - Pull missing Ollama models (if ollama CLI is available)
    - Flag config issues for human review
    """
    fixes_applied = []
    for u in health_data.get('unhealthy_endpoints', []):
        error = str(u.get('error', ''))
        model = u.get('model', 'unknown')
        api_base = u.get('api_base', '')

        # Missing Ollama model
        if "not found" in error.lower() and 'ollama' in api_base.lower():
            log(f"  [FIX] Missing Ollama model '{model}' — attempting pull...")
            try:
                import subprocess
                result = subprocess.run(
                    ['ollama', 'pull', model],
                    capture_output=True, text=True, timeout=120
                )
                if result.returncode == 0:
                    fixes_applied.append(f"Pulled Ollama model: {model}")
                    log(f"  [OK] Pulled Ollama model: {model}")
                else:
                    log(f"  [FAIL] Could not pull {model}: {result.stderr[:200]}")
            except FileNotFoundError:
                log(f"  [SKIP] ollama CLI not found in PATH.")
            except subprocess.TimeoutExpired:
                log(f"  [TIMEOUT] ollama pull timed out after 120s.")
            except Exception as e:
                log(f"  [ERROR] ollama pull failed: {e}")
        else:
            # Non-Ollama issue (missing API key, etc.) — flag for review
            log(f"  [REVIEW] Endpoint needs config fix: {model} — {error[:120]}")

    return fixes_applied

def main():
    log("====== Litellm Health Monitor Started ======")
    log(f"Monitoring {LITELLM_HEALTH_URL} every {CHECK_INTERVAL}s")
    log("To configure Discord alerts: create file E:/ANTIGRAVITY\\logs\\discord-webhook-url.txt with your webhook URL")

    # Track state to avoid duplicate alerts
    last_unhealthy_count = -1
    consecutive_healthy = 0

    while True:
        rotate_log()

        # First check if Litellm port is reachable
        if not test_port('127.0.0.1', PORT):
            log(f"Litellm port {PORT} unreachable — service may be down.")
            send_discord_alert(
                f"**Litellm proxy DOWN** — port {PORT} is not responding.",
                [{'model': f'litellm:{PORT}', 'error': f'Port {PORT} unreachable — service may have crashed.'}]
            )
            consecutive_healthy = 0
        else:
            health = check_litellm_health()
            if health is None:
                log("Could not fetch /health/all — Litellm may be misconfigured.")
            else:
                unhealthy = health.get('unhealthy_endpoints', [])
                healthy_count = health.get('healthy_count', 0)
                unhealthy_count = health.get('unhealthy_count', 0)

                if unhealthy_count > 0:
                    consecutive_healthy = 0
                    if unhealthy_count != last_unhealthy_count:
                        log(f"[ALERT] {unhealthy_count} unhealthy, {healthy_count} healthy.")
                        summary = f"**{unhealthy_count} unhealthy** / {healthy_count} healthy endpoint(s)"
                        send_discord_alert(summary, unhealthy)
                        fixes = fix_litellm_models(health)
                        if fixes:
                            log(f"Self-healing applied: {fixes}")
                        last_unhealthy_count = unhealthy_count
                else:
                    consecutive_healthy += 1
                    if consecutive_healthy == 1:
                        log("All Litellm endpoints healthy.")
                        send_discord_healthy()
                    last_unhealthy_count = -1

        time.sleep(CHECK_INTERVAL)

if __name__ == '__main__':
    main()
