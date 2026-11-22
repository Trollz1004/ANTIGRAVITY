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

  it('renders a "Forgot password?" link on /login pointing to /forgot-password', () => {
    const { container, getByRole } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>
    );

    const forgotLink = getByRole('link', { name: /Forgot password\?/i });
    expect(forgotLink.getAttribute('href')).toBe('/forgot-password');
    expect(collectVisibleAndAccessibleText(container)).not.toMatch(BANNED_WORD);
  });

  it('submits the /forgot-password request screen and shows the plain confirmation message', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      received: true,
      message:
        'If an account exists for that email address, we sent a password reset link. It expires in 30 minutes.',
    });

    const { container, getByLabelText, getByRole, findByText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(collectVisibleAndAccessibleText(container)).not.toMatch(BANNED_WORD);

    fireEvent.change(getByLabelText(/Email/i), {
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
