import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CouncilPanel from './CouncilPanel';

const load = vi.fn(async () => ({
  roster: { state: 'signed' as const, bindingEnabled: true },
  seats: [
    { platform: 'gemini' as const, label: 'GEMINI', state: 'UP' as const, detail: 'official identity verified' },
    { platform: 'manus' as const, label: 'MANUS', state: 'AUTH MISSING' as const, detail: 'identity unavailable' },
  ],
  ballots: [{ id: 'B-102', subject: 'Configuration update', status: 'OPEN' as const, decisions: 1 }],
  events: [{ id: 'E-1', actor: 'official-account', platform: 'gemini' as const, timestamp: '2026-08-19T00:00:00.000Z', subject: 'Configuration update', decision: 'approve' as const, binding: true }],
}));

describe('CouncilPanel', () => {
  it('renders official seat state, active ballots, and immutable records from a mocked API loader', async () => {
    render(<CouncilPanel load={load} />);
    await waitFor(() => expect(screen.getByText('GEMINI')).toBeInTheDocument());
    expect(screen.getByText('AUTH MISSING')).toBeInTheDocument();
    expect(screen.getAllByText('Configuration update')).toHaveLength(2);
    expect(screen.getByText('APPROVE')).toBeInTheDocument();
    expect(screen.getByText('ROSTER SIGNED')).toBeInTheDocument();
  });

  it('renders no operational bridge send controls', async () => {
    render(<CouncilPanel load={load} />);
    await waitFor(() => expect(load).toHaveBeenCalled());
    expect(screen.queryByText(/send/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/message/i)).toBeNull();
  });
});
