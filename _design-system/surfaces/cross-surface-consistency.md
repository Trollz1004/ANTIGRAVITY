# Cross-Surface Design Consistency Reference

**Owner:** UX Designer (MAR-4)
**Date:** 2026-07-17
**Status:** Reference document — tracks design system adoption across all ANTIGRAVITY surfaces.

---

## Surface Status

| Surface | URL | Design System | Status |
|---|---|---|---|
| YouAndINotAI | youandinotai.com | ANTIGRAVITY (canonical) | Active dev — Next.js + Tailwind v4 |
| ai-solutions.store | ai-solutions.store | ANTIGRAVITY surface template | Template created — see `surfaces/ai-solutions-store.html` |
| OnlineRecycle.org | onlinerecycle.org | ANTIGRAVITY surface template | Template created — see `surfaces/onlinerecycle-org.html` |

---

## Design Element Adoption Matrix

| Element | YouAndINotAI | ai-solutions.store | OnlineRecycle.org |
|---|---|---|---|
| Base bg (`#020617`) | ✓ | Partial | ✗ (green/light) |
| Glass cards (`rgba(15,23,42,0.60)`) | ✓ | ✗ | ✗ |
| Cyan primary (`#22d3ee`) | ✓ | Partial (teal) | ✗ |
| Pink secondary (`#f472b6`) | ✓ | ✗ | ✗ |
| Gold trust (`#e9b949`) | Planned | ✗ | ✗ |
| Inter font | ✓ | ✓ | ✓ |
| JetBrains Mono | ✓ | ✗ | ✗ |
| Skip link | ✓ | ✗ | ✗ |
| Focus visible | ✓ (just added) | ✗ | ✗ |
| prefers-reduced-motion | ✓ (just added) | ✗ | ✗ |
| Square payments | ✓ | ✗ | ✓ |
| Stripe payments | ✗ | ✓ | ✗ |

---

## Migration Priority

### Phase 1 (Immediate — MAR-4 scope)
- **YouAndINotAI** — Complete accessibility implementation, ensure all tokens consistent
- **Design system documentation** — Update canonical tokens document (done)

### Phase 2 (Next sprint)
- **ai-solutions.store** — Create design-system surface template, migrate to glass cards
- **OnlineRecycle.org** — Create design-system surface template, migrate to glass cards

### Phase 3 (Q3 2026)
- Unify all payment UX patterns across surfaces
- Single design-system component library for all surfaces
- Consistent navigation cross-linking

---

## Notes

- ai-solutions.store brand identity (teal/cyan primary, warm earth tones) is intentionally separate per earlier decisions. Migration should preserve brand distinction while adopting shared visual language (glass cards, font stack, spacing).
- OnlineRecycle.org uses green (`#16a34a`) as its primary — this maps to `--ag-success` in the design system. Consider using emerald-500 as the accent for this surface.
- All surfaces must maintain FL §496.405 compliance. No charity/donation language anywhere.
