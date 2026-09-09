import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ControlCenter from './ControlCenter';

vi.mock('../api', () => ({
  api: {
    services: vi.fn(async () => ({ services: [] })),
    controlAlerts: vi.fn(async () => ({ alerts: [] })),
    supportCases: vi.fn(async () => ({ cases: [] })),
    officialVoteView: vi.fn(async () => ({ roster: { state: 'signed', bindingEnabled: false }, seats: [], ballots: [], events: [] })),
    knowledgeGraph: vi.fn(async () => ({ nodes: [], builtAt: null })),
  },
}));

describe('ControlCenter', () => {
  it('keeps specialist work views reachable from the unified console', () => {
    const onNavigate = vi.fn();
    render(<ControlCenter health={null} tasks={[]} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open agent library' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open swarm setup' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inspect graph' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review bridge' }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, 'library');
    expect(onNavigate).toHaveBeenNthCalledWith(2, 'swarm');
    expect(onNavigate).toHaveBeenNthCalledWith(3, 'graphy');
    expect(onNavigate).toHaveBeenNthCalledWith(4, 'bridge');
  });
});
