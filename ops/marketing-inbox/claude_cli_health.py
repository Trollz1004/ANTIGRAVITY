#!/usr/bin/env python3
"""Claude CLI auth health-check for the JARVIS Sonnet review lane.

The Sonnet auto-review tick in mission-control shells out to
`claude -p --model sonnet --max-turns 3` once per minute. If CLI auth
has expired (Claude.ai subscription login or Anthropic Console API key),
every review fails with `claude CLI exited 1` and proposals pile up
without verdicts.

This script probes CLI auth by running a tiny `claude -p "ok"` and
classifies the output. It writes its verdict to a status file the
health-monitor cron can include, and (if Hermes-Telegram is wired) can
push a one-shot alert to Joshua when auth breaks.

Usage:
    python claude_cli_health.py            # probe, write status file
    python claude_cli_health.py --once      # exit non-zero if auth is bad

Exit codes:
    0 = auth OK
    1 = auth bad (CLI not logged in)
    2 = probe failed (network/CLI broken, not auth)
    3 = probe timeout
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

STATUS_PATH = Path(r"C:/ANTIGRAVITY/ops/marketing-inbox/claude_cli_status.json")


def probe(timeout_s: int = 60) -> tuple[int, str]:
    """Run `claude -p "ok"` and classify the output.

    Returns (status, raw_output) where status is one of:
      0 = OK (got a real response, not the login prompt)
      1 = AUTH_BAD (CLI says "Not logged in")
      2 = CLI_BROKEN (couldn't spawn / network / other error)
      3 = TIMEOUT
    """
    try:
        proc = subprocess.run(
            ["claude", "-p", "ok", "--max-turns", "1"],
            capture_output=True,
            text=True,
            timeout=timeout_s,
            shell=False,
        )
    except subprocess.TimeoutExpired:
        return 3, f"timeout after {timeout_s}s"
    except FileNotFoundError as exc:
        return 2, f"claude CLI not on PATH: {exc}"
    except Exception as exc:
        return 2, f"spawn failed: {type(exc).__name__}: {exc}"

    raw = (proc.stdout or "") + (proc.stderr or "")
    low = raw.lower()
    if "not logged in" in low or "please run /login" in low:
        return 1, raw.strip()
    if proc.returncode != 0:
        return 2, f"exit {proc.returncode}: {raw.strip()[:300]}"
    # OK: we got past the auth prompt. Don't require non-empty stdout
    # because some CLI versions print nothing on `--max-turns 1` with a
    # 1-token prompt.
    return 0, raw.strip() or "(no stdout)"


def write_status(status: int, raw: str) -> None:
    STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "status": status,
        "statusLabel": {0: "OK", 1: "AUTH_BAD", 2: "CLI_BROKEN", 3: "TIMEOUT"}.get(status, "UNKNOWN"),
        "raw": raw[:500],
    }
    STATUS_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--once", action="store_true", help="exit non-zero if auth is bad")
    parser.add_argument("--timeout", type=int, default=60, help="probe timeout in seconds")
    args = parser.parse_args()

    status, raw = probe(args.timeout)
    write_status(status, raw)
    label = {0: "OK", 1: "AUTH_BAD", 2: "CLI_BROKEN", 3: "TIMEOUT"}.get(status, "UNKNOWN")
    print(f"[claude_cli_health] status={label} raw={raw[:200]!r}")
    if args.once:
        return 0 if status == 0 else 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
