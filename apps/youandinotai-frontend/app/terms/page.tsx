import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'YouAndINotAI terms for membership, verification, safety, support, and account access.',
};

const sections = [
  {
    title: 'Who can use YouAndINotAI',
    body: 'YouAndINotAI is for adults 18 and older. Use accurate account details, keep your login private, and do not create accounts for someone else.',
  },
  {
    title: 'Membership and verification',
    body: 'Membership and verification purchases buy app access, account verification, safety features, matching tools, support, and related platform services. A purchase does not create ownership, voting rights, control rights, or investment rights.',
  },
  {
    title: 'Checkout and receipts',
    body: 'Payments are processed by Square. Square may handle card entry, payment confirmation, receipts, and payment-related security checks. Keep your receipt for support.',
  },
  {
    title: 'Dating safety rules',
    body: 'Treat other members with respect. Do not harass, threaten, impersonate, scam, spam, pressure, or post illegal content. Meet in public, use your own judgment, and report behavior that feels unsafe.',
  },
  {
    title: 'Profiles, discovery, chat, and plans',
    body: 'The app helps people create profiles, verify accounts, discover matches, chat, and make safer first-date plans. We do not guarantee matches, dates, relationships, event attendance, or outcomes.',
  },
  {
    title: 'Support and account actions',
    body: 'Support may review reports, verification issues, payment questions, privacy requests, and account recovery. We may restrict or remove accounts that break platform rules or create safety risk.',
  },
  {
    title: 'Refunds and changes',
    body: 'Refund handling depends on the product purchased, payment status, Square records, and applicable law. Features, prices, and availability may change as the product improves.',
  },
  {
    title: 'Privacy and cookies',
    body: 'Use of the service also follows the Privacy Policy and Cookie Policy. Necessary cookies support checkout, sign-in, fraud prevention, safety, and session security.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fff7ed] px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl rounded-[2.4rem] border-4 border-slate-950 bg-white p-6 shadow-[10px_10px_0_0_rgba(15,23,42,1)] md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-red-600">
          YouAndINotAI
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.08em] md:text-6xl">
          Terms of Service
        </h1>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">
          Plain-language terms for membership, verification, safety, support,
          and account access. Last updated June 23, 2026.
        </p>

        <div className="mt-8 grid gap-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[1.5rem] border-2 border-slate-950 bg-orange-50 p-5"
            >
              <h2 className="text-xl font-black tracking-[-0.04em]">
                {section.title}
              </h2>
              <p className="mt-2 leading-7 text-slate-700">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="/"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white"
          >
            Back to app
          </a>
          <a
            href="/privacy"
            className="rounded-2xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em]"
          >
            Privacy Policy
          </a>
          <a
            href="/cookies"
            className="rounded-2xl border-2 border-slate-950 bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.14em]"
          >
            Cookie Policy
          </a>
        </div>
      </section>
    </main>
  );
}
