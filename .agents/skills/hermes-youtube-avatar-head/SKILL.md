---
name: hermes-youtube-avatar-head
description: Produce avatar-head talking videos (a static or lightly animated head + voiceover) from a written script. Use for faceless "talking head" YouTube automation where no real face is used.
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [youtube, avatar, faceless, talking-head, video]
    related_skills: [hermes-youtube-faceless-news, agent-browser, i-have-adhd]
---

# Hermes — avatar-head talking video

## When to use

Joshua (or a task) asks for an avatar / avatar-head / talking-head video:
one character, a written script, no real face. If the content is a daily news
recap from `content/yesterday-news/`, prefer `hermes-youtube-faceless-news`;
use this skill for any other scripted talking-head piece.

## Pipeline

1. **Script** — take the assigned script text (from the task or a file). Cap
   at 90s unless the task says longer. Write it to
   `ops/marketing-inbox/youtube-avatar-<slug>-script.md`.
2. **Avatar asset** — use the repo's approved avatar asset if one exists
   (check `content/` and `assets/` for avatar/head images first). If none,
   create a simple branded head placeholder (circle + initials) — do NOT
   scrape a real person's likeness. No real face, no celebrity, no generated
   deepfake-style head.
3. **Lip-sync** — if an avatar/TTS tool with lip-sync is configured, use it.
   Otherwise: static head over a subtle pan/zoom (Ken Burns) with the
   voiceover, and mark lip-sync UNVERIFIED. Never fake a lip-sync file.
4. **Voiceover** — TTS per paragraph; if no TTS, produce captions (.srt) and
   mark voiceover UNVERIFIED.
5. **Assemble** — ffmpeg: 1080x1920 (shorts) or 1920x1080, h264, yuv420p.
   Log the exact command + `ffprobe` duration as evidence.
6. **Packet** — `ops/packets/hermes-youtube-avatar-<slug>/`: script, avatar
   asset source, commands run, manifest, mp4 path + duration. VERIFIED /
   UNVERIFIED per line.
7. **Publish** — only after Joshua's recorded approval; approved channel only.

## Hard limits

Same as hermes-youtube-faceless-news: no invented content, business-only
copy, no publish without approval, evidence handles everywhere, no
credentials in files, no push/merge.
