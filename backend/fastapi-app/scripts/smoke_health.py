"""Simple health smoke test for local FastAPI startup."""

from __future__ import annotations

import argparse
import time

import httpx


def run_smoke(url: str, timeout_seconds: int, attempts: int) -> int:
    for attempt in range(1, attempts + 1):
        try:
            response = httpx.get(url, timeout=timeout_seconds)
            if response.status_code == 200:
                print(f"PASS attempt={attempt} status=200 body={response.text}")
                return 0
            print(f"WAIT attempt={attempt} status={response.status_code}")
        except Exception as exc:  # noqa: BLE001
            print(f"WAIT attempt={attempt} error={exc}")

        time.sleep(1)

    print(f"FAIL could not get 200 from {url} after {attempts} attempts")
    return 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--url",
        default="http://localhost:8000/api/v1/health",
        help="Health endpoint URL.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=5,
        help="Per-request timeout seconds.",
    )
    parser.add_argument(
        "--attempts",
        type=int,
        default=25,
        help="Max retry attempts.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    raise SystemExit(run_smoke(args.url, args.timeout, args.attempts))
