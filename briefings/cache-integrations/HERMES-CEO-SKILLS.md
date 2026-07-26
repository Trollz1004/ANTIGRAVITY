# SKILLS.md — HOW AGENTS GET CAPABILITIES
> Harness pointer. Referenced by every agent's `AGENTS.md` / `CLAUDE.md`, never copied into them.
> The base pack is always on. Task skills load on demand and drop. The shelf is never preloaded.

## 0 · THE PRINCIPLE (unchanged)
Never preload the whole shelf. Discovery + load-on-demand + drop-after is what keeps context short and the bill low. Preloading is drift and burns money. Everything below serves that.

## 1 · THE BASE PACK — every agent carries these, always
Installed once per agent, always loaded. This is the toolkit, not the shelf.
| Skill | Source | Why it's mandatory |
|---|---|---|
| `find-skills` | vercel-labs/skills | discover the right skill before doing anything |
| `create-skills` | (harness / skillbrain) | agents author their own skills when none fits |
| `agent-browser` | vercel-labs/agent-browser | browser automation + cookie-sync for scraping & non-API posting |
| `caveman` | juliusbrussee/caveman | terse output — **mandatory, saves tokens** |
| `proactive-self-improving-agent` | yanhongxi-openclaw | the daily self-improve loop (§4) |
| search/find | native + `npx skills find` | agents must ALWAYS be able to search the web and the skill index |

**Install block (run per agent / per node):**
```bash
npx skills add https://github.com/vercel-labs/skills --skill find-skills
npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser
npx skills add https://github.com/juliusbrussee/caveman --skill caveman
npx skills add https://github.com/yanhongxi-openclaw/proactive-self-improving-agent --skill proactive-self-improving-agent
npx skills add trollz1004/antigravity      # Josh's own skill repo — available, loaded as needed
```
Discovery any time: `npx skills find <query>` · registry: https://www.skills.sh/

## 2 · TASK SKILLS — load on demand, one OR several, then drop
When a task needs more than the base pack, `find-skills` (or `skillbrain_search`) locates it, the agent loads it, uses it, drops it. **"More than 1" is allowed** — a posting run may hold `caveman` + `agent-browser` + `human-posting` at once because the task genuinely needs all three. What's forbidden is loading skills a task does *not* need "just in case." Relevance is the gate, not a hard count.

## 3 · THE `.agents/skills` SHELF
The full library lives at `E:\ANTIGRAVITY\.agents\skills\`. Agents **create their own** skills here via `create-skills` / `skillbrain_create_skill` when the registry has no fit — then it's discoverable to the whole fleet. Josh's shared skills also come from `trollz1004/antigravity`. `skillbrain_mcp` indexes all of it and serves it on demand (see the skillbrain README).

## 4 · SELF-IMPROVE LOOP — mandatory, all agents
Powered by `proactive-self-improving-agent` + browser automation:
1. **Daily** (once/day, mandatory): check https://www.skills.sh/ for new/updated skills relevant to the fleet's work. `npx skills find <the work you keep doing>`.
2. **Add as needed** — install a skill the moment a task would be better with it. **Update as needed** — refresh installed skills when upstream changes.
3. **Create when missing** — no skill fits → author one, drop it on the shelf, it's now fleet-wide.
4. Log what was added/updated to the agent journal (real entries only — real-or-zero).
Every agent can drive browser automation for this loop; none of it bypasses THE GATE (skill install is local tooling, not a model call).

## 5 · GUARDRAILS
- Skill install is local `npx`/filesystem — fine. **Model inference still routes through OmniRoute only** (SOUL.md Law A). A skill never gives an agent a direct provider path.
- Never install a skill that ships secrets or asks to set `ANTHROPIC_BASE_URL` globally. Reject it, log it.
- `caveman` on by default keeps outputs short; don't disable it to "explain more."
