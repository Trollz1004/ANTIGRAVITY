import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'YouAndINotAI privacy policy for account, verification, safety, support, and checkout data.',
};

const sections = [
  {
    title: 'Information you provide',
    body: 'We may collect account details, profile details, photos, preferences, verification status, support messages, safety reports, and privacy requests you send to us.',
  },
  {
    title: 'Checkout information',
    body: 'Square processes payment details. We use payment status, receipt details, and product selection to provide membership, verification, support, and account access.',
  },
  {
    title: 'How information is used',
    body: 'Information is used to run profiles, verification, discovery, matches, chat, safe plan tools, support, fraud prevention, account recovery, and platform safety.',
  },
  {
    title: 'Safety and moderation',
    body: 'Reports, blocks, restrictions, verification signals, and support history may be reviewed to protect members and enforce platform rules.',
  },
  {
    title: 'Cookies and device storage',
    body: 'Necessary cookies support sign-in, checkout, fraud prevention, safety, and session security. Optional cookies can remember preferences and help diagnose app issues.',
  },
  {
    title: 'Your choices',
    body: 'You can request support for account access, privacy questions, data export, correction, or deletion. Some records may be kept when needed for receipts, safety, security, or legal obligations.',
  },
  {
    title: 'No data sale',
    body: 'YouAndINotAI does not sell personal data. Public product copy should stay focused on membership, verification, support, safety, uptime, and platform value.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#020617] px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-[2.4rem] border border-slate-800 bg-slate-950 p-6 shadow-2xl md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
          YouAndINotAI
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.08em] md:text-6xl">
          Privacy Policy
        </h1>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-300">
          Simple privacy terms for account access, verification, safety,
          support, checkout, and dating features. Last updated June 23, 2026.
        </p>

        <div className="mt-8 grid gap-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-5"
            >
              <h2 className="text-xl font-black tracking-[-0.04em]">
                {section.title}
              </h2>
              <p className="mt-2 leading-7 text-slate-300">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/"
            className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
            aria-label="Back to YouAndINotAI app"
          >
            Back to app
          </a>
          <a
            href="/terms"
            className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.14em]"
          >
            Terms
          </a>
          <a
            href="/cookies"
            className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.14em]"
          >
            Cookie Policy
          </a>
        </div>
      </section>
    </main>
  );
}
