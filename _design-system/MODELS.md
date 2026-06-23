# MODELS.md — Gemma 4 tier routing for the ANTIGRAVITY fleet

> Opus thinks; the fleet receives. This file freezes the model-selection decision
> so no agent has to reason about *which* model to use — it just reads the row.

## Principle

Tier by **task difficulty**, not by habit. Cheap local models do cheap work;
the strongest model you have does the reasoning that can lose money or trust.
Never run a 2B model on a 31B's job.

## Fleet routing

| Agent | Category | Default model | Why |
| --- | --- | --- | --- |
| **Hermes** (router) | routing | `gemma4:e4b` (local) | Triage + dispatch is classification — fast, free, on-device. |
| **CMO** | marketing | `gemma4:e4b` → `gemma4:26b` for finals | Drafts cheap locally; polish on the MoE. |
| **UX** | design | `gemma4:31b` / `gemma4:31b-cloud` | Applies the design system; needs coding + layout reasoning. |
| **CTO** | software | `gemma4:31b-cloud` | Code review / agentic work — top tier only. |
| **CFO** | finance | `gemma4:31b-cloud` | Money math + reconciliation — never below 26B. |
| **CSO** | security | `gemma4:31b` | Pattern + threat reasoning. |
| **Heartbeat / health probes** | ops | `gemma4:e2b` | Pure status classification — smallest is fine. |

Sampling (all): `temperature=1.0`, `top_p=0.95`, `top_k=64`. Enable thinking with
the `<|think|>` membership record in the system prompt for the 26B+ tiers; leave it off for
E2B/E4B routing calls to save latency.

## Design-task routing (the UX agent's lane)

| Task | Model | Note |
| --- | --- | --- |
| Apply an existing component / fill copy / swap data | `gemma4:31b` (local) | Constrained by this design system — a mid model nails it. |
| Build a full new screen from the UI kits | `gemma4:31b-cloud` | More layout reasoning; cloud tier earns it. |
| **Invent a new aesthetic direction** | escalate to Opus | Open-ended creative reasoning — not a local-model job. |
| Image/OCR/doc parsing for assets | `gemma4:31b` (vision) | Use a 560–1120 visual membership record budget for OCR; 70–140 for captioning. |

**Rule of thumb:** if the design system already answers the question, any 31B can
execute. If it requires a *new* decision the system doesn't cover, that's an Opus
thought — escalate, capture the answer back into the system, and the fleet inherits it.
