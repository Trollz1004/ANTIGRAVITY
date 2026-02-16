"""Fix 47% stat across all content files — replace with Norton 2025 cited stat."""
import os

BASE = r"c:\OPUS"
REPLACEMENTS = [
    ("47% of dating profiles are bots. FORTY SEVEN PERCENT.", "60% of dating app users suspect they've matched with AI bots. SIXTY PERCENT. (Norton 2025 Cyber Safety Report)"),
    ("47% of dating profiles are bots or fake accounts", "60% of dating app users suspect they've matched with AI bots (Norton 2025 Cyber Safety Report)"),
    ("47% of dating profiles are bots. Nearly half", "60% of dating app users suspect they've matched with AI bots. More than half"),
    ("47% of dating profiles are fake. Learn", "60% of dating app users suspect they've matched with AI bots. Learn"),
    ("47% of dating profiles are bots, and nobody", "60% of dating app users report matching with suspected bots (Norton 2025), and nobody"),
    ("47% of dating profiles are estimated to be bots or fake", "60% of dating app users suspect they've matched with AI bots (Norton 2025)"),
    ("47% of dating profiles being fake", "60% of dating app users matching with suspected bots"),
    ("The Problem: 47% of dating profiles are bots", "The Problem: 60% of users match with suspected AI bots (Norton 2025)"),
    ("47% of dating apps are bots", "60% of dating app matches are suspected bots"),
    ("47% of profiles on other apps are fake", "60% of users on other apps suspect bot matches (Norton 2025)"),
    ("47% of profiles are bots", "60% of users report matching with suspected bots (Norton 2025)"),
    ("47% of dating profiles are bots", "60% of dating app users have matched with suspected bots (Norton 2025)"),
]

FILES = [
    r"content\caption-bank.json",
    r"content\faq-responses.json",
    r"content\how-to-spot-fake-dating-profiles-2026.md",
    r"content\why-dating-apps-have-bot-problem.md",
    r"content\reddit-linkedin-expansion.json",
    r"content\reddit-sideproject-draft.md",
    r"scripts\twitter_retry.py",
    r"scripts\twitter-blitz.py",
    r"scripts\seo_content_generator.py",
]

for fname in FILES:
    path = os.path.join(BASE, fname)
    if not os.path.exists(path):
        print(f"SKIP: {fname}")
        continue
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    original = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"FIXED: {fname}")
    else:
        print(f"NO CHANGE: {fname}")

print("\nDone — all 47% references replaced with Norton 2025 cited stat.")
