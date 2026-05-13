#!/usr/bin/env python3
"""
seed-income-engine.py
---------------------
Reads the Genspark organic-growth playbook xlsx and seeds mission-mcp with
tasks from two sheets:
  - Submission Tracker  -> one task per launch directory
  - Content Calendar    -> one task per 30-day action

Usage:
  python seed-income-engine.py              # dry-run (prints what it would do)
  python seed-income-engine.py --commit     # POST tasks to mission-mcp HTTP API

Environment:
  MISSION_MCP_URL   base URL for mission-mcp (default: http://127.0.0.1:3901)
  MISSION_MCP_TOKEN bearer token if auth is enabled (optional; loopback needs none)
  XLSX_PATH         override the xlsx path

Idempotency:
  Tasks carry a tag prefix in their description field as a JSON metadata block.
  Before creating, the script fetches existing task titles and skips duplicates.

Constraints enforced:
  - No "donate", "donation", "solicitation", "tax-deductible" in any emitted string
  - No live posting — this only creates planning tasks
  - No credentials in code
"""

import sys
import io
import json
import os
import re
import argparse
import urllib.request
import urllib.error
from datetime import datetime

# Fix Windows cp1252 terminal encoding so emoji in xlsx strings don't crash print()
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf_8"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")


def strip_emoji(text: str) -> str:
    """Remove non-BMP characters (emoji) that break Windows terminals and task titles."""
    return re.sub(r"[^\x00-\xFFFF]", "", text).strip()

# ── Config ────────────────────────────────────────────────────────────────────

DEFAULT_XLSX = (
    r"C:\Users\joshl\OneDrive\e-commerce-orchestrator-v2\Documents"
    r"\High-Traffic_Social_Communities_and_Dating_App_Mar-Genspark_AI_Sheets-20260403_0344.xlsx"
)
DEFAULT_MCP_URL = "http://127.0.0.1:3901"

FORBIDDEN_WORDS = re.compile(
    r"\b(donat(e|ion|ions)|solicitat(e|ion)|tax.?deductible)\b", re.IGNORECASE
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def check_forbidden(text: str) -> None:
    """Raise if text contains TOS-unsafe charity framing."""
    m = FORBIDDEN_WORDS.search(text)
    if m:
        raise ValueError(
            f"TOS-unsafe word '{m.group()}' detected in generated content. "
            "Rewrite before shipping."
        )


def mcp_post(url: str, token: str | None, payload: dict) -> dict:
    """POST JSON-RPC request to mission-mcp HTTP endpoint.

    MCP streamable-HTTP transport requires Accept: application/json, text/event-stream
    (server validates the Accept header and 406s otherwise). The server may respond
    with either a plain JSON body or a single-event SSE stream; we parse both.
    """
    body = json.dumps(payload).encode()
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{url}/mcp", data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content_type = resp.headers.get("Content-Type", "")
            raw = resp.read().decode()
            if "text/event-stream" in content_type:
                # SSE: extract the first `data: ...` line that contains JSON
                for line in raw.splitlines():
                    if line.startswith("data: "):
                        return json.loads(line[len("data: "):])
                raise RuntimeError(f"SSE response had no data: line. Raw: {raw[:200]}")
            return json.loads(raw)
    except urllib.error.URLError as e:
        raise RuntimeError(f"mission-mcp unreachable at {url}: {e}") from e


def call_tool(url: str, token: str | None, tool_name: str, arguments: dict) -> dict:
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }
    resp = mcp_post(url, token, payload)
    if "error" in resp:
        raise RuntimeError(f"tool error: {resp['error']}")
    content = resp.get("result", {}).get("content", [])
    if content:
        return json.loads(content[0]["text"])
    return {}


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:40]


def tag_block(tags: list[str]) -> str:
    """Encode tags as a compact JSON block appended to description."""
    return "\n\n<!-- income-engine-tags: " + json.dumps(tags) + " -->"


def existing_titles(url: str, token: str | None) -> set[str]:
    """Fetch all pending/in_progress task titles for dedup."""
    titles = set()
    for status in ("pending", "in_progress"):
        result = call_tool(url, token, "list_tasks", {"status": status, "limit": 500})
        if isinstance(result, list):
            for t in result:
                titles.add(t.get("title", ""))
    return titles


# ── Sheet parsers ─────────────────────────────────────────────────────────────

def parse_submission_tracker(xlsx_path: str) -> list[dict]:
    """Return list of task dicts from Submission Tracker sheet."""
    try:
        import pandas as pd
    except ImportError:
        sys.exit("pandas is required: pip install pandas openpyxl")

    df = pd.read_excel(xlsx_path, sheet_name=4, header=None)
    # Real data rows start at row 3 (0-indexed), header is row 2
    tasks = []
    for idx, row in df.iterrows():
        if idx < 3:
            continue
        platform = str(row.iloc[0]).strip()
        if not platform or platform in ("nan", "Platform", "📊 SUMMARY DASHBOARD", "Metric"):
            continue
        # Skip summary rows
        if platform.startswith("Total") or platform.startswith("Submitted") \
                or platform.startswith("Gone") or platform.startswith("Awaiting") \
                or platform.startswith("Need") or platform.startswith("Not Yet"):
            continue

        url_val = str(row.iloc[1]).strip() if str(row.iloc[1]) != "nan" else ""
        cost = str(row.iloc[2]).strip() if str(row.iloc[2]) != "nan" else "Free"
        audience = str(row.iloc[3]).strip() if str(row.iloc[3]) != "nan" else ""

        title = strip_emoji(f"Submit to {platform}")
        description = strip_emoji(
            f"Launch directory submission for youandinotai.com.\n\n"
            f"**Platform:** {platform}\n"
            f"**URL:** {url_val}\n"
            f"**Cost:** {cost}\n"
            f"**Audience:** {audience}\n\n"
            f"Write a compelling 100-word app description. Lead with product value — "
            f"AI-powered compatibility, genuine connections, smarter matching."
        )
        description += tag_block([
            "income-engine", "directory-submission", slugify(platform)
        ])

        check_forbidden(title)
        check_forbidden(description)

        # Priority: scale by audience size keywords
        priority = 3
        if "10M" in audience or "5M" in audience or "4M" in audience:
            priority = 2
        elif "1M" in audience or "500K" in audience:
            priority = 3
        else:
            priority = 4

        tasks.append({
            "title": title,
            "description": description,
            "priority": priority,
        })

    return tasks


def parse_content_calendar(xlsx_path: str) -> list[dict]:
    """Return list of task dicts from Content Calendar sheet."""
    try:
        import pandas as pd
    except ImportError:
        sys.exit("pandas is required: pip install pandas openpyxl")

    df = pd.read_excel(xlsx_path, sheet_name=5, header=None)
    tasks = []
    for idx, row in df.iterrows():
        if idx < 5:
            continue
        day_val = str(row.iloc[0]).strip()
        if not day_val or day_val == "nan" or not day_val.isdigit():
            continue

        day_num = int(day_val)
        platform = str(row.iloc[3]).strip() if str(row.iloc[3]) != "nan" else "Various"
        action = str(row.iloc[4]).strip() if str(row.iloc[4]) != "nan" else ""
        hashtags = str(row.iloc[5]).strip() if str(row.iloc[5]) != "nan" else ""

        # Strip emoji from source data, then truncate for title (max 60 chars)
        platform = strip_emoji(platform)
        action = strip_emoji(action)
        hashtags = strip_emoji(hashtags)
        action_snippet = action[:57] + "..." if len(action) > 60 else action

        title = f"Day {day_num} - {platform}: {action_snippet}"
        description = (
            f"**Day {day_num} Content Calendar Action**\n\n"
            f"**Platform:** {platform}\n"
            f"**Action:** {action}\n"
            f"**Hashtags/Community:** {hashtags}\n\n"
            f"Draft content via `python draft-content.py --task-id <this-task-id>`. "
            f"Human approval required before posting. Never auto-post."
        )
        description += tag_block([
            "income-engine", "content-calendar", f"day-{day_num}"
        ])

        check_forbidden(title)
        check_forbidden(description)

        tasks.append({
            "title": title,
            "description": description,
            "priority": 4,
        })

    return tasks


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Seed mission-mcp with income-engine tasks from the Genspark playbook."
    )
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Actually POST tasks to mission-mcp. Default is dry-run.",
    )
    parser.add_argument(
        "--xlsx",
        default=os.environ.get("XLSX_PATH", DEFAULT_XLSX),
        help="Path to the Genspark xlsx file.",
    )
    parser.add_argument(
        "--mcp-url",
        default=os.environ.get("MISSION_MCP_URL", DEFAULT_MCP_URL),
        help="Base URL for mission-mcp HTTP server.",
    )
    args = parser.parse_args()

    token = os.environ.get("MISSION_MCP_TOKEN")
    dry_run = not args.commit

    print(f"[seed-income-engine] mode={'DRY-RUN' if dry_run else 'COMMIT'}")
    print(f"[seed-income-engine] xlsx={args.xlsx}")
    print(f"[seed-income-engine] mcp={args.mcp_url}")
    print()

    # Parse sheets
    print("[seed-income-engine] Parsing Submission Tracker...")
    submission_tasks = parse_submission_tracker(args.xlsx)
    print(f"  -> {len(submission_tasks)} directory submission tasks")

    print("[seed-income-engine] Parsing Content Calendar...")
    calendar_tasks = parse_content_calendar(args.xlsx)
    print(f"  -> {len(calendar_tasks)} content calendar tasks")

    all_tasks = submission_tasks + calendar_tasks
    print(f"\n[seed-income-engine] Total tasks to seed: {len(all_tasks)}")

    if dry_run:
        print("\n--- DRY RUN OUTPUT (run with --commit to POST) ---\n")
        for t in all_tasks:
            print(f"  WOULD CREATE: [{t['priority']}] {t['title']}")
        print(f"\n[seed-income-engine] Dry run complete. {len(all_tasks)} tasks ready.")
        print("Run with --commit to actually seed mission-mcp.")
        return

    # Live run — check existing tasks first
    print("\n[seed-income-engine] Fetching existing task titles for dedup...")
    try:
        existing = existing_titles(args.mcp_url, token)
    except RuntimeError as e:
        print(f"ERROR: {e}")
        print("Is mission-mcp running? Start with: cd services/mission-mcp && npm run start:http")
        sys.exit(1)

    print(f"  -> {len(existing)} existing tasks found")

    created = 0
    skipped = 0
    for t in all_tasks:
        if t["title"] in existing:
            print(f"  SKIP (exists): {t['title']}")
            skipped += 1
            continue

        result = call_tool(args.mcp_url, token, "create_task", {
            "title": t["title"],
            "description": t["description"],
            "priority": t["priority"],
        })
        task_id = result.get("id", "?")
        print(f"  CREATED [{task_id}] {t['title']}")
        created += 1

    print(f"\n[seed-income-engine] Done. created={created} skipped={skipped}")


if __name__ == "__main__":
    main()
