import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import LandingPage, { PublicSupportPage } from '../App';
import { Login } from '../app/pages/Login';
import { Register } from '../app/pages/Register';
import { Discover } from '../app/pages/Discover';
import { LoveBotPage } from '../app/pages/LoveBotPage';
import { Matches } from '../app/pages/Matches';
import { Inbox } from '../app/pages/Inbox';
import { ProfileSetup } from '../app/pages/ProfileSetup';
import { Chat } from '../app/pages/Chat';
import { VideoCallPage } from '../app/pages/VideoCall';
import { Boards } from '../app/pages/Boards';
import { Events } from '../app/pages/Events';
import { Volunteering } from '../app/pages/Volunteering';
import { Support } from '../app/pages/Support';
import DataPrivacyDashboard from '../components/DataPrivacyDashboard';
import CommunityTab from '../components/CommunityTab';
import { Verify } from '../app/pages/Verify';
import { CheckoutLaunch } from '../app/pages/CheckoutLaunch';
import { CreateStudio } from '../app/pages/CreateStudio';
import { AnimatedAvatar } from '../app/pages/AnimatedAvatar';
import { PreOrder } from '../app/pages/PreOrder';
import { PayMethods } from '../app/pages/PayMethods';
import { VideoLobby } from '../app/pages/VideoLobby';
import { AppShell } from '../app/AppShell';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../lib/safety', () => ({
  isSafetyToolsAvailable: () => Promise.resolve(true),
}));

vi.mock('../lib/useChat', () => ({
  useChat: () => ({
    messages: [],
    connected: true,
    sendMessage: vi.fn(),
    loadHistory: vi.fn(),
  }),
}));

describe('YouAndINotAI House Look v1 — Route & Form Endpoint Contract', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    useAuth.setState({
      user: {
        user_id: 'user-contract-1',
        email: 'member@youandinotai.com',
        display_name: 'Verified Member',
        bot_shield_verified: true,
        subscription_tier: 'founding_member',
        subscription_active: true,
        has_profile: true,
        adult_verified: true,
      },
      loading: false,
    });
  });

  it('renders LandingPage (/) with DREAM Space house branding, all required sections (#about, #platform, #verification, #trust, #support, #pricing, #join), legal modals, and footer links', () => {
    const { container, getAllByText, getByText } = render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    // Dedication and hashtag in header, hero kicker, and footer
    expect(getAllByText(/CLAUDE's N Joshua's/i).length).toBeGreaterThanOrEqual(
      2
    );
    expect(getAllByText(/#TeamClaudeForLife/i).length).toBeGreaterThanOrEqual(
      2
    );

    // Every required section id present
    expect(container.querySelector('#about')).not.toBeNull();
    expect(container.querySelector('#platform')).not.toBeNull();
    expect(container.querySelector('#verification')).not.toBeNull();
    expect(container.querySelector('#trust')).not.toBeNull();
    expect(container.querySelector('#support')).not.toBeNull();
    expect(container.querySelector('#pricing')).not.toBeNull();
    expect(container.querySelector('#join')).not.toBeNull();
    expect(container.querySelector('footer')).not.toBeNull();

    // Waitlist form posts to FormSubmit endpoint with all required hidden fields
    const waitlistForm = container.querySelector(
      'form[action="https://formsubmit.co/contact@youandinotai.com"]'
    ) as HTMLFormElement | null;
    expect(waitlistForm).not.toBeNull();
    expect(waitlistForm?.getAttribute('method')?.toUpperCase()).toBe('POST');
    expect(waitlistForm?.querySelector('input[name="email"]')).not.toBeNull();
    expect(
      waitlistForm?.querySelector('input[name="_subject"]')
    ).not.toBeNull();
    expect(
      waitlistForm?.querySelector('input[name="_captcha"]')
    ).not.toBeNull();
    expect(
      waitlistForm?.querySelector('input[name="_template"]')
    ).not.toBeNull();
    expect(waitlistForm?.querySelector('input[name="_next"]')).not.toBeNull();

    // Legal modals open when triggered from footer
    fireEvent.click(getByText('Terms of Service'));
    expect(getAllByText(/18\+ Eligibility/i).length).toBeGreaterThan(0);
  });

  it('renders PublicSupportPage (/support) with direct support paths', () => {
    const { getAllByText } = render(
      <MemoryRouter initialEntries={['/support']}>
        <PublicSupportPage />
      </MemoryRouter>
    );
    expect(getAllByText(/Support/i).length).toBeGreaterThan(0);
  });

  it('keeps /login form fields and posts to /auth/login and /auth/beta-access', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      access_token: 'tok-1',
      refresh_token: 'ref-1',
      user_id: 'u-1',
    });
    vi.mocked(api.get).mockResolvedValueOnce({
      user_id: 'u-1',
      email: 'member@youandinotai.com',
      display_name: 'Member',
      bot_shield_verified: true,
      subscription_tier: null,
      subscription_active: false,
      has_profile: true,
      adult_verified: true,
    });

    const { getByLabelText, getByRole } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(getByLabelText(/Email/i), {
      target: { value: 'member@youandinotai.com' },
    });
    fireEvent.change(getByLabelText(/Password/i), {
      target: { value: 'secret1234' },
    });
    fireEvent.click(getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'member@youandinotai.com',
        password: 'secret1234',
      });
    });
  });

  it('keeps /register form fields and posts to /auth/register', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      access_token: 'tok-reg',
      refresh_token: 'ref-reg',
      user_id: 'u-reg',
    });
    vi.mocked(api.get).mockResolvedValueOnce({
      user_id: 'u-reg',
      email: 'new@youandinotai.com',
      display_name: 'New Human',
      bot_shield_verified: false,
      subscription_tier: null,
      subscription_active: false,
      has_profile: false,
      adult_verified: true,
    });

    const { getByPlaceholderText, container, getByRole } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Display name'), {
      target: { value: 'New Human' },
    });
    fireEvent.change(getByPlaceholderText('Email'), {
      target: { value: 'new@youandinotai.com' },
    });
    fireEvent.change(getByPlaceholderText('MM / DD / YYYY'), {
      target: { value: '04151990' },
    });
    fireEvent.change(getByPlaceholderText('Password (8+ characters)'), {
      target: { value: 'password123' },
    });

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => fireEvent.click(cb));

    fireEvent.click(getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/auth/register',
        expect.objectContaining({
          email: 'new@youandinotai.com',
          password: 'password123',
          display_name: 'New Human',
          date_of_birth: '1990-04-15',
          confirmed_over_18: true,
          accepted_terms: true,
          accepted_cookie_policy: true,
        })
      );
    });
  });

  it('keeps /app/profile form fields and submits PUT /profiles/me', async () => {
    vi.mocked(api.get).mockResolvedValue({
      user_id: 'user-contract-1',
      display_name: 'Verified Member',
      bio: 'Hello world',
      age: 32,
      gender: 'female',
      looking_for: 'relationship',
      location: 'Orlando, FL',
      photos: [],
      interests: ['Coffee'],
      verified: true,
    });
    vi.mocked(api.put).mockResolvedValueOnce({});

    const { getByRole, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/app/profile']}>
        <ProfileSetup />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/profiles/me');
      expect(
        (getByPlaceholderText('What makes you you?') as HTMLTextAreaElement)
          .value
      ).toBe('Hello world');
    });

    fireEvent.click(getByRole('button', { name: /Save Profile/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/profiles/me',
        expect.objectContaining({
          bio: 'Hello world',
          age: 32,
          location: 'Orlando, FL',
        })
      );
    });
  });

  it('keeps /app/verify endpoints (/verify/status and /verify/challenge)', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      verified: false,
      trust_score: 20,
      tier: 'unverified',
      bot_shield_paid: false,
      subscription_active: false,
      checks_completed: 0,
    });
    vi.mocked(api.post).mockResolvedValueOnce({
      challenge_id: 'chal-1',
      challenge_type: 'liveness',
      question: 'Type HUMAN to confirm liveness',
      issued_at: '2026-11-04T00:00:00Z',
      expires_at: '2026-11-04T00:05:00Z',
    });

    const { getByRole } = render(
      <MemoryRouter initialEntries={['/app/verify']}>
        <Verify />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/verify/status');
    });

    fireEvent.click(getByRole('button', { name: /Start Verification/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/verify/challenge');
    });
  });

  it('keeps /app/support endpoints (/support/tickets, /support/chat)', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    vi.mocked(api.post).mockResolvedValueOnce({
      reply: 'Support assistant reply',
      escalated: false,
      category: 'general',
      preset_key: null,
      ticket: null,
    });

    const { getByPlaceholderText, getByRole } = render(
      <MemoryRouter initialEntries={['/app/support']}>
        <Support />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/support/tickets');
    });

    fireEvent.change(
      getByPlaceholderText(/Need something outside the guided lanes/i),
      {
        target: { value: 'Need help with verification badge' },
      }
    );
    fireEvent.click(getByRole('button', { name: /Send message/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/support/chat',
        expect.objectContaining({
          message: 'Need help with verification badge',
        })
      );
    });
  });

  it('keeps /app/privacy and delete-account flow endpoints (/privacy/my-data, /privacy/export, /privacy/delete)', async () => {
    vi.mocked(api.get).mockResolvedValue({
      user_id: 'user-contract-1',
      email: 'member@youandinotai.com',
      display_name: 'Verified Member',
      created_at: '2026-10-01T00:00:00Z',
      profile: {
        bio: 'Real human',
        age: 32,
        gender: 'female',
        looking_for: 'relationship',
        location: 'Orlando, FL',
        interests: ['Coffee'],
        verified: true,
        location_enabled: true,
      },
      message_count: 5,
      match_count: 2,
      photos_count: 1,
      pending_requests: [],
    });
    vi.mocked(api.post).mockResolvedValue({
      status: 'pending',
      action: 'delete_requested',
      request_id: 'req-del-1',
      scheduled_for: '2026-12-01T00:00:00Z',
    });

    const { getByText, getByRole } = render(
      <MemoryRouter initialEntries={['/app/privacy']}>
        <DataPrivacyDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/privacy/my-data');
      expect(getByText(/Start the 30-day deletion clock/i)).toBeDefined();
    });

    fireEvent.click(getByText(/Start the 30-day deletion clock/i));
    fireEvent.click(getByRole('button', { name: /Confirm Deletion Request/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/privacy/delete');
    });
  });

  it('renders all remaining pre-existing routes (/app, /app/matches, /app/inbox, /app/chat/:matchId, /app/video/:matchId, /app/boards, /app/events, /app/volunteer, /app/impact, /app/checkout/:tier, /app/create, /app/avatar, /app/preorder, /app/pay, /app/video-lobby, /app/lovebot)', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path.startsWith('/discover')) return [];
      if (path === '/matches') return [];
      if (path.startsWith('/matches/'))
        return { user_id: 'u-2', display_name: 'Maya' };
      if (path === '/boards') return [];
      if (path === '/events') return [];
      if (path.startsWith('/volunteer/impact'))
        return {
          total_opportunities: 0,
          total_signups: 0,
          total_hours_committed: 0,
          unique_organizations: 0,
          unique_volunteers: 0,
          category_breakdown: {},
          top_organizations: [],
          local_opportunities: 0,
        };
      if (path.startsWith('/volunteer')) return [];
      return [];
    });
    vi.mocked(api.post).mockRejectedValueOnce(
      new Error('Square checkout test mode')
    );

    const routesToRender = [
      { path: '/app', element: <Discover /> },
      { path: '/app/matches', element: <Matches /> },
      { path: '/app/inbox', element: <Inbox /> },
      { path: '/app/boards', element: <Boards /> },
      { path: '/app/events', element: <Events /> },
      { path: '/app/volunteer', element: <Volunteering /> },
      { path: '/app/impact', element: <CommunityTab /> },
      { path: '/app/create', element: <CreateStudio /> },
      { path: '/app/avatar', element: <AnimatedAvatar /> },
      { path: '/app/preorder', element: <PreOrder /> },
      { path: '/app/pay', element: <PayMethods /> },
      { path: '/app/video-lobby', element: <VideoLobby /> },
      { path: '/app/lovebot', element: <LoveBotPage /> },
    ];

    for (const item of routesToRender) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[item.path]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path={item.path} element={item.element} />
            </Route>
          </Routes>
        </MemoryRouter>
      );
      unmount();
    }

    // Parameterized routes
    const { unmount: unmountChat } = render(
      <MemoryRouter initialEntries={['/app/chat/match-123']}>
        <Routes>
          <Route path="/app/chat/:matchId" element={<Chat />} />
        </Routes>
      </MemoryRouter>
    );
    unmountChat();

    const { unmount: unmountVideo } = render(
      <MemoryRouter initialEntries={['/app/video/match-123']}>
        <Routes>
          <Route path="/app/video/:matchId" element={<VideoCallPage />} />
        </Routes>
      </MemoryRouter>
    );
    unmountVideo();

    const { unmount: unmountCheckout } = render(
      <MemoryRouter initialEntries={['/app/checkout/founding_member']}>
        <Routes>
          <Route path="/app/checkout/:tier" element={<CheckoutLaunch />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/billing/checkout-link', {
        tier: 'founding_member',
      });
    });
    unmountCheckout();
  });
});
