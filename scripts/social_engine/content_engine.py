"""
Content Engine — Generates marketing content via Ollama (free) with Haiku API fallback.
Three-tier: Ollama -> Haiku -> Caption Bank
"""
import json
import logging
import os
import random
import re
from datetime import datetime
from pathlib import Path

import requests

log = logging.getLogger("social-engine")

PROJECT_DIR = Path(__file__).parent.parent.parent
CAPTION_BANK = PROJECT_DIR / "content" / "caption-bank.json"
SEO_ARTICLES_DIR = PROJECT_DIR / "content"

OLLAMA_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL_SOCIAL", os.environ.get("OLLAMA_MODEL", "qwen2.5:7b"))
# Override if env says a model that doesn't exist locally
if "llama" in OLLAMA_MODEL.lower():
    OLLAMA_MODEL = "qwen2.5:7b"


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


def _build_prompt(pillar, platform_spec, days_left):
    """Build the generation prompt for a platform."""
    base_prompt = random.choice(pillar["prompts"])
    base_prompt = base_prompt.replace("{{days_left}}", str(days_left))

    return (
        f"{base_prompt}\n\n"
        f"Platform: {platform_spec.get('tone', 'casual')}\n"
        f"Max length: {platform_spec.get('max_chars', 280)} characters\n"
        f"Hashtag style: {platform_spec.get('hashtag_style', 'none')}, max {platform_spec.get('max_hashtags', 0)} hashtags\n"
        f"Brand: YouAndINotAI | Handle: @YouAndiNotAi | URL: youandinotai.com\n"
        f"VOICE: You are Josh, a male founder (Trollz1004). Quirky, funny, slightly trollish humor. "
        f"Write like a real person — not corporate, not AI-sounding. "
        f"Think 'guy who roasts dating apps while building one.' "
        f"NEVER write from a female perspective or imply matching with men. "
        f"Do NOT use markdown formatting. Write plain text only. "
        f"Do NOT add any preamble or explanation — just output the post text."
    )


def generate_from_queue(platform):
    """Pull pre-generated content from the post queue (populated by Claude Code sessions)."""
    queue_file = PROJECT_DIR / "data" / "post-queue.json"
    if not queue_file.exists():
        return None
    try:
        with open(queue_file, encoding="utf-8") as f:
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
        with open(queue_file, "w", encoding="utf-8") as f:
            json.dump(queue, f, indent=2, ensure_ascii=False)
        text = post.get("text", post) if isinstance(post, dict) else str(post)
        log.info(f"Queue: pulled post for {platform} ({len(posts)} remaining)")
        return text
    except Exception as e:
        log.warning(f"Queue read failed: {e}")
    return None


def generate_ollama(prompt):
    """Generate via local Ollama (free)."""
    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=60,
        )
        if resp.status_code == 200:
            text = resp.json().get("response", "").strip()
            if text:
                log.info(f"Ollama generated {len(text)} chars")
                return text
    except Exception as e:
        log.warning(f"Ollama failed: {e}")
    return None


def generate_haiku(prompt):
    """Generate via Claude Haiku API (requires valid ANTHROPIC_API_KEY)."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        log.warning("No ANTHROPIC_API_KEY — skipping Haiku")
        return None
    try:
        from anthropic import Anthropic
        client = Anthropic(api_key=api_key)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text.strip()
        if text:
            log.info(f"Haiku generated {len(text)} chars")
            return text
    except Exception as e:
        log.warning(f"Haiku API failed: {e}")
    return None


def get_caption_fallback(platform):
    """Emergency fallback: pick from pre-written caption bank."""
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
    """Clean AI-generated text: remove quotes, markdown, trim to limit."""
    text = text.strip().strip('"').strip("'")
    # Remove markdown formatting
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*', r'\1', text)
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)
    # Remove any "Here's a post:" preamble
    for prefix in ["Here's", "Here is", "Sure!", "Sure,", "Post:", "Caption:"]:
        if text.lower().startswith(prefix.lower()):
            text = text[len(prefix):].lstrip(" :\n")
    if len(text) > max_chars:
        text = text[:max_chars - 3].rsplit(" ", 1)[0] + "..."
    return text.strip()


def generate_post(platform, pillars, platform_specs, days_left):
    """
    Generate a marketing post for the given platform.
    Tries: Ollama (free) -> Haiku API (cheap) -> Caption bank (pre-written)
    Returns the post text.
    """
    pillar = _pick_pillar(pillars)
    spec = platform_specs.get(platform, platform_specs.get("twitter", {}))
    max_chars = spec.get("max_chars", 280)
    prompt = _build_prompt(pillar, spec, days_left)

    # Tier 1: Pre-generated queue (populated by Claude Code sessions)
    text = generate_from_queue(platform)
    if text:
        return _clean_output(text, max_chars), "queued", "queue"

    # Tier 2: Ollama local (free)
    text = generate_ollama(prompt)
    if text:
        return _clean_output(text, max_chars), pillar["id"], "ollama"

    # Tier 3: Haiku API (if key is valid)
    text = generate_haiku(prompt)
    if text:
        return _clean_output(text, max_chars), pillar["id"], "haiku"

    # Tier 4: Caption bank (pre-written)
    log.warning(f"Using caption bank fallback for {platform}")
    text = get_caption_fallback(platform)
    return _clean_output(text, max_chars), "fallback", "caption_bank"


def generate_article(platform, pillars, platform_specs, days_left):
    """Generate long-form content for article platforms (Medium, Dev.to, Hashnode, Substack)."""
    pillar = _pick_pillar(pillars)
    spec = platform_specs.get(platform, {})

    article_prompt = (
        f"Write a 500-800 word blog post about the dating app bot crisis and how YouAndINotAI solves it "
        f"with V8 Cloud Verification (8 layers including Plaid identity verification). "
        f"Topic angle: {pillar['id'].replace('_', ' ')}. "
        f"Platform: {platform} ({spec.get('tone', 'thoughtful')}). "
        f"Launching April 4, 2026 — {days_left} days away. "
        f"Founding members get $14.99/mo locked forever (100 spots). "
        f"60% of revenue goes to Shriners Children's Hospitals. "
        f"Include a compelling title. Write in plain text, no markdown headers. "
        f"End with a CTA to youandinotai.com"
    )

    text = generate_ollama(article_prompt)
    if text:
        return text, pillar["id"], "ollama"

    text = generate_haiku(article_prompt)
    if text:
        return text, pillar["id"], "haiku"

    # Fallback: use pre-written SEO article
    seo_files = list(SEO_ARTICLES_DIR.glob("*.md"))
    if seo_files:
        article = random.choice(seo_files)
        return article.read_text(encoding="utf-8"), "seo_fallback", "file"

    return "YouAndINotAI launches April 4 — the only dating app where every profile is verified. youandinotai.com", "fallback", "caption_bank"
