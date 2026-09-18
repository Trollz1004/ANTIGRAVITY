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
