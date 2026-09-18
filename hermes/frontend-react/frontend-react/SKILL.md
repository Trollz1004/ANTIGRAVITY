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
