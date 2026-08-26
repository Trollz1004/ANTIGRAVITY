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
| `payments`                         | Square/Stripe payment processing, checkout flows                  |
| `revenue-model`                    | Business revenue guidance, pricing decisions                      |
| `self-improving-system`            | Skills reference index to reduce context window usage             |
| `sleek-design-mobile-apps`         | Mobile app design via Sleek platform                              |
| `social-growth-engineer`           | TikTok/Instagram viral growth engineering                         |
| `supabase`                         | Supabase database, auth, edge functions integration               |
| `supabase-postgres-best-practices` | Postgres performance optimization                                 |
| `ui-ux-pro-max`                    | UI/UX design across 10 technology stacks                          |


## Agency Skills — NOT INSTALLED

**This section previously advertised "144+ Agency agents … available as skills
prefixed with `agency-`", and listed Engineering, Design, Game Development
(`agency-unity-architect`, `agency-unreal-systems-engineer`), Spatial Computing,
Finance and other families. None of it was true.**

Verified 2026-08-26 on Sabretooth:

```
ls -d .agents/skills/agency-*   -> 0 directories
ls -d .agents/skills/*/         -> 88 directories
test -d agency-agents           -> MISSING
```

Not one `agency-*` skill exists on disk. The `agency-agents/` source tree that the
old "Regenerating" instructions told you to run `convert.sh` and `install.sh` from
does not exist either, so those commands could never have worked. Either the install
never happened or it was removed, and the README was never updated to match.

**This cost real time.** The claimed game-development entries led to a standing
belief that roughly five Unreal skills were available for the DREAM project. There
are none — no Unreal skill, no Unity skill, no game-engine skill of any kind. The
only directory that matches a search for "engine" is `social-growth-engineer`.

Related, and equally worth knowing before planning Unreal work: Unreal Engine is not
installed on this machine, no `.uproject` exists, and Hermes' `unreal-engine` MCP
entry is `enabled: false` pointing at `http://127.0.0.1:8000/mcp` — an address the
YouAndINotAI dating-app backend already owns. See
`.agents/harness-config/hermes.yaml` for the parked note.

**Do not restore the old list.** If Agency skills are ever installed, regenerate this
section from a directory listing rather than from an inventory of what was intended.

## The 88 skills that do exist

The table above names the durable, hand-maintained ones. For the full live list,
read the directory — it is the only trustworthy source:

```bash
ls -d .agents/skills/*/ | sed 's|.*/skills/||; s|/$||' | sort
```

Skills carrying a `--<hash>` suffix are installed copies pinned to a marketplace
version; the unsuffixed sibling of the same name, where one exists, is the local
working copy.
