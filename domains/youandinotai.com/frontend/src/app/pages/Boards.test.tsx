import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { Boards } from './Boards';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../lib/safety', () => ({
  isSafetyToolsAvailable: vi.fn().mockResolvedValue(true),
}));

describe('Boards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads boards from /boards and loads posts from /boards/:slug/posts', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce([
        {
          slug: 'general',
          name: 'General Lounge',
          description: 'Talk about anything.',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'post-1',
          board_slug: 'general',
          author_id: 'u-1',
          author_name: 'Josh',
          title: 'Welcome to the Lounge',
          body: 'Real humans only.',
          created_at: '2026-11-04T12:00:00Z',
        },
      ]);

    const { getByText } = render(<Boards />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/boards');
      expect(getByText('General Lounge')).toBeDefined();
    });

    fireEvent.click(getByText('General Lounge'));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/boards/general/posts');
      expect(getByText('Welcome to the Lounge')).toBeDefined();
    });
  });

  it('surfaces a clean error banner instead of throwing unhandled rejections when /boards fails', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(
      new Error('Board service unavailable')
    );

    const { getByText } = render(<Boards />);

    await waitFor(() => {
      expect(getByText('Board service unavailable')).toBeDefined();
    });
  });
});
