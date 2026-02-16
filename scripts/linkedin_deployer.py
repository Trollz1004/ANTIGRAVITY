#!/usr/bin/env python3
"""
LinkedIn Deployer — Posts founder story from reddit-linkedin-expansion.json.
Part of Protocol Omega 4-Phase Content Deployment.

Usage:
  python linkedin_deployer.py              # Preview post
  python linkedin_deployer.py --post       # Post via API (requires credentials)
  python linkedin_deployer.py --clipboard  # Copy to clipboard for manual paste

Requires: pip install requests
Env vars: LINKEDIN_ACCESS_TOKEN (OAuth 2.0 token)
"""
import json
import os
import sys
import io
from pathlib import Path
from datetime import datetime

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
CONTENT_FILE = PROJECT_DIR / "content" / "reddit-linkedin-expansion.json"
ENV_FILES = [
    SCRIPT_DIR / ".env",
    PROJECT_DIR / "marketing-automation" / ".env",
]

UTM = "?utm_source=linkedin&utm_medium=organic&utm_campaign=founder-story"


def load_env():
    for env_file in ENV_FILES:
        if env_file.exists():
            with open(env_file, encoding="utf-8", errors="ignore") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def load_content():
    with open(CONTENT_FILE, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("linkedin_post", {})


def add_utm(text):
    return text.replace("youandinotai.com", f"youandinotai.com{UTM}")


def preview():
    load_env()
    post = load_content()
    text = add_utm(post.get("text", ""))

    print(f"\n{'='*60}")
    print(f"  LINKEDIN POST — PREVIEW")
    print(f"{'='*60}\n")
    print(text)
    print(f"\n  Characters: {len(text)}")
    print(f"  UTM: {UTM}")
    print()


def copy_to_clipboard():
    """Copy post text to clipboard for manual paste."""
    load_env()
    post = load_content()
    text = add_utm(post.get("text", ""))

    try:
        import subprocess
        process = subprocess.Popen(["clip"], stdin=subprocess.PIPE)
        process.communicate(text.encode("utf-8"))
        print("Copied to clipboard! Paste into LinkedIn.")
    except Exception as e:
        print(f"Clipboard failed: {e}")
        print("\nManual copy:\n")
        print(text)


def post_to_linkedin():
    """Post via LinkedIn API (requires OAuth token)."""
    import requests
    load_env()

    token = os.environ.get("LINKEDIN_ACCESS_TOKEN", "")
    if not token:
        print("No LINKEDIN_ACCESS_TOKEN found.")
        print("LinkedIn API requires OAuth 2.0 — get token from:")
        print("  https://www.linkedin.com/developers/apps")
        print("\nFalling back to clipboard mode...")
        copy_to_clipboard()
        return

    post = load_content()
    text = add_utm(post.get("text", ""))

    # Get user profile URN
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = requests.get("https://api.linkedin.com/v2/me", headers=headers)
    if me_resp.status_code != 200:
        print(f"LinkedIn auth failed: {me_resp.status_code}")
        return

    person_id = me_resp.json()["id"]
    author = f"urn:li:person:{person_id}"

    # Create post
    post_data = {
        "author": author,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": text},
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }

    resp = requests.post(
        "https://api.linkedin.com/v2/ugcPosts",
        headers={**headers, "Content-Type": "application/json"},
        json=post_data,
    )

    if resp.status_code in (200, 201):
        print(f"LinkedIn post published! ID: {resp.json().get('id', 'unknown')}")
    else:
        print(f"LinkedIn post failed: {resp.status_code} — {resp.text}")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="LinkedIn Content Deployer")
    parser.add_argument("--post", action="store_true", help="Post via LinkedIn API")
    parser.add_argument("--clipboard", action="store_true", help="Copy to clipboard")
    args = parser.parse_args()

    if args.post:
        post_to_linkedin()
    elif args.clipboard:
        copy_to_clipboard()
    else:
        preview()


if __name__ == "__main__":
    main()
