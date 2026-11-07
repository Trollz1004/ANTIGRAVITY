import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { readCookieConsent, saveCookieConsent } from '../lib/consent';

export function CookieConsentBanner() {
  const [open, setOpen] = useState(false);
  const [essential, setEssential] = useState(true);
  const [preferences, setPreferences] = useState(false);
  const [performance, setPerformance] = useState(false);

  useEffect(() => {
    const existing = readCookieConsent();
    if (existing) {
      setPreferences(Boolean(existing.preferences));
      setPerformance(Boolean(existing.performance));
    }
    const onOpenCookies = () => setOpen(true);
    window.addEventListener('youandinotai:open-cookies', onOpenCookies);
    return () =>
      window.removeEventListener('youandinotai:open-cookies', onOpenCookies);
  }, []);

  if (!open) {
    return null;
  }

  const persist = (
    nextEssential: boolean,
    nextPreferences: boolean,
    nextPerformance: boolean
  ) => {
    if (!nextEssential) {
      return;
    }
    saveCookieConsent({
      preferences: nextPreferences,
      performance: nextPerformance,
    });
    setOpen(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-16 z-[10001] px-4 pb-4">
      <div className="mx-auto max-w-4xl rounded-xl border border-[#3A3F45] bg-[#12151A] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-[#3A3F45] bg-[#1A1E25]">
            <ShieldCheck className="text-[#FFD21E]" size={20} />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-sm font-bold text-[#F4F1EA]">
              Cookie controls
            </h2>
            <p className="mt-1 text-sm text-[#F4F1EA]">
              Your account privacy stays in your hands. Choose your cookie
              preferences for this device.
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 rounded-lg border border-[#3A3F45] bg-[#1A1E25] px-4 py-3">
                <input
                  type="checkbox"
                  checked={essential}
                  onChange={e => setEssential(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#FFD21E]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#F4F1EA]">
                    Strictly necessary cookies
                  </span>
                  <span className="block text-xs text-[#F4F1EA]">
                    Required for sign-in, safety checks, and session security.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-[#3A3F45] bg-[#1A1E25] px-4 py-3">
                <input
                  type="checkbox"
                  checked={preferences}
                  onChange={e => setPreferences(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#FFD21E]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#F4F1EA]">
                    Preference cookies
                  </span>
                  <span className="block text-xs text-[#F4F1EA]">
                    Remember UI choices like theme or layout on this device.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-[#3A3F45] bg-[#1A1E25] px-4 py-3">
                <input
                  type="checkbox"
                  checked={performance}
                  onChange={e => setPerformance(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#FFD21E]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#F4F1EA]">
                    Performance cookies
                  </span>
                  <span className="block text-xs text-[#F4F1EA]">
                    Optional first-party diagnostics for app reliability and
                    session performance.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => persist(essential, preferences, performance)}
                className="ds-btn-signal px-5 py-2.5 text-sm"
              >
                Save cookie choices
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ds-btn-ghost px-5 py-2.5 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
