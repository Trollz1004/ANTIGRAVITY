/**
 * 25-API Platform Registry — public metadata only, zero secrets.
 * Source of truth: MASTER.env platform list + CORS research.
 */

export interface PlatformEntry {
  id: string;
  label: string;
  icon: string;
  color: string;
  type: 'social' | 'commerce' | 'llm' | 'dispatch' | 'infra';
  claw: string;
  api: string;
  corsSupport: 'browser' | 'backend-proxy' | 'local' | 'n/a';
  notes: string;
}

export const PLATFORMS: Record<string, PlatformEntry> = {
  // ── SOCIAL / CONTENT ──────────────────────────────────────
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    icon: '▶',
    color: '#FF0000',
    type: 'social',
    claw: 'GeminiClaw',
    api: 'YouTube Data API v3',
    corsSupport: 'browser',
    notes:
      'Browser-direct via cors_upload.js + GIS. Intermittent CORS failures on upload endpoint — build server fallback.',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    icon: '◈',
    color: '#E1306C',
    type: 'social',
    claw: 'MetaClaw',
    api: 'Meta Graph API',
    corsSupport: 'backend-proxy',
    notes: 'Two-step server-to-server container creation flow. No browser SDK for publishing. App secret required.',
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    icon: 'ƒ',
    color: '#1877F2',
    type: 'social',
    claw: 'MetaClaw',
    api: 'Meta Graph API',
    corsSupport: 'browser',
    notes:
      'FB JS SDK v22.0+ for Pages only. Personal timeline posting deprecated 2018. Long-lived token exchange needs secret server-side.',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    icon: '♪',
    color: '#69C9D0',
    type: 'social',
    claw: 'GensparkClaw',
    api: 'TikTok Content API',
    corsSupport: 'backend-proxy',
    notes:
      'Most restrictive. Server-only API. 3+ sequential API calls. Tokens expire every 24h. Unaudited = SELF_ONLY visibility.',
  },
  twitter: {
    id: 'twitter',
    label: 'X / Twitter',
    icon: '✕',
    color: '#1DA1F2',
    type: 'social',
    claw: 'ClaudeClaw',
    api: 'X API v2',
    corsSupport: 'backend-proxy',
    notes:
      'No CORS headers on any endpoint. PKCE possible but useless — fetch dies at preflight. Server proxy mandatory.',
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: 'in',
    color: '#0A66C2',
    type: 'social',
    claw: 'ClaudeClaw',
    api: 'LinkedIn Marketing API',
    corsSupport: 'backend-proxy',
    notes: 'Browser JS SDK discontinued. Explicit CORS block documented by LinkedIn. client_secret required.',
  },
  reddit: {
    id: 'reddit',
    label: 'Reddit',
    icon: '●',
    color: '#FF4500',
    type: 'social',
    claw: 'OpenClaw',
    api: 'Reddit API v1',
    corsSupport: 'backend-proxy',
    notes:
      'oauth.reddit.com sends no CORS headers. snoowrap non-functional in browsers. Implicit tokens 1h, no refresh.',
  },
  pinterest: {
    id: 'pinterest',
    label: 'Pinterest',
    icon: '📌',
    color: '#E60023',
    type: 'social',
    claw: 'GensparkClaw',
    api: 'Pinterest API v5',
    corsSupport: 'backend-proxy',
    notes: 'Old PDK retired with v3. No PKCE. All official code is server-side. Tokens 30d, refresh 1y.',
  },

  // ── COMMERCE ──────────────────────────────────────────────
  ebay: {
    id: 'ebay',
    label: 'eBay',
    icon: '🛒',
    color: '#e53238',
    type: 'commerce',
    claw: 'HEMORzoid',
    api: 'eBay Browse API',
    corsSupport: 'backend-proxy',
    notes: 'Server-side OAuth. Listing management via Trading API or Inventory API.',
  },
  square: {
    id: 'square',
    label: 'Square',
    icon: '◼',
    color: '#00B388',
    type: 'commerce',
    claw: 'HEMORzoid',
    api: 'Square Commerce API',
    corsSupport: 'backend-proxy',
    notes: 'Payment links live. Location: LY5GN09F5AN83. Account: joshlcoleman@gmail.com.',
  },
  mercari: {
    id: 'mercari',
    label: 'Mercari',
    icon: '🏷',
    color: '#FF4655',
    type: 'commerce',
    claw: 'HEMORzoid',
    api: 'Mercari API',
    corsSupport: 'backend-proxy',
    notes: 'No public API — scraper/automation based. Server-only.',
  },
  fbmkt: {
    id: 'fbmkt',
    label: 'FB Marketplace',
    icon: '🏪',
    color: '#1877F2',
    type: 'commerce',
    claw: 'MetaClaw',
    api: 'Meta Graph API',
    corsSupport: 'backend-proxy',
    notes: 'Marketplace API restricted. Uses Meta Graph API for commerce listings.',
  },

  // ── AI/LLM SOURCES ───────────────────────────────────────
  opus: {
    id: 'opus',
    label: 'Opus (Claude)',
    icon: '⚡',
    color: '#a78bfa',
    type: 'llm',
    claw: 'Orchestrator',
    api: 'Anthropic API',
    corsSupport: 'backend-proxy',
    notes: 'Primary architect. ~90% of codebase. Strategic orchestrator.',
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    icon: '✦',
    color: '#34d399',
    type: 'llm',
    claw: 'GeminiClaw',
    api: 'Google AI Studio',
    corsSupport: 'backend-proxy',
    notes: 'UI / Content / Visual intelligence. jules-cli.py direct API bypass.',
  },
  perplexity: {
    id: 'perplexity',
    label: 'Perplexity',
    icon: '◎',
    color: '#f59e0b',
    type: 'llm',
    claw: 'Comet',
    api: 'Perplexity Sonar Pro',
    corsSupport: 'backend-proxy',
    notes: 'Deep research + competitor intel. $20/mo.',
  },
  grok: {
    id: 'grok',
    label: 'Grok',
    icon: '⬡',
    color: '#00ccff',
    type: 'llm',
    claw: 'Comet',
    api: 'xAI API',
    corsSupport: 'backend-proxy',
    notes: 'Adversarial testing + X-platform integration.',
  },
  kimi: {
    id: 'kimi',
    label: 'Kimi-K2.5',
    icon: '🌙',
    color: '#ff6b9d',
    type: 'llm',
    claw: 'Ollama',
    api: 'Ollama local',
    corsSupport: 'local',
    notes: 'Local inference via Ollama. Zero cost.',
  },
  qwen: {
    id: 'qwen',
    label: 'qwen2.5',
    icon: '🐉',
    color: '#fbbf24',
    type: 'llm',
    claw: 'Ollama',
    api: 'Ollama local',
    corsSupport: 'local',
    notes: 'Default local worker. qwen2.5:7b on all three nodes.',
  },

  // ── DISPATCH / COMMS ──────────────────────────────────────
  telegram: {
    id: 'telegram',
    label: 'Telegram',
    icon: '✈',
    color: '#2CA5E0',
    type: 'dispatch',
    claw: 'ClawdBot',
    api: 'Telegram Bot API',
    corsSupport: 'backend-proxy',
    notes: '@AiSolutionsForTheKids bot. Dispatch gateway.',
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    type: 'dispatch',
    claw: 'MetaClaw',
    api: 'WhatsApp Business API',
    corsSupport: 'backend-proxy',
    notes: 'WhatsApp Business API via Meta Graph.',
  },
  discord: {
    id: 'discord',
    label: 'Discord',
    icon: '◉',
    color: '#5865F2',
    type: 'dispatch',
    claw: 'JoshuaClaw',
    api: 'Discord Bot API / Webhooks',
    corsSupport: 'backend-proxy',
    notes:
      'Primary approval inbox for Joshua Claw and Hermes review packets. Use for approval messaging, not autonomous social posting.',
  },

  // ── INFRA ─────────────────────────────────────────────────
  cloudflare: {
    id: 'cloudflare',
    label: 'Cloudflare',
    icon: '☁',
    color: '#F6821F',
    type: 'infra',
    claw: 'Wrangler',
    api: 'CF Pages + Workers',
    corsSupport: 'n/a',
    notes: 'Wrangler OAuth. joshlcoleman@gmail.com. Frontend + tunnels.',
  },
  gcp: {
    id: 'gcp',
    label: 'GCP / GCR',
    icon: '🔷',
    color: '#4285F4',
    type: 'infra',
    claw: 'Codex',
    api: 'GCP Cloud Run',
    corsSupport: 'n/a',
    notes: 'Backend deployed via Cloud Run. ai-collab4kids project.',
  },
  qdrant: {
    id: 'qdrant',
    label: 'Qdrant Memory',
    icon: '🧠',
    color: '#dc2626',
    type: 'infra',
    claw: 'Ollama',
    api: 'Qdrant REST API',
    corsSupport: 'local',
    notes: 'Vector memory for session context. Local only.',
  },
  github: {
    id: 'github',
    label: 'GitHub',
    icon: '🐙',
    color: '#94a3b8',
    type: 'infra',
    claw: 'Codex',
    api: 'GitHub API v4',
    corsSupport: 'backend-proxy',
    notes: 'Trollz1004/ANTIGRAVITY. One repo, one branch, one folder.',
  },
};

export const PLATFORM_TYPES = ['social', 'commerce', 'llm', 'dispatch', 'infra'] as const;

export function getPlatformsByType(type: string): PlatformEntry[] {
  return Object.values(PLATFORMS).filter((p) => p.type === type);
}

export function getPlatformCount(): number {
  return Object.keys(PLATFORMS).length;
}
