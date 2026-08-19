import { describe, expect, it } from 'vitest';
import { callProvider, getProviderAvailability } from '../server/ai-providers';
import { AI_PROVIDER_SLUGS, PROVIDER_CONFIGS } from '../shared/ai-providers';

const messages = [{ role: 'user' as const, content: 'Check bridge handling.' }];

describe('ClawX provider bridge configuration', () => {
  it('marks a provider without a configured bridge or direct key as unavailable rather than throwing', () => {
    const availability = getProviderAvailability('gemini', {}, {});

    expect(availability).toEqual({ available: false, route: 'unavailable' });
  });

  it('rejects an unapproved model override before making a provider request', async () => {
    const fetchImpl = async () => {
      throw new Error('network call should not occur');
    };
    const result = await callProvider('gemini', messages, {}, 'not-an-approved-model', {
      env: {},
      fetchImpl,
    });

    expect(result.status).toBe('invalid-model');
    expect(result.error).toBe('Requested model is not approved for this provider.');
  });

  it('uses the authenticated OmniRoute seam and records execution provenance for operational work', async () => {
    const result = await callProvider('codex', messages, {}, undefined, {
      env: {
        OPENAI_COMPAT_BASE_URL: 'http://gateway.invalid/v1',
        OPENAI_COMPAT_API_KEY: 'test-only-placeholder',
      },
      now: (() => {
        let tick = 100;
        return () => (tick += 25);
      })(),
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            model: 'gpt-4.1',
            choices: [{ message: { content: 'Bridge response.' } }],
            usage: { prompt_tokens: 5, completion_tokens: 3 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    });

    expect(result.status).toBe('ok');
    expect(result.executionProvider).toBe('omniroute');
    expect(result.executionModel).toBe('gpt-4.1');
    expect(result.content).toBe('Bridge response.');
  });

  it('does not permit the general provider bridge to execute governance votes', async () => {
    const result = await callProvider('gemini', messages, {}, undefined, {
      env: {
        OPENAI_COMPAT_BASE_URL: 'http://gateway.invalid/v1',
        OPENAI_COMPAT_API_KEY: 'test-only-placeholder',
      },
      purpose: 'governance',
    });

    expect(result.status).toBe('unavailable');
    expect(result.executionProvider).toBe('official-governance-bridge');
    expect(result.error).toBe('Official governance votes require their designated platform bridge.');
  });
});

describe('ClawX board configuration', () => {
  it('defines six official board seats with matching model configurations', () => {
    expect(AI_PROVIDER_SLUGS).toHaveLength(6);
    AI_PROVIDER_SLUGS.forEach((slug) => {
      expect(PROVIDER_CONFIGS[slug].availableModels).toContain(PROVIDER_CONFIGS[slug].defaultModel);
    });
  });

  it('does not configure a direct Anthropic environment variable for the Claude seat', () => {
    expect(PROVIDER_CONFIGS.claude.apiKeyEnvVar).toBe('OPENAI_COMPAT_API_KEY');
  });
});
