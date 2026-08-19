import { createHash, randomUUID } from 'node:crypto';
import { callGeminiDirect } from './ai-providers';
import type { ChatMessage } from '../shared/ai-providers';

export type BallotDecision = 'approve' | 'reject' | 'abstain';
export type BallotStatus = 'completed' | 'unavailable' | 'invalid-response' | 'failed';

export interface ProviderBallotRequest {
  ballotId?: string;
  proposal: string;
  context?: string;
  model?: string;
}

export interface ProviderBallotAudit {
  auditVersion: 1;
  ballotId: string;
  nonProduction: true;
  provider: 'gemini';
  executionProvider: 'gemini';
  executionModel: string;
  promptVersion: 'gemini-direct-generate-content-v1';
  requestedAt: string;
  requestHash: string;
  responseHash: string | null;
  reasoningHash: string | null;
  decision: BallotDecision | null;
  status: BallotStatus;
  errorLabel?: 'provider-unavailable' | 'provider-failed' | 'invalid-ballot-response';
}

export interface ProviderBallotOptions {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  now?: () => number;
  createId?: () => string;
}

const GEMINI_BALLOT_MODEL = 'gemini-2.5-flash';
const PROMPT_VERSION = 'gemini-direct-generate-content-v1' as const;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function parseDecision(content: string): { decision: BallotDecision; reasoning: string } | null {
  try {
    const parsed = JSON.parse(content) as { decision?: unknown; reasoning?: unknown };
    if (parsed.decision !== 'approve' && parsed.decision !== 'reject' && parsed.decision !== 'abstain') return null;
    const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning.trim() : '';
    return { decision: parsed.decision, reasoning };
  } catch {
    return null;
  }
}

function ballotMessages(request: ProviderBallotRequest): ChatMessage[] {
  const proposal = request.proposal.trim();
  const context = request.context?.trim();
  return [
    {
      role: 'system',
      content:
        'You are the official Gemini bridge for an explicitly NON-PRODUCTION advisory validation ballot. ' +
        'Do not execute changes. Return JSON only with exactly two fields: decision and reasoning. ' +
        'decision must be approve, reject, or abstain. Keep reasoning under 280 characters.',
    },
    {
      role: 'user',
      content: `Proposal:\n${proposal}${context ? `\n\nContext:\n${context}` : ''}`,
    },
  ];
}

/**
 * Requests an advisory ballot from Gemini's direct official API path. This is
 * deliberately separate from callProvider: governance ballots must never route
 * through OmniRoute or silently substitute another execution provider.
 */
export async function requestProviderBallot(
  request: ProviderBallotRequest,
  options: ProviderBallotOptions = {},
): Promise<ProviderBallotAudit> {
  const env = options.env ?? process.env;
  const now = options.now ?? Date.now;
  const requestedAt = new Date(now()).toISOString();
  const ballotId = request.ballotId ?? `nonprod-gemini-${options.createId?.() ?? randomUUID()}`;
  const model = request.model ?? GEMINI_BALLOT_MODEL;
  const messages = ballotMessages(request);
  const requestHash = sha256(JSON.stringify({ ballotId, model, messages, nonProduction: true }));
  const baseAudit = {
    auditVersion: 1 as const,
    ballotId,
    nonProduction: true as const,
    provider: 'gemini' as const,
    executionProvider: 'gemini' as const,
    executionModel: model,
    promptVersion: PROMPT_VERSION,
    requestedAt,
    requestHash,
  };

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { ...baseAudit, responseHash: null, reasoningHash: null, decision: null, status: 'unavailable', errorLabel: 'provider-unavailable' };
  }

  const result = await callGeminiDirect(
    apiKey,
    model,
    messages,
    { fetchImpl: options.fetchImpl ?? fetch, now },
    { responseMimeType: 'application/json', temperature: 0 },
  );
  if (result.status !== 'ok') {
    return {
      ...baseAudit,
      executionModel: result.executionModel,
      responseHash: null,
      reasoningHash: null,
      decision: null,
      status: result.status === 'unavailable' || result.status === 'unauthorized' ? 'unavailable' : 'failed',
      errorLabel: result.status === 'unavailable' || result.status === 'unauthorized' ? 'provider-unavailable' : 'provider-failed',
    };
  }

  const responseHash = sha256(result.content);
  const parsed = parseDecision(result.content);
  if (!parsed) {
    return {
      ...baseAudit,
      executionModel: result.executionModel,
      responseHash,
      reasoningHash: null,
      decision: null,
      status: 'invalid-response',
      errorLabel: 'invalid-ballot-response',
    };
  }

  return {
    ...baseAudit,
    executionModel: result.executionModel,
    responseHash,
    reasoningHash: sha256(parsed.reasoning),
    decision: parsed.decision,
    status: 'completed',
  };
}
