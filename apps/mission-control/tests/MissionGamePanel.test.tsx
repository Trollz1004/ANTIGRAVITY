import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MissionGamePanel } from '../src/components/MissionGamePanel';

describe('MissionGamePanel', () => {
  it('lets a player complete a tactical action and see local-only progression feedback', () => {
    render(<MissionGamePanel />);

    expect(screen.getByRole('heading', { name: /mission game/i })).toBeInTheDocument();
    expect(screen.getByText(/XP 120/i)).toBeInTheDocument();
    expect(screen.getByText(/streak 0/i)).toBeInTheDocument();
    expect(screen.getByText(/ops ledger is private and local-only/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /complete signal sweep/i }));

    expect(screen.getByText(/XP 165/i)).toBeInTheDocument();
    expect(screen.getByText(/streak 1/i)).toBeInTheDocument();
    expect(screen.getByText(/rank: field operator/i)).toBeInTheDocument();
    expect(screen.getByText(/Signal Sweep completed/i)).toBeInTheDocument();
  });
});
