# Hermes Agent — Working Config Snapshot (2026-05-12)

**Source:** Live production config from 9020 node, Hermes Agent dashboard verified running at `http://127.0.0.1:9119`.
**Captured by:** Opus on T5500 from Josh's paste.
**Purpose:** Survive 9020 wipe; serve as the template config when hermes-agent is installed on T5500.

## Key operational facts

| Setting | Value | Why it matters |
|---|---|---|
| Default model | `inclusionai/ring-2.6-1t:free` (OpenRouter) | 1-trillion-param free-tier model. Zero LLM cost on routine work. Aligns with "save membership records" doctrine. |
| Fallback chain | openrouter → nous → zai | All free-or-cheap; no surprise spend. |
| Cheap-model (smart routing) | Same `ring-2.6-1t:free` | Even routine-tier work hits the free 1T model. |
| Auxiliary providers | All `auto` (vision/web/compression/session_search/skills_hub/approval/mcp/title_gen/triage/curator) | Hermes picks the right backend per task; no manual config needed. |
| Memory | enabled, 2200 char per memory + 1375 char user profile, curator on weekly | Hermes maintains its own memory layer separate from Claude's. |
| Delegation | orchestrator_enabled, max 3 concurrent children, max spawn depth 1, 50 max iterations | Hermes IS itself an orchestrator. Can be delegated to. |
| Max turns / timeout | 150 turns / 1800s gateway | Long autonomous sessions supported. |
| Approvals | mode `manual`, mcp_reload_confirm `true`, destructive_slash_confirm `true` | Safe-by-default for sensitive ops. |
| Plugins enabled | `Antigravity`, `disk-cleanup`, `google_meet`, `spotify`, `teams_pipeline` | There's an "Antigravity" plugin specifically — worth investigating what it does. |
| Toolsets (CLI) | 22 toolsets including browser, code_execution, computer_use, delegation, terminal, vision, web | Hermes is feature-complete as a standalone agent; not just LLM routing. |
| Bindings | Slack / Discord / WhatsApp (allowlisted to +13529735909) / Telegram / Mattermost / Matrix | Multi-platform messaging surface live. |
| TTS / STT | TTS multi-provider (edge default, elevenlabs/openai/xai/mistral/piper available); STT local Whisper base | Voice in/out wired. |
| Theme / TUI | midnight theme, kaomoji status indicator, compact, show_reasoning, streaming on | Display tuned. |
| Code execution | project mode | Hermes can run code in repo scope. |
| Curator | weekly interval, stale@30d / archive@90d, backup keeps 5 | Auto-housekeeping. |
| Working dir | `c:\Antigravity` | Same repo Claude operates in. |

## Hermes ↔ Claude coordination notes

- **Hermes-agent and Claude (Opus) are PEERS via the toolbox doctrine.** Per `user_claude_is_ceo.md`, Hermes-agent is "a tool. Cheap LLM-routing to local Ollama when reasoning load is low." This config confirms it — Hermes defaults to OpenRouter's free 1T model, not Anthropic API. Claude (Opus) stays the orchestrator; Hermes is the cheap execution layer.
- **Delegation interop**: Hermes has `delegation.orchestrator_enabled: true` and `max_spawn_depth: 1`. This means Hermes can spawn children but only one level deep — it can't nest infinitely. Safe for cross-AI delegation patterns.
- **Memory layer separation**: Hermes maintains its own memory (2200 char per entry + 1375 user profile). Claude's memory lives in `C:\Users\joshl\.claude\projects\C--Users-joshl--hermes\memory\`. These are *separate*. If we want cross-AI memory sharing, that's a bridge to build later — for now, Hermes operates with its own context.
- **The `Antigravity` plugin** in the enabled list is a Hermes plugin specific to this project. Worth a future audit pass to know what tools/skills it adds.

## Full config (preserved verbatim)

```yaml
model:
  default: inclusionai/ring-2.6-1t:free
  provider: openrouter
  base_url: https://openrouter.ai/api/v1
providers: {}
fallback_providers:
- openrouter
- nous
- zai
credential_pool_strategies:
  openrouter: round_robin
toolsets:
- hermes-cli
agent:
  max_turns: 150
  gateway_timeout: 1800
  restart_drain_timeout: 180
  api_max_retries: 3
  service_tier: ''
  tool_use_enforcement: auto
  gateway_timeout_warning: 900
  gateway_notify_interval: 180
  gateway_auto_continue_freshness: 3600
  image_input_mode: auto
  disabled_toolsets: []
terminal:
  backend: local
  modal_mode: auto
  cwd: c:\Antigravity
  timeout: 180
  env_passthrough: []
  shell_init_files: []
  auto_source_bashrc: true
  docker_image: ''
  docker_forward_env: []
  docker_env: {}
  singularity_image: ''
  modal_image: ''
  daytona_image: ''
  vercel_runtime: node24
  container_cpu: 3
  container_memory: 5120
  container_disk: 51200
  container_persistent: true
  docker_volumes: []
  docker_mount_cwd_to_workspace: true
  docker_run_as_host_user: true
  persistent_shell: true
web:
  backend: ''
  search_backend: ''
  extract_backend: ''
browser:
  inactivity_timeout: 120
  command_timeout: 30
  record_sessions: false
  allow_private_urls: false
  engine: auto
  auto_local_for_private_urls: true
  cdp_url: ''
  dialog_policy: must_respond
  dialog_timeout_s: 300
  camofox:
    managed_persistence: false
checkpoints:
  enabled: false
  max_snapshots: 20
  max_total_size_mb: 500
  max_file_size_mb: 10
  auto_prune: true
  retention_days: 7
  delete_orphans: true
  min_interval_hours: 24
file_read_max_chars: 100000
tool_output:
  max_bytes: 50000
  max_lines: 2000
  max_line_length: 2000
tool_loop_guardrails:
  warnings_enabled: true
  hard_stop_enabled: false
  warn_after:
    exact_failure: 2
    same_tool_failure: 3
    idempotent_no_progress: 2
  hard_stop_after:
    exact_failure: 5
    same_tool_failure: 8
    idempotent_no_progress: 5
compression:
  enabled: true
  threshold: 0.9
  target_ratio: 0.2
  protect_last_n: 20
  hygiene_hard_message_limit: 400
prompt_caching:
  cache_ttl: 5m
openrouter:
  response_cache: true
  response_cache_ttl: 300
  min_coding_score: 0.65
bedrock:
  region: ''
  discovery:
    enabled: true
    provider_filter: []
    refresh_interval: 3600
  guardrail:
    guardrail_identifier: ''
    guardrail_version: ''
    stream_processing_mode: async
    trace: disabled
auxiliary:
  vision: { provider: auto, model: '', base_url: '', api_key: '', timeout: 120, extra_body: {}, download_timeout: 30 }
  web_extract: { provider: auto, model: '', base_url: '', api_key: '', timeout: 360, extra_body: {} }
  compression: { provider: auto, model: '', base_url: '', api_key: '', timeout: 120, extra_body: {} }
  session_search: { provider: auto, model: '', base_url: '', api_key: '', timeout: 30, extra_body: {}, max_concurrency: 3 }
  skills_hub: { provider: auto, model: '', base_url: '', api_key: '', timeout: 30, extra_body: {} }
  approval: { provider: auto, model: '', base_url: '', api_key: '', timeout: 30, extra_body: {} }
  mcp: { provider: auto, model: '', base_url: '', api_key: '', timeout: 30, extra_body: {} }
  title_generation: { provider: auto, model: '', base_url: '', api_key: '', timeout: 30, extra_body: {} }
  triage_specifier: { provider: auto, model: '', base_url: '', api_key: '', timeout: 120, extra_body: {} }
  curator: { provider: auto, model: '', base_url: '', api_key: '', timeout: 600, extra_body: {} }
display:
  compact: true
  personality: concise
  resume_display: full
  busy_input_mode: interrupt
  tui_auto_resume_recent: false
  bell_on_complete: false
  show_reasoning: true
  streaming: true
  final_response_markdown: strip
  persistent_output: true
  persistent_output_max_lines: 200
  inline_diffs: true
  show_cost: true
  skin: default
  language: en
  tui_status_indicator: kaomoji
  user_message_preview: { first_lines: 2, last_lines: 2 }
  interim_assistant_messages: true
  tool_progress_command: false
  tool_progress_overrides: {}
  tool_preview_length: 0
  ephemeral_system_ttl: 0
  platforms: {}
  runtime_footer:
    enabled: false
    fields: [model, context_pct, cwd]
  copy_shortcut: auto
  tool_progress: all
dashboard:
  theme: midnight
privacy:
  redact_pii: false
tts:
  provider: edge
  edge: { voice: en-US-AriaNeural }
  elevenlabs: { voice_id: pNInz6obpgDQGcFmaJgB, model_id: eleven_multilingual_v2 }
  openai: { model: gpt-4o-mini-tts, voice: alloy }
  xai: { voice_id: eve, language: en, sample_rate: 24000, bit_rate: 128000 }
  mistral: { model: voxtral-mini-tts-2603, voice_id: c69964a6-ab8b-4f8a-9465-ec0925096ec8 }
  neutts: { ref_audio: '', ref_text: '', model: neuphonic/neutts-air-q4-gguf, device: cpu }
  piper: { voice: en_US-lessac-medium }
stt:
  enabled: true
  provider: local
  local: { model: base, language: '' }
  openai: { model: whisper-1 }
  mistral: { model: voxtral-mini-latest }
voice:
  record_key: ctrl+b
  max_recording_seconds: 120
  auto_tts: false
  beep_enabled: true
  silence_threshold: 200
  silence_duration: 3
human_delay:
  mode: false
  min_ms: 800
  max_ms: 2500
context:
  engine: compressor
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200
  user_char_limit: 1375
  provider: ''
delegation:
  model: ''
  provider: ''
  base_url: ''
  api_key: ''
  inherit_mcp_toolsets: true
  max_iterations: 50
  child_timeout_seconds: 600
  reasoning_effort: ''
  max_concurrent_children: 3
  max_spawn_depth: 1
  orchestrator_enabled: true
  subagent_auto_approve: false
prefill_messages_file: ''
goals:
  max_turns: 20
skills:
  external_dirs: []
  template_vars: true
  inline_shell: false
  inline_shell_timeout: 10
  guard_agent_created: false
curator:
  enabled: true
  interval_hours: 168
  min_idle_hours: 2
  stale_after_days: 30
  archive_after_days: 90
  backup: { enabled: true, keep: 5 }
honcho: {}
timezone: ''
slack:
  require_mention: true
  free_response_channels: ''
  allowed_channels: ''
  channel_prompts: {}
discord:
  require_mention: true
  free_response_channels: ''
  allowed_channels: ''
  auto_thread: true
  reactions: true
  channel_prompts: {}
  dm_role_auth_guild: ''
  server_actions: ''
whatsapp:
  dm_policy: allowlist
  allow_from:
  - '+13529735909'
  group_policy: deny
  require_mention: false
telegram:
  reactions: false
  channel_prompts: {}
  allowed_chats: ''
mattermost:
  require_mention: true
  free_response_channels: ''
  allowed_channels: ''
  channel_prompts: {}
matrix:
  require_mention: true
  free_response_rooms: ''
  allowed_rooms: ''
approvals:
  mode: manual
  timeout: 60
  cron_mode: deny
  mcp_reload_confirm: true
  destructive_slash_confirm: true
command_allowlist: []
quick_commands: {}
hooks: {}
hooks_auto_accept: false
personalities: {}
security:
  allow_private_urls: false
  redact_secrets: true
  tirith_enabled: true
  tirith_path: tirith
  tirith_timeout: 5
  tirith_fail_open: true
  website_blocklist: { enabled: false, domains: [], shared_files: [] }
cron:
  wrap_response: true
  max_parallel_jobs: null
kanban:
  dispatch_in_gateway: true
  dispatch_interval_seconds: 60
  failure_limit: 2
code_execution:
  mode: project
logging:
  level: INFO
  max_size_mb: 5
  backup_count: 3
model_catalog:
  enabled: true
  url: https://hermes-agent.nousresearch.com/docs/api/model-catalog.json
  ttl_hours: 24
  providers: {}
network:
  force_ipv4: false
sessions:
  auto_prune: false
  retention_days: 90
  vacuum_after_prune: true
  min_interval_hours: 24
onboarding:
  seen:
    openclaw_residue_cleanup: true
    tool_progress_prompt: true
    busy_input_prompt: true
updates:
  pre_update_backup: false
  backup_keep: 5
_config_version: 23
models:
- { name: inclusionai/ring-2.6-1t:free, provider: openrouter, max_tokens: 4096, temperature: 0.7, top_p: 0.95, frequency_penalty: 0, presence_penalty: 0 }
- { name: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free, provider: openrouter, max_tokens: 4096, temperature: 0.7, top_p: 0.95, frequency_penalty: 0, presence_penalty: 0 }
- { name: openai/gpt-4o-mini, provider: openrouter, max_tokens: 4096, temperature: 0.7, top_p: 0.95, frequency_penalty: 0, presence_penalty: 0 }
default_model: inclusionai/ring-2.6-1t:free
model_preferences:
- { model: inclusionai/ring-2.6-1t:free, provider: openrouter }
- { model: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free, provider: openrouter }
- { model: openai/gpt-4o-mini, provider: openrouter }
session_reset:
  mode: none
platform_toolsets:
  cli: [browser, clarify, code_execution, computer_use, cronjob, delegation, file, homeassistant, image_gen, memory, messaging, moa, rl, session_search, skills, spotify, terminal, todo, tts, vision, web]
  api_server: [browser, clarify, cronjob, delegation, file, homeassistant, image_gen, memory, messaging, moa, rl, session_search, skills, terminal, todo, tts, vision, web, spotify]
  telegram: [browser, clarify, code_execution, computer_use, cronjob, delegation, file, homeassistant, image_gen, memory, messaging, moa, rl, session_search, skills, spotify, terminal, todo, tts, vision, web]
  whatsapp: [browser, clarify, code_execution, computer_use, cronjob, delegation, file, homeassistant, image_gen, memory, messaging, moa, rl, session_search, skills, spotify, terminal, todo, tts, vision, web]
smart_model_routing:
  cheap_model: inclusionai/ring-2.6-1t:free
plugins:
  enabled: [Antigravity, disk-cleanup, google_meet, spotify, teams_pipeline]
  disabled: []
model_context_length: 0
known_plugin_toolsets:
  cli: [spotify]
  telegram: [spotify]
  whatsapp: [spotify]

fallback_model:
  provider: openrouter
  model: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
```

## Post-wipe restoration on T5500

When T5500 becomes the sole node, install hermes-agent and apply this config:

1. Install hermes-agent on T5500 (likely via `pip install hermes-agent` or the upstream installer — check `https://hermes-workspace.com/install.sh`)
2. Locate the hermes-agent config dir on T5500 (likely `C:\Users\joshl\AppData\Local\hermes\hermes-agent\` per the 9020 path)
3. Copy this YAML to the equivalent config location
4. Adjust `terminal.cwd` to `c:\Antigravity` (same — both nodes use that path)
5. Run `hermes auth login` to wire OAuth (nous, openai-codex, etc.)
6. Set OpenRouter API key in `OPENROUTER_API_KEY` env var (from vault)
7. Verify with `hermes dashboard` — should bind to `:9119`
8. If T5500 has anything already on `:9119`, override via `--port` flag or `HERMES_DASHBOARD_PORT` env

The Antigravity plugin, kanban, memory, delegation orchestrator, and all 22 toolsets should activate identically.
