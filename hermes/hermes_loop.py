#!/usr/bin/env python3
"""
HERMES Loop — /mnt/c/ANTIGRAVITY/hermes/hermes_loop.py
Autonomous task processor. Runs continuously, checks queue, executes tasks.
Built 2026-04-16 for OPUS / Josh / YouAndINotAI
"""

import json
import time
import os
import subprocess
from datetime import datetime

HERMES_DIR = "/mnt/c/ANTIGRAVITY/hermes"
QUEUE_FILE = f"{HERMES_DIR}/tasks/queue.json"
HISTORY_FILE = f"{HERMES_DIR}/tasks/history.json"
INBOX_FILE = f"{HERMES_DIR}/inbox/messages.json"
LOG_FILE = f"{HERMES_DIR}/logs/activity.log"
ERROR_LOG = f"{HERMES_DIR}/logs/error.log"
CONFIG_FILE = f"{HERMES_DIR}/config.json"

LOOP_INTERVAL = 300  # 5 minutes between cycles


def log(msg):
    """Write to activity log with timestamp."""
    timestamp = datetime.now().isoformat()
    entry = f"[{timestamp}] {msg}"
    print(entry)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(entry + "\n")
    except Exception as e:
        print(f"[LOG ERROR] {e}")


def log_error(msg):
    """Write to error log."""
    timestamp = datetime.now().isoformat()
    entry = f"[{timestamp}] ERROR: {msg}"
    print(entry)
    try:
        with open(ERROR_LOG, "a") as f:
            f.write(entry + "\n")
    except Exception:
        pass


def load_json(path, default=None):
    """Load JSON file safely."""
    if default is None:
        default = {}
    try:
        with open(path, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def save_json(path, data):
    """Save JSON file safely."""
    try:
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        log_error(f"save_json failed: {e}")
        return False


def load_queue():
    return load_json(QUEUE_FILE, {"tasks": [], "last_updated": "", "total_processed": 0})


def save_queue(queue):
    queue["last_updated"] = datetime.now().isoformat()
    return save_json(QUEUE_FILE, queue)


def load_history():
    return load_json(HISTORY_FILE, {"tasks": [], "last_updated": ""})


def save_history(history):
    history["last_updated"] = datetime.now().isoformat()
    return save_json(HISTORY_FILE, history)


def check_inbox():
    """Check for OPUS messages."""
    inbox = load_json(INBOX_FILE, {"messages": [], "unread_count": 0})
    return inbox.get("messages", [])


def process_task(task):
    """
    Execute a single task.
    Delegates to appropriate handler based on platform.
    """
    platform = task.get("platform", "").lower()
    content = task.get("content", "")
    task_id = task.get("id", "unknown")
    image = task.get("image", "")

    log(f"Processing task {task_id}: {platform} — {content[:50]}...")

    try:
        if platform == "twitter":
            _post_twitter(content, image)
        elif platform == "instagram":
            _post_instagram(content, image)
        elif platform == "reddit":
            _post_reddit(content)
        elif platform == "linkedin":
            _post_linkedin(content)
        elif platform == "meta":
            _post_meta(content)
        else:
            log(f"Unknown platform: {platform} — task {task_id} skipped")
            return "skipped"

        log(f"Task {task_id} completed successfully")
        return "done"
    except Exception as e:
        log_error(f"Task {task_id} failed: {e}")
        return "error"


def _post_twitter(content, image=""):
    """Post to Twitter via ENIGMA social_poster."""
    log("Twitter post delegated to ENIGMA — use MCP Chrome on Node 9020")
    # In full setup: call I:/OPUS/automation/modules/social_poster.py
    # For now: log intent
    log(f"[WOULD POST TO TWITTER] {content}")


def _post_instagram(content, image=""):
    """Post to Instagram via Meta Graph API."""
    log("Instagram post delegated to ENIGMA — use MCP Chrome on Node 9020")
    log(f"[WOULD POST TO INSTAGRAM] {content}")


def _post_reddit(content):
    """Post to Reddit."""
    log("Reddit posting — check karma level first")
    log(f"[WOULD POST TO REDDIT] {content}")


def _post_linkedin(content):
    """Post to LinkedIn."""
    log("LinkedIn posting — use MCP Chrome on Node 9020")
    log(f"[WOULD POST TO LINKEDIN] {content}")


def _post_meta(content):
    """Post to Meta (Facebook)."""
    log("Meta posting — use MCP Chrome on Node 9020")
    log(f"[WOULD POST TO META] {content}")


def run_cycle():
    """Run one iteration of the Hermes loop."""
    log("=== HERMES CYCLE START ===")

    # 1. Check inbox
    messages = check_inbox()
    if messages:
        log(f"Inbox: {len(messages)} message(s) found")
        # Process inbox messages as tasks
        # (Full inbox → task conversion would go here)

    # 2. Load queue
    queue = load_queue()
    pending = [t for t in queue.get("tasks", []) if t.get("status") == "pending"]

    if not pending:
        log("No pending tasks — sleeping")
        return

    log(f"Found {len(pending)} pending task(s)")

    # 3. Process oldest task first
    task = pending[0]
    task_id = task.get("id")
    result = process_task(task)

    # 4. Update queue
    queue = load_queue()
    for t in queue.get("tasks", []):
        if t.get("id") == task_id:
            t["status"] = result
            t["completed_at"] = datetime.now().isoformat()
            break
    queue["total_processed"] = queue.get("total_processed", 0) + 1
    save_queue(queue)

    # 5. Move to history
    history = load_history()
    completed = [t for t in queue.get("tasks", []) if t.get("status") in ("done", "error")]
    history["tasks"].extend(completed)
    # Keep last 100 in history
    history["tasks"] = history["tasks"][-100:]
    save_history(history)

    # 6. Remove completed from queue
    queue["tasks"] = [t for t in queue.get("tasks", []) if t.get("status") == "pending"]
    save_queue(queue)

    log(f"=== HERMES CYCLE END — result: {result} ===")


def main():
    log("HERMES Loop started")
    log(f"Config: {CONFIG_FILE}")
    log(f"Queue: {QUEUE_FILE}")

    # Load config
    config = load_json(CONFIG_FILE, {})
    ai_sources = config.get("ai_sources", {})
    log(f"AI sources available: {list(ai_sources.keys())}")

    while True:
        try:
            run_cycle()
        except Exception as e:
            log_error(f"Cycle error: {e}")

        log(f"Sleeping {LOOP_INTERVAL}s...")
        time.sleep(LOOP_INTERVAL)


if __name__ == "__main__":
    main()
