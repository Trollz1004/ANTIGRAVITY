import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileSetup } from './ProfileSetup';
import { api } from '../../lib/api';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'qa@youandinotai.com',
      display_name: 'QA Tester',
      bot_shield_verified: true,
    },
    fetchUser: vi.fn(),
  }),
}));

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('ProfileSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches /profiles/me on mount and pre-populates saved fields', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      user_id: 'user-1',
      display_name: 'QA Tester',
      bio: 'Coffee enthusiast and builder.\n\nPrompt: Bookstore coffee first.\n\nDate comfort: Public coffee or daytime walk first\n\nSafety preference: Keep first meetings public',
      age: 34,
      gender: 'Male',
      looking_for: 'Relationship',
      location: 'Orlando, FL',
      photos: [],
      interests: ['Coffee', 'Hiking'],
      verified: true,
    });

    const { getByPlaceholderText, getByDisplayValue } = render(
      <MemoryRouter>
        <ProfileSetup />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/profiles/me');
      expect(
        (getByPlaceholderText('What makes you you?') as HTMLTextAreaElement)
          .value
      ).toBe('Coffee enthusiast and builder.');
    });

    expect(getByDisplayValue('Bookstore coffee first.')).toBeDefined();
    expect(getByDisplayValue('34')).toBeDefined();
    expect(getByDisplayValue('Orlando, FL')).toBeDefined();
  });
});
