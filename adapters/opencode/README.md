# OpenCode Adapter

Paperclip alias: `opencode`

CLI: `opencode`

Provider separation: Routes through root `opencode/opencode.json` which defines isolated entries for:
- opencode (zen free)
- hermes-router/*
- ollama-local/*
- ollama-cloud/*
- openrouter/*:free
- codex, openai, google, xai, nous

Agents using this adapter (example):
- Default worker agents for fast/cheap/local work
- Any agent with `adapter: opencode` in AGENT.md

Health: opencode TUI or `opencode run "echo hi" --model hermes-router/hermes`

Separation rule: Do not mix with fcc-claude. Each agent folder declares exactly one adapter. Provider/model chosen per AGENT.md `provider` + `model` lines. Shared opencode.json keeps model list canonical.

No secrets in this dir.
