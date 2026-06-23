# RUNBOOK: free-claude-code activation + agent-skills install

**Filed:** 2026-06-09 by Opus (claude-sandbox session)
**Status:** Executable by Hermes / Tom / Joshua-with-hands. No Opus required after this file lands.
**Approved plan:** `/root/.claude/plans/encapsulated-bouncing-brooks.md` (sandbox-side)

---

## Why this file exists

Two decisions need execution on Sabertooth, both unblock active gig work, neither
needs Opus to perform:

1. **free-claude-code is installed at `C:\Users\joshl\.fcc` but not yet wired into Claude Code.**
   With Joshua's downgrade from Max → Pro (~$20/mo), Pro caps hit faster than
   Max caps ever did. fcc is the overflow layer: when Pro throttles mid-demo,
   Claude Code keeps running by routing through Ollama (free local), DeepSeek
   (cheap), Kimi, Groq, Z.ai, OpenRouter — 17 providers total. It does NOT
   replace Pro; it absorbs spillover so gig work doesn't stall.

2. **`addyosmani/agent-skills`** — 24 production-grade engineering skills
   from Addy Osmani (Google → Anthropic). One-command Claude Code plugin install.
   Auto-activates skills based on context (e.g. UI work → `frontend-ui-engineering`,
   API work → `api-and-interface-design`). Coexists with the 5 role-based
   sub-agents (`cfo`/`hermes`/`cmo`/`cto`/`closer`) at `.claude/agents/` — different
   layer, no conflict.

**Focus Gate (carries forward):** these unblock tooling. They do NOT replace the
first-gig test. The metric remains: is there a closed paying gig in the next 7
days? If no, the tools were not the bottleneck and we revisit the loop diagnosis.

---

## SECTION 1 — free-claude-code activation

`.fcc` is already installed. These steps wire it into Claude Code.

### 1.1 Start the fcc proxy (leave running in its own terminal)

```cmd
fcc-server
```

Proxy listens on `http://127.0.0.1:8082`. Admin UI at `http://127.0.0.1:8082/admin`.

### 1.2 Add provider keys via Admin UI

```cmd
start http://127.0.0.1:8082/admin
```

Recommended first additions (priority order):

| Provider  | Why                                                       | Cost                |
| --------- | --------------------------------------------------------- | ------------------- |
| Ollama    | Local, free, unlimited; Sabertooth already runs :11434    | $0                  |
| DeepSeek  | Best price/quality ratio for cheap fallback               | ~$0.27/M membership records     |
| Groq      | Fastest inference; useful free tier                       | Free tier first     |
| Z.ai      | glm-5.1 etc. — already used by Hermes-in-Paperclip       | Cheap               |
| OpenRouter| Unified gateway if Joshua wants pay-per-membership record GPT-5/Opus  | Pay-per-membership record       |

Gemini intentionally last in priority: free tier exists but data may be used for
training; route only non-sensitive prompts there.

### 1.3 Persist Claude Code env vars (elevated PowerShell, one-time)

```powershell
setx ANTHROPIC_BASE_URL "http://localhost:8082"
setx ANTHROPIC_AUTH_TOKEN "freecc"
setx CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY "1"
setx CLAUDE_CODE_AUTO_COMPACT_WINDOW "190000"
```

`CLAUDE_CODE_AUTO_COMPACT_WINDOW=190000` directly addresses the "compaction
steers me away every 300k membership records" complaint Joshua raised earlier this session.
It pushes the auto-summarize threshold way out so it triggers far less often.

### 1.4 Close and reopen the terminal (env vars only load on new shells), then:

```cmd
claude --version    REM should print without error
claude              REM new session; routes through fcc, not Anthropic
```

---

## SECTION 2 — agent-skills install

Inside any Claude Code session on Sabertooth, run:

```
/plugin marketplace add addyosmani/agent-skills
/plugin install agent-skills@addy-agent-skills
```

That's it. 24 skills auto-activate based on context. No file copying needed.
No conflicts with existing `.claude/agents/` (different layer — skills are
workflow patterns; agents are role personas).

### What you get (24 skills mapped to SDLC stages)

| Stage  | Skills                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------- |
| Meta   | `using-agent-skills`                                                                              |
| Define | `interview-me`, `idea-refine`, `spec-driven-development`                                          |
| Plan   | `planning-and-task-breakdown`                                                                     |
| Build  | `incremental-implementation`, `test-driven-development`, `context-engineering`, `source-driven-development`, `doubt-driven-development`, `frontend-ui-engineering`, `api-and-interface-design` |
| Verify | `browser-testing-with-devtools`, `debugging-and-error-recovery`                                   |
| Review | `code-review-and-quality`, `code-simplification`, `security-and-hardening`, `performance-optimization` |
| Ship   | `git-workflow-and-versioning`, `ci-cd-and-automation`, `deprecation-and-migration`, `documentation-and-adrs`, `observability-and-instrumentation`, `shipping-and-launch` |

Plus 3 specialist personas (code-reviewer, test-engineer, security-auditor) and
4 reference checklists. Every skill ends with evidence requirements (tests
passing, build output, runtime data) — same discipline as senior engineering.

---

## SECTION 3 — Honest warnings (read before flipping the switch)

1. **Anthropic ToS exposure.** fcc redirects Claude Code traffic *away* from
   Anthropic. Anthropic could ban the account on detection. Joshua's Pro
   subscription (~$20/mo) is the asset at risk. Worth knowing before activating.
2. **`fcc-server` install was `curl|sh` / `irm|iex`.** Read the actual install
   script under `C:\Users\joshl\.fcc\` before relying on it long-term. 5
   minutes; avoids running unread code in elevated context.
3. **Provider data privacy differs.** Ollama is local-only (zero data leakage).
   Gemini may train on prompts. OpenRouter is opaque. DeepSeek has its own ToS.
   Choose providers per the sensitivity of the prompt.
4. **agent-skills is community-maintained.** Addy Osmani is at Anthropic but the
   plugin is not officially Anthropic-supported. Breaking changes can happen on
   upstream.
5. **Naming collision warning.** Upstream `agent-skills` uses the word
   "Antigravity" to refer to a *different* open-source coding agent (`agy` CLI).
   That is NOT this repo (`Trollz1004/ANTIGRAVITY`). Don't confuse them.

---

## SECTION 4 — Focus Gate reaffirmation

From `STATE.md` doctrine and this session's mid-conversation diagnosis:

> No new infrastructure ships until the first dollar is earned.
>
> If 8 months of building produced no closed gigs, the next tool will not fix it.
> These two land as exceptions only because they directly reduce gig-work friction
> — fcc keeps Claude Code alive when Pro throttles mid-demo; agent-skills raises
> the quality bar on demo output. Anything beyond these two requires a closed gig
> first.

Metric for the next 7 days: **closed paying gig, yes or no.**
Not "is the toolchain modern." Not "how many models do we route to."
If zero closes in 7 days, tools are confirmed not to be the bottleneck.

---

## Verification (do this end-to-end after both installs)

1. **fcc proxy alive:**
   ```cmd
   curl http://localhost:8082/v1/models
   ```
   Should return JSON list of provider-prefixed models. Empty list = no providers
   added in Admin UI yet.

2. **Claude Code routes through fcc, not Anthropic:**
   Open a fresh terminal (env vars only load on new shells). Run `claude`.
   Send any short prompt. Check fcc Admin UI request log — the request
   should appear there. If not, env vars didn't take — verify with
   `echo %ANTHROPIC_BASE_URL%`.

3. **agent-skills active:**
   In Claude Code, `/plugin list` should show `agent-skills`. Type a
   development-shaped prompt ("I want to add a new REST endpoint") and
   confirm `api-and-interface-design` auto-engages.

4. **Existing 5 role agents still work:**
   `@hermes find me 5 gigs` should still load `hermes.md` from
   `.claude/agents/` and respond in its structured format. agent-skills
   does not displace role agents.

5. **First-gig loop (the actual metric):**
   Within 7 days, attempt to close one gig via the full pipeline:
   `@hermes → @cto → @cmo → @closer → hit Submit`.
   Zero closes = tools weren't the bottleneck. Revisit the loop diagnosis.

---

## What this runbook deliberately does NOT do

- No new code
- No new `services/`
- No new `.claude/agents/` files (uses existing 5 role agents + plugin skills)
- No PR opened (per CLAUDE.md — Joshua reviews/merges manually)
- No provider API keys configured (Joshua adds his own via Admin UI)
- No cherry-pick of agent-skills content into ANTIGRAVITY (plugin install
  stays in sync with upstream; cherry-picking creates drift)

---

## Sources

- https://github.com/Alishahryar1/free-claude-code
- https://github.com/addyosmani/agent-skills
- https://github.com/addyosmani/agent-skills/blob/main/CLAUDE.md
- https://github.com/addyosmani/agent-skills/blob/main/AGENTS.md
