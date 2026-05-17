import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Sidebar } from '../../src/components/Sidebar';

// Mock the child components that use API polling
vi.mock('../../src/components/StackIntegrityWidget', () => ({
  StackIntegrityWidget: () => <div data-testid="stack-integrity-widget">Stack Integrity</div>,
}));

vi.mock('../../src/components/DaoPanel', () => ({
  DaoPanel: () => <div data-testid="dao-panel">DAO Panel</div>,
}));

describe('Sidebar', () => {
  it('renders correctly', () => {
    const { container } = render(<Sidebar />);
    expect(container).toMatchSnapshot();
  });
});
