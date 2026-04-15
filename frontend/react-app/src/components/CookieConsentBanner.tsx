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

  const persist = (nextEssential: boolean, nextPreferences: boolean, nextPerformance: boolean) => {
    if (!nextEssential) {
      return;
    }
    saveCookieConsent({ preferences: nextPreferences, performance: nextPerformance });
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[10001] px-4 pb-4">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-gray-950/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
            <ShieldCheck className="text-emerald-400" size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-white">Cookie controls</h2>
            <p className="mt-1 text-sm text-gray-400">
              We do not sell data or run ad trackers. Use these three boxes to decide what stays on your device.
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <input
                  type="checkbox"
                  checked={essential}
                  onChange={(e) => setEssential(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-pink-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">Strictly necessary cookies</span>
                  <span className="block text-xs text-gray-400">Required for sign-in, safety checks, and session security. You must tick this box yourself.</span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <input
                  type="checkbox"
                  checked={preferences}
                  onChange={(e) => setPreferences(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-pink-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">Preference cookies</span>
                  <span className="block text-xs text-gray-400">Remember UI choices like theme or layout on this device.</span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <input
                  type="checkbox"
                  checked={performance}
                  onChange={(e) => setPerformance(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-pink-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">Performance cookies</span>
                  <span className="block text-xs text-gray-400">Optional diagnostics only. No ad networks, no resale, no third-party profiling.</span>
                </span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => persist(essential, preferences, performance)}
                disabled={!essential}
                className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-sm font-bold text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
