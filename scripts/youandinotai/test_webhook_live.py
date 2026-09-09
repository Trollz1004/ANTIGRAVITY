#!/usr/bin/env python3
"""Post a live Orlando beta Square webhook payload to production."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

DEFAULT_URL = "https://api.youandinotai.com/api/payments/webhook/square"
DEFAULT_EVENT_ID = "TEST_PAYMENT_ORLANDO_BETA"
DEFAULT_EMAIL = "orlando-beta@example.com"


def build_payload(event_id: str, email: str) -> dict[str, object]:
    return {
        "event_id": event_id,
        "type": "payment.updated",
        "created_at": "2026-03-14T00:00:00Z",
        "data": {
            "object": {
                "payment": {
                    "id": event_id,
                    "status": "COMPLETED",
                    "amount_money": {"amount": 100, "currency": "USD"},
                    "buyer_email_address": email,
                    "note": event_id,
                    "reference_id": event_id,
                }
            }
        },
    }


def post_json(url: str, payload: dict[str, object]) -> tuple[int, str]:
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Codex-T5500/Orlando-Webhook-Test",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.status, response.read().decode("utf-8", errors="replace")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--event-id", default=DEFAULT_EVENT_ID)
    parser.add_argument("--email", default=DEFAULT_EMAIL)
    args = parser.parse_args()

    payload = build_payload(args.event_id, args.email)
    print(f"POST {args.url}")
    print(f"event_id={args.event_id}")

    try:
        status, body = post_json(args.url, payload)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"status={exc.code}")
        print(body)
        return 1
    except Exception as exc:  # pragma: no cover - operational script
        print(f"request_failed={exc}", file=sys.stderr)
        return 1

    print(f"status={status}")
    print(body)
    if status != 200:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
