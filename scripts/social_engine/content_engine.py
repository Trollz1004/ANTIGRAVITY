"""
Content Engine — Posts content from Opus-generated queue.
Architecture: Opus (Claude Code) generates all content during sessions.
Daemon reads from queue and posts it. Caption bank as emergency fallback.
NO Ollama. NO Haiku. NO API calls. OPUS BRAIN ONLY.
"""
import json
import logging
import random
import re
from pathlib import Path

log = logging.getLogger("social-engine")

PROJECT_DIR = Path(__file__).parent.parent.parent
CAPTION_BANK = PROJECT_DIR / "content" / "caption-bank.json"
POST_QUEUE = PROJECT_DIR / "data" / "post-queue.json"
SEO_ARTICLES_DIR = PROJECT_DIR / "content"


def _load_caption_bank():
    if CAPTION_BANK.exists():
        try:
            with open(CAPTION_BANK, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _pick_pillar(pillars):
    """Weighted random selection of content pillar."""
    weights = [p["weight"] for p in pillars]
    return random.choices(pillars, weights=weights, k=1)[0]


def generate_from_queue(platform):
    """Pull Opus-generated content from the post queue.
    This is the PRIMARY content source. Opus fills this during sessions."""
    if not POST_QUEUE.exists():
        return None
    try:
        with open(POST_QUEUE, encoding="utf-8") as f:
            queue = json.load(f)
        posts = queue.get(platform, queue.get("general", []))
        if not posts:
            return None
        # Pop first unused post
        post = posts.pop(0)
        # Save updated queue
        if platform in queue:
            queue[platform] = posts
        else:
            queue["general"] = posts
        with open(POST_QUEUE, "w", encoding="utf-8") as f:
            json.dump(queue, f, indent=2, ensure_ascii=False)
        text = post.get("text", post) if isinstance(post, dict) else str(post)
        remaining = sum(len(v) for v in queue.values() if isinstance(v, list))
        log.info(f"Queue: pulled post for {platform} ({remaining} total remaining)")
        return text
    except Exception as e:
        log.warning(f"Queue read failed: {e}")
    return None


def get_caption_fallback(platform):
    """Emergency fallback when queue is empty: pick from pre-written caption bank."""
    bank = _load_caption_bank()
    captions = bank.get(platform, bank.get("instagram", []))
    if not captions:
        return "Real humans. Zero bots. V8 Cloud Verification. youandinotai.com #YouAndINotAI"
    entry = random.choice(captions)
    text = entry.get("text", "") if isinstance(entry, dict) else str(entry)
    hashtags = entry.get("hashtags", []) if isinstance(entry, dict) else []
    if hashtags:
        text += "\n\n" + " ".join(hashtags)
    return text


def _clean_output(text, max_chars):
    """Clean text: remove quotes, markdown, trim to limit."""
    text = text.strip().strip('"').strip("'")
    # Remove markdown formatting
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    # Remove any AI preamble
    for prefix in ["Here's", "Here is", "Sure!", "Sure,", "Post:", "Caption:"]:
        if text.lower().startswith(prefix.lower()):
            text = text[len(prefix):].lstrip(" :\n")
    if len(text) > max_chars:
        text = text[:max_chars - 3].rsplit(" ", 1)[0] + "..."
    return text.strip()


def generate_post(platform, pillars, platform_specs, days_left):
    """
    Get a post for the given platform.
    Tier 1: Opus-generated queue (filled by Claude Code sessions)
    Tier 2: Caption bank (pre-written fallback)
    That's it. Opus brain or pre-written. Nothing else.
    """
    spec = platform_specs.get(platform, platform_specs.get("twitter", {}))
    max_chars = spec.get("max_chars", 280)

    # Tier 1: Opus-generated queue
    text = generate_from_queue(platform)
    if text:
        return _clean_output(text, max_chars), "queued", "opus_queue"

    # Tier 2: Caption bank fallback (when queue is empty)
    log.warning(f"Queue empty for {platform} — using caption bank (Opus needs to refill)")
    text = get_caption_fallback(platform)
    return _clean_output(text, max_chars), "fallback", "caption_bank"


def generate_article(platform, pillars, platform_specs, days_left):
    """Get long-form content for article platforms."""
    # Try queue first
    text = generate_from_queue(platform)
    if text:
        return text, "queued", "opus_queue"

    # Fallback: use pre-written SEO article
    seo_files = list(SEO_ARTICLES_DIR.glob("*.md"))
    if seo_files:
        article = random.choice(seo_files)
        return article.read_text(encoding="utf-8"), "seo_fallback", "file"

    return "YouAndINotAI launches April 4 — the only dating app where every profile is verified. youandinotai.com", "fallback", "caption_bank"
