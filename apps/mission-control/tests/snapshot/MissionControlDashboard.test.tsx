import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MissionControlDashboard } from '../../src/components/MissionControlDashboard';

// Mock all API-dependent modules
vi.mock('../../src/lib/api', () => ({
  API_BASE: '',
  apiGet: vi.fn().mockResolvedValue({
    status: 'ok',
    checked_at: '2026-01-01T00:00:00Z',
    latency_ms: 10,
    details: { models: ['hermes'], active: 'hermes' },
    error: null,
  }),
  apiPost: vi.fn().mockResolvedValue(null),
  apiJson: vi.fn().mockResolvedValue({ data: { tasks: [], runs: [], commands: [] }, error: null }),
  fetchWithTimeout: vi.fn().mockResolvedValue({ status: 'unreachable' }),
}));

vi.mock('../../src/lib/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

describe('MissionControlDashboard', () => {
  it('renders correctly', () => {
    const { container } = render(<MissionControlDashboard />);
    expect(container).toMatchSnapshot();
  });
});
