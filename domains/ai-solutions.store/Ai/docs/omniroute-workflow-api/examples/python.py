"""
OmniRoute gateway examples — Python (requests).
Reads the key from os.environ["OMNI_ROUTE_API_KEY"] at runtime. Never hardcode it.

Usage:
    export OMNI_ROUTE_API_KEY=...   # from your own secret store
    python python.py
"""

import json
import os
import sys

import requests

BASE_URL = os.environ.get("OPENAI_COMPAT_BASE_URL", "http://192.168.0.8:20128/v1")
API_KEY = os.environ.get("OMNI_ROUTE_API_KEY")

if not API_KEY:
    print("OMNI_ROUTE_API_KEY is not set in the environment. Aborting.", file=sys.stderr)
    sys.exit(1)

HEADERS = {"Authorization": f"Bearer {API_KEY}"}


def list_models():
    print("== List models ==")
    resp = requests.get(f"{BASE_URL}/models", headers=HEADERS, timeout=30)
    data = resp.json()
    print(f"status={resp.status_code} model_count={len(data.get('data', []))}")


def non_streaming_chat():
    print("== Non-streaming chat completion ==")
    resp = requests.post(
        f"{BASE_URL}/chat/completions",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={
            "model": "auto/best-coding",
            "messages": [{"role": "user", "content": "Say OK."}],
            "max_tokens": 5,
            "stream": False,
        },
        timeout=60,
    )
    print(f"status={resp.status_code}")
    print(resp.text[:400])


def streaming_chat():
    print("== Streaming chat completion (SSE) ==")
    with requests.post(
        f"{BASE_URL}/chat/completions",
        headers={
            **HEADERS,
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        },
        json={
            "model": "auto/best-coding",
            "messages": [{"role": "user", "content": "Count to 3."}],
            "stream": True,
        },
        stream=True,
        timeout=60,
    ) as resp:
        print(f"status={resp.status_code}")
        for line in resp.iter_lines(decode_unicode=True):
            if line:
                print(line)


if __name__ == "__main__":
    list_models()
    non_streaming_chat()
    streaming_chat()
