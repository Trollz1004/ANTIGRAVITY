import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Heart,
  KeyRound,
  Mail,
  Menu,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from './lib/auth';
import { ThemeProvider } from './lib/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';

const WAITLIST_FORM_ACTION = 'https://formsubmit.co/contact@youandinotai.com';

const SECURE_PLAN_LINKS = {
  bot_shield: '/app/verify',
  founding_member: '/app/checkout/founding_member',
  '3_month': '/app/checkout/3_month',
  '12_month': '/app/checkout/12_month',
  royalty: '/app/checkout/royalty',
} as const;

const NAV_ITEMS = [
  { label: 'Human Only', href: '#about' },
  { label: 'The Social', href: '#platform' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Impact', href: '#mission' },
  { label: 'Join', href: '#join' },
] as const;

const PLATFORM_CARDS = [
  {
    icon: ShieldCheck,
    title: 'Identity First',
    body: 'Bot-Shield verification and account-bound checkout are built into launch. The platform is designed to make human validation the default.',
    tone: 'bg-white',
    iconTone: 'bg-[#111111] text-white',
  },
  {
    icon: Heart,
    title: 'AI as a Shield',
    body: 'AI stays behind the scenes for fraud pressure, safety signals, and launch operations. It does not fake your personality or your connection.',
    tone: 'bg-[#111111] text-white',
    iconTone: 'bg-[#ff5a1f] text-white',
  },
  {
    icon: Users,
    title: 'Built for Real Life',
    body: 'Dating, meetups, and real-world follow-through live in one product flow. The goal is less swiping theater and more actual conversation off-screen.',
    tone: 'bg-[#ff5a1f] text-[#111111]',
    iconTone: 'bg-white text-[#111111]',
  },
] as const;

const PRICING_PLANS = [
  {
    name: 'Bot-Shield Verification',
    price: '$1',
    desc: 'Human checkpoint before the badge is awarded.',
    link: SECURE_PLAN_LINKS.bot_shield,
    tone: 'bg-[#111111] text-white',
  },
  {
    name: 'Founding Member',
    price: '$14.99/mo',
    desc: 'Locked founder rate with account-bound checkout.',
    link: SECURE_PLAN_LINKS.founding_member,
    tone: 'bg-white',
  },
  {
    name: '3-Month Founder',
    price: '$39.99',
    desc: 'Short-term founder access with one upfront payment.',
    link: SECURE_PLAN_LINKS['3_month'],
    tone: 'bg-[#efe8da]',
  },
  {
    name: '12-Month Founder',
    price: '$99.99',
    desc: 'Best value for launch-year access.',
    link: SECURE_PLAN_LINKS['12_month'],
    tone: 'bg-[#efe8da]',
  },
  {
    name: 'Royalty Card',
    price: '$2,500',
    desc: 'Premium founder product. Current terms are provided privately at checkout.',
    link: SECURE_PLAN_LINKS.royalty,
    tone: 'bg-[#ff5a1f] text-white',
  },
] as const;

function HeroBackground() {
  return (
    <>
      <div className="fixed inset-0 z-0 hero-bg" />
      <div className="fixed inset-0 z-0 hero-bg-overlay" />
    </>
  );
}

function BrutalButton({
  href,
  children,
  dark = false,
}: {
  href: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center border-4 border-[#111111] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] no-underline transition-transform hover:-translate-x-1 hover:-translate-y-1 ${
        dark ? 'bg-[#111111] text-white' : 'bg-[#ff5a1f] text-white'
      } shadow-[6px_6px_0_0_#111111]`}
    >
      {children}
    </a>
  );
}

function SignupCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t-4 border-[#111111] bg-[#111111] px-3 py-2 text-white md:px-4 md:py-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 md:gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#f4efe7] md:text-sm md:tracking-[0.18em]">
          Bot-Shield verification is live now.
        </span>
        <a
          href={SECURE_PLAN_LINKS.bot_shield}
          className="inline-flex items-center justify-center border-4 border-white bg-[#ff5a1f] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white no-underline transition-transform hover:-translate-x-1 hover:-translate-y-1 shadow-[3px_3px_0_0_#ffffff] md:px-5 md:py-2 md:text-xs md:tracking-[0.18em] md:shadow-[4px_4px_0_0_#ffffff]"
        >
          Get Verified
        </a>
      </div>
    </div>
  );
}

function BetaCodeEntry() {
  const { betaAccess } = useAuth();
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await betaAccess(code);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/app';
      }, 600);
    } catch {
      setError('Invalid code');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mt-4 inline-flex items-center gap-2 border-4 border-[#111111] bg-[#dff6e6] px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#111111] shadow-[4px_4px_0_0_#111111]">
        <Check size={16} />
        Access granted
      </div>
    );
  }

  return (
    <div className="mt-6">
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="border-4 border-[#111111] bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#111111] transition-transform hover:-translate-x-1 hover:-translate-y-1 shadow-[4px_4px_0_0_#111111]"
        >
          <span className="inline-flex items-center gap-2">
            <KeyRound size={12} />
            Beta Tester? Enter Access Code
          </span>
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Access code"
            className="min-w-0 flex-1 border-4 border-[#111111] bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#111111] outline-none placeholder:text-[#7a746d]"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="border-4 border-[#111111] bg-[#111111] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-transform hover:-translate-x-1 hover:-translate-y-1 disabled:opacity-60 shadow-[4px_4px_0_0_#111111]"
          >
            {loading ? '...' : 'Enter'}
          </button>
        </form>
      )}
      {error && (
        <p className="mt-3 text-sm font-bold uppercase tracking-[0.16em] text-[#b42318]">
          {error}
        </p>
      )}
    </div>
  );
}

function VerificationSteps() {
  const steps = [
    {
      num: '01',
      title: 'Start Bot-Shield',
      desc: 'Begin the one-time human checkpoint from the public launch flow.',
    },
    {
      num: '02',
      title: 'Pass the Human Check',
      desc: 'Complete the liveness challenge and the account-bound Square step.',
    },
    {
      num: '03',
      title: 'Unlock the Badge',
      desc: 'The verified badge is awarded only after both checkpoints are complete.',
    },
  ];

  return (
    <section
      id="verification"
      className="border-b-4 border-[#111111] bg-[#111111] px-4 py-10 text-white md:px-12 md:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff8b61] md:mb-8 md:text-xs md:tracking-[0.24em]">
          Section 02 // Verification
        </div>
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          {steps.map(step => (
            <div
              key={step.num}
              className="border-4 border-white bg-[#1a1a1a] p-4 shadow-[6px_6px_0_0_#ff5a1f] md:p-6"
            >
              <div className="mb-2 text-3xl font-black tracking-tighter text-[#ff8b61] md:mb-4 md:text-5xl">
                {step.num}
              </div>
              <h3 className="mb-2 text-xl font-black uppercase tracking-tight md:mb-3 md:text-2xl">
                {step.title}
              </h3>
              <p className="text-xs font-medium leading-6 text-[#d7d3cc] md:text-sm md:leading-7">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section
      id="pricing"
      className="border-b-4 border-[#111111] bg-[#f4efe7] px-4 py-10 md:px-12 md:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a1f] md:mb-4 md:text-xs md:tracking-[0.24em]">
          Section 03 // Founder Pricing
        </div>
        <h2 className="mb-3 text-3xl font-black tracking-tighter text-[#111111] md:mb-4 md:text-7xl">
          pick your lane.
        </h2>
        <p className="mb-6 max-w-3xl text-sm font-medium leading-7 text-[#38322b] md:mb-10 md:text-lg md:leading-8">
          Every checkout route is account-bound. Public pricing is live, plain,
          and tied to the actual launch flow.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-5">
          {PRICING_PLANS.map(plan => (
            <a
              key={plan.name}
              href={plan.link}
              className={`block border-4 border-[#111111] p-4 no-underline shadow-[6px_6px_0_0_#111111] transition-transform hover:-translate-x-1 hover:-translate-y-1 md:p-6 ${plan.tone}`}
            >
              <div className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70 md:text-xs md:tracking-[0.18em]">
                Live
              </div>
              <div className="mt-2 text-2xl font-black tracking-tighter md:mt-4 md:text-3xl">
                {plan.price}
              </div>
              <h3 className="mt-2 text-lg font-black uppercase tracking-tight md:mt-4 md:text-2xl">
                {plan.name}
              </h3>
              <p className="mt-2 text-xs font-medium leading-6 opacity-80 md:mt-3 md:text-sm md:leading-7">
                {plan.desc}
              </p>
            </a>
          ))}
        </div>
        <p className="mt-5 max-w-4xl text-xs font-bold uppercase tracking-[0.12em] text-[#5c554d] md:mt-8 md:text-sm md:tracking-[0.16em]">
          Securely processed by Square. Customer purchases buy platform access
          and founder products. They are not charitable contributions.
        </p>
      </div>
    </section>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      new URLSearchParams(window.location.search).get('waitlist') ===
      'confirmed'
    );
  });

  useEffect(() => {
    if (!submitted || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('waitlist') !== 'confirmed') return;
    url.searchParams.delete('waitlist');
    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }, [submitted]);

  const waitlistReturnUrl =
    typeof window === 'undefined'
      ? 'https://youandinotai.com/?waitlist=confirmed#join'
      : `${window.location.origin}/?waitlist=confirmed#join`;

  const handleSubmit = () => {
    setSubmitted(false);
  };

  return (
    <section
      id="join"
      className="border-b-4 border-[#111111] bg-[#111111] px-4 py-10 text-white md:px-12 md:py-16"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff8b61] md:mb-4 md:text-xs md:tracking-[0.24em]">
          Section 05 // Join
        </div>
        <h2 className="text-3xl font-black tracking-tighter md:text-7xl">
          join the list.
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-[#d7d3cc] md:mt-4 md:text-lg md:leading-8">
          Get early access updates without the noise. The waitlist is simple by
          design.
        </p>
        <div className="mt-5 border-4 border-white bg-[#f4efe7] p-4 text-[#111111] shadow-[8px_8px_0_0_#ff5a1f] md:mt-8 md:p-6">
          {submitted ? (
            <div className="space-y-2 text-center md:space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.14em] md:gap-3 md:text-sm md:tracking-[0.18em]">
                <Check size={16} />
                You&apos;re on the list.
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#5c554d] md:text-xs md:tracking-[0.16em]">
                Launch updates will go to this address. Need help? Email
                support.
              </p>
            </div>
          ) : (
            <form
              action={WAITLIST_FORM_ACTION}
              method="POST"
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 md:flex-row md:gap-4"
            >
              <input
                type="hidden"
                name="_subject"
                value="New YouAndINotAI waitlist signup"
              />
              <input type="hidden" name="_next" value={waitlistReturnUrl} />
              <input type="hidden" name="_captcha" value="false" />
              <input
                type="hidden"
                name="_autoresponse"
                value="You're on the YouAndINotAI waitlist. No charge was made, and no account was created yet. We will send launch updates to this address."
              />
              <div className="relative min-w-0 flex-1">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a746d] md:left-4"
                />
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="[EMAIL]"
                  className="w-full border-4 border-[#111111] bg-white py-3 pl-10 pr-3 text-sm font-bold text-[#111111] outline-none placeholder:text-[#7a746d] md:py-4 md:pl-12 md:pr-4 md:text-base"
                />
              </div>
              <button
                type="submit"
                className="border-4 border-[#111111] bg-[#ff5a1f] px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition-transform hover:-translate-x-1 hover:-translate-y-1 disabled:opacity-60 shadow-[6px_6px_0_0_#111111] md:px-8 md:text-sm md:tracking-[0.18em]"
              >
                Join Now
              </button>
            </form>
          )}
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#5c554d] md:mt-4 md:text-xs md:tracking-[0.18em]">
            No spam. No bots. Just launch updates.
          </p>
        </div>
        <BetaCodeEntry />
      </div>
    </section>
  );
}

const LEGAL_CONTENT: Record<string, { title: string; body: string }> = {
  terms: {
    title: 'Terms of Service',
    body: `By using YouAndiNotAi ("the Platform"), you agree to these Terms of Service.\n\n1. ELIGIBILITY — You must be 18+ years old to use the Platform.\n2. VERIFICATION FLOW — Bot-Shield verification may be required for protected features. Fraudulent verification attempts result in account action or removal.\n3. CONDUCT — No harassment, spam, hate speech, or impersonation. Violations can result in immediate account termination.\n4. PAYMENTS — All payments are processed through secure account-bound Square checkout. Recurring subscriptions auto-renew unless canceled.\n5. CONTENT — You retain ownership of content you post. By posting, you grant YouAndiNotAi a license to display it on the Platform.\n6. DISCLAIMER — The Platform is provided "as is." We do not guarantee matches or outcomes.\n7. LIABILITY — Trash Or Treasure Online Recycler LLC's total liability is limited to fees paid in the prior 12 months.\n8. BILLING — The current Bot-Shield launch flow requires both a passed liveness challenge and a completed Square payment before the verified badge is granted.\n\nLast updated: March 2026. Contact: contact@youandinotai.com`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `YouAndiNotAi values your privacy.\n\nDATA WE COLLECT — Email address, profile information you provide, verification-state events, payment confirmation tied to your account, and waitlist signups you submit.\nDATA WE DO NOT SELL — We never sell your personal data. Period.\nTHIRD PARTIES — Square (payments), Cloudflare (hosting), and FormSubmit (waitlist capture and autoresponse). Each has their own privacy policy.\nCOOKIES — Minimal. Session cookies only. No ad trackers.\nDATA DELETION — Email contact@youandinotai.com to request full data deletion.\nSECURITY — All data is encrypted in transit, and protected services use authenticated account access.\n\nLast updated: April 2026.`,
  },
  age: {
    title: 'Age Policy',
    body: `YouAndiNotAi is strictly for users aged 18 and older.\n\nOur current launch flow does not claim government-ID verification in production. We require users to be 18+, and we reserve the right to remove accounts that appear to be underage or fraudulent.\n\nIf you believe a minor is using the Platform, report it immediately to contact@youandinotai.com.\n\nWe do not knowingly collect personal data from minors.`,
  },
  refund: {
    title: 'Refund Policy',
    body: `Refund eligibility varies by product:\n\nBOT-SHIELD ($1) — Non-refundable once the challenge and payment checkpoint have started.\nFOUNDING MEMBER ($14.99/mo) — Cancel anytime. No refunds for partial months. Access remains until the current billing period ends.\n3-MONTH FOUNDER ($39.99) — See the full refund policy for current eligibility.\n12-MONTH FOUNDER ($99.99) — See the full refund policy for current eligibility.\nROYALTY CARD ($2,500) — Final sale under the published product terms.\n\nAll refunds are processed through Square. Contact: contact@youandinotai.com`,
  },
};

function LegalModal({ type, onClose }: { type: string; onClose: () => void }) {
  const content = LEGAL_CONTENT[type];
  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto border-4 border-[#111111] bg-[#f4efe7] p-6 shadow-[10px_10px_0_0_#111111]"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-2xl font-black uppercase tracking-tight text-[#111111]">
            {content.title}
          </h3>
          <button
            onClick={onClose}
            className="border-4 border-[#111111] bg-white p-2 text-[#111111] transition-transform hover:-translate-x-1 hover:-translate-y-1 shadow-[4px_4px_0_0_#111111]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="whitespace-pre-line text-sm font-medium leading-7 text-[#2c2924]">
          {content.body}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="w-full max-w-md border-4 border-[#111111] bg-[#dff6e6] p-8 text-center text-[#111111] shadow-[10px_10px_0_0_#111111]"
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#111111] bg-white">
          <img
            src="/bot-shield-logo.png"
            alt="Bot-Shield Verified"
            className="h-10 w-10 object-contain"
          />
        </div>
        <h3 className="text-3xl font-black uppercase tracking-tight">
          Bot-Shield Verified
        </h3>
        <p className="mt-3 text-sm font-medium leading-7">
          Your verification is complete. Square handles receipt delivery for the
          payment email used at checkout.
        </p>
        <button
          onClick={onClose}
          className="mt-6 border-4 border-[#111111] bg-[#111111] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-transform hover:-translate-x-1 hover:-translate-y-1 shadow-[6px_6px_0_0_#111111]"
        >
          Let&apos;s Go
        </button>
      </motion.div>
    </motion.div>
  );
}

function Footer({ onLegal }: { onLegal: (type: string) => void }) {
  const legalKeys = ['terms', 'privacy', 'age', 'refund'] as const;

  return (
    <footer className="border-t-4 border-[#111111] bg-[#efe8da] px-4 py-6 text-[#111111] md:px-12 md:py-10">
      <div className="mx-auto grid max-w-7xl gap-6 md:gap-8 md:grid-cols-[1.2fr_0.8fr_1fr]">
        <div>
          <div className="text-2xl font-black uppercase tracking-tighter md:text-3xl">
            YOUANDINOTAI<span className="text-[#ff5a1f]">.</span>
          </div>
          <p className="mt-3 max-w-lg text-xs font-medium leading-6 text-[#3f3a34] md:mt-4 md:text-sm md:leading-7">
            Human-first social platform for dating, meetups, and real-world
            connection. Bot-Shield and account-bound checkout are live now.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.14em] md:text-sm md:tracking-[0.18em]">
            Launch Links
          </h4>
          <div className="mt-3 flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.1em] md:mt-4 md:gap-3 md:text-sm md:tracking-[0.12em]">
            <a href="#pricing" className="no-underline hover:text-[#ff5a1f]">
              Pricing
            </a>
            <a href="#join" className="no-underline hover:text-[#ff5a1f]">
              Waitlist
            </a>
            <a href="/support" className="no-underline hover:text-[#ff5a1f]">
              Support
            </a>
            <a
              href="mailto:[EMAIL]"
              className="no-underline hover:text-[#ff5a1f]"
            >
              Contact
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.14em] md:text-sm md:tracking-[0.18em]">
            Policy
          </h4>
          <div className="mt-3 flex flex-wrap gap-2 md:mt-4 md:gap-3">
            {legalKeys.map(key => (
              <button
                key={key}
                onClick={() => onLegal(key)}
                className="border-4 border-[#111111] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition-transform hover:-translate-x-1 hover:-translate-y-1 shadow-[4px_4px_0_0_#111111] md:px-4 md:py-2 md:text-xs md:tracking-[0.16em]"
              >
                {LEGAL_CONTENT[key].title
                  .replace(' Policy', '')
                  .replace(' of Service', '')}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-5 max-w-7xl border-t-4 border-[#111111] pt-4 md:mt-8 md:pt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#5c554d] md:text-xs md:tracking-[0.16em]">
          © 2026 Trash Or Treasure Online Recycler LLC. YouAndiNotAi.com is a
          for-profit platform.
        </p>
      </div>
    </footer>
  );
}

export function PublicSupportPage() {
  const [legalModal, setLegalModal] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <HeroBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <main className="flex-1 px-6 py-12 md:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <a
                href="/"
                className="border-4 border-white bg-[#111111] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white no-underline transition-transform hover:-translate-x-1 hover:-translate-y-1 shadow-[4px_4px_0_0_#ffffff]"
              >
                Back Home
              </a>
              <div className="border-4 border-white bg-[#ff5a1f] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white shadow-[4px_4px_0_0_#ffffff]">
                Support
              </div>
            </div>

            <section className="border-4 border-white bg-[#f4efe7] p-8 text-[#111111] shadow-[10px_10px_0_0_#ff5a1f]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ff5a1f]">
                YouAndiNotAi Support
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tighter md:text-6xl">
                help for receipts, verification, privacy, and account issues.
              </h1>
              <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-[#3f3a34]">
                Signed-in members can use the in-app support center to chat with
                support, escalate a ticket, and review prior requests. If you
                are not signed in yet, use the email contact below or create an
                account first.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="border-4 border-[#111111] bg-white p-5 shadow-[6px_6px_0_0_#111111]">
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    Account Support
                  </h2>
                  <p className="mt-3 text-sm font-medium leading-7 text-[#3f3a34]">
                    Use the support center after sign-in for payment receipts,
                    Bot-Shield verification, privacy requests, and account
                    troubleshooting.
                  </p>
                </div>
                <div className="border-4 border-[#111111] bg-white p-5 shadow-[6px_6px_0_0_#111111]">
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    Direct Contact
                  </h2>
                  <p className="mt-3 text-sm font-medium leading-7 text-[#3f3a34]">
                    For general support or login issues, email the support inbox
                    and include the address tied to your account when possible.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <BrutalButton href="/login" dark>
                  Sign In
                </BrutalButton>
                <BrutalButton href="/register">Create Account</BrutalButton>
                <BrutalButton href="mailto:contact@youandinotai.com?subject=YouAndiNotAi%20Support">
                  Email Support
                </BrutalButton>
                <BrutalButton href="/app/support">Member Support</BrutalButton>
              </div>
            </section>
          </div>
        </main>
        <Footer onLegal={type => setLegalModal(type)} />
      </div>

      <AnimatePresence>
        {legalModal && (
          <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [legalModal, setLegalModal] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') === 'success' || params.get('transactionId')) {
      setShowSuccess(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <ThemeProvider>
    <div className="mx-auto min-h-screen max-w-[1600px] border-x-4 border-[#111111] bg-[#f4efe7] text-[#111111] pb-cta">
      <nav className="sticky top-0 z-50 border-b-4 border-[#111111] bg-white px-4 py-3 md:px-12 md:py-5">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          <div className="text-xl font-black uppercase tracking-tighter md:text-3xl">
            YOUANDINOTAI<span className="text-[#ff5a1f]">.</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_ITEMS.map(item => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-black uppercase tracking-[0.16em] no-underline hover:text-[#ff5a1f]"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <BrutalButton href={SECURE_PLAN_LINKS.bot_shield} dark>
              Get Verified
            </BrutalButton>
            <ThemeToggle />
          </div>

          <button
            onClick={() => setMenuOpen(value => !value)}
            className="inline-flex items-center justify-center border-4 border-[#111111] bg-white p-2 md:hidden shadow-[4px_4px_0_0_#111111]"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="mt-5 flex flex-col gap-3 border-t-4 border-[#111111] pt-5 md:hidden">
            {NAV_ITEMS.map(item => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-4 border-[#111111] bg-[#f4efe7] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] no-underline shadow-[4px_4px_0_0_#111111]"
              >
                {item.label}
              </a>
            ))}
            <BrutalButton href={SECURE_PLAN_LINKS.bot_shield} dark>
              Get Verified
            </BrutalButton>
          </div>
        )}
      </nav>

      <div className="border-b-4 border-[#111111] bg-[#111111] px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-[#f4efe7] md:px-12 md:py-3 md:text-xs md:tracking-[0.2em]">
        Founder pricing is live. Launch day is April 4, 2026.
      </div>

      <section
        id="about"
        className="grid border-b-4 border-[#111111] md:min-h-[78vh] md:grid-cols-12"
      >
        <div className="border-b-4 border-[#111111] bg-white px-4 py-8 md:col-span-8 md:border-b-0 md:border-r-4 md:px-12 md:py-20">
          <div className="max-w-4xl">
            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a1f] md:mb-4 md:text-xs md:tracking-[0.24em]">
              Section 01 // Human Only
            </div>
            <h1 className="text-4xl font-black lowercase leading-[0.9] tracking-tighter md:text-8xl xl:text-9xl">
              real people.
              <br />
              zero bot noise.
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-medium leading-snug text-[#2f2a24] md:mt-8 md:text-3xl md:leading-tight">
              A human-first social platform for dating, meetups, and real-world
              connection. AI is used to protect the experience, not perform it.
            </p>
            <div className="mt-5 inline-block border-l-4 border-[#ff5a1f] bg-[#fff6f1] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#111111] md:mt-8 md:px-4 md:py-3 md:text-sm md:tracking-[0.16em]">
              Bot-Shield verification and account-bound checkout are live now.
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4 md:mt-10">
              <BrutalButton href={SECURE_PLAN_LINKS.bot_shield} dark>
                Get Verified
              </BrutalButton>
              <BrutalButton href="#pricing">See Pricing</BrutalButton>
            </div>
          </div>
        </div>

        <div className="bg-[#ff5a1f] px-4 py-8 text-[#111111] md:col-span-4 md:px-10 md:py-16">
          <div className="space-y-4 md:space-y-6">
            <div className="border-t-4 border-[#111111] pt-4 md:pt-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter md:text-4xl">
                Launch Status
              </h2>
              <p className="mt-2 text-base font-bold leading-7 md:mt-4 md:text-lg md:leading-8">
                The public surface is product-first: verification, pricing,
                support, and profile flow.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
              <div className="border-4 border-[#111111] bg-white p-4 shadow-[6px_6px_0_0_#111111] md:p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ff5a1f] md:text-xs md:tracking-[0.18em]">
                  Live
                </div>
                <div className="mt-1 text-lg font-black uppercase tracking-tight md:mt-2 md:text-2xl">
                  Bot-Shield Flow
                </div>
                <p className="mt-1 text-xs font-medium leading-6 text-[#38322b] md:mt-2 md:text-sm md:leading-7">
                  Verification stays tied to the real checkout path instead of
                  anonymous payment links.
                </p>
              </div>
              <div className="border-4 border-[#111111] bg-white p-4 shadow-[6px_6px_0_0_#111111] md:p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ff5a1f] md:text-xs md:tracking-[0.18em]">
                  Launch
                </div>
                <div className="mt-1 text-lg font-black uppercase tracking-tight md:mt-2 md:text-2xl">
                  April 4, 2026
                </div>
                <p className="mt-1 text-xs font-medium leading-6 text-[#38322b] md:mt-2 md:text-sm md:leading-7">
                  Founder pricing, support, and early-access capture are all
                  wired into the same surface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="platform"
        className="border-b-4 border-[#111111] bg-[#f4efe7] px-4 py-10 md:px-12 md:py-16"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a1f] md:mb-4 md:text-xs md:tracking-[0.24em]">
            The Social
          </div>
          <h2 className="mb-6 text-3xl font-black tracking-tighter md:mb-10 md:text-7xl">
            how we connect.
          </h2>
          <div className="grid gap-4 md:gap-6 md:grid-cols-3">
            {PLATFORM_CARDS.map(card => (
              <div
                key={card.title}
                className={`border-4 border-[#111111] p-5 shadow-[6px_6px_0_0_#111111] md:p-8 ${card.tone}`}
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center border-4 border-[#111111] md:mb-6 md:h-14 md:w-14 ${card.iconTone}`}
                >
                  <card.icon size={20} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight md:text-2xl">
                  {card.title}
                </h3>
                <p className="mt-3 text-xs font-medium leading-6 opacity-85 md:mt-4 md:text-sm md:leading-7">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <VerificationSteps />
      <PricingSection />

      <section
        id="mission"
        className="border-b-4 border-[#111111] bg-white px-4 py-10 md:px-12 md:py-16"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a1f] md:mb-4 md:text-xs md:tracking-[0.24em]">
            Section 04 // Impact
          </div>
          <h2 className="text-3xl font-black tracking-tighter md:text-7xl">
            silent impact.
          </h2>
          <div className="mt-6 grid gap-4 md:mt-10 md:gap-8 md:grid-cols-2">
            <div className="border-4 border-[#111111] bg-[#f4efe7] p-4 shadow-[6px_6px_0_0_#111111] md:p-6">
              <p className="text-sm font-medium leading-7 text-[#2f2a24] md:text-lg md:leading-8">
                We do not market this platform as a charity. It has to stand on
                product quality, trust, and real human value first.
              </p>
            </div>
            <div className="border-4 border-[#111111] bg-[#111111] p-4 text-white shadow-[6px_6px_0_0_#ff5a1f] md:p-6">
              <p className="text-sm font-medium leading-7 text-[#d7d3cc] md:text-lg md:leading-8">
                Any later mission support follows the current operating policy
                and stays out of the sales pitch. Customer purchases are
                platform purchases, not charitable contributions.
              </p>
            </div>
          </div>
          <div className="mt-6 border-4 border-[#111111] bg-[#ff5a1f] px-4 py-5 text-center text-lg font-black italic tracking-tight text-white shadow-[8px_8px_0_0_#111111] md:mt-10 md:px-6 md:py-8 md:text-2xl">
            &quot;The Silent Founder would thank you, but he stays silent.&quot;
          </div>
        </div>
      </section>

      <WaitlistForm />

      <section className="border-b-4 border-[#111111] bg-white px-4 py-10 text-center md:px-12 md:py-16">
        <div className="mx-auto max-w-xl">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a1f] md:mb-4 md:text-xs md:tracking-[0.24em]">
            Section 06 // Share
          </div>
          <h2 className="text-3xl font-black tracking-tighter md:text-6xl">
            share the platform.
          </h2>
          <p className="mt-3 text-sm font-medium leading-7 text-[#3f3a34] md:mt-4 md:text-lg md:leading-8">
            Scan to visit or pass it to someone who is tired of fake profiles
            and low-trust noise.
          </p>
          <div className="mx-auto mt-5 inline-block border-4 border-[#111111] bg-[#f4efe7] p-3 shadow-[8px_8px_0_0_#111111] md:mt-8 md:p-4">
            <img
              src="/qrcode.png"
              alt="Scan to visit youandinotai.com"
              width={160}
              height={160}
              className="mx-auto h-auto max-w-[160px] bg-white md:max-w-[220px]"
            />
          </div>
        </div>
      </section>

      <Footer onLegal={type => setLegalModal(type)} />
      <SignupCTA />

      <AnimatePresence>
        {legalModal && (
          <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
        )}
        {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
      </AnimatePresence>
    </div>
    </ThemeProvider>
  );
}
