import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Heart, Mail } from 'lucide-react';

import { FormField } from '../../components/FormField';
import { api } from '../../lib/api';
import { isMailEnabled } from '../../lib/mailHealth';
import { validateEmail, validateRequired } from '../../lib/validation';

const DEFAULT_CONFIRMATION =
  'If an account exists for that email address, we sent a password reset link. It expires in 30 minutes.';

export function ForgotPassword() {
  const [mailEnabled, setMailEnabled] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Forgot Password | YouAndINotAI';
    let cancelled = false;
    void isMailEnabled().then(enabled => {
      if (!cancelled) {
        setMailEnabled(enabled);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const validateEmailValue = useCallback(
    (value: string): string | undefined => {
      if (!validateRequired(value)) return 'Email is required';
      if (!validateEmail(value)) return 'Enter a valid email address';
      return undefined;
    },
    []
  );

  const handleBlur = useCallback(
    (value: string) => {
      setTouched(true);
      setEmailError(validateEmailValue(value));
    },
    [validateEmailValue]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTouched(true);

    const validationErr = validateEmailValue(email);
    setEmailError(validationErr);
    if (validationErr) return;

    setLoading(true);
    try {
      const response = await api.post<{ received?: boolean; message?: string }>(
        '/auth/forgot-password',
        { email: email.trim() }
      );
      setConfirmation(response?.message || DEFAULT_CONFIRMATION);
    } catch (err: any) {
      setError(err?.message || 'Could not send reset link. Please try again.');
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
              Forgot your password?
            </h1>
            {mailEnabled && (
              <p className="text-sm text-[#C9CBCE] leading-relaxed">
                Enter your account email and we will send a single-use reset
                link that stays valid for 30 minutes.
              </p>
            )}
          </div>

          {!mailEnabled ? (
            <div className="space-y-5">
              <div
                role="status"
                className="rounded-lg border border-[#3A3F45] bg-[#1A1E25] px-4 py-4 text-sm text-[#F4F1EA] leading-relaxed space-y-3"
              >
                <p>Password reset by email is not switched on yet.</p>
                <p className="text-[#C9CBCE]">
                  Need account recovery help? Visit our support guide at{' '}
                  <Link
                    to="/support"
                    className="font-semibold text-[#FFD21E] underline"
                  >
                    /support
                  </Link>{' '}
                  or email{' '}
                  <a
                    href="mailto:contact@youandinotai.com"
                    className="font-semibold text-[#FFD21E] underline"
                  >
                    contact@youandinotai.com
                  </a>{' '}
                  from your account email.
                </p>
              </div>
              <Link
                to="/support"
                className="ds-btn-signal w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-3.5 text-sm no-underline"
              >
                Open Support Guide <ArrowRight size={18} />
              </Link>
            </div>
          ) : confirmation ? (
            <div className="space-y-5">
              <div
                role="status"
                className="rounded-lg border border-[#FFD21E] bg-[#1A1E25] px-4 py-3.5 text-sm font-medium text-[#F4F1EA] leading-relaxed"
              >
                {confirmation}
              </div>
              <Link
                to="/login"
                className="ds-btn-signal w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-3.5 text-sm no-underline"
              >
                <ArrowLeft size={18} /> Back to Sign In
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

              <FormField
                label="Email"
                name="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={e => handleBlur(e.target.value)}
                error={emailError}
                touched={touched}
                placeholder="name@example.com"
                autoComplete="email"
                icon={<Mail size={18} className="text-[#9DA3AA]" />}
              />

              <button
                type="submit"
                disabled={loading}
                className="ds-btn-signal w-full min-h-[44px] flex items-center justify-center gap-2 px-5 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Sending link...</span>
                ) : (
                  <>
                    Send Reset Link <ArrowRight size={18} />
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
