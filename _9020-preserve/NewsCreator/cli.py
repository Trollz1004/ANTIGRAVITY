import os
import sys
import json
from pathlib import Path
from typing import Dict, List

import httpx


def get_env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


OLLAMA_BASE_URL = get_env("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = get_env("OLLAMA_MODEL", "llama3.1:8b")


def load_messages(path: Path) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return []


def save_messages(path: Path, messages: List[Dict[str, str]]):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(messages, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Self-hosted agent CLI (Ollama)")
    parser.add_argument("--session", default="default", help="Session id")
    parser.add_argument("--system", default=None, help="System prompt override")
    parser.add_argument("--model", default=OLLAMA_MODEL, help="Ollama model name")
    parser.add_argument("--memory-dir", default=str(Path("data/memory")), help="Memory folder")
    args = parser.parse_args()

    mem_path = Path(args.memory_dir) / f"{args.session}.json"
    messages = load_messages(mem_path)

    if args.system:
        if messages and messages[0].get("role") == "system":
            messages[0] = {"role": "system", "content": args.system}
        else:
            messages = [{"role": "system", "content": args.system}] + messages

    print(f"Model: {args.model} | Session: {args.session}")
    print("Type your message. Ctrl+C to exit.\n")

    try:
        while True:
            user = input("You: ").strip()
            if not user:
                continue
            messages.append({"role": "user", "content": user})
            payload = {
                "model": args.model,
                "messages": messages,
                "stream": False,
                "options": {"temperature": 0.2},
            }
            url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat"
            try:
                with httpx.Client(timeout=120) as client:
                    r = client.post(url, json=payload)
                    r.raise_for_status()
                    data = r.json()
                    reply = data.get("message", {}).get("content", "")
            except Exception as e:
                print(f"[error] {e}")
                continue

            messages.append({"role": "assistant", "content": reply})
            print(f"Agent: {reply}\n")
            save_messages(mem_path, messages)
    except KeyboardInterrupt:
        print("\nBye!")
        save_messages(mem_path, messages)
        sys.exit(0)


if __name__ == "__main__":
    main()

