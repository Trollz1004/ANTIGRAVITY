#!/usr/bin/env python3
"""
CodeX Task Sentry
=================

Persistent queue dispatcher for the Sabretooth node.

What it does:
- Maintains a durable task queue in JSON.
- Dispatches tasks to `codex exec`, OpenClaw (`/chat`), or Ollama (`/api/generate`).
- Marks task lifecycle (pending -> in_progress -> done/failed).
- Spawns follow-up tasks automatically when a task completes.
- Exports a human-readable markdown queue file (`TASK-QUEUE-100.md`).

Usage examples:
  python scripts/codex_task_sentry.py --init-ewaste --export-markdown
  python scripts/codex_task_sentry.py --status
  python scripts/codex_task_sentry.py --run-once --export-markdown
  python scripts/codex_task_sentry.py --loop --interval-minutes 5 --export-markdown
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_DIR = PROJECT_DIR / "data"
LOGS_DIR = PROJECT_DIR / "CodeX" / "logs"

DEFAULT_QUEUE_FILE = DATA_DIR / "codex-task-queue.json"
DEFAULT_STATE_FILE = DATA_DIR / "codex-task-sentry-state.json"
DEFAULT_MARKDOWN_FILE = PROJECT_DIR / "CodeX" / "state" / "runtime" / "TASK-QUEUE-100.md"

DEFAULT_OPENCLAW_URL = os.environ.get("OPENCLAW_URL", "http://127.0.0.1:3201")
DEFAULT_OLLAMA_URL = os.environ.get(
    "OLLAMA_URL", os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
)
DEFAULT_OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")

VALID_STATUSES = {"pending", "in_progress", "done", "failed"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def safe_truncate(value: str, max_chars: int) -> str:
    if len(value) <= max_chars:
        return value
    return value[: max_chars - 3] + "..."


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")


def setup_logger(log_path: Path) -> logging.Logger:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("codex-task-sentry")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    formatter = logging.Formatter("%(asctime)s [SENTRY] %(levelname)-5s %(message)s")

    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    return logger


def default_queue() -> dict[str, Any]:
    return {
        "version": "1.0",
        "updated_at": utc_now(),
        "tasks": [],
    }


def normalize_task(task: dict[str, Any]) -> dict[str, Any]:
    now = utc_now()
    normalized = dict(task)
    normalized.setdefault("id", f"task-{int(time.time())}")
    normalized.setdefault("title", normalized["id"])
    normalized.setdefault("description", "")
    normalized.setdefault("executor", "codex")
    normalized.setdefault("priority", 50)
    normalized.setdefault("status", "pending")
    normalized.setdefault("retries", 0)
    normalized.setdefault("max_retries", 2)
    normalized.setdefault("tags", [])
    normalized.setdefault("created_at", now)
    normalized.setdefault("updated_at", now)
    normalized.setdefault("spawn_on_done", [])
    normalized.setdefault("prompt", normalized.get("description", normalized["title"]))

    if normalized["status"] not in VALID_STATUSES:
        normalized["status"] = "pending"
    return normalized


def load_queue(queue_file: Path) -> dict[str, Any]:
    queue = read_json(queue_file, default_queue())
    if not isinstance(queue, dict):
        queue = default_queue()
    tasks = queue.get("tasks", [])
    if not isinstance(tasks, list):
        tasks = []
    queue["tasks"] = [normalize_task(t) for t in tasks if isinstance(t, dict)]
    queue.setdefault("version", "1.0")
    queue.setdefault("updated_at", utc_now())
    return queue


def save_queue(queue_file: Path, queue: dict[str, Any]) -> None:
    queue["updated_at"] = utc_now()
    write_json(queue_file, queue)


def queue_counts(queue: dict[str, Any]) -> dict[str, int]:
    counts = {status: 0 for status in VALID_STATUSES}
    for task in queue.get("tasks", []):
        status = task.get("status", "pending")
        if status in counts:
            counts[status] += 1
    return counts


def task_exists(queue: dict[str, Any], task_id: str) -> bool:
    for task in queue.get("tasks", []):
        if task.get("id") == task_id:
            return True
    return False


class SafeDict(dict):
    def __missing__(self, key: str) -> str:
        return "{" + key + "}"


def render_templates(obj: Any, context: dict[str, str]) -> Any:
    if isinstance(obj, str):
        return obj.format_map(SafeDict(context))
    if isinstance(obj, list):
        return [render_templates(x, context) for x in obj]
    if isinstance(obj, dict):
        return {k: render_templates(v, context) for k, v in obj.items()}
    return obj


def append_task(queue: dict[str, Any], task: dict[str, Any]) -> bool:
    normalized = normalize_task(task)
    if task_exists(queue, normalized["id"]):
        return False
    queue.setdefault("tasks", []).append(normalized)
    queue["updated_at"] = utc_now()
    return True


def seed_ewaste_tasks(queue: dict[str, Any]) -> int:
    day = datetime.now().strftime("%Y%m%d")
    seed_tasks = [
        {
            "id": f"EW-INTAKE-{day}",
            "title": "Create e-waste intake and triage sheet for inbound PCs/servers/laptops",
            "description": "Build a reusable intake workflow and file templates for inventory, grading, and value estimates.",
            "executor": "codex",
            "priority": 100,
            "tags": ["ewaste", "intake", "inventory", "ebay"],
            "prompt": (
                "In E:/sandbox-repo, set up an operational intake workflow for inbound e-waste devices "
                "(PCs, servers, laptops). Create practical templates under data/ or briefings/ for: "
                "inventory intake, condition grading, testing status, estimated resale value, and ebay listing readiness. "
                "Keep everything compliant and focused on service-safe resale tracking."
            ),
            "spawn_on_done": [
                {
                    "id": f"EW-LISTINGS-{day}",
                    "title": "Generate eBay listing templates with service-safe messaging",
                    "description": "Prepare listing titles, descriptions, and condition disclosures for common hardware categories.",
                    "executor": "openclaw",
                    "priority": 95,
                    "tags": ["ewaste", "ebay", "copy"],
                    "prompt": (
                        "Create high-converting but policy-safe ebay listing templates for inbound desktops, laptops, and servers. "
                        "Include concise title patterns, honest condition language, shipping notes, and a short service-support line."
                    ),
                    "spawn_on_done": [
                        {
                            "id": f"EW-OUTREACH-{day}",
                            "title": "Create outreach messages to source more e-waste",
                            "description": "Produce compliant outreach copy for local businesses and community groups.",
                            "executor": "openclaw",
                            "priority": 75,
                            "tags": ["ewaste", "outreach", "inventory"],
                            "prompt": (
                                "Write concise outreach templates to request surplus e-waste from businesses and schools. "
                                "Tone must be transparent, respectful, and focused on responsible recycling and fast intake."
                            ),
                        }
                    ],
                },
                {
                    "id": f"EW-QA-{day}",
                    "title": "Generate testing + photo checklist before eBay publishing",
                    "description": "Standardize pre-listing QA so listings are accurate and trusted.",
                    "executor": "ollama",
                    "priority": 90,
                    "tags": ["ewaste", "qa", "ebay"],
                    "prompt": (
                        "Generate a practical checklist for testing inbound PCs/servers/laptops before resale, "
                        "plus a photo shot-list that improves buyer trust on ebay."
                    ),
                },
                {
                    "id": f"EW-LEDGER-{day}",
                    "title": "Build operational ledger for sold e-waste items",
                    "description": "Create a simple ledger structure linking each sold item to intake, resale, and reporting status.",
                    "executor": "codex",
                    "priority": 92,
                    "tags": ["ewaste", "operations", "ledger"],
                    "prompt": (
                        "Set up an operational ledger format in this repo that can map sold ebay items to intake, resale, and reporting status. "
                        "Keep fields practical for weekly reporting and auditability."
                    ),
                    "spawn_on_done": [
                        {
                            "id": f"EW-WEEKLY-REPORT-{day}",
                            "title": "Draft weekly operational report template for internal review",
                            "description": "Turn intake and sales activity into clear weekly reporting.",
                            "executor": "codex",
                            "priority": 70,
                            "tags": ["ewaste", "reporting", "operations"],
                            "prompt": (
                                "Create a weekly report template that summarizes inbound inventory, sold items, "
                                "gross revenue, net proceeds, and operational notes for OnlineRecycle."
                            ),
                        }
                    ],
                },
            ],
        }
    ]

    added = 0
    for task in seed_tasks:
        if append_task(queue, task):
            added += 1
    return added


def select_next_task(queue: dict[str, Any]) -> dict[str, Any] | None:
    pending = [t for t in queue.get("tasks", []) if t.get("status") == "pending"]
    if not pending:
        return None
    pending.sort(
        key=lambda t: (
            -int(t.get("priority", 50)),
            str(t.get("created_at", "")),
            str(t.get("id", "")),
        )
    )
    return pending[0]


def http_json(url: str, payload: dict[str, Any], timeout_seconds: int) -> dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
        raw = resp.read().decode("utf-8", errors="ignore")
    if not raw.strip():
        return {}
    return json.loads(raw)


def run_codex_task(task: dict[str, Any], max_result_chars: int) -> tuple[bool, str]:
    prompt = str(task.get("prompt", "")).strip()
    if not prompt:
        return False, "Task has no prompt."

    model = str(task.get("model", "")).strip()
    timeout_seconds = int(task.get("timeout_seconds", 1800))

    safe_task_id = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in task["id"])
    output_file = DATA_DIR / f"codex-task-output-{safe_task_id}-{int(time.time())}.txt"

    cmd = ["codex", "--ask-for-approval", "never"]
    if model:
        cmd.extend(["--model", model])
    if bool(task.get("web_search", False)):
        cmd.append("--search")

    cmd.extend(
        [
            "exec",
            "--cd",
            str(PROJECT_DIR),
            "--sandbox",
            "workspace-write",
            "--skip-git-repo-check",
            "--output-last-message",
            str(output_file),
            prompt,
        ]
    )

    try:
        result = subprocess.run(
            cmd,
            cwd=str(PROJECT_DIR),
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
            encoding="utf-8",
            errors="ignore",
        )
    except subprocess.TimeoutExpired:
        return False, f"codex exec timed out after {timeout_seconds} seconds."
    except FileNotFoundError:
        return False, "codex CLI not found in PATH."
    except Exception as exc:
        return False, f"codex exec failed: {exc}"

    last_message = ""
    if output_file.exists():
        try:
            last_message = output_file.read_text(encoding="utf-8", errors="ignore").strip()
        except Exception:
            last_message = ""

    tail_stdout = safe_truncate(result.stdout.strip(), 1200) if result.stdout else ""
    tail_stderr = safe_truncate(result.stderr.strip(), 1200) if result.stderr else ""

    parts = []
    if last_message:
        parts.append(last_message)
    if tail_stdout:
        parts.append(f"[stdout]\n{tail_stdout}")
    if tail_stderr:
        parts.append(f"[stderr]\n{tail_stderr}")

    if not parts:
        parts.append(f"codex exit code: {result.returncode}")

    combined = safe_truncate("\n\n".join(parts), max_result_chars)
    return result.returncode == 0, combined


def run_openclaw_task(task: dict[str, Any], openclaw_url: str, max_result_chars: int) -> tuple[bool, str]:
    prompt = str(task.get("prompt", "")).strip()
    if not prompt:
        return False, "Task has no prompt."

    timeout_seconds = int(task.get("timeout_seconds", 60))
    endpoint = openclaw_url.rstrip("/") + "/chat"
    payload = {"sessionId": f"sentry-{task['id']}", "message": prompt}

    try:
        response = http_json(endpoint, payload, timeout_seconds)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        return False, f"OpenClaw HTTP {exc.code}: {safe_truncate(body, 800)}"
    except urllib.error.URLError as exc:
        return False, f"OpenClaw connection error: {exc.reason}"
    except Exception as exc:
        return False, f"OpenClaw request failed: {exc}"

    message = str(response.get("response", "")).strip()
    if not message:
        return False, f"OpenClaw response missing 'response' field: {response}"
    return True, safe_truncate(message, max_result_chars)


def run_ollama_task(task: dict[str, Any], ollama_url: str, max_result_chars: int) -> tuple[bool, str]:
    prompt = str(task.get("prompt", "")).strip()
    if not prompt:
        return False, "Task has no prompt."

    model = str(task.get("model", DEFAULT_OLLAMA_MODEL)).strip() or DEFAULT_OLLAMA_MODEL
    timeout_seconds = int(task.get("timeout_seconds", 90))
    endpoint = ollama_url.rstrip("/") + "/api/generate"
    payload = {"model": model, "prompt": prompt, "stream": False}

    try:
        response = http_json(endpoint, payload, timeout_seconds)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        return False, f"Ollama HTTP {exc.code}: {safe_truncate(body, 800)}"
    except urllib.error.URLError as exc:
        return False, f"Ollama connection error: {exc.reason}"
    except Exception as exc:
        return False, f"Ollama request failed: {exc}"

    message = str(response.get("response", "")).strip()
    if not message:
        return False, f"Ollama response missing 'response' field: {response}"
    return True, safe_truncate(message, max_result_chars)


def dispatch_task(
    task: dict[str, Any],
    force_executor: str | None,
    openclaw_url: str,
    ollama_url: str,
    max_result_chars: int,
) -> tuple[bool, str, str]:
    executor = (force_executor or str(task.get("executor", "codex"))).strip().lower()

    if executor == "codex":
        ok, result = run_codex_task(task, max_result_chars=max_result_chars)
        return ok, result, executor
    if executor == "openclaw":
        ok, result = run_openclaw_task(task, openclaw_url, max_result_chars=max_result_chars)
        return ok, result, executor
    if executor == "ollama":
        ok, result = run_ollama_task(task, ollama_url, max_result_chars=max_result_chars)
        return ok, result, executor
    return False, f"Unknown executor '{executor}'.", executor


def spawn_followups(task: dict[str, Any], queue: dict[str, Any]) -> int:
    followups = task.get("spawn_on_done", [])
    if not isinstance(followups, list) or not followups:
        return 0

    context = {
        "date": datetime.now().strftime("%Y%m%d"),
        "today": datetime.now().strftime("%Y-%m-%d"),
        "parent_id": str(task.get("id", "")),
        "parent_title": str(task.get("title", "")),
    }

    added = 0
    for candidate in followups:
        if not isinstance(candidate, dict):
            continue
        rendered = render_templates(candidate, context)
        if append_task(queue, rendered):
            added += 1
    return added


def export_markdown(queue: dict[str, Any], markdown_file: Path) -> None:
    groups = {
        "pending": [],
        "in_progress": [],
        "done": [],
        "failed": [],
    }
    for task in queue.get("tasks", []):
        status = task.get("status", "pending")
        groups.setdefault(status, []).append(task)

    for status in groups:
        groups[status].sort(
            key=lambda t: (
                -int(t.get("priority", 50)),
                str(t.get("created_at", "")),
                str(t.get("id", "")),
            )
        )

    lines: list[str] = []
    lines.append("# TASK QUEUE 100")
    lines.append("")
    lines.append(f"Generated: {utc_now()}")
    lines.append("")

    counts = queue_counts(queue)
    lines.append("## Summary")
    lines.append("")
    lines.append(f"- Pending: {counts['pending']}")
    lines.append(f"- In Progress: {counts['in_progress']}")
    lines.append(f"- Done: {counts['done']}")
    lines.append(f"- Failed: {counts['failed']}")
    lines.append("")

    section_order = [
        ("Pending", "pending", "[ ]"),
        ("In Progress", "in_progress", "[~]"),
        ("Done", "done", "[x]"),
        ("Failed", "failed", "[!]"),
    ]

    for label, status, check in section_order:
        lines.append(f"## {label}")
        lines.append("")
        items = groups.get(status, [])
        if not items:
            lines.append("- (none)")
            lines.append("")
            continue
        for task in items:
            task_id = task.get("id", "unknown")
            title = task.get("title", task_id)
            executor = task.get("executor", "codex")
            priority = task.get("priority", 50)
            retries = task.get("retries", 0)
            updated = task.get("updated_at", "")
            lines.append(
                f"- {check} `{task_id}` {title} | executor={executor} priority={priority} retries={retries} updated={updated}"
            )
        lines.append("")

    markdown_file.parent.mkdir(parents=True, exist_ok=True)
    markdown_file.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def write_state(
    state_file: Path,
    queue: dict[str, Any],
    last_task_id: str | None,
    last_task_status: str | None,
    last_error: str | None,
) -> None:
    state = {
        "updated_at": utc_now(),
        "last_task_id": last_task_id,
        "last_task_status": last_task_status,
        "last_error": last_error,
        "counts": queue_counts(queue),
    }
    write_json(state_file, state)


def print_status(queue: dict[str, Any]) -> None:
    counts = queue_counts(queue)
    next_task = select_next_task(queue)
    print("CODEX TASK SENTRY STATUS")
    print("========================")
    print(f"Pending     : {counts['pending']}")
    print(f"In Progress : {counts['in_progress']}")
    print(f"Done        : {counts['done']}")
    print(f"Failed      : {counts['failed']}")
    if next_task:
        print("")
        print(f"Next Task   : {next_task.get('id')} ({next_task.get('executor', 'codex')})")
        print(f"Title       : {next_task.get('title')}")
    else:
        print("")
        print("Next Task   : none")


def run_one_cycle(
    queue_file: Path,
    state_file: Path,
    markdown_file: Path,
    force_executor: str | None,
    openclaw_url: str,
    ollama_url: str,
    max_result_chars: int,
    export_md: bool,
    logger: logging.Logger,
) -> bool:
    queue = load_queue(queue_file)
    next_task = select_next_task(queue)

    if next_task is None:
        logger.info("No pending tasks.")
        write_state(state_file, queue, None, "idle", None)
        if export_md:
            export_markdown(queue, markdown_file)
        return False

    task_id = str(next_task.get("id"))
    logger.info("Dispatching task: %s", task_id)

    next_task["status"] = "in_progress"
    next_task["started_at"] = utc_now()
    next_task["updated_at"] = utc_now()
    save_queue(queue_file, queue)

    ok, result, executor_used = dispatch_task(
        next_task,
        force_executor=force_executor,
        openclaw_url=openclaw_url,
        ollama_url=ollama_url,
        max_result_chars=max_result_chars,
    )

    next_task["executor_used"] = executor_used
    next_task["updated_at"] = utc_now()

    if ok:
        next_task["status"] = "done"
        next_task["completed_at"] = utc_now()
        next_task["last_result"] = result
        next_task.pop("last_error", None)
        added = spawn_followups(next_task, queue)
        logger.info("Task complete: %s (followups added: %d)", task_id, added)
        write_state(state_file, queue, task_id, "done", None)
    else:
        retries = int(next_task.get("retries", 0)) + 1
        max_retries = int(next_task.get("max_retries", 2))
        next_task["retries"] = retries
        next_task["last_error"] = result
        next_task["last_result"] = result
        if retries > max_retries:
            next_task["status"] = "failed"
            logger.error("Task failed permanently: %s | %s", task_id, result)
            write_state(state_file, queue, task_id, "failed", result)
        else:
            next_task["status"] = "pending"
            logger.warning(
                "Task failed (will retry): %s retry=%s/%s | %s",
                task_id,
                retries,
                max_retries,
                result,
            )
            write_state(state_file, queue, task_id, "retrying", result)

    save_queue(queue_file, queue)
    if export_md:
        export_markdown(queue, markdown_file)
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="CodeX Task Sentry")
    parser.add_argument("--queue-file", type=Path, default=DEFAULT_QUEUE_FILE, help="Path to queue JSON")
    parser.add_argument("--state-file", type=Path, default=DEFAULT_STATE_FILE, help="Path to state JSON")
    parser.add_argument(
        "--markdown-file",
        type=Path,
        default=DEFAULT_MARKDOWN_FILE,
        help="Path to markdown queue snapshot",
    )
    parser.add_argument("--openclaw-url", default=DEFAULT_OPENCLAW_URL, help="OpenClaw base URL")
    parser.add_argument("--ollama-url", default=DEFAULT_OLLAMA_URL, help="Ollama base URL")
    parser.add_argument(
        "--force-executor",
        choices=["codex", "openclaw", "ollama"],
        help="Override executor for all dispatched tasks",
    )
    parser.add_argument("--init-ewaste", action="store_true", help="Seed queue with e-waste donation tasks")
    parser.add_argument("--status", action="store_true", help="Print queue status")
    parser.add_argument("--run-once", action="store_true", help="Run one dispatch cycle")
    parser.add_argument("--loop", action="store_true", help="Run continuously")
    parser.add_argument("--interval-minutes", type=int, default=5, help="Loop interval minutes")
    parser.add_argument("--export-markdown", action="store_true", help="Write TASK-QUEUE-100.md snapshot")
    parser.add_argument("--max-result-chars", type=int, default=4000, help="Max task result length")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

    logger = setup_logger(LOGS_DIR / "codex-task-sentry.log")
    logger.info("CodeX Task Sentry started.")

    queue = load_queue(args.queue_file)
    modified = False

    if args.init_ewaste:
        added = seed_ewaste_tasks(queue)
        modified = modified or (added > 0)
        logger.info("Seeded e-waste tasks: %d added", added)
        if added == 0:
            logger.info("No new seed tasks added (already present).")

    if modified:
        save_queue(args.queue_file, queue)

    if args.export_markdown:
        export_markdown(queue, args.markdown_file)

    if args.status and not args.run_once and not args.loop:
        print_status(queue)
        return 0

    if args.run_once:
        run_one_cycle(
            queue_file=args.queue_file,
            state_file=args.state_file,
            markdown_file=args.markdown_file,
            force_executor=args.force_executor,
            openclaw_url=args.openclaw_url,
            ollama_url=args.ollama_url,
            max_result_chars=args.max_result_chars,
            export_md=args.export_markdown,
            logger=logger,
        )
        return 0

    if args.loop:
        interval_seconds = max(30, args.interval_minutes * 60)
        logger.info("Loop mode enabled. Interval: %s seconds", interval_seconds)
        while True:
            try:
                run_one_cycle(
                    queue_file=args.queue_file,
                    state_file=args.state_file,
                    markdown_file=args.markdown_file,
                    force_executor=args.force_executor,
                    openclaw_url=args.openclaw_url,
                    ollama_url=args.ollama_url,
                    max_result_chars=args.max_result_chars,
                    export_md=args.export_markdown,
                    logger=logger,
                )
            except KeyboardInterrupt:
                logger.info("Interrupted by user. Exiting.")
                break
            except Exception as exc:
                logger.error("Loop cycle error: %s", exc)
            time.sleep(interval_seconds)
        return 0

    # Default action with no mode flags: print status.
    print_status(queue)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

