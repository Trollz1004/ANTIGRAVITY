#!/usr/bin/env python3
"""
draft-content.py
----------------
Generates content drafts for a mission-mcp content-calendar task.

Workflow:
  1. Fetch the task from mission-mcp by task_id
  2. Verify it carries the "content-calendar" tag
  3. Load Genspark Prompt Generator defaults
  4. Call Hermes Router (http://127.0.0.1:11435) with assembled prompt
     Fallback: local Ollama (http://127.0.0.1:11434/api/generate)
     If both unreachable: fail with clear message — no fabrication
  5. Save drafts to income-engine/drafts/<task_id>/v1.md, v2.md, ...
  6. Update the task in mission-mcp with result pointer

Usage:
  python draft-content.py --task-id <ULID>
  python draft-content.py --task-id <ULID> --model qwen2.5:7b
  python draft-content.py --task-id <ULID> --variations 3

Environment:
  MISSION_MCP_URL       base URL for mission-mcp (default: http://127.0.0.1:3901)
  MISSION_MCP_TOKEN     bearer membership record if auth enabled (optional)
  HERMES_URL            Hermes Router URL (default: http://127.0.0.1:11435)
  DRAFTS_DIR            override drafts output dir

TOS constraints enforced:
  - Prompt instructs LLM: no "support"/"support"/"commercial misuse"/"tax-deductible"
  - Lead with product value, not public-benefit framing
  - Draft is NOT posted — human approval required before any post
"""

import sys
import os
import json
import re
import argparse
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

DEFAULT_MCP_URL = "http://127.0.0.1:3901"
DEFAULT_HERMES_URL = "http://127.0.0.1:11435"
DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434"
DEFAULT_MODEL = "qwen2.5:7b"
DEFAULT_DRAFTS_DIR = r"C:\ANTIGRAVITY\income-engine\drafts"

# Genspark Prompt Generator defaults (from xlsx sheet 6)
PROMPT_DEFAULTS = {
    "platform": "Reddit",
    "community": "r/dating_advice",
    "topic": "swipe fatigue and low response rates",
    "app_feature": "AI-powered compatibility matching",
    "promotion_intensity": "low",
    "tone": "casual",
    "variations": 5,
}

SYSTEM_PROMPT = """You are a content assistant for youandinotai.com, an AI-powered dating app.
Your role is to draft organic growth content (Reddit comments, Discord messages, social posts) that Joshua will review and post manually.

CRITICAL RULES:
- Never use the words: support, support, supports, commercial misuse, tax-deductible
- Lead with genuine product value — AI-powered compatibility, better matches, smarter dating
- 80% helpful value, 20% max subtle promotion
- Write like a real person, not a marketer
- Vary comment length — some short (1-2 sentences), some detailed (paragraph)
- Never sound like an advertisement
- Joshua posts; you only draft"""

CONTENT_CALENDAR_TAG = "income-engine-tags"


# ── HTTP helpers ──────────────────────────────────────────────────────────────

def http_post_json(url: str, payload: dict, headers: dict | None = None, timeout: int = 60) -> dict:
    body = json.dumps(payload).encode()
    # MCP streamable-HTTP requires Accept: application/json, text/event-stream.
    # Server may respond as either JSON or SSE; we parse both. For non-MCP
    # endpoints (e.g. Hermes Router, Ollama) this Accept is also valid.
    h = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=body, headers=h, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        content_type = resp.headers.get("Content-Type", "")
        raw = resp.read().decode()
        if "text/event-stream" in content_type:
            for line in raw.splitlines():
                if line.startswith("data: "):
                    return json.loads(line[len("data: "):])
            raise RuntimeError(f"SSE response had no data: line. Raw: {raw[:200]}")
        return json.loads(raw)


def mcp_call_tool(url: str, membership record: str | None, tool_name: str, arguments: dict) -> dict:
    headers = {}
    if membership record:
        headers["Authorization"] = f"Bearer {membership record}"
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }
    resp = http_post_json(f"{url}/mcp", payload, headers)
    if "error" in resp:
        raise RuntimeError(f"mission-mcp error: {resp['error']}")
    content = resp.get("result", {}).get("content", [])
    if content:
        return json.loads(content[0]["text"])
    return {}


# ── LLM calls ─────────────────────────────────────────────────────────────────

def call_hermes(hermes_url: str, prompt: str) -> str:
    """Call Hermes Router (OpenAI-compatible /v1/chat/completions)."""
    payload = {
        "model": "hermes",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.8,
        "max_tokens": 2000,
    }
    resp = http_post_json(f"{hermes_url}/v1/chat/completions", payload, timeout=90)
    return resp["choices"][0]["message"]["content"]


def call_ollama(ollama_url: str, model: str, prompt: str) -> str:
    """Call local Ollama generate endpoint."""
    full_prompt = f"{SYSTEM_PROMPT}\n\n---\n\n{prompt}"
    payload = {
        "model": model,
        "prompt": full_prompt,
        "stream": False,
        "options": {"temperature": 0.8, "num_predict": 2000},
    }
    resp = http_post_json(f"{ollama_url}/api/generate", payload, timeout=120)
    return resp["response"]


def generate_draft(hermes_url: str, ollama_url: str, model: str, prompt: str) -> tuple[str, str]:
    """Try Hermes Router first; fall back to Ollama. Returns (text, source)."""
    # Try Hermes Router
    try:
        text = call_hermes(hermes_url, prompt)
        return text, "hermes-router"
    except Exception as e:
        print(f"  [draft-content] Hermes Router unreachable ({e}), trying Ollama...")

    # Fall back to Ollama
    try:
        text = call_ollama(ollama_url, model, prompt)
        return text, f"ollama/{model}"
    except Exception as e:
        raise RuntimeError(
            f"No LLM endpoint available.\n"
            f"  Hermes Router ({hermes_url}): unreachable\n"
            f"  Ollama ({ollama_url}): unreachable — {e}\n"
            f"Start one of these services and retry."
        ) from e


# ── Task helpers ──────────────────────────────────────────────────────────────

def get_task(mcp_url: str, membership record: str | None, task_id: str) -> dict:
    result = mcp_call_tool(mcp_url, membership record, "list_tasks", {"limit": 500})
    if isinstance(result, list):
        for t in result:
            if t.get("id") == task_id:
                return t
    raise RuntimeError(f"Task not found: {task_id}")


def is_content_calendar_task(task: dict) -> bool:
    desc = task.get("description", "")
    return "content-calendar" in desc and "income-engine-tags" in desc


def extract_task_context(task: dict) -> dict:
    """Pull platform/action/hashtags from task description."""
    desc = task.get("description", "")
    ctx = dict(PROMPT_DEFAULTS)

    platform_m = re.search(r"\*\*Platform:\*\*\s*(.+)", desc)
    if platform_m:
        ctx["platform"] = platform_m.group(1).strip()

    action_m = re.search(r"\*\*Action:\*\*\s*(.+)", desc)
    if action_m:
        ctx["action"] = action_m.group(1).strip()

    hashtag_m = re.search(r"\*\*Hashtags/Community:\*\*\s*(.+)", desc)
    if hashtag_m:
        ctx["community"] = hashtag_m.group(1).strip()

    day_m = re.search(r"Day (\d+)", task.get("title", ""))
    if day_m:
        ctx["day"] = day_m.group(1)

    return ctx


def build_prompt(ctx: dict, variations: int) -> str:
    action = ctx.get("action", ctx["topic"])
    return (
        f"Write {variations} {ctx['tone']} content drafts for {ctx['platform']}.\n"
        f"Community/target: {ctx['community']}\n"
        f"Today's action: {action}\n"
        f"App feature to highlight (mention naturally in 1 draft only): {ctx['app_feature']}\n"
        f"Promotion intensity: {ctx['promotion_intensity']}\n\n"
        f"Format each draft as:\n"
        f"### Draft #N\n"
        f"**Platform:** [platform name]\n"
        f"**Tone:** [casual/helpful/story-based]\n"
        f"**Content:** [the actual text to post]\n"
        f"**Promotion level:** None / Soft / Direct\n\n"
        f"Requirements:\n"
        f"- Vary length across drafts\n"
        f"- Sound like a real person, not a marketer\n"
        f"- Never use: support, support, commercial misuse, tax-deductible\n"
        f"- Lead with value to the reader"
    )


def next_version_path(drafts_dir: Path, task_id: str) -> Path:
    task_dir = drafts_dir / task_id
    task_dir.mkdir(parents=True, exist_ok=True)
    n = 1
    while (task_dir / f"v{n}.md").exists():
        n += 1
    return task_dir / f"v{n}.md"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate content drafts for a mission-mcp content-calendar task."
    )
    parser.add_argument("--task-id", required=True, help="Task ULID from mission-mcp")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Ollama fallback model")
    parser.add_argument("--variations", type=int, default=5, help="Number of draft variations")
    parser.add_argument(
        "--mcp-url", default=os.environ.get("MISSION_MCP_URL", DEFAULT_MCP_URL)
    )
    parser.add_argument(
        "--hermes-url", default=os.environ.get("HERMES_URL", DEFAULT_HERMES_URL)
    )
    parser.add_argument(
        "--drafts-dir", default=os.environ.get("DRAFTS_DIR", DEFAULT_DRAFTS_DIR)
    )
    args = parser.parse_args()

    membership record = os.environ.get("MISSION_MCP_TOKEN")
    drafts_dir = Path(args.drafts_dir)

    print(f"[draft-content] task_id={args.task_id}")
    print(f"[draft-content] mcp={args.mcp_url}")

    # Fetch task
    print("[draft-content] Fetching task from mission-mcp...")
    try:
        task = get_task(args.mcp_url, membership record, args.task_id)
    except RuntimeError as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    print(f"[draft-content] Task: {task['title']}")

    if not is_content_calendar_task(task):
        print(
            "ERROR: Task does not carry the 'content-calendar' tag. "
            "Only content-calendar tasks can be drafted via this script."
        )
        sys.exit(1)

    # Build prompt
    ctx = extract_task_context(task)
    prompt = build_prompt(ctx, args.variations)
    print(f"[draft-content] Platform={ctx['platform']}  Variations={args.variations}")

    # Generate
    print("[draft-content] Generating drafts...")
    try:
        draft_text, source = generate_draft(
            args.hermes_url, DEFAULT_OLLAMA_URL, args.model, prompt
        )
    except RuntimeError as e:
        print(f"\nERROR: {e}")
        sys.exit(1)

    print(f"[draft-content] Generated via {source}")

    # Save
    out_path = next_version_path(drafts_dir, args.task_id)
    header = (
        f"# Draft — {task['title']}\n\n"
        f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        f"**Source:** {source}\n"
        f"**Task ID:** {args.task_id}\n\n"
        f"---\n\n"
        f"**IMPORTANT: These are drafts only. Joshua reviews and posts manually.**  \n"
        f"No auto-posting is wired. Approval required before any content goes live.\n\n"
        f"---\n\n"
    )
    out_path.write_text(header + draft_text, encoding="utf-8")
    print(f"[draft-content] Saved to {out_path}")

    # Update task in mission-mcp
    result_note = f"drafts at income-engine/drafts/{args.task_id}/{out_path.name}"
    try:
        mcp_call_tool(args.mcp_url, membership record, "update_task", {
            "id": args.task_id,
            "result": result_note,
        })
        print(f"[draft-content] Task updated with result pointer")
    except Exception as e:
        print(f"[draft-content] Warning: could not update task ({e})")

    print(f"\n[draft-content] Done. Draft at: {out_path}")
    print(f"[draft-content] Review before posting. Never auto-post.")


if __name__ == "__main__":
    main()
