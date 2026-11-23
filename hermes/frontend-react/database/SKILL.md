---
name: database
description: "PostgreSQL, Supabase, Firebase, schema design, migrations, RLS."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [database, postgres, supabase, firebase, schema, rls]
    related_skills: [nextjs, testing]
---

# Database

## When to Use

- Schema design and migrations
- Writing queries or RLS policies
- Setting up Supabase/Firebase
- Performance optimization

## Quick Reference

| Task | Tool |
|------|------|
| Migrations | Prisma / Drizzle / Supabase CLI |
| ORM | Prisma (type-safe) / Drizzle (SQL-like) |
| Real-time | Supabase Realtime / Firebase RTDB |
| Storage | Supabase Storage / Firebase Storage |
| Auth | Supabase Auth / Firebase Auth |

## Schema Design

### Prisma Example

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id       String @id @default(cuid())
  title    String
  body     String
  author   User   @relation(fields: [authorId], references: [id])
  authorId String
  published Boolean @default(false)
  tags     Tag[]  @relation("PostTags")
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[] @relation("PostTags")
}
```

### Indexing Strategy

```sql
-- Always index foreign keys
CREATE INDEX idx_post_author ON "Post"("authorId");

-- Index for common filters
CREATE INDEX idx_post_published ON "Post"("published") WHERE published = true;

-- GIN index for JSONB / full-text
CREATE INDEX idx_post_search ON "Post" USING GIN(to_tsvector('english', title || ' ' || body));
```

## Row Level Security (Supabase)

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can read their own posts
CREATE POLICY "Users can read own posts"
  ON posts FOR SELECT
  USING (auth.uid() = author_id);

-- Users can update own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Public can read published posts
CREATE POLICY "Public can read published"
  ON posts FOR SELECT
  USING (published = true);
```

## Pitfalls

- **N+1 queries** → Use `include`/`select` in Prisma or JOINs
- **Missing indexes** → Index foreign keys, filter columns, sort columns
- **No soft delete** → Add `deletedAt` timestamp
- **Over-normalizing** → Sometimes JSONB is better than 6th normal form
- **Forgetting RLS** → Always enable, test with anon key

## Verification

- [ ] Schema migrated successfully
- [ ] Indexes created for common queries
- [ ] RLS policies tested (owner, admin, public)
- [ ] No N+1 in API routes
- [ ] Backups configured (automated)

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
