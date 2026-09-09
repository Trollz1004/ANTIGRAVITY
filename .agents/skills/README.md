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


## Agency Skills — they exist, they were just never copied here

**Correction, same day.** An earlier pass concluded the 144+ Agency skills "never
existed", because `ls .agents/skills/agency-*` returned nothing in this tree. That
was one directory generalised into a claim about the whole machine, and it was
wrong. Joshua said he had 244–277 skills. He was right.

They live at:

```
C:\Users\joshi\OneDrive\Personal Vault-Laptop\ANTIGRAVITY\.agents\skills\
  229 skill directories, 184 of them agency-*
```

`Trollz1004/ANTIGRAVITY-v2` carries the same set. The install happened — on the
laptop vault — and was simply never copied into `C:\ANTIGRAVITY`. The README that
described them was accurate about the pack and stale only about *where it lived*.
The honest fix was a path, not a demolition.

The `agency-agents/` source tree the old "Regenerating" section pointed at is
genuinely absent from this root, so those `convert.sh` / `install.sh` commands
still cannot run from here. Regenerate from the vault copy or from upstream.

### The game-development family is real

This is the part the earlier pass denied hardest, and the part that matters for
DREAM. Eleven skills copied from the vault into this tree:

| Skill | Domain |
|---|---|
| `agency-unreal-systems-engineer` | Unreal |
| `agency-unreal-world-builder` | Unreal |
| `agency-unreal-multiplayer-architect` | Unreal |
| `agency-unreal-technical-artist` | Unreal |
| `agency-game-designer` | Design |
| `agency-game-audio-engineer` | Audio |
| `agency-unity-architect` | Unity |
| `agency-unity-multiplayer-engineer` | Unity |
| `agency-unity-editor-tool-developer` | Unity |
| `agency-unity-shader-graph-artist` | Unity |
| `agency-godot-gameplay-scripter` | Godot |

Four Unreal skills — Joshua remembered "like 5", which is close enough that the
memory was sound and the search was not.

The other 173 `agency-*` skills stay in the vault. Folding all 184 into a repo
mid-cleanup would trade one mess for another. Copy what a task needs, from the
path above.

### Hermes ships its own Unreal MCP skill

`unreal-mcp-hermes/` is a reference copy of the live Hermes skill at
`%LOCALAPPDATA%\hermes\hermes-agent\optional-skills\creative\unreal-mcp\` — a
13.9 KB `SKILL.md` plus five reference documents. Not a stub.

Note what it is and is not: the **client** half. Epic's Unreal MCP server runs
inside the Unreal Editor process. Unreal is not installed on Sabretooth, no
`.uproject` exists, and Hermes' `mcp_servers.unreal-engine` entry is
`enabled: false` pointed at `http://127.0.0.1:8000/mcp` — a port the dating-app
backend already owns. See `docs/ops/NODE-AND-PORT-MAP.md`.

## The skills that exist in this tree

The table at the top names the durable, hand-maintained ones. For the live list,
read the directory — it is the only trustworthy source:

```bash
ls -d .agents/skills/*/ | sed 's|.*/skills/||; s|/$||' | sort
```

Directories with a `--<hash>` suffix are Paperclip *materialized* copies — clones
of a skill that already exists here, carrying an extra
`.paperclip-materialized-skill.json` marker. They are gitignored: Paperclip
re-creates them on demand, and committing them double-counts the skill inventory.
