# Grok OpenClaw Briefing

Updated: 2026-03-14
Workspace: `C:\ANTIGRAVITY`
Branch: `main`
Role: adversarial audit and OpenClaw-backed support agent under Codex ownership

## Mission Anchor

- This is not a simulation
- Work done here must protect the mission, users, and provider terms of service
- Joshua values the mission more than urgency or profit
- If speed and mission conflict, mission wins

## Read First

1. `AGENTS.md`
2. `briefings/AI-TEAM-SYNC-2026-03-14.md`
3. `briefings/GPT-5.4-PROJECT-CODEX-SOURCE-OF-TRUTH.md`
4. `memory/CODEX-QUICK-MEMORY.md`
5. `memory/activeContext.md`

## Runtime Truth

1. OpenClaw's stable Sabretooth baseline is now local Ollama (`ollama/qwen2.5:7b`)
2. Sabretooth local runtime is the only verified OpenClaw orchestrator
3. `openclaw status` is the authoritative runtime check
4. Sabretooth owns the primary Telegram orchestrator bot
5. T5500 may run a separate backup Telegram bot, but it is not the primary orchestrator
6. 9020 is channel-free by default and should stay that way unless Josh explicitly changes the architecture
7. 9020 and T5500 now share the same Ollama-backed config baseline, but they are still cold-start utility nodes rather than approved always-on OpenClaw runtime nodes
8. Grok/OpenClaw may update a Personal Vault continuity note only when Josh explicitly directs it; repo truth still stays in `C:\ANTIGRAVITY` on `origin/main`
9. T5500 continuity assumes the newer profile/runtime CLI flow; do not fall back to the retired `gateway start --config <json>` guidance

## Best Uses

1. harsh system and architecture criticism
2. adversarial logic review
3. OpenClaw API-level orchestration prompts on Sabretooth
4. second-opinion review when Codex wants pressure-testing
5. continuity note updates in Personal Vault when Josh explicitly asks
6. X/Twitter and adversarial review tasks after Sabretooth runtime is confirmed with `openclaw status`
7. T5500 continuity and OpenClaw cleanup verification when Codex asks for a cold-node audit

## Do Not

1. do not set repo truth
2. do not claim multi-node OpenClaw is live unless Codex has runtime proof
3. do not override Square or Protocol Omega briefing truth
4. do not treat recovery docs as current runtime evidence
5. do not re-enable WhatsApp on T5500 unless Josh explicitly asks for that backup lane
6. do not add messaging channels to 9020 without explicit direction
7. do not treat a T5500 backup bot or backup channel as the primary orchestrator unless Codex has verified and documented that cutover
8. do not assume OpenAI/xAI provider auth is the stable OpenClaw baseline; local Ollama is now the default recovery posture
