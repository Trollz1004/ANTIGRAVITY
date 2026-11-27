---
name: frontend-react
description: "React 19 patterns: hooks, state, performance, components, testing."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [react, frontend, hooks, state, performance, components]
    related_skills: [nextjs, design-ui, testing]
---

# Frontend & React

## When to Use

- Building React components or applications
- State management decisions
- Performance optimization
- Component architecture

## Quick Reference

| Task | Approach |
|------|----------|
| State | useState → useReducer → Zustand/Jotai (only when needed) |
| Data fetching | TanStack Query / SWR |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS + cn() utility |
| Testing | Vitest + Testing Library |
| Icons | Lucide React |

## React 19 Patterns

### Server Components (RSC)

```tsx
// Server Component (default in Next.js App Router)
async function UserProfile({ id }: { id: string }) {
  const user = await db.user.findUnique({ where: { id } });
  return <div>{user.name}</div>;
}

// Client Component (interactive parts)
'use client';
function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>{liked ? '❤️' : '🤍'}</button>;
}
```

### Custom Hooks Pattern

```tsx
// ✅ Good: Encapsulates logic, reusable
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Usage
const search = useDebounce(query, 300);
```

### Performance Checklist

- [ ] Use `React.memo()` only when re-renders measured (not prematurely)
- [ ] Lazy load below-fold components with `React.lazy()` + `Suspense`
- [ ] Virtualize long lists with `@tanstack/react-virtual`
- [ ] Code-split routes automatically (Next.js does this)
- [ ] Use `useMemo`/`useCallback` only when profiling shows benefit

### Component Composition

```tsx
// ✅ Good: Composition over props drilling
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}
function CardHeader({ title }: { title: string }) { return <h3>{title}</h3>; }
function CardBody({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }

// Usage
<Card>
  <CardHeader title="Hello" />
  <CardBody>Content here</CardBody>
</Card>
```

## Pitfalls

- **Prop drilling 3+ levels** → Use Context or composition
- **useEffect for derived state** → Compute during render instead
- **Object/array in useEffect deps** → Use primitive deps or `useMemo`
- **Index as key** → Use stable unique IDs
- **Over-optimizing early** → Profile first, optimize second

## Verification

- [ ] Components render without errors
- [ ] State updates trigger correct re-renders
- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] Loading and error states handled
- [ ] Accessible (keyboard nav, screen readers)

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
- `First read: the house index, https://github.com/Trollz1004/dream-online/blob/main/docs/house/INDEX.md, then the newest rulings in the claude.ai project Ai-Dream-Team as the index describes.`
- `Funding comes first and game work is paused (ruled 2026-11-13).`
- `The wheel: tickets in the .fable-kitchen inbox on the Alienware; runner ops/router/inbox-runner.ts in dream-online; lane rules in orders/RULES.md in the kitchen.`
- `Merging (ruled 2026-11-16): nothing merges with a failing required check; platform and marketing changes need the checks plus one trusted review; game and engine work keeps two offerings and two judges; whoever merges looks at the files and leaves a one-line verdict.`
- `Public text passes the go gate: the product does what the text says, stop-slop plus a humanizer pass, only what is true, every outside fact links the exact page.`
- `Marketing team log: https://github.com/Trollz1004/ANTIGRAVITY/tree/main/marketing/team (public; nothing private goes in).`
<!-- TROLLZ1004-SPINE:END -->
