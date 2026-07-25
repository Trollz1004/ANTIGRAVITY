# CLAUDE Archive Notice

Last updated: 2026-03-10

## Purpose

This file exists to prevent drift while Claude Max / Opus access is financially paused or reduced.

## Rule

- Claude-specific backup memory, prompt, and identity files outside `C:\ANTIGRAVITY` are not authoritative.
- The only authoritative operating context is:
  - `C:\ANTIGRAVITY`
  - `origin/main`
  - current canonical docs in the live repo

## Consolidation

- Claude operational context is consolidated into the live ANTIGRAVITY repo.
- OneDrive backup copies, old Claude memory files, and old OPUSONLY references must not be used as default context.
- If Claude access resumes later, Claude should still inherit context from the live repo rather than from stale OneDrive files.

## Why

- Prior Claude memory drift across OneDrive, OPUSONLY, and backup copies caused repeated context conflicts, wrong node identity, wrong payment assumptions, and wasted time.
- This is an archive-control measure, not a mission change.

## Mission

- Mission unchanged.
- DAO split unchanged.
- `` unchanged.
- This notice exists only to prevent stale-memory interference.
