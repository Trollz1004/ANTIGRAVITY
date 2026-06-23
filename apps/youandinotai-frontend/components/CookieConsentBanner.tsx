'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'youandinotai_cookie_choices_v1';

export default function CookieConsentBanner() {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [necessary, setNecessary] = useState(false);
  const [preferences, setPreferences] = useState(false);
  const [performance, setPerformance] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === 'saved');
    } catch {
      setDismissed(false);
    }
    setReady(true);
  }, []);

  if (!ready || dismissed) {
    return null;
  }

  function saveChoices() {
    if (!necessary) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, 'saved');
      window.localStorage.setItem(
        `${STORAGE_KEY}_details`,
        JSON.stringify({
          necessary,
          preferences,
          performance,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // If local storage is unavailable, still let the visitor continue.
    }

    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[10000] px-4 pb-4">
      <div className="mx-auto max-w-4xl rounded-[1.8rem] border border-slate-700 bg-slate-950/95 p-5 text-white shadow-2xl backdrop-blur">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15">
            <ShieldCheck size={20} className="text-blue-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black uppercase tracking-[0.16em]">
              Cookie choices
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              We use clear cookie controls for sign-in, safety, preferences, and
              basic performance checks. We do not sell personal data.
            </p>

            <div className="mt-4 grid gap-3">
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <input
                  type="checkbox"
                  checked={necessary}
                  onChange={(event) => setNecessary(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-blue-400"
                />
                <span>
                  <span className="block text-sm font-black">
                    Strictly necessary cookies
                  </span>
                  <span className="block text-xs leading-5 text-slate-400">
                    Required for checkout, sign-in, fraud prevention, safety,
                    and session security.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <input
                  type="checkbox"
                  checked={preferences}
                  onChange={(event) => setPreferences(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-blue-400"
                />
                <span>
                  <span className="block text-sm font-black">
                    Preference cookies
                  </span>
                  <span className="block text-xs leading-5 text-slate-400">
                    Remember settings like theme and simple display choices on
                    this device.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <input
                  type="checkbox"
                  checked={performance}
                  onChange={(event) => setPerformance(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-blue-400"
                />
                <span>
                  <span className="block text-sm font-black">
                    Performance cookies
                  </span>
                  <span className="block text-xs leading-5 text-slate-400">
                    Optional app diagnostics so broken pages and checkout issues
                    can be found faster.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveChoices}
                disabled={!necessary}
                className="rounded-full bg-blue-500 px-5 py-2 text-sm font-black text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save cookie choices
              </button>
              <a
                href="/cookies"
                className="text-xs font-black uppercase tracking-[0.14em] text-slate-300 underline underline-offset-4"
              >
                Cookie Policy
              </a>
              <a
                href="/privacy"
                className="text-xs font-black uppercase tracking-[0.14em] text-slate-300 underline underline-offset-4"
              >
                Privacy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
