# Antigravity Skills Directory

This workspace contains skills for the Antigravity AI agent system.

## Organization

Skills are organized by category:

| Skill | Purpose |
|-------|---------|
| `devrel-content` | Technical content creation (blog posts, tutorials, documentation) |
| `growth-marketer` | Growth marketing, funnel optimization, viral growth |
| `hermes-evolution` | Self-improving agents - evaluate and propose enhancements |
| `mission-control` | Task tracking, agent reporting, status queries |
| `payments` | Square/Stripe payment processing, checkout flows |
| `revenue-model` | Business revenue guidance, pricing decisions |
| `sleek-design-mobile-apps` | Mobile app design via Sleek platform |
| `social-growth-engineer` | TikTok/Instagram viral growth engineering |
| `supabase` | Supabase database, auth, edge functions integration |
| `supabase-postgres-best-practices` | Postgres performance optimization |
| `ui-ux-pro-max` | UI/UX design across 10 technology stacks |

## Agency Skills

All 144+ Agency agents are available as skills prefixed with `agency-`:

- **Engineering**: `agency-frontend-developer`, `agency-backend-architect`, `agency-mobile-app-builder`, etc.
- **Design**: `agency-ui-designer`, `agency-ux-researcher`, `agency-brand-guardian`, etc.
- **Marketing**: `agency-growth-hacker`, `agency-content-creator`, `agency-tiktok-strategist`, etc.
- **Sales**: `agency-outbound-strategist`, `agency-deal-strategist`, `agency-sales-engineer`, etc.
- **Product**: `agency-product-manager`, `agency-sprint-prioritizer`, etc.
- **Project Management**: `agency-project-shepherd`, `agency-studio-producer`, etc.
- **Testing**: `agency-reality-checker`, `agency-evidence-collector`, etc.
- **Support**: `agency-support-responder`, `agency-analytics-reporter`, etc.
- **Paid Media**: `agency-ppc-campaign-strategist`, `agency-paid-social-strategist`, etc.
- **Spatial Computing**: `agency-xr-interface-architect`, `agency-visionos-spatial-engineer`, etc.
- **Specialized**: `agency-mcp-builder`, `agency-blockchain-security-auditor`, etc.
- **Finance**: `agency-bookkeeper-controller`, `agency-financial-analyst`, etc.
- **Game Development**: `agency-game-designer`, `agency-unity-architect`, `agency-unreal-systems-engineer`, etc.
- **Strategy**: `agency-chief-of-staff` |
- **Academic**: `agency-anthropologist`, `agency-historian`, etc.

### Using Agency Skills

Activate any skill in Antigravity:

```
Use the agency-frontend-developer skill to review this component.
```

### Regenerating Agency Skills

After modifying agent definitions in `agency-agents/`:

```bash
./agency-agents/scripts/convert.sh --tool antigravity
./agency-agents/scripts/install.sh --tool antigravity --no-interactive
```