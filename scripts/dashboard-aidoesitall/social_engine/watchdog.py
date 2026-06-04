"""
Watchdog — Self-diagnosis and auto-recovery for the social engine.
Prevents repeated failures by detecting issues EARLY and alerting Josh.
Tracks known issues so alerts aren't spammed every cycle.
"""
import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path

log = logging.getLogger("social-engine")

PROJECT_DIR = Path(__file__).parent.parent.parent
PROFILE_DIR = PROJECT_DIR / "data" / "browser-sessions" / "daemon-profile"
ISSUES_FILE = PROJECT_DIR / "data" / "watchdog-issues.json"

# Track what we've already alerted about (in-memory, reset on daemon restart)
_alerted_issues = set()


def _load_issues():
    """Load persistent issue tracking."""
    if ISSUES_FILE.exists():
        try:
            with open(ISSUES_FILE, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"issues": {}, "last_updated": None}


def _save_issues(issues):
    """Save issue tracking."""
    issues["last_updated"] = datetime.now().isoformat()
    try:
        with open(ISSUES_FILE, "w", encoding="utf-8") as f:
            json.dump(issues, f, indent=2)
    except Exception as e:
        log.error(f"[Watchdog] Failed to save issues: {e}")


def clear_browser_locks():
    """Clear stale Chrome lock files that prevent browser launch."""
    cleared = False
    for lock in ["SingletonLock", "SingletonCookie", "SingletonSocket"]:
        lf = PROFILE_DIR / lock
        if lf.exists():
            try:
                lf.unlink()
                log.info(f"[Watchdog] Cleared stale lock: {lock}")
                cleared = True
            except Exception:
                pass
    return cleared


def check_browser_health(context):
    """Check if browser context is alive and has valid sessions."""
    if context is None:
        return False, "Browser context is None — never launched"
    try:
        pages = context.pages
        return True, f"Browser alive with {len(pages)} pages"
    except Exception as e:
        return False, f"Browser context dead: {e}"


def check_login_status(context, platform, url):
    """Quick check if a platform session is still valid."""
    if context is None:
        return False, "No browser"
    try:
        page = context.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=15000)
        time.sleep(3)
        current_url = page.url.lower()
        title = page.title().lower()
        page.close()

        if "login" in current_url or "sign" in current_url:
            return False, f"Redirected to login: {current_url}"
        if "log in" in title or "sign in" in title:
            return False, f"Login page detected: {title}"
        return True, "Session active"
    except Exception as e:
        return False, str(e)


def _check_api_platforms():
    """Check which API platforms have missing config."""
    missing = {}
    checks = {
        "bluesky": ["BLUESKY_HANDLE", "BLUESKY_APP_PASSWORD"],
        "mastodon": ["MASTODON_ACCESS_TOKEN"],
        "discord": ["DISCORD_WEBHOOK_URL"],
        "telegram": ["TELEGRAM_BOT_TOKEN", "TELEGRAM_MARKETING_CHANNEL_ID"],
        "devto": ["DEVTO_API_KEY"],
        "hashnode": ["HASHNODE_API_KEY"],
    }
    for platform, vars in checks.items():
        missing_vars = [v for v in vars if not os.environ.get(v)]
        if missing_vars:
            missing[platform] = missing_vars
    return missing


def diagnose_cycle(state):
    """Run after each cycle. Detect patterns that need intervention.
    Only alerts ONCE per issue type to prevent spam."""
    global _alerted_issues
    alerts = []
    platforms = state.get("platforms", {})
    issues = _load_issues()

    # ── Check 1: Platforms with consecutive failures ──
    failing = []
    for name, pstate in platforms.items():
        consec = pstate.get("consecutive_fails", 0)
        if consec >= 3:
            failing.append(f"{name}: {consec} consecutive fails")

    if failing and "consecutive_fails" not in _alerted_issues:
        total_posts = state.get("total_posts", 0)
        if total_posts == 0:
            alerts.append(
                "*CRITICAL: Zero posts ever succeeded*\n"
                "Browser sessions likely expired.\n"
                "Run: `python scripts/daemon-login.py`\n"
                "Then restart daemon.\n\n"
                "Failing platforms:\n" + "\n".join(f"  {f}" for f in failing)
            )
            _alerted_issues.add("consecutive_fails")
        elif len(failing) >= 3:
            alerts.append(
                "*WARNING: Multiple platform failures*\n"
                + "\n".join(f"  {f}" for f in failing)
                + "\n\nMay need to re-login to browser platforms."
            )
            _alerted_issues.add("consecutive_fails")

    # ── Check 2: Missing API keys (alert once per daemon run) ──
    missing_apis = _check_api_platforms()
    if missing_apis and "missing_apis" not in _alerted_issues:
        lines = ["*API platforms disabled — missing env vars:*"]
        for plat, vars in missing_apis.items():
            lines.append(f"  {plat}: {', '.join(vars)}")
        lines.append("\nAdd these to .env to enable free API posting.")
        alerts.append("\n".join(lines))
        _alerted_issues.add("missing_apis")

    # ── Check 3: Queue depletion ──
    queue_file = PROJECT_DIR / "data" / "post-queue.json"
    if queue_file.exists():
        try:
            with open(queue_file, encoding="utf-8") as f:
                queue = json.load(f)
            total_queued = sum(len(v) for v in queue.values() if isinstance(v, list))
            if total_queued < 5 and "queue_low" not in _alerted_issues:
                alerts.append(f"*Queue low: {total_queued} posts remaining*\nRefill data/post-queue.json")
                _alerted_issues.add("queue_low")
        except Exception:
            pass

    # ── Check 4: Engine health summary (every 12 cycles = ~6 hours) ──
    total_runs = state.get("total_runs", 0)
    if total_runs > 0 and total_runs % 12 == 0:
        total_posts = state.get("total_posts", 0)
        total_errors = state.get("total_errors", 0)
        working = []
        broken = []
        disabled = []
        for name, pstate in platforms.items():
            if pstate.get("total", 0) > 0:
                working.append(name)
            elif pstate.get("consecutive_fails", 0) > 0:
                broken.append(name)
            else:
                disabled.append(name)

        summary = (
            f"*Engine Health Report*\n"
            f"Runs: {total_runs} | Posts: {total_posts} | Errors: {total_errors}\n"
        )
        if working:
            summary += f"Working: {', '.join(working)}\n"
        if broken:
            summary += f"Broken: {', '.join(broken)}\n"
        if disabled:
            summary += f"Disabled: {', '.join(disabled)}\n"
        alerts.append(summary)

    # Save issues
    issues["issues"]["failing_platforms"] = failing
    issues["issues"]["missing_apis"] = list(missing_apis.keys()) if missing_apis else []
    issues["issues"]["total_posts"] = state.get("total_posts", 0)
    _save_issues(issues)

    return alerts


def pre_cycle_check():
    """Run BEFORE each cycle. Auto-fix what we can."""
    # Clear stale lock files
    clear_browser_locks()

    # Check .env is loaded
    if not os.environ.get("SOCIAL_EMAIL"):
        log.warning("[Watchdog] SOCIAL_EMAIL not in env — .env may not be loaded")

    # Check Ollama is reachable (free content generation)
    try:
        import requests
        url = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        resp = requests.get(f"{url}/api/tags", timeout=5)
        if resp.status_code == 200:
            models = [m["name"] for m in resp.json().get("models", [])]
            log.debug(f"[Watchdog] Ollama OK: {models}")
        else:
            log.warning(f"[Watchdog] Ollama returned {resp.status_code}")
    except Exception:
        log.warning("[Watchdog] Ollama not reachable — content will use queue/caption bank only")
