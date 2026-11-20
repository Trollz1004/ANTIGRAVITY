import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AppShell } from './AppShell';
import { useAuth } from '../lib/auth';

describe('AppShell phone bottom menu', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.setState({
      user: {
        user_id: 'user-shell-1',
        email: 'member@youandinotai.com',
        display_name: 'Verified Member',
        bot_shield_verified: true,
        subscription_tier: null,
        subscription_active: false,
        has_profile: true,
        adult_verified: true,
      },
      loading: false,
    });
  });

  it('names every phone bottom menu item for the page it opens, gives Matches a heart icon, opens messages from Messages, and never labels an item Video unless it opens the video page', () => {
    const { container, getByTestId } = render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              path="/app"
              element={<div data-testid="page-out">discover-page</div>}
            />
            <Route
              path="/app/inbox"
              element={<div data-testid="page-out">messages-page</div>}
            />
            <Route
              path="/app/create"
              element={<div data-testid="page-out">create-page</div>}
            />
            <Route
              path="/app/matches"
              element={<div data-testid="page-out">matches-page</div>}
            />
            <Route
              path="/app/profile"
              element={<div data-testid="page-out">profile-page</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const mobileNav = container.querySelector(
      'nav.fixed.bottom-0'
    ) as HTMLElement | null;
    expect(mobileNav).not.toBeNull();

    const discoverLink = within(mobileNav!).getByRole('link', {
      name: 'Discover',
    });
    expect(discoverLink.getAttribute('href')).toBe('/app');

    const messagesLink = within(mobileNav!).getByRole('link', {
      name: 'Messages',
    });
    expect(messagesLink.getAttribute('href')).toBe('/app/inbox');

    const matchesLink = within(mobileNav!).getByRole('link', {
      name: 'Matches',
    });
    expect(matchesLink.getAttribute('href')).toBe('/app/matches');
    expect(matchesLink.querySelector('svg.lucide-heart')).not.toBeNull();

    const profileLink = within(mobileNav!).getByRole('link', {
      name: 'Profile',
    });
    expect(profileLink.getAttribute('href')).toBe('/app/profile');

    expect(within(mobileNav!).queryByText('Chats')).toBeNull();
    expect(within(mobileNav!).queryByText('Message')).toBeNull();
    expect(within(mobileNav!).queryByText('Settings')).toBeNull();
    expect(within(mobileNav!).queryByText('Video')).toBeNull();

    // Every link labelled "Video" in AppShell must point to a video page
    const allLinks = Array.from(container.querySelectorAll('a'));
    const videoLinks = allLinks.filter(a => a.textContent?.trim() === 'Video');
    expect(videoLinks.length).toBeGreaterThan(0);
    for (const link of videoLinks) {
      expect(link.getAttribute('href')).toBe('/app/video-lobby');
    }

    // Clicking "Messages" in the phone bottom nav opens the messages route
    fireEvent.click(messagesLink);
    expect(getByTestId('page-out').textContent).toBe('messages-page');
  });
});
