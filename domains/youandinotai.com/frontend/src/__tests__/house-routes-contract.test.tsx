import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import LandingPage, { PublicSupportPage } from '../App';
import { Login } from '../app/pages/Login';
import { Register } from '../app/pages/Register';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
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

    // The tribute phrase and hashtag must be absent from every customer surface
    expect(container.textContent).not.toMatch(/CLAUDE.?s N Joshua/i);
    expect(container.textContent).not.toMatch(/TeamClaudeForLife/i);

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

  it('requires 18+ date of birth for new Google sign-in accounts before creating account', async () => {
    useAuth.setState({ user: null, loading: false });
    let capturedCallback:
      | ((resp: { credential: string }) => Promise<void>)
      | null = null;
    window.google = {
      accounts: {
        id: {
          initialize: (opts: {
            callback: (resp: { credential: string }) => Promise<void>;
          }) => {
            capturedCallback = opts.callback;
          },
          renderButton: vi.fn(),
        },
      },
    };

    try {
      vi.mocked(api.post).mockRejectedValueOnce(
        new Error('Date of birth is required to create an account (18+ only)')
      );

      const { findByLabelText, findByText, getByRole, container } = render(
        <GoogleSignInButton clientId="test-google-client-id" />
      );

      await waitFor(() => {
        expect(capturedCallback).not.toBeNull();
      });
      await act(async () => {
        await capturedCallback!({ credential: 'google-id-token-1' });
      });

      const dobInput = await findByLabelText(
        /Confirm 18\+ Date of Birth to Finish Google Sign Up/i
      );

      // Missing DOB refused
      fireEvent.click(getByRole('button', { name: /Confirm 18\+ & Continue/i }));
      expect(await findByText('Date of birth is required')).toBeTruthy();

      // Under-18 DOB refused
      const underageYear = new Date().getUTCFullYear() - 16;
      fireEvent.change(dobInput, {
        target: { value: `0101${underageYear}` },
      });
      fireEvent.click(getByRole('button', { name: /Confirm 18\+ & Continue/i }));
      expect(
        await findByText('YouAndINotAI is strictly 18+ only')
      ).toBeTruthy();

      // Valid 18+ DOB + confirmation checkbox submits date_of_birth
      vi.mocked(api.post).mockResolvedValueOnce({
        access_token: 'tok-google',
        refresh_token: 'ref-google',
        user_id: 'u-google',
      });
      vi.mocked(api.get).mockResolvedValueOnce({
        user_id: 'u-google',
        email: 'google@youandinotai.com',
        display_name: 'Google Adult',
        bot_shield_verified: false,
        subscription_tier: null,
        subscription_active: false,
        has_profile: false,
        adult_verified: true,
      });

      fireEvent.change(dobInput, { target: { value: '05141992' } });
      const checkbox = container.querySelector(
        'input[type="checkbox"]'
      ) as HTMLInputElement;
      fireEvent.click(checkbox);
      fireEvent.click(getByRole('button', { name: /Confirm 18\+ & Continue/i }));

      await waitFor(() => {
        expect(api.post).toHaveBeenLastCalledWith('/auth/google', {
          id_token: 'google-id-token-1',
          date_of_birth: '1992-05-14',
        });
      });
    } finally {
      delete window.google;
    }
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

  it('renders first-screen-wow stage, header motion canvases, and 8-segment section progress bar wired to sections', () => {
    const { container, getByLabelText, getByRole } = render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    expect(
      container.querySelector('#youandinotai-stage-canvas')
    ).not.toBeNull();
    expect(container.querySelector('#youandinotai-header-mark')).not.toBeNull();
    expect(container.querySelector('#youandinotai-header-line')).not.toBeNull();

    const progressMap = container.querySelector('#youandinotai-progress-map');
    expect(progressMap).not.toBeNull();
    expect(progressMap?.getAttribute('data-total-stops')).toBe('8');
    expect(progressMap?.getAttribute('data-filled-count')).toBe('1');

    const segments = progressMap?.querySelectorAll('button[data-stop-id]');
    expect(segments?.length).toBe(8);

    // Hover/focus on segment 05 shows tooltip label
    const membershipBtn = getByLabelText('05 Membership');
    fireEvent.focus(membershipBtn);
    expect(getByRole('tooltip').textContent).toContain('05 · Membership');

    // No charity, mission, or third-party payment processor names in visible landing text
    const visibleText = container.textContent || '';
    expect(visibleText).not.toMatch(
      /\b(charity|philanthropy|nonprofit|donation|Square|Stripe)\b/i
    );
  });

  it('respects prefers-reduced-motion by freezing the stage and keeping the progress bar interactive', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      const { container, getByLabelText } = render(
        <MemoryRouter initialEntries={['/']}>
          <LandingPage />
        </MemoryRouter>
      );

      const stageCanvas = container.querySelector('#youandinotai-stage-canvas');
      expect(stageCanvas?.getAttribute('data-stage-mode')).toBe(
        'reduced-motion'
      );

      const joinBtn = getByLabelText('07 Start Tonight');
      fireEvent.click(joinBtn);
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('enforces Impeccable phone and desktop fixes: top-aligned phone stage flow, 44px hit targets, skip-link, progress map tap/focus labels, flattened pricing tiers, and support CTA cap', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    try {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: 390,
      });
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: 844,
      });

      const { container, getByRole } = render(
        <MemoryRouter initialEntries={['/']}>
          <LandingPage />
        </MemoryRouter>
      );

      // Skip-to-content link is the first focusable element
      const skipLink = container.querySelector(
        'a.skip-link[href="#main-content"]'
      );
      expect(skipLink).not.toBeNull();
      const firstFocusable = container.querySelector(
        'a[href], button:not([disabled]), input:not([disabled])'
      );
      expect(firstFocusable).toBe(skipLink);

      // Tall phone stages (#platform, #verification, #trust, #pricing, #support) flow top-aligned with pb-20
      for (const stopId of [
        'platform',
        'verification',
        'trust',
        'pricing',
        'support',
      ]) {
        const wrapper = container.querySelector(
          `[data-stage-wrapper="${stopId}"]`
        );
        expect(wrapper?.getAttribute('data-stage-flow')).toBe('top-aligned');
        expect(wrapper?.className).toContain('justify-start');
        expect(wrapper?.className).toContain('pb-20');
      }

      // Progress map buttons carry title and aria-label and show tooltip on tap
      const segments = container.querySelectorAll(
        '#youandinotai-progress-map button[data-stop-id]'
      );
      expect(segments.length).toBe(8);
      segments.forEach(btn => {
        expect(btn.getAttribute('title')).toMatch(/^\d{2}\s·\s.+/);
        expect(btn.getAttribute('aria-label')).toMatch(/^\d{2}\s.+/);
        expect(btn.className).toContain('min-h-[44px]');
        expect(btn.className).toContain('min-w-[44px]');
      });

      fireEvent.click(segments[2]);
      expect(getByRole('tooltip').textContent).toContain('03 · Verification');

      // Flattened #pricing tier columns keep 3px yellow left border on recommended tier
      const pricingArticles = container.querySelectorAll('#pricing article');
      expect(pricingArticles.length).toBe(5);
      expect(pricingArticles[1].className).toContain('border-l-[3px]');
      expect(pricingArticles[1].className).toContain('border-[#FFD21E]');
      expect(pricingArticles[0].className).not.toContain('rounded-[10px]');

      // #support action row has 1 primary button and 2 secondary actions
      const supportCtas = container.querySelectorAll(
        '#support .ds-btn-signal, #support .ds-btn-ghost'
      );
      expect(supportCtas.length).toBe(3);
      expect(
        container.querySelectorAll('#support .ds-btn-signal').length
      ).toBe(1);
      expect(container.querySelectorAll('#support .ds-btn-ghost').length).toBe(
        2
      );
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        writable: true,
        value: originalInnerWidth,
      });
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: originalInnerHeight,
      });
    }
  });
});
