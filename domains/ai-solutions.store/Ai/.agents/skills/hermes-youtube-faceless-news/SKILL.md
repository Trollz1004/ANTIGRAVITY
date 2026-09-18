---
name: hermes-youtube-faceless-news
description: Turn a day folder in content/yesterday-news/ into a faceless YouTube short (script -> visuals -> voiceover -> render pipeline). Use for Hermes YouTube automation of daily news recaps.
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [youtube, faceless, news, automation, shorts, video]
    related_skills: [hermes-youtube-avatar-head, agent-browser, i-have-adhd]
---

# Hermes — YouTube faceless daily-news automation

## Source of truth

`content/yesterday-news/<YYYYMMDD>/` in `C:\ANTIGRAVITY`:
- `metadata.json` — title, tags, date, sources[] (title/source/url)
- `script.txt` — narration script (already written; do NOT invent stories)

Latest day = the newest dated folder. If the newest folder's date == today,
use the folder dated yesterday; otherwise use the newest folder.

## Pipeline (one video per cycle)

1. **Read** `metadata.json` + `script.txt` from the target day folder.
2. **Clean the script**: strip HTML tags (`<p>`, `[&#8230;]`, links), keep only
   the narration. Cap at 8 stories / ~60s of audio. Preserve the intro line
   "Welcome to Yesterday's News Today for <date>."
3. **Write the cleaned script** to
   `ops/marketing-inbox/youtube-<date>-script.md` (marketing-inbox = approval
   queue; nothing publishes without Joshua approval).
4. **Render plan** (faceless): one generated stock-style image per story
   (the repo has no stock library — use a deterministic 16:9 placeholder
   background + large caption text; do NOT download arbitrary web images
   without license checks), 3-5s per story, 1080x1920 (shorts) or 1920x1080.
5. **Voiceover**: generate TTS per story line. If no TTS tool is configured,
   produce a `.srt`-style caption file instead and mark voiceover
   UNVERIFIED — never fake an audio file.
6. **Assemble**: ffmpeg image+audio -> mp4 (shorts: -s 1080x1920, h264, yuv420p).
7. **Evidence**: write `ops/packets/hermes-youtube-<date>/` with the cleaned
   script, render commands used (real output), asset manifest, and the mp4
   path + duration from `ffprobe`. Report VERIFIED / UNVERIFIED per line.
8. **Upload**: only after Joshua records approval. Upload via the approved
   YouTube channel path only; never a personal/third-party channel.

## Hard limits

- No invented stories: content comes ONLY from the day folder.
- Business-only copy (product-copy-business-only). No charity vocabulary.
- Nothing publishes without Joshua's recorded approval (marketing-inbox).
- Report every claim with an evidence handle (file path, command output).
- Never touch .env or credentials; never push/merge (judge lane only).

## Output

The packet in step 7 + one JSON drop to `ops/marketing-inbox/` listing:
date, title, story count, script path, asset manifest, video path, duration,
and publish status (PENDING unless Joshua approves).
