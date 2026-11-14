import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { Register } from '../app/pages/Register';
import { FounderAffiliates } from '../app/pages/FounderAffiliates';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';

vi.mock('../lib/api', async importOriginal => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('Referral attribution on sign-up and read-only founder affiliate counts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    useAuth.setState({ user: null, loading: false });
  });

  it('sends stored referral_code on email sign-up (/register) and clears stored partner id', async () => {
    localStorage.setItem('antigravity_partner_id', 'creator-email');

    vi.mocked(api.post).mockResolvedValueOnce({
      access_token: 'tok-email',
      refresh_token: 'ref-email',
      user_id: 'u-email',
    });
    vi.mocked(api.get).mockResolvedValueOnce({
      user_id: 'u-email',
      email: 'referred@youandinotai.com',
      display_name: 'Referred Human',
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
      target: { value: 'Referred Human' },
    });
    fireEvent.change(getByPlaceholderText('Email'), {
      target: { value: 'referred@youandinotai.com' },
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
          email: 'referred@youandinotai.com',
          referral_code: 'creator-email',
        })
      );
    });

    expect(localStorage.getItem('antigravity_partner_id')).toBeNull();
  });

  it('sends stored referral_code on Google sign-up (/auth/google) across 18+ DOB confirmation and clears it after account creation', async () => {
    localStorage.setItem('antigravity_partner_id', 'creator-google');

    let capturedCallback:
      ((resp: { credential: string }) => Promise<void>) | null = null;
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
      // First attempt for a new user requires 18+ date of birth
      vi.mocked(api.post).mockRejectedValueOnce(
        new Error('Date of birth is required to create an account (18+ only)')
      );

      const { findByLabelText, getByRole, container } = render(
        <GoogleSignInButton clientId="test-google-client-id" />
      );

      await waitFor(() => {
        expect(capturedCallback).not.toBeNull();
      });

      await act(async () => {
        await capturedCallback!({ credential: 'google-token-ref' });
      });

      // Referral code must still be preserved in localStorage until account creation succeeds
      expect(localStorage.getItem('antigravity_partner_id')).toBe(
        'creator-google'
      );

      const dobInput = await findByLabelText(
        /Confirm 18\+ Date of Birth to Finish Google Sign Up/i
      );

      vi.mocked(api.post).mockResolvedValueOnce({
        access_token: 'tok-google-ref',
        refresh_token: 'ref-google-ref',
        user_id: 'u-google-ref',
      });
      vi.mocked(api.get).mockResolvedValueOnce({
        user_id: 'u-google-ref',
        email: 'googleref@youandinotai.com',
        display_name: 'Google Referred',
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
      fireEvent.click(
        getByRole('button', { name: /Confirm 18\+ & Continue/i })
      );

      await waitFor(() => {
        expect(api.post).toHaveBeenLastCalledWith('/auth/google', {
          id_token: 'google-token-ref',
          date_of_birth: '1992-05-14',
          referral_code: 'creator-google',
        });
      });

      expect(localStorage.getItem('antigravity_partner_id')).toBeNull();
    } finally {
      delete window.google;
    }
  });

  it('renders the plain founder table with seeded rows and no charts', async () => {
    useAuth.setState({
      user: {
        user_id: 'founder-1',
        email: 'founder@youandinotai.com',
        display_name: 'Josh Founder',
        bot_shield_verified: true,
        subscription_tier: 'founding_member',
        subscription_active: true,
        has_profile: true,
        adult_verified: true,
        member_badge: 'Founder',
      },
      loading: false,
    });

    vi.mocked(api.get).mockResolvedValueOnce({
      generated_at: '2026-11-14T12:00:00Z',
      items: [
        {
          referral_code: 'creator-alpha',
          signups_count: 3,
          verified_count: 2,
          payments_count: 3,
          gross_cents: 1700,
          owed_cents: 850,
        },
        {
          referral_code: 'creator-beta',
          signups_count: 1,
          verified_count: 0,
          payments_count: 0,
          gross_cents: 0,
          owed_cents: 0,
        },
      ],
      totals: {
        codes_count: 2,
        signups_count: 4,
        verified_count: 2,
        payments_count: 3,
        gross_cents: 1700,
        owed_cents: 850,
      },
    });

    const { container, findByText, getByRole } = render(
      <MemoryRouter initialEntries={['/app/admin/affiliates']}>
        <FounderAffiliates />
      </MemoryRouter>
    );

    expect(await findByText('creator-alpha')).toBeTruthy();
    expect(await findByText('creator-beta')).toBeTruthy();

    const table = getByRole('table');
    expect(table.textContent).toContain('$17.00');
    expect(table.textContent).toContain('$8.50');
    expect(container.textContent).toMatch(
      /counts only, nothing is paid from here/i
    );
    expect(container.textContent).toMatch(
      /Refunds are not recorded on these rows/i
    );

    // Calm, dark, large text, no charts
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('shows zeros for a code with no activity and never invents numbers', async () => {
    useAuth.setState({
      user: {
        user_id: 'founder-1',
        email: 'founder@youandinotai.com',
        display_name: 'Josh Founder',
        bot_shield_verified: true,
        subscription_tier: 'founding_member',
        subscription_active: true,
        has_profile: true,
        adult_verified: true,
        member_badge: 'Founder',
      },
      loading: false,
    });

    vi.mocked(api.get).mockResolvedValueOnce({
      generated_at: '2026-11-14T12:00:00Z',
      items: [],
      totals: {
        codes_count: 0,
        signups_count: 0,
        verified_count: 0,
        payments_count: 0,
        gross_cents: 0,
        owed_cents: 0,
      },
    });

    const { getByLabelText, getByRole, findByText } = render(
      <MemoryRouter initialEntries={['/app/admin/affiliates']}>
        <FounderAffiliates />
      </MemoryRouter>
    );

    const table = await waitFor(() => getByRole('table'));
    expect(table.textContent).toContain('$0.00');

    // Look up a specific code that has no activity yet
    vi.mocked(api.get).mockResolvedValueOnce({
      generated_at: '2026-11-14T12:01:00Z',
      items: [
        {
          referral_code: 'quiet-code',
          signups_count: 0,
          verified_count: 0,
          payments_count: 0,
          gross_cents: 0,
          owed_cents: 0,
        },
      ],
      totals: {
        codes_count: 1,
        signups_count: 0,
        verified_count: 0,
        payments_count: 0,
        gross_cents: 0,
        owed_cents: 0,
      },
    });

    fireEvent.change(getByLabelText(/Check referral code/i), {
      target: { value: 'quiet-code' },
    });
    fireEvent.click(getByRole('button', { name: /Check Code/i }));

    expect(await findByText('quiet-code')).toBeTruthy();
    expect(api.get).toHaveBeenLastCalledWith(
      '/metrics/affiliates?code=quiet-code'
    );
    expect(table.textContent).toContain('$0.00');
  });

  it('refuses a non-founder on the page when the endpoint returns 403', async () => {
    useAuth.setState({
      user: {
        user_id: 'member-1',
        email: 'member@youandinotai.com',
        display_name: 'Member',
        bot_shield_verified: true,
        subscription_tier: null,
        subscription_active: false,
        has_profile: true,
        adult_verified: true,
        member_badge: null,
      },
      loading: false,
    });

    vi.mocked(api.get).mockRejectedValueOnce(
      new ApiError(403, 'Founder or admin access required')
    );

    const { findByRole } = render(
      <MemoryRouter initialEntries={['/app/admin/affiliates']}>
        <FounderAffiliates />
      </MemoryRouter>
    );

    const alert = await findByRole('alert');
    expect(alert.textContent).toMatch(/Founder or admin access/i);
  });
});
