# ClawX - Unified AI Command Center TODO

- [x] Database schema: conversations, messages, ai_providers, usage_logs tables
- [x] AI Provider integration: Claude API
- [x] AI Provider integration: Gemini API
- [x] AI Provider integration: Perplexity API
- [x] AI Provider integration: Grok API
- [x] AI Provider integration: Ollama (local)
- [x] AI Provider integration: Manus built-in LLM
- [x] tRPC routers: chat, providers, analytics
- [x] Single prompt broadcast to multiple AIs simultaneously
- [ ] Response streaming from each AI model
- [x] Dashboard layout with sidebar navigation
- [x] Chat interface with model selector (individual + broadcast mode)
- [x] Multi-panel response display for broadcast mode
- [x] Conversation history with timestamps and token tracking
- [x] API credential management via environment variables
- [x] Usage analytics dashboard: token usage, response times, costs per model
- [ ] Ollama priority mode for heavy tasks to preserve API tokens
- [x] Dark theme with clean functional design

## JoshuaCLAW Governance System
- [x] Database schema: governance_proposals and governance_votes tables
- [x] Backend: JoshuaCLAW voting logic (7 voters, 4/7 majority, odd tiebreaker)
- [x] Backend: Two-tier system (Tier 1 Critical / Tier 2 Operational)
- [x] Frontend: Red/Green light vote panel with visual vote board
- [x] Frontend: Governance page with proposal creation and vote tracking
- [x] Sidebar navigation: Add Governance page link
- [x] Tests: JoshuaCLAW voting logic tests (22 tests passing)

## YouAndINotAI Backend Critical Fixes (Pre-Launch)
- [x] Fix #3: /verify/confirm must check actual payment before marking verified
- [x] Fix #5: JWT secret must fail-fast on startup, no fallback default
- [x] Fix #1: Remove Stripe from verify.py, webhooks.py, models.py, config.py — wire Square
- [x] Fix #2: Build Square webhook handler for Bot-Shield $1 and subscriptions
- [x] Fix #4: Create tests/ directory with auth, verification, and webhook tests
- [x] Push all fixes to GitHub (commit be5eade)

## ClawX v1.1 — AI Board Upgrade & Secure API Keys
- [x] Replace Ollama with Codex (OpenAI) as 6th official AI Board member
- [x] Update all provider models to highest available: Claude Opus 4.6, Gemini 2.5 Pro, Grok-3, Perplexity Sonar Pro, Codex GPT-4.1, Manus built-in
- [x] Remove Ollama from governance voter list (keep as local utility only)
- [x] Implement secure server-side API key storage in database (encrypted, per-user)
- [x] Build Settings page: API key management UI (add/update/delete keys per provider)
- [x] API keys never exposed to frontend — all calls proxied through server
- [x] Update JoshuaCLAW governance board: replace Ollama voter with Codex voter
- [x] Update provider status cards on Home dashboard to reflect new board
- [x] Add Codex (OpenAI) API integration with GPT-4.1 model
- [x] Add sidebar nav entry for Settings page
- [x] Tests for secure key storage and Codex integration
- [x] Add user_api_keys table to database schema (encrypted, per-user, per-provider)
- [x] Build Settings/API Keys page: sign-in gated, add/update/delete keys per provider
- [x] Server-side key encryption using AES-256 before storing in DB
- [x] Auto-inject user API keys into all provider calls after login
- [x] Show provider status (Ready/No Key) based on stored keys on dashboard
