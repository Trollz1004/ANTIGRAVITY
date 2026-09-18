---
name: design-ui
description: "Design systems, shadcn, accessibility, responsive design, Figma-to-code."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [design, ui, shadcn, accessibility, responsive, figma]
    related_skills: [frontend-react, mobile]
---

# Design & UI

## When to Use

- Building component libraries or design systems
- Implementing accessible interfaces
- Converting Figma designs to code
- Responsive layout challenges

## Design System Setup

### With shadcn/ui

```bash
# Init shadcn
npx shadcn@latest init

# Add components
npx shadcn@latest add button card dialog form
```

### Design Tokens

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-fg)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-fg)' },
      },
      spacing: { '4xs': '0.125rem', '3xs': '0.25rem', '2xs': '0.5rem', xs: '0.75rem', sm: '1rem', md: '1.5rem', lg: '2rem', xl: '3rem', '2xl': '4rem', '3xl': '6rem', '4xl': '8rem' },
      borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px' },
    },
  },
};
```

## Accessibility Checklist

- [ ] Semantic HTML (`<main>`, `<nav>`, `<article>`, `<button>`)
- [ ] Focus visible states (`focus-visible:ring-2`)
- [ ] Color contrast ≥ 4.5:1 (AA) or 7:1 (AAA)
- [ ] Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- [ ] Screen reader labels (`aria-label`, `aria-describedby`)
- [ ] Reduced motion support (`@media (prefers-reduced-motion)`)
- [ ] Error messages linked to inputs (`aria-invalid`, `aria-errormessage`)

## Responsive Patterns

### Container Queries (Modern)

```tsx
// Component adapts to container, not viewport
<div className="@container">
  <div className="@md:grid-cols-2 @lg:grid-cols-3">
    {items.map(item => <Card key={item.id} {...item} />)}
  </div>
</div>
```

### Mobile-First CSS

```tsx
// Default mobile, scale up
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## Figma-to-Code Workflow

1. **Inspect** in Figma → get spacing, colors, typography
2. **Map** to Tailwind classes or CSS variables
3. **Componentize** → extract reusable pieces
4. **Responsive** → check all breakpoints
5. **Interactive** → add hover, focus, active states
6. **Polish** → transitions, micro-interactions

## Pitfalls

- **Pixel-perfect obsession** → Design is a guide, not a prison
- **Ignoring focus states** → Keyboard users need visible focus
- **Fixed heights** → Content grows, containers should too
- **Too many fonts** → Max 2 typefaces, 3 weights
- **Animation overload** → Subtle motion, respect `prefers-reduced-motion`

## Verification

- [ ] Lighthouse accessibility score ≥ 90
- [ ] Works at 320px and 1920px widths
- [ ] All interactive elements keyboard accessible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader announces content correctly
