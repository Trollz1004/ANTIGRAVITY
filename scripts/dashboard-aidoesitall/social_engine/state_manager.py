"""
State Manager — Persistent state for the social engine daemon.
Adapted from master_orchestrator.py state management.
"""
import json
import logging
from datetime import datetime
from pathlib import Path

from .schedule_config import RATE_LIMITS, PLATFORM_SCHEDULE

log = logging.getLogger("social-engine")

DATA_DIR = Path(__file__).parent.parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
STATE_FILE = DATA_DIR / "social-engine-state.json"


def _default_state():
    platforms = {}
    for name in PLATFORM_SCHEDULE:
        platforms[name] = {"posted_today": 0, "total": 0, "last_post": None, "errors": 0, "consecutive_fails": 0}
    return {
        "last_run": None,
        "total_runs": 0,
        "total_posts": 0,
        "total_errors": 0,
        "platforms": platforms,
        "created": datetime.now().isoformat(),
        "last_daily_reset": datetime.now().strftime("%Y-%m-%d"),
    }


def load_state():
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, encoding="utf-8") as f:
                state = json.load(f)
            # ensure all platforms exist in state
            for name in PLATFORM_SCHEDULE:
                if name not in state.get("platforms", {}):
                    state.setdefault("platforms", {})[name] = {
                        "posted_today": 0, "total": 0, "last_post": None, "errors": 0, "consecutive_fails": 0,
                    }
            return state
        except Exception as e:
            log.error(f"Failed to load state: {e}")
    return _default_state()


def save_state(state):
    state["last_run"] = datetime.now().isoformat()
    state["total_runs"] = state.get("total_runs", 0) + 1
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)


def reset_daily_counts(state):
    today = datetime.now().strftime("%Y-%m-%d")
    if state.get("last_daily_reset") != today:
        for p in state["platforms"].values():
            p["posted_today"] = 0
        state["last_daily_reset"] = today
        log.info("Daily counters reset")


def can_post(platform, state):
    limits = RATE_LIMITS.get(platform, {})
    pstate = state["platforms"].get(platform, {})

    # skip if too many consecutive failures (exponential backoff)
    consec = pstate.get("consecutive_fails", 0)
    if consec >= 3:
        # backoff: skip for 2^(consec-2) hours
        if pstate.get("last_post"):
            hours_since = (datetime.now() - datetime.fromisoformat(pstate["last_post"])).total_seconds() / 3600
            backoff_hours = min(2 ** (consec - 2), 24)
            if hours_since < backoff_hours:
                return False, f"Backoff: {consec} consecutive fails, wait {backoff_hours}h"

    if pstate.get("posted_today", 0) >= limits.get("max_daily", 999):
        return False, f"Daily limit: {pstate['posted_today']}/{limits['max_daily']}"

    if pstate.get("last_post"):
        try:
            elapsed = (datetime.now() - datetime.fromisoformat(pstate["last_post"])).total_seconds() / 60
            if elapsed < limits.get("min_interval_min", 0):
                return False, f"Too soon: {int(elapsed)}/{limits['min_interval_min']} min"
        except (ValueError, TypeError):
            pass

    return True, "OK"


def record_post(platform, state, success=True):
    pstate = state["platforms"].setdefault(platform, {
        "posted_today": 0, "total": 0, "last_post": None, "errors": 0, "consecutive_fails": 0,
    })
    if success:
        pstate["posted_today"] = pstate.get("posted_today", 0) + 1
        pstate["total"] = pstate.get("total", 0) + 1
        pstate["last_post"] = datetime.now().isoformat()
        pstate["consecutive_fails"] = 0
        state["total_posts"] = state.get("total_posts", 0) + 1
    else:
        pstate["errors"] = pstate.get("errors", 0) + 1
        pstate["consecutive_fails"] = pstate.get("consecutive_fails", 0) + 1
        pstate["last_post"] = datetime.now().isoformat()
        state["total_errors"] = state.get("total_errors", 0) + 1
