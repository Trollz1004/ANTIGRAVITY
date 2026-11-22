import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Login } from '../app/pages/Login';
import { ForgotPassword } from '../app/pages/ForgotPassword';
import { ResetPassword } from '../app/pages/ResetPassword';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const BANNED_WORD = /prompt/i;

function collectVisibleAndAccessibleText(root: HTMLElement): string {
  const parts = [root.textContent || ''];
  root
    .querySelectorAll('[placeholder],[aria-label],[title],[alt]')
    .forEach(el => {
      for (const attr of ['placeholder', 'aria-label', 'title', 'alt']) {
        const val = el.getAttribute(attr);
        if (val) parts.push(val);
      }
    });
  return parts.join('\n');
}

describe('Password reset flow screens (412px phone-first, plain words, no banned word)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 412,
    });
  });

  it('hides "Forgot password?" on /login when /health reports mail is "off"', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      status: 'ok',
      mail: 'off',
    });

    const { container, queryByRole } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/health');
    });
    expect(queryByRole('link', { name: /Forgot password\?/i })).toBeNull();
    expect(collectVisibleAndAccessibleText(container)).not.toMatch(BANNED_WORD);
  });

  it('shows the mail-off sentence, existing support path, and no email form on /forgot-password when mail is "off"', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      status: 'ok',
      mail: 'off',
    });

    const { container, getByText, queryByLabelText, queryByRole } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <ForgotPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/health');
    });

    expect(
      getByText('Password reset by email is not switched on yet.')
    ).toBeTruthy();
    const mailtoLink = container.querySelector(
      'a[href="mailto:contact@youandinotai.com"]'
    );
    expect(mailtoLink).not.toBeNull();
    const supportLinks = container.querySelectorAll('a[href="/support"]');
    expect(supportLinks.length).toBeGreaterThan(0);
    expect(container.querySelector('form')).toBeNull();
    expect(queryByLabelText(/Email/i)).toBeNull();
    expect(queryByRole('button', { name: /Send Reset Link/i })).toBeNull();
    expect(collectVisibleAndAccessibleText(container)).not.toMatch(BANNED_WORD);
  });

  it('treats a failing /health call as mail off and reads /health once across /login and /forgot-password', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(
      new Error('Health check unavailable')
    );

    const { container, getByText, queryByLabelText, queryByRole } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
        <ForgotPassword />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });
    expect(api.get).toHaveBeenCalledWith('/health');
    expect(queryByRole('link', { name: /Forgot password\?/i })).toBeNull();
    expect(
      getByText('Password reset by email is not switched on yet.')
    ).toBeTruthy();
    expect(queryByLabelText(/Email/i)).toBeNull();
    expect(collectVisibleAndAccessibleText(container)).not.toMatch(BANNED_WORD);
  });

  it('renders a "Forgot password?" link on /login and reads /health once when navigating to /forgot-password with mail "on"', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      status: 'ok',
      mail: 'on',
    });

    const { container, findByLabelText, findByRole } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    const forgotLink = await findByRole('link', { name: /Forgot password\?/i });
    expect(forgotLink.getAttribute('href')).toBe('/forgot-password');
    expect(collectVisibleAndAccessibleText(container)).not.toMatch(BANNED_WORD);

    fireEvent.click(forgotLink);
    expect(await findByLabelText(/Email/i)).toBeTruthy();
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/health');
    expect(collectVisibleAndAccessibleText(container)).not.toMatch(BANNED_WORD);
  });

  it('submits the /forgot-password request screen and shows the plain confirmation message when mail is "on"', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      status: 'ok',
      mail: 'on',
    });
    vi.mocked(api.post).mockResolvedValueOnce({
      received: true,
      message:
        'If an account exists for that email address, we sent a password reset link. It expires in 30 minutes.',
    });

    const { container, findByLabelText, getByRole, findByText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = await findByLabelText(/Email/i);
    expect(collectVisibleAndAccessibleText(container)).not.toMatch(BANNED_WORD);

    fireEvent.change(emailInput, {
      target: { value: 'member@youandinotai.com' },
    });
    fireEvent.click(getByRole('button', { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'member@youandinotai.com',
      });
    });

    expect(
      await findByText(/If an account exists for that email address/i)
    ).toBeTruthy();
    expect(collectVisibleAndAccessibleText(container)).not.toMatch(BANNED_WORD);
  });

  it('submits the /reset-password screen with token and new password and clears localStorage tokens', async () => {
    localStorage.setItem('access_token', 'old-access');
    localStorage.setItem('refresh_token', 'old-refresh');
    vi.mocked(api.post).mockResolvedValueOnce({
      reset: true,
      message:
        'Your password has been updated. Please sign in with your new password.',
    });

    const validToken = 'reset_token_12345678901234567890123456789012';
    const { container, getByLabelText, getByRole, findByText } = render(
      <MemoryRouter initialEntries={[`/reset-password?token=${validToken}`]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

    expect(collectVisibleAndAccessibleText(container)).not.toMatch(BANNED_WORD);

    fireEvent.change(getByLabelText(/^New password/i), {
      target: { value: 'NewPassword456!' },
    });
    fireEvent.change(getByLabelText(/Confirm new password/i), {
      target: { value: 'NewPassword456!' },
    });
    fireEvent.click(getByRole('button', { name: /Save New Password/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: validToken,
        new_password: 'NewPassword456!',
      });
    });

    expect(await findByText(/Your password has been updated/i)).toBeTruthy();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(collectVisibleAndAccessibleText(container)).not.toMatch(BANNED_WORD);
  });
});
