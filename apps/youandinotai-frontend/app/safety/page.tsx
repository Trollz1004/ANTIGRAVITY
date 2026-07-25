import type { Metadata } from 'next';
import { ShieldAlert, AlertTriangle, Scale, Lock, EyeOff, Gavel } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trust & Safety Center - Zero Tolerance Policy',
  description: 'Our industry-leading consumer protection and zero-tolerance law enforcement escalation policies.',
};

const corePolicies = [
  {
    icon: <ShieldAlert className="h-6 w-6 text-red-500" />,
    title: 'Aggressive Consumer Protection',
    body: 'We do not merely meet industry standards; we set the bar. We employ advanced heuristics, manual reviews, and strict identity verification to proactively block bad actors before they can interact with the community.',
  },
  {
    icon: <Gavel className="h-6 w-6 text-blue-500" />,
    title: 'Zero-Tolerance Law Enforcement Escalation',
    body: 'Scammers, bots, and exploiters have no expectation of privacy here. We aggressively and proactively report illegal activity, fraud, and exploitation directly to authorities, including the FBI IC3, NCMEC, and local law enforcement.',
  },
  {
    icon: <EyeOff className="h-6 w-6 text-emerald-500" />,
    title: 'No Safe Haven for Fraud',
    body: 'If you attempt to use this platform to defraud, harass, or exploit our members, your data (including IP addresses, device fingerprints, transaction history, and chat logs) will be preserved and handed over to authorities to ensure accountability.',
  },
  {
    icon: <Lock className="h-6 w-6 text-purple-500" />,
    title: 'Ironclad Data Security',
    body: 'For our genuine members, your data is protected with enterprise-grade encryption and strict access controls. Your privacy is paramount. But privacy is a right reserved for law-abiding individuals, not a shield for criminals.',
  },
];

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-[#020617] px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
            YouAndINotAI Trust & Safety
          </p>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.08em] text-white md:text-7xl">
            Setting the New Standard.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg font-medium leading-8 text-slate-400">
            We believe basic compliance is not enough. We operate with a zero-tolerance policy against bad actors to ensure the highest grade of consumer protection in the industry.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {corePolicies.map((policy) => (
            <article
              key={policy.title}
              className="group relative overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/40 p-8 transition-all hover:bg-slate-900/80 hover:border-slate-700 hover:shadow-2xl hover:shadow-red-500/10"
            >
              <div className="mb-5 inline-flex items-center justify-center rounded-2xl bg-slate-950 p-4 shadow-inner">
                {policy.icon}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-3">
                {policy.title}
              </h2>
              <p className="leading-relaxed text-slate-300">
                {policy.body}
              </p>
              
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-slate-800/20 blur-3xl transition-all group-hover:bg-red-500/10" />
            </article>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center rounded-[2.5rem] border border-red-900/30 bg-red-950/20 p-8 text-center md:p-12">
          <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-2xl font-black tracking-[-0.04em] text-white md:text-4xl">
            See Something Suspicious?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            If you encounter behavior that violates our community standards, report it immediately in the app or contact our Trust & Safety team. We review every report.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="/"
              className="rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-950 transition-transform hover:scale-105"
            >
              Back to App
            </a>
            <a
              href="/privacy"
              className="rounded-full border border-slate-700 bg-slate-900 px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
