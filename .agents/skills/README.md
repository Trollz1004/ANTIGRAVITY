# Antigravity Skills Directory

This workspace contains skills for the Antigravity AI agent system.

## Organization

Skills are organized by category:

| Skill                              | Purpose                                                           |
| ---------------------------------- | ----------------------------------------------------------------- |
| `devrel-content`                   | Technical content creation (blog posts, tutorials, documentation) |
| `growth-marketer`                  | Growth marketing, funnel optimization, viral growth               |
| `hermes-evolution`                 | Self-improving agents - evaluate and propose enhancements         |
| `mission-control`                  | Task tracking, agent reporting, status queries                    |
| `payments`                         | Square primary + PayPal payment processing, checkout flows         |
| `revenue-model`                    | Business revenue guidance, pricing decisions                      |
| `self-improving-system`            | Skills reference index to reduce context window usage             |
| `sleek-design-mobile-apps`         | Mobile app design via Sleek platform                              |
| `social-growth-engineer`           | TikTok/Instagram viral growth engineering                         |
| `supabase`                         | Supabase database, auth, edge functions integration               |
| `supabase-postgres-best-practices` | Postgres performance optimization                                 |
| `ui-ux-pro-max`                    | UI/UX design across 10 technology stacks                          |


## Agency Skills — they exist, they were just never copied here

**Correction, same day.** An earlier pass concluded the 144+ Agency skills "never
existed", because `ls .agents/skills/agency-*` returned nothing in this tree. That
was one directory generalised into a claim about the whole machine, and it was
wrong. Joshua said he had 244–277 skills. He was right.

They live at:

```
%USERPROFILE%\OneDrive\Personal Vault-Laptop\ANTIGRAVITY\.agents\skills\
  229 skill directories, 184 of them agency-*
```

`Trollz1004/ANTIGRAVITY-v2` carries the same set. The install happened — on the
laptop vault — and was simply never copied into `C:\ANTIGRAVITY`. The README that
described them was accurate about the pack and stale only about *where it lived*.
The honest fix was a path, not a demolition.

The `agency-agents/` source tree the old "Regenerating" section pointed at is
genuinely absent from this root, so those `convert.sh` / `install.sh` commands
still cannot run from here. Regenerate from the vault copy or from upstream.

### Retired & Disabled Game Packs (`.agents/skills_disabled/`)

DREAM Online (`Trollz1004/dream-online`) runs on the **100% in-house DREAM Engine**
(`Alienware 192.168.0.40:9180`), with zero external third-party game engines.
Legacy third-party engine skills live disabled in `.agents/skills_disabled/` (for
example `agency-game-designer` and other quarantined vendor templates) and are not
loaded by active fleet sessions.

## The skills that exist in this tree

The table at the top names the durable, hand-maintained ones. For the live list,
read the directory — it is the only trustworthy source:

```bash
ls -d .agents/skills/*/ | sed 's|.*/skills/||; s|/$||' | sort
```

Any gitignored `--<hash>` directories are legacy materialized copies of an
existing skill and are excluded from canonical inventory counts.

