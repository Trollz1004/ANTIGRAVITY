'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-30"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(244,63,94,0.12), transparent 60%)',
        }}
      />
      <section className="relative z-10 mx-auto max-w-lg text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          YouAndINotAI
        </p>
        <h1 className="mt-6 text-5xl font-black tracking-[-0.08em] text-slate-100">
          Something went wrong
        </h1>
        <p className="mt-4 text-lg leading-7 text-slate-300">
          The app hit an unexpected error. The team has been notified.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          If this keeps happening, contact support.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-lg shadow-cyan-950/30"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-100"
            aria-label="Back to YouAndINotAI home"
          >
            Back to app
          </a>
        </div>
      </section>
    </main>
  );
}
