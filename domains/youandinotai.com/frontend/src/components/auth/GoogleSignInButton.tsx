import { useEffect, useState } from 'react';
import { calculateAgeUtc, formatDateInput, toIsoDate } from '../../lib/ageGate';
import { useAuth } from '../../lib/auth';

declare global {
  interface Window {
    google: any;
  }
}

export function GoogleSignInButton({
  clientId,
}: { clientId?: string } = {}) {
  const { googleLogin, user } = useAuth();
  const googleClientId = clientId ?? import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [pendingCredential, setPendingCredential] = useState<string | null>(
    null
  );
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [confirmedOver18, setConfirmedOver18] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user || !googleClientId) return; // a user is already logged in or Google auth is not configured
    let cancelled = false;

    const handleCredentialResponse = async (response: any) => {
      const credential = response?.credential;
      if (!credential) return;
      setError('');
      try {
        await googleLogin(credential);
        // Existing adult-verified account signs in directly.
      } catch (err: any) {
        const message = String(err?.message || '');
        if (/date of birth/i.test(message) || /18\+/i.test(message)) {
          setPendingCredential(credential);
        } else {
          setError(message || 'Google sign-in failed');
        }
      }
    };

    const initializeGsi = () => {
      if (cancelled || !window.google?.accounts?.id) {
        console.error('Google Identity Services library not loaded.');
        return;
      }

      const buttonRoot = document.getElementById('google-signin-button');
      if (!buttonRoot) return;
      buttonRoot.innerHTML = '';

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(buttonRoot, {
        theme: 'outline',
        size: 'large',
      });
    };

    const loadGsi = async () => {
      if (window.google?.accounts?.id) {
        initializeGsi();
        return;
      }

      const existing = document.getElementById(
        'google-gsi-client'
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', initializeGsi, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', initializeGsi, { once: true });
      script.addEventListener(
        'error',
        () => {
          console.error('Google Identity Services library failed to load.');
        },
        { once: true }
      );
      document.head.appendChild(script);
    };

    void loadGsi();

    return () => {
      cancelled = true;
    };
  }, [googleClientId, googleLogin, user]);

  const handleConfirmAge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCredential) return;
    setError('');
    if (!dateOfBirth) {
      setError('Date of birth is required');
      return;
    }
    const birthDateIso = toIsoDate(dateOfBirth);
    if (!birthDateIso) {
      setError('Enter date of birth as MM / DD / YYYY');
      return;
    }
    if (calculateAgeUtc(birthDateIso) < 18) {
      setError('YouAndINotAI is strictly 18+ only');
      return;
    }
    if (!confirmedOver18) {
      setError('Confirm you are at least 18 years old');
      return;
    }
    setSubmitting(true);
    try {
      await googleLogin(pendingCredential, birthDateIso);
      setPendingCredential(null);
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!googleClientId) return null;
  return (
    <div className="space-y-4">
      <div id="google-signin-button"></div>
      {error && (
        <p role="alert" className="text-sm font-medium text-[#FF6B6B]">
          {error}
        </p>
      )}
      {pendingCredential && (
        <form
          onSubmit={handleConfirmAge}
          className="rounded-lg border border-[#3A3F45] bg-[#1A1E25] p-4 space-y-3"
          noValidate
        >
          <label
            htmlFor="google-dob-input"
            className="block text-sm font-semibold text-[#F4F1EA]"
          >
            Confirm 18+ Date of Birth to Finish Google Sign Up
          </label>
          <input
            id="google-dob-input"
            type="text"
            required
            value={dateOfBirth}
            onChange={e => setDateOfBirth(formatDateInput(e.target.value))}
            inputMode="numeric"
            maxLength={14}
            placeholder="MM / DD / YYYY"
            className="w-full rounded-lg border border-[#3A3F45] bg-[#0A0B0D] px-4 py-3 text-sm text-[#F4F1EA] placeholder-[#9DA3AA] outline-none focus:border-[#FFD21E]"
          />
          <label className="flex items-start gap-2.5 text-xs text-[#C9CBCE] cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedOver18}
              onChange={e => setConfirmedOver18(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I confirm I am at least 18 years old and my date of birth is
              accurate.
            </span>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="ds-btn-signal w-full px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? 'Verifying...' : 'Confirm 18+ & Continue'}
          </button>
        </form>
      )}
    </div>
  );
}
