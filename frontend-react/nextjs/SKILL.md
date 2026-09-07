---
name: nextjs
description: "Next.js App Router, RSC, caching, middleware, deployment patterns."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [nextjs, app-router, rsc, server-components, vercel]
    related_skills: [frontend-react, database]
---

# Next.js

## When to Use

- Building full-stack React applications
- API routes or server actions
- SEO-critical pages (SSR/SSG)
- Vercel deployments

## App Router Patterns

### Server Components (Default)

```tsx
// app/page.tsx — Server Component by default
import { db } from '@/lib/db';

export default async function Page() {
  const posts = await db.post.findMany();
  return (
    <main>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  );
}
```

### Client Components

```tsx
'use client';
import { useState } from 'react';

export function Search() {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### Server Actions

```tsx
// app/actions.ts
'use server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  await db.post.create({
    data: { title: formData.get('title') as string }
  });
  revalidatePath('/posts');
}
```

### Route Handlers

```ts
// app/api/posts/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const posts = await db.post.findMany();
  return NextResponse.json(posts);
}
```

## Caching Strategy

| Type | Use For | How |
|------|---------|-----|
| Static | Blog posts, docs | `generateStaticParams()` |
| ISR | Product catalogs | `revalidate: 3600` |
| Dynamic | User dashboards | No caching |
| On-demand | Admin panels | `revalidateTag()` |

## Middleware

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth, redirects, A/B testing, geo
  const token = request.cookies.get('token');
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|favicon.ico).*)'],
};
```

## Pitfalls

- **'use client' everywhere** → Only when needed (state, effects, browser APIs)
- **Fetching in client** → Fetch in Server Components, pass as props
- **Over-fetching** → Select only needed fields from DB
- **Missing loading.tsx** → Always add for async Server Components
- **Missing error.tsx** → Always add for error boundaries

## Verification

- [ ] Pages load with correct rendering strategy
- [ ] Server actions work without JS
- [ ] Caching behaves as expected
- [ ] Middleware runs on correct paths
- [ ] Build passes with no warnings
