import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SafetyDrawer } from './SafetyDrawer';

vi.mock('../../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

describe('SafetyDrawer', () => {
  it('renders Report and Block controls without Mute, Restrict, or Freeze buttons', () => {
    render(
      <SafetyDrawer
        open={true}
        targetUserId="user-123"
        targetName="Alex"
        source="board"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Report Concern')).toBeDefined();
    expect(
      screen.getByRole('button', { name: /File Detailed Report/i })
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: /Quick Submit/i })
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Block User/i })).toBeDefined();

    expect(screen.queryByRole('button', { name: /Mute/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Restrict/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Freeze/i })).toBeNull();
    expect(screen.queryByText(/Mute User/i)).toBeNull();
    expect(screen.queryByText(/Restrict Visibility/i)).toBeNull();
    expect(screen.queryByText(/Freeze Conversation/i)).toBeNull();
  });
});
