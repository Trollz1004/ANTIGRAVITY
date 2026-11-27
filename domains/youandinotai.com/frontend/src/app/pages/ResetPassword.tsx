import { useState, useCallback, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Heart, Lock } from 'lucide-react';

import { FormField } from '../../components/FormField';
import { api } from '../../lib/api';
import { validateMinLength, validateRequired } from '../../lib/validation';

const DEFAULT_RESET_MESSAGE =
  'Your password has been updated. Please sign in with your new password.';

interface ResetFieldErrors {
  newPassword?: string;
  confirmPassword?: string;
}

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') || '').trim();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ResetFieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [completedMessage, setCompletedMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Set New Password | YouAndINotAI';
  }, []);

  const validateField = useCallback(
    (
      name: 'newPassword' | 'confirmPassword',
      value: string,
      currentNewPassword: string
    ): string | undefined => {
      if (name === 'newPassword') {
        if (!validateRequired(value)) return 'New password is required';
        if (!validateMinLength(value, 8))
          return 'Password must be at least 8 characters';
        return undefined;
      }
      if (!validateRequired(value)) return 'Please confirm your new password';
      if (value !== currentNewPassword) return 'Passwords do not match';
      return undefined;
    },
    []
  );

  const handleBlur = useCallback(
    (name: 'newPassword' | 'confirmPassword', value: string) => {
      setTouched(prev => ({ ...prev, [name]: true }));
      const err = validateField(name, value, newPassword);
      setFieldErrors(prev => ({ ...prev, [name]: err }));
    },
    [newPassword, validateField]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const newPwdErr = validateField('newPassword', newPassword, newPassword);
    const confirmErr = validateField(
      'confirmPassword',
      confirmPassword,
      newPassword
    );
    setFieldErrors({ newPassword: newPwdErr, confirmPassword: confirmErr });
    setTouched({ newPassword: true, confirmPassword: true });
    if (newPwdErr || confirmErr) return;

    if (!token) {
      setError(
        'This reset link is missing its token. Request a new reset link.'
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<{ reset?: boolean; message?: string }>(
        '/auth/reset-password',
        {
          token,
          new_password: newPassword,
        }
      );
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setCompletedMessage(response?.message || DEFAULT_RESET_MESSAGE);
    } catch (err: any) {
      setError(
        err?.message || 'This password reset link is invalid or has expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#F4F1EA] flex flex-col justify-between px-4 py-6 sm:py-8 md:px-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-[#3A3F45] pb-4 mb-6">
        <Link to="/" className="flex items-center gap-3 text-left no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#3A3F45] bg-[#12151A] font-display text-sm font-bold text-[#FFD21E]">
            Y&amp;I
          </span>
          <span className="block font-display text-base font-bold tracking-tight text-[#F4F1EA]">
            YouAndINotAI
          </span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center my-auto">
        <div className="w-full rounded-xl border border-[#3A3F45] bg-[#12151A] p-6 sm:p-8">
          <div className="mb-6">
            <div className="inline-block px-3 py-1 mb-3 rounded border border-[#3A3F45] bg-[#1A1E25] font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#FFD21E]">
              Account Recovery · 18+
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F1EA] mb-2">
              Set a new password.
            </h1>
            <p className="text-sm text-[#C9CBCE] leading-relaxed">
              Choose a new password with at least 8 characters. Saving a new
              password signs out older sessions.
            </p>
          </div>

          {completedMessage ? (
            <div className="space-y-5">
              <div
                role="status"
                className="rounded-lg border border-[#FFD21E] bg-[#1A1E25] px-4 py-3.5 text-sm font-medium text-[#F4F1EA] leading-relaxed"
              >
                {completedMessage}
              </div>
              <Link
                to="/login"
                className="ds-btn-signal w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-3.5 text-sm no-underline"
              >
                Sign In <ArrowRight size={18} />
              </Link>
            </div>
          ) : !token ? (
            <div className="space-y-5">
              <div
                role="alert"
                className="rounded-lg border border-[#FF6B6B] bg-[#1A1E25] px-4 py-3.5 text-sm font-medium text-[#FF6B6B] leading-relaxed"
              >
                This reset link is missing its token. Request a new password
                reset link.
              </div>
              <Link
                to="/forgot-password"
                className="ds-btn-signal w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-3.5 text-sm no-underline"
              >
                Request Reset Link <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#FF6B6B] bg-[#1A1E25] px-4 py-3 text-sm font-medium text-[#FF6B6B]"
                >
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <FormField
                  label="New password"
                  name="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  onBlur={e => handleBlur('newPassword', e.target.value)}
                  error={fieldErrors.newPassword}
                  touched={touched.newPassword}
                  placeholder="8+ characters"
                  autoComplete="new-password"
                  icon={<Lock size={18} className="text-[#9DA3AA]" />}
                />

                <FormField
                  label="Confirm new password"
                  name="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onBlur={e => handleBlur('confirmPassword', e.target.value)}
                  error={fieldErrors.confirmPassword}
                  touched={touched.confirmPassword}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  icon={<Lock size={18} className="text-[#9DA3AA]" />}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ds-btn-signal w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    Save New Password <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 flex flex-col items-center gap-3 border-t border-[#3A3F45] pt-5 text-center">
            <Link
              to="/login"
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#FFD21E] transition-colors hover:underline"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold text-[#C9CBCE] transition-colors hover:text-[#F4F1EA]"
            >
              <Heart size={14} className="text-[#FFD21E]" />
              Back to YouAndINotAI
            </Link>
          </div>
        </div>
      </main>

      <footer className="mx-auto mt-8 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-[#3A3F45] pt-4 text-xs text-[#9DA3AA]">
        <span>youandinotai.com is for adults 18 and over.</span>
      </footer>
    </div>
  );
}
