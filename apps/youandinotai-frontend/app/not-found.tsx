import Link from 'next/link';

export const metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-30"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.15), transparent 60%)',
        }}
      />
      <section className="relative z-10 mx-auto max-w-lg text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          YouAndINotAI
        </p>
        <h1 className="mt-6 text-7xl font-black tracking-[-0.1em] text-slate-100 md:text-8xl">
          404
        </h1>
        <p className="mt-4 text-lg leading-7 text-slate-300">
          This page does not exist. The link may be broken, or the page may
          have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-lg shadow-cyan-950/30"
            aria-label="Back to YouAndINotAI home"
          >
            Back to app
          </Link>
          <Link
            href="/terms"
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-100"
          >
            Terms
          </Link>
        </div>
      </section>
    </main>
  );
}
