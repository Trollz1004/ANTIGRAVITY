import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Discover } from '../app/pages/Discover';
import { AppShell } from '../app/AppShell';
import { api, ApiError } from '../lib/api';
import * as authModule from '../lib/auth';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  ApiError: class extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  },
}));

vi.mock('../lib/safety', () => ({
  isSafetyToolsAvailable: () => Promise.resolve(true),
}));

const INVENTED_NAMES = ['Maya', 'Jordan', 'Elena', 'Ari', 'demo-maya', 'demo-jordan', 'demo-elena', 'demo-ari'];

function assertNoInventedProfiles(container: HTMLElement) {
  for (const name of INVENTED_NAMES) {
    expect(container.textContent).not.toContain(name);
  }
}

describe('No invented people in date app feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a plain empty state saying "no one new is nearby yet" when the feed is empty, with zero invented profiles', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([]);

    const { container } = render(
      <MemoryRouter initialEntries={['/app']}>
        <Discover />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no one new is nearby yet/i)).toBeTruthy();
    });

    expect(container.textContent).toContain('Check back soon as more verified members join your area.');
    assertNoInventedProfiles(container);
  });

  it('renders UnverifiedGate with one button to /app/verify when the server responds with 403, with zero invented profiles', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError(403, 'Verification required'));

    const { container } = render(
      <MemoryRouter initialEntries={['/app']}>
        <Discover />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/prove you're human/i)).toBeTruthy();
    });

    expect(container.textContent).toContain('$1 Human Check');
    const verifyLink = screen.getByRole('link', { name: /Finish your \$1 human check/i });
    expect(verifyLink.getAttribute('href')).toBe('/app/verify');
    assertNoInventedProfiles(container);
  });

  it('renders empty feed on network error without falling back to any invented profiles', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed to fetch'));

    const { container } = render(
      <MemoryRouter initialEntries={['/app']}>
        <Discover />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no one new is nearby yet/i)).toBeTruthy();
    });

    assertNoInventedProfiles(container);
  });
});

describe('AppShell status label follows bot_shield_verified', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Verified" when bot_shield_verified is true and does not show unverified check link', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user-1',
        email: 'verified@example.com',
        display_name: 'Verified User',
        bot_shield_verified: true,
      } as any,
      loading: false,
      token: 'jwt-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      fetchUser: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/app']}>
        <AppShell />
      </MemoryRouter>
    );

    expect(container.textContent).toContain('Verified');
    expect(container.textContent).not.toContain('Verified Member');
    expect(screen.queryByText(/Finish your \$1 human check/i)).toBeNull();
  });

  it('shows "Finish your $1 human check" link to /app/verify when bot_shield_verified is false', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user-2',
        email: 'unverified@example.com',
        display_name: 'Unverified User',
        bot_shield_verified: false,
      } as any,
      loading: false,
      token: 'jwt-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      fetchUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppShell />
      </MemoryRouter>
    );

    const links = screen.getAllByRole('link', { name: /Finish your \$1 human check/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].getAttribute('href')).toBe('/app/verify');
    expect(screen.queryByText('Verified Member')).toBeNull();
  });
});
