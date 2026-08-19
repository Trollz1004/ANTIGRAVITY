// ClawX AI Board — 6 Official Members + 1 Human Founder (Joshua)
// Ollama removed from the Board. Codex is the 6th official AI Board member.
// All models set to highest available as of March 2026.

export const AI_PROVIDER_SLUGS = ['manus', 'claude', 'gemini', 'perplexity', 'grok', 'codex'] as const;

// Ollama kept as a utility slug for local processing — NOT a board member
export const AI_UTILITY_SLUGS = ['ollama'] as const;

export type AiProviderSlug = (typeof AI_PROVIDER_SLUGS)[number];
export type AiUtilitySlug = (typeof AI_UTILITY_SLUGS)[number];
export type AiSlug = AiProviderSlug | AiUtilitySlug;

export interface ProviderConfig {
  slug: AiProviderSlug;
  name: string;
  boardTitle: string; // Official JoshuaCLAW board title
  boardPosition: number; // 1-6 on the board (Joshua is #7 tiebreaker)
  type: 'cloud' | 'builtin';
  defaultModel: string; // Highest available model
  availableModels: string[];
  icon: string;
  color: string;
  costPerInputToken: number;
  costPerOutputToken: number;
  apiKeyEnvVar: string; // Server-side env var name for this provider's key
}

export const PROVIDER_CONFIGS: Record<AiProviderSlug, ProviderConfig> = {
  manus: {
    slug: 'manus',
    name: 'Manus',
    boardTitle: 'Legacy Guardian',
    boardPosition: 1,
    type: 'builtin',
    defaultModel: 'manus-default',
    availableModels: ['manus-default'],
    icon: 'Bot',
    color: '#6366f1',
    costPerInputToken: 0,
    costPerOutputToken: 0,
    apiKeyEnvVar: 'BUILT_IN_FORGE_API_KEY',
  },
  claude: {
    slug: 'claude',
    name: 'Claude (Anthropic)',
    boardTitle: 'CTO / Architect',
    boardPosition: 2,
    type: 'cloud',
    defaultModel: 'claude-opus-4-7',
    availableModels: ['claude-opus-4-7', 'claude-sonnet-4-7', 'claude-haiku-4-5-20251001'],
    icon: 'Brain',
    color: '#d97706',
    costPerInputToken: 0.015,
    costPerOutputToken: 0.075,
    // Direct Anthropic credentials are intentionally unsupported. Claude uses
    // the authenticated OmniRoute OpenAI-compatible bridge.
    apiKeyEnvVar: 'OPENAI_COMPAT_API_KEY',
  },
  gemini: {
    slug: 'gemini',
    name: 'Gemini (Google)',
    boardTitle: 'Agentic Ops',
    boardPosition: 3,
    type: 'cloud',
    defaultModel: 'gemini-2.5-pro',
    availableModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
    icon: 'Sparkles',
    color: '#4285f4',
    costPerInputToken: 0.00125,
    costPerOutputToken: 0.005,
    apiKeyEnvVar: 'GEMINI_API_KEY',
  },
  perplexity: {
    slug: 'perplexity',
    name: 'Perplexity (Comet)',
    boardTitle: 'Lead Architect',
    boardPosition: 4,
    type: 'cloud',
    defaultModel: 'sonar-pro',
    availableModels: ['sonar-pro', 'sonar-reasoning-pro', 'sonar-deep-research'],
    icon: 'Search',
    color: '#22c55e',
    costPerInputToken: 0.003,
    costPerOutputToken: 0.015,
    apiKeyEnvVar: 'SONAR_API_KEY',
  },
  grok: {
    slug: 'grok',
    name: 'Grok (xAI)',
    boardTitle: 'Adversarial Research',
    boardPosition: 5,
    type: 'cloud',
    defaultModel: 'grok-3',
    availableModels: ['grok-3', 'grok-3-mini', 'grok-2-1212'],
    icon: 'Zap',
    color: '#ef4444',
    costPerInputToken: 0.003,
    costPerOutputToken: 0.015,
    apiKeyEnvVar: 'XAI_API_KEY',
  },
  codex: {
    slug: 'codex',
    name: 'Codex (OpenAI)',
    boardTitle: 'MCP Keyholder',
    boardPosition: 6,
    type: 'cloud',
    defaultModel: 'gpt-4.1',
    availableModels: ['gpt-4.1', 'gpt-4.1-mini', 'o4-mini', 'o3'],
    icon: 'Code2',
    color: '#10b981',
    costPerInputToken: 0.002,
    costPerOutputToken: 0.008,
    apiKeyEnvVar: 'OPENAI_API_KEY',
  },
};

// Joshua is voter #7 — the human tiebreaker. Not an AI provider.
export const JOSHUA_VOTER = {
  name: 'Joshua (Founder)',
  boardTitle: 'Human Founder / Tiebreaker',
  boardPosition: 7,
  icon: 'User',
  color: '#f59e0b',
} as const;

// Full board for JoshuaCLAW governance display
export const FULL_BOARD = [
  ...AI_PROVIDER_SLUGS.map((slug) => ({ ...PROVIDER_CONFIGS[slug], isHuman: false })),
  { ...JOSHUA_VOTER, slug: 'joshua' as const, isHuman: true },
];

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChunk {
  provider: AiSlug;
  content: string;
  done: boolean;
  inputTokens?: number;
  outputTokens?: number;
  responseTimeMs?: number;
  error?: string;
}
