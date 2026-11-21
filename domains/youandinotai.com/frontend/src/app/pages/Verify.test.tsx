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
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
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

  it('places the waiting line and "I paid, check my badge" button above the summary box when returning with ?status=success', async () => {
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

    const { getByText, getByRole } = render(
      <MemoryRouter initialEntries={['/app/verify?status=success']}>
        <Verify />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const waitingLine = getByText(
      'We are waiting for Square to confirm your payment.'
    );
    const checkBadgeButton = getByRole('button', {
      name: 'I paid, check my badge',
    });
    const summaryHeading = getByText('Verification summary');

    expect(
      waitingLine.compareDocumentPosition(summaryHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      checkBadgeButton.compareDocumentPosition(summaryHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('keeps Submit disabled for three seconds on a timed question with one plain line saying so', async () => {
    vi.useFakeTimers();

    vi.mocked(api.get).mockResolvedValue({
      verified: false,
      trust_score: 20,
      tier: 'unverified',
      bot_shield_paid: false,
      subscription_active: false,
      checks_completed: 0,
    });
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/verify/challenge') {
        return {
          challenge_id: 'chal-3s-1',
          challenge_type: 'liveness_math',
          question: 'What is 14 + 5?',
          issued_at: '2026-11-20T12:00:00Z',
          expires_at: '2026-11-20T12:05:00Z',
        };
      }
      if (path === '/verify/submit') {
        return {
          passed: true,
          trust_score: 60,
          message:
            'Liveness verified! Complete the $1 Bot-Shield payment to earn your badge.',
          checkout_url: 'https://square.link/u/test-checkout',
        };
      }
      throw new Error(`Unexpected POST ${path}`);
    });

    const { getByRole, getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/app/verify']}>
        <Verify />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      getByRole('button', { name: /Start Verification/i }).click();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(getByText('What is 14 + 5?')).toBeDefined();
    expect(getByText(/Submit stays off for three seconds/i)).toBeDefined();

    const input = getByPlaceholderText('Your answer') as HTMLInputElement;
    await act(async () => {
      input.focus();
      input.value = '19';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const reactPropsKey = Object.keys(input).find(k =>
      k.startsWith('__reactProps$')
    );
    if (reactPropsKey) {
      await act(async () => {
        (input as any)[reactPropsKey].onChange({ target: { value: '19' } });
      });
    }

    const submitButton = getByRole('button', {
      name: 'Submit',
    }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2900);
    });
    expect(submitButton.disabled).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(submitButton.disabled).toBe(false);
  });

  it('clears an expired or failed question, shows a "New question" button, and replaces both browser alert() calls with a line on the page', async () => {
    vi.useFakeTimers();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    vi.mocked(api.get).mockResolvedValue({
      verified: false,
      trust_score: 20,
      tier: 'unverified',
      bot_shield_paid: false,
      subscription_active: false,
      checks_completed: 0,
    });

    let challengeAttempt = 0;
    let submitAttempt = 0;
    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/verify/challenge') {
        challengeAttempt += 1;
        if (challengeAttempt === 1) {
          throw new Error('Could not create a question right now.');
        }
        return {
          challenge_id: `chal-attempt-${challengeAttempt}`,
          challenge_type: 'liveness_math',
          question:
            challengeAttempt === 2 ? 'What is 10 + 7?' : 'What is 20 + 8?',
          issued_at: '2026-11-20T12:00:00Z',
          expires_at: '2026-11-20T12:05:00Z',
        };
      }
      if (path === '/verify/submit') {
        submitAttempt += 1;
        if (submitAttempt === 1) {
          throw new ApiError(410, 'Challenge expired');
        }
        return {
          passed: false,
          trust_score: 20,
          message: 'Incorrect answer. You can try a new challenge.',
          checkout_url: null,
        };
      }
      throw new Error(`Unexpected POST ${path}`);
    });

    const { getByRole, getByPlaceholderText, getByText, queryByText } = render(
      <MemoryRouter initialEntries={['/app/verify']}>
        <Verify />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // 1. Challenge creation error shows inline line without alert()
    await act(async () => {
      getByRole('button', { name: /Start Verification/i }).click();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(alertSpy).not.toHaveBeenCalled();
    expect(getByText('Could not create a question right now.')).toBeDefined();

    // 2. Retry starts question; expired submission clears question, shows line without alert(), and shows "New question"
    await act(async () => {
      getByRole('button', { name: /New question|Start Verification/i }).click();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(getByText('What is 10 + 7?')).toBeDefined();

    const firstInput = getByPlaceholderText('Your answer') as HTMLInputElement;
    const firstPropsKey = Object.keys(firstInput).find(k =>
      k.startsWith('__reactProps$')
    );
    if (firstPropsKey) {
      await act(async () => {
        (firstInput as any)[firstPropsKey].onChange({
          target: { value: '17' },
        });
      });
    }
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await act(async () => {
      getByRole('button', { name: 'Submit' }).click();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(alertSpy).not.toHaveBeenCalled();
    expect(queryByText('What is 10 + 7?')).toBeNull();
    expect(getByText(/Challenge expired/i)).toBeDefined();
    const newQuestionBtn = getByRole('button', { name: 'New question' });
    expect(newQuestionBtn).toBeDefined();

    // 3. Clicking "New question" loads next question; failed answer clears question and shows "New question"
    await act(async () => {
      newQuestionBtn.click();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(getByText('What is 20 + 8?')).toBeDefined();

    const secondInput = getByPlaceholderText('Your answer') as HTMLInputElement;
    const secondPropsKey = Object.keys(secondInput).find(k =>
      k.startsWith('__reactProps$')
    );
    if (secondPropsKey) {
      await act(async () => {
        (secondInput as any)[secondPropsKey].onChange({
          target: { value: '99' },
        });
      });
    }
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await act(async () => {
      getByRole('button', { name: 'Submit' }).click();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(alertSpy).not.toHaveBeenCalled();
    expect(queryByText('What is 20 + 8?')).toBeNull();
    expect(
      getByText('Incorrect answer. You can try a new challenge.')
    ).toBeDefined();
    expect(getByRole('button', { name: 'New question' })).toBeDefined();
  });

  it('hides the dollar-back box when GET /verify/refund-status returns available: false', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/verify/status') {
        return {
          verified: true,
          trust_score: 60,
          tier: 'gold',
          bot_shield_paid: true,
          subscription_active: false,
          checks_completed: 2,
        };
      }
      if (path === '/verify/refund-status') {
        return { available: false };
      }
      throw new Error(`Unexpected GET ${path}`);
    });

    const { getByText, queryByText, queryByRole } = render(
      <MemoryRouter initialEntries={['/app/verify']}>
        <Verify />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText('Badge active.')).toBeDefined();
    });

    expect(
      queryByText(
        'Not for you? Get your $1 back within 3 days. Your badge turns off.'
      )
    ).toBeNull();
    expect(queryByRole('button', { name: 'Give me my $1 back' })).toBeNull();
  });

  it('shows a member with the badge the headline "You\'re verified." and one line on what that unlocks, not "Prove you\'re human" and not the how-it-works box', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/verify/status') {
        return {
          verified: true,
          trust_score: 60,
          tier: 'gold',
          bot_shield_paid: true,
          subscription_active: false,
          checks_completed: 2,
        };
      }
      if (path === '/verify/refund-status') {
        return { available: false };
      }
      throw new Error(`Unexpected GET ${path}`);
    });

    const { getByRole, getByText, queryByText } = render(
      <MemoryRouter initialEntries={['/app/verify']}>
        <Verify />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByRole('heading', { level: 1, name: "You're verified." })
      ).toBeDefined();
    });

    expect(
      getByText(
        'Your badge unlocks discovery, messaging, and video on your account.'
      )
    ).toBeDefined();
    expect(queryByText(/Prove you're human/i)).toBeNull();
    expect(queryByText(/How the flow works/i)).toBeNull();
    expect(queryByText(/Answer a short timed question\./i)).toBeNull();
  });

  it('shows the dollar-back line and button when refund-status says available, asks once on the page without a browser dialog, shows the server message, and flips the menu to not verified without a reload', async () => {
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockImplementation(() => true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    useAuth.setState({
      user: {
        user_id: 'user-verify-1',
        email: 'paid@youandinotai.com',
        display_name: 'Paid Member',
        bot_shield_verified: true,
        subscription_tier: null,
        subscription_active: false,
        has_profile: true,
        adult_verified: true,
      },
      loading: false,
    });

    let refunded = false;
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/verify/status') {
        return refunded
          ? {
              verified: false,
              trust_score: 20,
              tier: 'unverified',
              bot_shield_paid: false,
              subscription_active: false,
              checks_completed: 2,
            }
          : {
              verified: true,
              trust_score: 60,
              tier: 'gold',
              bot_shield_paid: true,
              subscription_active: false,
              checks_completed: 2,
            };
      }
      if (path === '/verify/refund-status') {
        return refunded
          ? { available: false }
          : { available: true, expires_at: '2026-11-23T12:00:00Z' };
      }
      if (path === '/auth/me') {
        return {
          user_id: 'user-verify-1',
          email: 'paid@youandinotai.com',
          display_name: 'Paid Member',
          bot_shield_verified: !refunded,
          subscription_tier: null,
          subscription_active: false,
          has_profile: true,
          adult_verified: true,
        };
      }
      throw new Error(`Unexpected GET ${path}`);
    });

    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/verify/refund') {
        refunded = true;
        return {
          refunded: true,
          verified: false,
          amount_cents: 100,
          status: 'PENDING',
          refund_id: 'rfnd_ui_1',
          message:
            'Your $1 refund has started. Your Verified Human badge is now off.',
        };
      }
      throw new Error(`Unexpected POST ${path}`);
    });

    const { getByText, getByRole, getAllByText, queryByText } = render(
      <MemoryRouter initialEntries={['/app/verify']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/app/verify" element={<Verify />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByText(
          'Not for you? Get your $1 back within 3 days. Your badge turns off.'
        )
      ).toBeDefined();
    });

    const askButton = getByRole('button', { name: 'Give me my $1 back' });
    expect(askButton).toBeDefined();
    expect(queryByText('Finish your $1 human check')).toBeNull();

    // First click asks once to confirm on the page without calling POST /verify/refund or opening a browser dialog
    await act(async () => {
      askButton.click();
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalledWith('/verify/refund');

    const confirmOnPageButton = getByRole('button', {
      name: /Yes, give me my \$1 back/i,
    });
    expect(confirmOnPageButton).toBeDefined();

    // Second click confirms on the page, calls POST /verify/refund, shows server message, and updates AppShell menu
    await act(async () => {
      confirmOnPageButton.click();
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/verify/refund');
      expect(
        getByText(
          'Your $1 refund has started. Your Verified Human badge is now off.'
        )
      ).toBeDefined();
      expect(useAuth.getState().user?.bot_shield_verified).toBe(false);
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(
      getAllByText('Finish your $1 human check').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('shows the last day the dollar can be asked back from refund-status in the box', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/verify/status') {
        return {
          verified: true,
          trust_score: 60,
          tier: 'gold',
          bot_shield_paid: true,
          subscription_active: false,
          checks_completed: 2,
        };
      }
      if (path === '/verify/refund-status') {
        return {
          available: true,
          expires_at: '2026-11-23T12:00:00Z',
          until: '2026-11-23T12:00:00Z',
        };
      }
      throw new Error(`Unexpected GET ${path}`);
    });

    const { getByText } = render(
      <MemoryRouter initialEntries={['/app/verify']}>
        <Verify />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByText(/November 23, 2026/i)).toBeDefined();
    });
  });

  it('clears the old Payment confirmed card when a refund completes in the same tab', async () => {
    window.history.replaceState({}, '', '/app/verify?status=success');

    let verified = false;
    let refunded = false;

    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/verify/status') {
        return {
          verified,
          trust_score: verified ? 60 : 20,
          tier: verified ? 'gold' : 'unverified',
          bot_shield_paid: verified,
          subscription_active: false,
          checks_completed: 2,
        };
      }
      if (path === '/verify/refund-status') {
        return verified && !refunded
          ? {
              available: true,
              expires_at: '2026-11-23T12:00:00Z',
              until: '2026-11-23T12:00:00Z',
            }
          : { available: false };
      }
      if (path === '/auth/me') {
        return {
          user_id: 'user-verify-1',
          email: 'paid@youandinotai.com',
          display_name: 'Paid Member',
          bot_shield_verified: verified,
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
        verified = true;
        return { verified: true, trust_score: 60, tier: 'gold' };
      }
      if (path === '/verify/refund') {
        verified = false;
        refunded = true;
        return {
          refunded: true,
          verified: false,
          amount_cents: 100,
          status: 'PENDING',
          refund_id: 'rfnd_clear_1',
          message:
            'Your $1 refund has started. Your Verified Human badge is now off.',
        };
      }
      throw new Error(`Unexpected POST ${path}`);
    });

    const { getByText, getByRole, queryByText } = render(
      <MemoryRouter initialEntries={['/app/verify?status=success']}>
        <Verify />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        getByText('Payment confirmed. Your Verified Human badge is now active.')
      ).toBeDefined();
      expect(getByRole('button', { name: 'Give me my $1 back' })).toBeDefined();
    });

    await act(async () => {
      getByRole('button', { name: 'Give me my $1 back' }).click();
    });

    await act(async () => {
      getByRole('button', { name: /Yes, give me my \$1 back/i }).click();
    });

    await waitFor(() => {
      expect(
        getByText(
          'Your $1 refund has started. Your Verified Human badge is now off.'
        )
      ).toBeDefined();
    });

    expect(
      queryByText('Payment confirmed. Your Verified Human badge is now active.')
    ).toBeNull();
    expect(queryByText('Payment confirmed.')).toBeNull();
    expect(queryByText('Challenge passed')).toBeNull();
    expect(getByText('Ready for badge activation?')).toBeDefined();
  });

  it('at 412 wide scrolls both confirm buttons above the bottom menu and scrolls the refund message into view below the top bar after refund', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(((
      arg1?: number | ScrollToOptions,
      arg2?: number
    ) => {
      const nextY =
        typeof arg1 === 'object' && arg1 !== null
          ? Number(arg1.top ?? 0)
          : Number(arg2 ?? 0);
      Object.defineProperty(window, 'scrollY', {
        value: nextY,
        configurable: true,
        writable: true,
      });
    }) as typeof window.scrollTo);

    Object.defineProperty(window, 'innerWidth', {
      value: 412,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 915,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      configurable: true,
      writable: true,
    });

    let refunded = false;
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/verify/status') {
        return {
          verified: !refunded,
          trust_score: refunded ? 20 : 60,
          tier: refunded ? 'unverified' : 'gold',
          bot_shield_paid: !refunded,
          subscription_active: false,
          checks_completed: 2,
        };
      }
      if (path === '/verify/refund-status') {
        return refunded
          ? { available: false }
          : {
              available: true,
              expires_at: '2026-11-23T12:00:00Z',
              until: '2026-11-23T12:00:00Z',
            };
      }
      if (path === '/auth/me') {
        return {
          user_id: 'user-verify-1',
          email: 'paid@youandinotai.com',
          display_name: 'Paid Member',
          bot_shield_verified: !refunded,
          subscription_tier: null,
          subscription_active: false,
          has_profile: true,
          adult_verified: true,
        };
      }
      throw new Error(`Unexpected GET ${path}`);
    });

    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/verify/refund') {
        refunded = true;
        return {
          refunded: true,
          verified: false,
          amount_cents: 100,
          status: 'PENDING',
          refund_id: 'rfnd_scroll_1',
          message:
            'Your $1 refund has started. Your Verified Human badge is now off.',
        };
      }
      throw new Error(`Unexpected POST ${path}`);
    });

    const { getByRole, getByText } = render(
      <MemoryRouter initialEntries={['/app/verify']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/app/verify" element={<Verify />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByRole('button', { name: 'Give me my $1 back' })).toBeDefined();
    });

    await act(async () => {
      getByRole('button', { name: 'Give me my $1 back' }).click();
    });

    expect(
      getByRole('button', { name: /Yes, give me my \$1 back/i })
    ).toBeDefined();
    expect(getByRole('button', { name: 'Keep my badge' })).toBeDefined();
    expect(scrollToSpy).toHaveBeenCalled();

    scrollToSpy.mockClear();

    await act(async () => {
      getByRole('button', { name: /Yes, give me my \$1 back/i }).click();
    });

    await waitFor(() => {
      expect(
        getByText(
          'Your $1 refund has started. Your Verified Human badge is now off.'
        )
      ).toBeDefined();
    });

    expect(scrollToSpy).toHaveBeenCalled();
  });

  it('at 412 wide keeps "Give me my $1 back" in first view above the bottom menu with compact mobile spacing', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 412,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 915,
      configurable: true,
      writable: true,
    });

    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/verify/status') {
        return {
          verified: true,
          trust_score: 60,
          tier: 'gold',
          bot_shield_paid: true,
          subscription_active: false,
          checks_completed: 2,
        };
      }
      if (path === '/verify/refund-status') {
        return {
          available: true,
          expires_at: '2026-11-23T12:00:00Z',
          until: '2026-11-23T12:00:00Z',
        };
      }
      throw new Error(`Unexpected GET ${path}`);
    });

    const { container, getByRole, getByText } = render(
      <MemoryRouter initialEntries={['/app/verify']}>
        <Verify />
      </MemoryRouter>
    );

    const askButton = await waitFor(() =>
      getByRole('button', { name: 'Give me my $1 back' })
    );
    const badgeHeading = getByText('Badge active.');
    const badgeCard = badgeHeading.closest('div.glass-strong');
    const refundCard = askButton.closest('div.glass-strong');
    const pageRoot = container.querySelector('.app-page');

    expect(pageRoot?.className).toContain('pt-4');
    expect(badgeCard?.className).toContain('p-5');
    expect(refundCard?.className).toContain('p-5');
    expect(askButton.className).toContain('mt-3');
  });

  it('shows a paid member whose question result is too old one plain line asking for one new timed question with no new charge, never says prompt, and activates the badge on passing without a second checkout', async () => {
    vi.useFakeTimers();

    let verified = false;
    vi.mocked(api.get).mockImplementation(async (path: string) => {
      if (path === '/verify/status') {
        return {
          verified,
          trust_score: verified ? 60 : 20,
          tier: verified ? 'gold' : 'unverified',
          bot_shield_paid: true,
          subscription_active: false,
          checks_completed: verified ? 3 : 2,
        };
      }
      if (path === '/verify/refund-status') {
        return { available: false };
      }
      if (path === '/auth/me') {
        return {
          user_id: 'user-verify-1',
          email: 'paid@youandinotai.com',
          display_name: 'Paid Member',
          bot_shield_verified: verified,
          subscription_tier: null,
          subscription_active: false,
          has_profile: true,
          adult_verified: true,
        };
      }
      throw new Error(`Unexpected GET ${path}`);
    });

    vi.mocked(api.post).mockImplementation(async (path: string) => {
      if (path === '/verify/challenge') {
        return {
          challenge_id: 'chal-late-paid-1',
          challenge_type: 'liveness_math',
          question: 'What is 15 + 4?',
          issued_at: '2026-11-21T12:00:00Z',
          expires_at: '2026-11-21T12:05:00Z',
        };
      }
      if (path === '/verify/submit') {
        verified = true;
        return {
          passed: true,
          trust_score: 60,
          message:
            'Liveness verified! Your $1 Bot-Shield verification is complete.',
          checkout_url: null,
        };
      }
      throw new Error(`Unexpected POST ${path}`);
    });

    const { container, getByRole, getByPlaceholderText, getByText, queryByText } =
      render(
        <MemoryRouter initialEntries={['/app/verify']}>
          <Verify />
        </MemoryRouter>
      );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(
      getByText(
        'Your $1 payment is confirmed. Answer one new timed question to activate your badge with no new charge.'
      )
    ).toBeDefined();
    expect(
      queryByText(
        /When you answer the timed question, the page will hand you into the \$1 Square checkout\./i
      )
    ).toBeNull();
    expect(container.textContent?.toLowerCase()).not.toContain('prompt');

    await act(async () => {
      getByRole('button', { name: /Start Verification/i }).click();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(getByText('What is 15 + 4?')).toBeDefined();

    const input = getByPlaceholderText('Your answer') as HTMLInputElement;
    const reactPropsKey = Object.keys(input).find(k =>
      k.startsWith('__reactProps$')
    );
    if (reactPropsKey) {
      await act(async () => {
        (input as any)[reactPropsKey].onChange({ target: { value: '19' } });
      });
    }

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    await act(async () => {
      getByRole('button', { name: 'Submit' }).click();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(getByText('Badge active.')).toBeDefined();
    expect(queryByText(/Pay \$1 Bot-Shield/i)).toBeNull();
    expect(container.textContent?.toLowerCase()).not.toContain('prompt');
  });
});
