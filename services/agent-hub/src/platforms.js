// Single source of truth for the list of valid platforms.
// src/models/task.js uses this for validation; src/integrations/dispatcher.js
// uses this to validate its PLATFORM_ROUTING map covers every platform.
//
// To add a platform: add it here, then add a matching entry to
// PLATFORM_ROUTING in src/integrations/dispatcher.js.

const PLATFORMS = [
  'hermes',       // Hermes router — co-CEO, research, growth
  'claude',       // Official Claude desktop — browser sign-in
  'fcc-claude',   // FCC-Claude via proxy :8082 — co-CEO, code, compliance
  'codex',        // OpenAI Codex desktop — browser sign-in
  'opencode',     // OpenCode CLI (NVIDIA free) — code tasks
  'openai',       // OpenAI API (ChatGPT, GPT-5.5)
  'ollama',       // Local Ollama (GPU inference)
  'cloud',        // Cloud models (OpenRouter, Ollama Cloud, 1min-relay)
  'omni-router',  // OmniRouter token/API routing layer
  'grok',         // xAI Grok desktop — browser sign-in
  'gemini',       // Google Gemini desktop — browser sign-in
  'chatgpt',      // ChatGPT web/desktop — browser sign-in
  'github',       // GitHub issues/actions/webhooks
  '1minai',       // 1min.AI desktop app (Sabretooth only)
  'perplexity',   // Perplexity AI — research/search
  'cursor',       // Cursor IDE — code editing
  'clawx',        // ClawX/OpenClaw — support tickets
  'pi',           // Pi conversational AI
  'slack',        // Slack bot/automations
  'desktop',      // Generic desktop app (any GUI tool)
  'commander',    // Windows Terminal/Commander tasks
  'odysseus'      // Odysseus AI — local service :7000
];

module.exports = { PLATFORMS };
