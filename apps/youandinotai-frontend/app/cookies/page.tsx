import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'YouAndINotAI cookie policy with necessary, preference, and performance cookie controls.',
};

const cookieTypes = [
  {
    title: 'Strictly necessary cookies',
    body: 'Required for checkout, sign-in, fraud prevention, safety, account recovery, and session security. These keep the service working.',
  },
  {
    title: 'Preference cookies',
    body: 'Optional cookies that remember settings like theme and display choices on this device.',
  },
  {
    title: 'Performance cookies',
    body: 'Optional diagnostics that help identify broken pages, checkout issues, and app reliability problems.',
  },
];

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#eff6ff] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-[2.4rem] border-4 border-slate-950 bg-white p-6 shadow-[10px_10px_0_0_rgba(15,23,42,1)] md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
          YouAndINotAI
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.08em] md:text-6xl">
          Cookie Policy
        </h1>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
          Use the cookie banner to choose what stays on your device. We do not
          sell personal data or use ad-network profiling. Last updated June 23,
          2026.
        </p>

        <div className="mt-8 grid gap-4">
          {cookieTypes.map((type, index) => (
            <article
              key={type.title}
              className="flex gap-4 rounded-[1.5rem] border-2 border-slate-950 bg-cyan-50 p-5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-sm font-black text-white" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h2 className="text-xl font-black tracking-[-0.04em]">
                  {type.title}
                </h2>
                <p className="mt-2 leading-7 text-slate-700">{type.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[1.5rem] border-2 border-slate-950 bg-orange-50 p-5">
          <h2 className="text-xl font-black tracking-[-0.04em]">
            Changing choices
          </h2>
          <p className="mt-2 leading-7 text-slate-700">
            You can clear site data in your browser to show the cookie banner
            again. Essential cookies may still be needed for secure checkout,
            sign-in, and account safety.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
            aria-label="Back to YouAndINotAI app"
          >
            Back to app
          </a>
          <a
            href="/terms"
            className="rounded-2xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em]"
          >
            Terms
          </a>
          <a
            href="/privacy"
            className="rounded-2xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em]"
          >
            Privacy Policy
          </a>
        </div>
      </section>
    </main>
  );
}
