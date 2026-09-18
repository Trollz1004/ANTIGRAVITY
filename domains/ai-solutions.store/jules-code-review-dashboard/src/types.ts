export type ViewMode = 'store' | 'workstation' | 'catalog';

export type WorkstationMode = 'code' | 'create' | 'research' | 'chat';

export type AIProvider = 'claude' | 'gpt' | 'gemini' | 'grok' | 'perplexity' | 'ollama';

export interface ProviderOption {
  id: AIProvider;
  name: string;
  model: string;
  badge: string;
  requiresKey: boolean;
  color: string;
}

export interface PricingTier {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  price: string;
  period: string;
  badge?: string;
  description: string;
  features: string[];
  ctaText: string;
  highlighted?: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  tagline: string;
  price: string;
  period?: string;
  badge?: string;
  audience: string;
  description: string;
  features: string[];
  specs: Record<string, string>;
  category: 'workstation' | 'platform' | 'education' | 'security';
}

export interface LicenseRecord {
  key: string;
  tier: 'pro' | 'enterprise';
  customerEmail: string;
  createdAt: string;
  status: 'active' | 'revoked' | 'expired';
  platform: 'all' | 'windows' | 'macos' | 'linux';
  features: string[];
}

export interface JulesScanResult {
  status: 'pending' | 'approved' | 'failed';
  score: number;
  scanTimeMs: number;
  rulesChecked: number;
  checks: {
    id: string;
    category: 'security' | 'performance' | 'reliability' | 'leakage';
    name: string;
    passed: boolean;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    detail: string;
  }[];
  summary: string;
  verifiedBadge?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  codeSnippet?: string;
  codeLanguage?: string;
  provider?: string;
  timestamp: string;
  julesScan?: JulesScanResult;
}

export interface UserApiKeys {
  anthropic?: string;
  openai?: string;
  google?: string;
  xai?: string;
  perplexity?: string;
  ollamaUrl?: string;
}

export type PlatformContributionOption = 'pediatric' | 'pac' | 'none';

export interface UserPreferences {
  contributionAllocation?: PlatformContributionOption;
  allocationTimestamp?: string;
}
