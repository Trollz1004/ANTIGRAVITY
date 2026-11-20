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
    expect(
      getByText(/Submit stays off for three seconds/i)
    ).toBeDefined();

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
});
