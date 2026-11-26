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
