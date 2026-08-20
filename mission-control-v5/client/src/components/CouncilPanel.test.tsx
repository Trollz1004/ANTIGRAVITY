import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CouncilPanel from './CouncilPanel';

const load = vi.fn(async () => ({
  roster: { state: 'signed' as const, bindingEnabled: false as const },
  seats: [
    {
      platform: 'gemini' as const,
      label: 'Google Gemini',
      officialClient: 'Official Gemini account-authenticated client',
      state: 'AVAILABLE' as const,
      requestedModel: 'ACCOUNT_TIER_HIGHEST_REASONING',
      actualModel: 'gemini-highest-reasoning',
      detail: 'Official client identity verified',
    },
    {
      platform: 'openai-codex' as const,
      label: 'OpenAI Codex — gpt-5.6-sol — official account authentication',
      officialClient: 'Official Codex account-authenticated client',
      state: 'BLOCKED' as const,
      requestedModel: 'gpt-5.6-sol',
      actualModel: null,
      detail: 'gpt-5.6-sol is not verified in the authenticated client',
    },
  ],
  ballots: [{ id: 'B-102', subject: 'Configuration update', status: 'OPEN' as const, decisions: 1 }],
  events: [
    {
      id: 'E-1',
      actor: 'ACCOUNT_AUTHENTICATED',
      platform: 'gemini' as const,
      officialClient: 'Official Gemini account-authenticated client',
      laneState: 'AVAILABLE' as const,
      requestedModel: 'ACCOUNT_TIER_HIGHEST_REASONING',
      actualModel: 'gemini-highest-reasoning',
      timestamp: '2026-08-19T00:00:00.000Z',
      subject: 'Configuration update',
      decision: 'approve' as const,
      evidenceSummary: 'TEST_ONLY',
      binding: false as const,
    },
  ],
}));

describe('CouncilPanel', () => {
  it('renders independent official-client state, model provenance, and advisory evidence', async () => {
    render(<CouncilPanel load={load} />);
    await waitFor(() => expect(screen.getByText('Google Gemini')).toBeInTheDocument());
    expect(screen.getByText('BLOCKED')).toBeInTheDocument();
    expect(screen.getAllByText('Configuration update')).toHaveLength(2);
    expect(screen.getByText('APPROVE')).toBeInTheDocument();
    expect(screen.getByText('ROSTER PENDING')).toBeInTheDocument();
    expect(screen.getByText(/REQUESTED · gpt-5.6-sol/i)).toBeInTheDocument();
    expect(screen.getByText(/ACTUAL · NOT VERIFIED/i)).toBeInTheDocument();
  });

  it('renders no operational bridge send controls', async () => {
    render(<CouncilPanel load={load} />);
    await waitFor(() => expect(load).toHaveBeenCalled());
    expect(screen.queryByText(/send/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/message/i)).toBeNull();
  });
});
