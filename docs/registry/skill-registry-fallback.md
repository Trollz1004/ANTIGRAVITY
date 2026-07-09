# Skill Registry Fallback

The local source is `C:\antigravity\.agents\skills\self-improving-system\skills.md`.

## Lookup order

1. Local capable agent: `scripts\skills.ps1 -Query <keyword>` or `scripts/skills.sh <keyword>`.
2. Browser/no-tool agent: read a Vercel-hosted read-only skills page/API when published.
3. Durable registry/audit: Supabase table snapshot when configured.

## Why this exists

Weak agents and browser-only tools should not load the whole skill library or edit repo files to discover skills. They only need a read-only index that points to the exact `SKILL.md` path.

## Supabase role

Supabase should store structured skill registry rows and audit snapshots:

- `skill_id`
- `name`
- `path`
- `description`
- `source`
- `updated_at`
- `content_hash`
- `active`

Use RLS so browser/no-tool agents can read the published index but cannot write.

## Vercel role

Vercel should serve a static or serverless read-only skill index endpoint/page generated from the repo index. It is the browser fallback, not the canonical authoring surface.

No Vercel or Supabase write/deploy is authorized by this document alone.
