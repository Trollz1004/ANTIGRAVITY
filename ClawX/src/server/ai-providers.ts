import type { ChatMessage } from '../shared/ai-providers';

export interface ProviderResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
  error?: string;
}

type UserApiKeys = Record<string, string>;

export async function callProvider(
  slug: string,
  messages: ChatMessage[],
  userApiKeys: UserApiKeys,
  modelOverride?: string,
): Promise<ProviderResponse> {
  throw new Error(`Provider "${slug}" not implemented — add API key and handler`);
}
