import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { readCookieConsent, saveCookieConsent } from '../lib/consent';

export function CookieConsentBanner() {
  const [ready, setReady] = useState(false);
  const [essential, setEssential] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [performance, setPerformance] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const existing = readCookieConsent();
    if (existing) {
      setDismissed(true);
    }
    setReady(true);
  }, []);

  if (!ready || dismissed) {
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
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[10001] px-4 pb-4">
      <div className="mx-auto max-w-4xl rounded-xl border border-[#3A3F45] bg-[#12151A] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-[#3A3F45] bg-[#1A1E25]">
            <ShieldCheck className="text-[#FFD21E]" size={20} />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-sm font-bold text-[#F4F1EA]">
              Cookie controls
            </h2>
            <p className="mt-1 text-sm text-[#C9CBCE]">
              Your account privacy stays in your hands. Use these three boxes to
              decide what stays on your device.
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
                  <span className="block text-xs text-[#9DA3AA]">
                    Required for sign-in, safety checks, and session security.
                    You must tick this box yourself.
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
                  <span className="block text-xs text-[#9DA3AA]">
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
                  <span className="block text-xs text-[#9DA3AA]">
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
                disabled={!essential}
                className="ds-btn-signal px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save cookie choices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
