import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AppShell } from '../AppShell';
import { Verify } from './Verify';
import { ApiError, api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

vi.mock('../../lib/api', async () => {
  const actual =
    await vi.importActual<typeof import('../../lib/api')>('../../lib/api');
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

describe('Verify after $1 payment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('access_token', 'tok-paid-member');
    window.history.replaceState({}, '', '/app/verify');
    useAuth.setState({
      user: {
        user_id: 'user-verify-1',
        email: 'paid@youandinotai.com',
        display_name: 'Paid Member',
        bot_shield_verified: false,
        subscription_tier: null,
        subscription_active: false,
        has_profile: true,
        adult_verified: true,
      },
      loading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches the signed-in user again through the auth store when POST /verify/confirm succeeds so AppShell shows Verified without a reload', async () => {
    window.history.replaceState({}, '', '/app/verify?status=success');
    const fetchUserSpy = vi.spyOn(useAuth.getState(), 'fetchUser');

    let confirmCompleted = false;
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/verify/status') {
        return confirmCompleted
          ? {
              verified: true,
              trust_score: 60,
              tier: 'gold',
              bot_shield_paid: true,
              subscription_active: false,
              checks_completed: 2,
            }
          : {
              verified: false,
              trust_score: 60,
              tier: 'unverified',
              bot_shield_paid: false,
              subscription_active: false,
              checks_completed: 1,
            };
      }
      if (path === '/auth/me') {
        return {
          user_id: 'user-verify-1',
          email: 'paid@youandinotai.com',
          display_name: 'Paid Member',
          bot_shield_verified: true,
          subscription_tier: null,
          subscription_active: false,
          has_profile: true,
          adult_verified: true,
        };
      }
      throw new Error(`Unexpected GET ${path}`);
    });

    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/verify/confirm') {
        confirmCompleted = true;
        return {
          verified: true,
          trust_score: 60,
          tier: 'gold',
        };
      }
      throw new Error(`Unexpected POST ${path}`);
    });

    const { getAllByText, queryByText } = render(
      <MemoryRouter initialEntries={['/app/verify?status=success']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/app/verify" element={<Verify />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/verify/confirm');
      expect(fetchUserSpy).toHaveBeenCalled();
      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(useAuth.getState().user?.bot_shield_verified).toBe(true);
    });

    expect(getAllByText('Verified').length).toBeGreaterThanOrEqual(2);
    expect(queryByText('Finish your $1 human check')).toBeNull();
    expect(queryByText(/Start Verification/i)).toBeNull();
  });

  it('shows the waiting line and the check badge button without Start Verification when arriving with ?status=success while /verify/confirm answers 402', async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, '', '/app/verify?status=success');

    vi.mocked(api.get).mockResolvedValue({
      verified: false,
      trust_score: 60,
      tier: 'unverified',
      bot_shield_paid: false,
      subscription_active: false,
      checks_completed: 1,
    });
    vi.mocked(api.post).mockRejectedValue(
      new ApiError(
        402,
        'Payment required. Complete the $1 Bot-Shield payment before verification.'
      )
    );

    const { getByText, getByRole, queryByText, queryByRole } = render(
      <MemoryRouter initialEntries={['/app/verify?status=success']}>
        <Verify />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/verify/confirm');
    expect(
      getByText('We are waiting for Square to confirm your payment.')
    ).toBeDefined();
    expect(
      getByRole('button', { name: 'I paid, check my badge' })
    ).toBeDefined();
    expect(queryByRole('button', { name: /Start Verification/i })).toBeNull();
    expect(queryByText(/Start Verification/i)).toBeNull();
  });

  it('asks /verify/confirm again every 3 seconds for up to 60 seconds, then leaves the waiting line and button in place', async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, '', '/app/verify?status=success');

    vi.mocked(api.get).mockResolvedValue({
      verified: false,
      trust_score: 60,
      tier: 'unverified',
      bot_shield_paid: false,
      subscription_active: false,
      checks_completed: 1,
    });
    vi.mocked(api.post).mockRejectedValue(
      new ApiError(
        402,
        'Payment required. Complete the $1 Bot-Shield payment before verification.'
      )
    );

    const { getByText, getByRole, queryByText } = render(
      <MemoryRouter initialEntries={['/app/verify?status=success']}>
        <Verify />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(api.post).toHaveBeenCalledTimes(1);

    for (let step = 1; step <= 20; step += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(api.post).toHaveBeenCalledTimes(1 + step);
    }

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });
    expect(api.post).toHaveBeenCalledTimes(21);

    expect(
      getByText('We are waiting for Square to confirm your payment.')
    ).toBeDefined();
    expect(
      getByRole('button', { name: 'I paid, check my badge' })
    ).toBeDefined();
    expect(queryByText(/Start Verification/i)).toBeNull();
  });
});
