# CEO Directive — Grok / Opencode Adapter Configuration

**Run:** http://127.0.0.1:3110/TRO/agents/ceo/runs/d9d597c1-456c-4708-9e5b-cf174b07226f

---

## Authority & Identity

- **Human authority:** Joshua Coleman (`Trollz1004`) — final decision maker.
- **Repository:** `Trollz1004/ANTIGRAVITY` on `main`.
- **Root folder:** `C:\antigravity`.
- **SOL anchor:** `C:\antigravity\SOL.md`.
- **Role of this CEO run:** You are the Grok CEO runtime for Paperclip HQ. You execute the directive below inside the repo and report back.

---

## Task

Edit `C:\antigravity\opencode\opencode.json` so OpenCode / Pi has correct, complete, non-conflicting provider and model entries for:

1. **OpenRouter free models** — all models available via the `:free` suffix on OpenRouter.
2. **Opencode / Pi free models** — any free inference endpoint provided by Opencode/Pi.
3. **Ollama self-hosted models** — local Ollama bridge, already present as `ollama-local`.

The file already contains providers for `anthropic`, `codex`, `openai`, `google`, `xai`, `nous`, `openrouter`, `ollama-cloud`, `ollama-local`, `hermes-router`. Preserve every existing entry. Only extend, do not replace or delete.

---

## Required Changes

### 1. OpenRouter free provider (`provider.openrouter`)

- Keep every existing free model already in the block.
- Add any missing OpenRouter free models, using exact model IDs from `https://openrouter.ai/api/v1/models` filtered to `is_free: true` (or the `:free` suffix convention).
- All entries must use `"apiKeyEnv": "OPENROUTER_API_KEY"`.
- Prefer `name` values that are concise and contain no charity/split/kids-care language.
- Example existing models to preserve:
  - `meta-llama/llama-3.3-70b-instruct:free`
  - `meta-llama/llama-3.2-3b-instruct:free`
  - `google/gemma-4-27b-it:free`
  - `qwen/qwen3-235b-a22b:free`
  - `nousresearch/hermes-3-llama-3.1-70b:free`
  - `nvidia/nemotron-3-8b-creative:free`
  - `openai/gpt-oss-120b:free`
  - `liquid/lfm-2.5-40b-mixture-of-depths:free`
  - `cognitivecomputations/dolphin-mistral-nemo-12b:free`
  - `x-ai/grok-3:free`
- Add any other free families found: deepseek, mistralai, microsoft, etc.

### 2. Opencode / Pi free provider

- Add a new provider named `opencode` or `opencode-pi` if the platform exposes a free inference endpoint.
- `baseURL`: use the documented Opencode inference endpoint (e.g. `https://api.opencode.ai/v1` if that is the published endpoint).
- `apiKeyEnv`: `OPENCODE_API_KEY` or `OPENCODE_PI_API_KEY`.
- Only include models confirmed to be free-tier.
- If the endpoint is unknown, create the provider skeleton with no models and a `TODO` comment in Markdown only — not in the JSON.

### 3. Ollama self-hosted local provider

- The existing `ollama-local` provider is at `http://localhost:11434/v1`.
- Ensure it has a clear note that this is the canonical way to attach self-hosted Ollama models to Paperclip/OpenCode.
- Add an `ollama-opencode` local bridge entry only if it is functionally different from `ollama-local`; otherwise document that `ollama-local` is the single source of truth.

---

## Constraints

1. One repo / one branch / one root folder. No new repos, no new root directories.
2. All changes stay inside `C:\antigravity` on `main`.
3. Do not store real API keys in the JSON. Use `{env:VAR_NAME}` or `apiKeyEnv` references only.
4. No charity/split/kids-care language in model names, provider names, or descriptions.
5. No roleplay, hypotheticals, or narrative framing inside the JSON.
6. Validate JSON syntax after editing. If invalid, fix it before committing.
7. After the JSON is valid, stage, commit, and push to `origin/main`.

---

## Validation Steps (do not skip)

1. Read `C:\antigravity\opencode\opencode.json`.
2. Edit according to the sections above.
3. Run a JSON syntax check (`python -m json.tool opencode\opencode.json` or equivalent).
4. Verify no duplicate provider names.
5. Run `git status`, `git diff --stat`, and confirm only `opencode/opencode.json` is changed.
6. `git add opencode/opencode.json`.
7. `git commit -m "opencode: add OpenRouter free, Opencode free, and Ollama self-hosted adapters"`.
8. `git push origin main`.
9. Report back.

---

## Output Template

Reply with exactly this block:

```text
CEO RUN: <run url>
STATUS: <in_progress|done|blocked>
FILES CHANGED:
- <path> (+<n>/-<n>)
PROVIDERS ADDED/UPDATED:
- <provider name>: <model count> models
JSON SYNTAX: <valid|invalid>
COMMIT SHA: <sha>
BLOCKERS: <none|description>
NEXT ACTION: <concrete step>
```

---

## Doctrine Reminders

- Paperclip is the single execution/audit plane for ANTIGRAVITY.
- This task is tracked in Paperclip; all work is logged and timestamped.
- If a change conflicts with `SOL.md`, stop and escalate to Joshua Coleman before continuing.
