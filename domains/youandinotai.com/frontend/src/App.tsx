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
  ChevronRight,
  Sparkles
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
  { label: 'Trust', href: '#trust' },
  { label: 'Join', href: '#join' },
] as const;

const PLATFORM_CARDS = [
  {
    icon: ShieldCheck,
    title: 'Identity First',
    body: 'Bot-Shield verification and account-bound checkout are built into launch. The platform is designed to make human validation the default.',
  },
  {
    icon: Heart,
    title: 'AI as a Shield',
    body: 'AI stays behind the scenes for fraud pressure, safety signals, and launch operations. It does not fake your personality or your connection.',
  },
  {
    icon: Users,
    title: 'Built for Real Life',
    body: 'Dating, meetups, and real-world follow-through live in one product flow. The goal is less swiping theater and more actual conversation off-screen.',
  },
] as const;

const PRICING_PLANS = [
  {
    name: 'Bot-Shield Verification',
    price: '$1',
    desc: 'Human checkpoint before the badge is awarded.',
    link: SECURE_PLAN_LINKS.bot_shield,
    popular: false,
  },
  {
    name: 'Founding Member',
    price: '$14.99/mo',
    desc: 'Locked founder rate with account-bound checkout.',
    link: SECURE_PLAN_LINKS.founding_member,
    popular: true,
  },
  {
    name: '3-Month Founder',
    price: '$39.99',
    desc: 'Short-term founder access with one upfront payment.',
    link: SECURE_PLAN_LINKS['3_month'],
    popular: false,
  },
  {
    name: '12-Month Founder',
    price: '$99.99',
    desc: 'Best value for launch-year access.',
    link: SECURE_PLAN_LINKS['12_month'],
    popular: false,
  },
  {
    name: 'Royalty Card',
    price: '$2,500',
    desc: 'Premium founder product. Current terms are provided privately at checkout.',
    link: SECURE_PLAN_LINKS.royalty,
    popular: false,
  },
] as const;

function HeroBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-zinc-950">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-600/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-stone-600/20 blur-[120px]" />
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-amber-600/10 blur-[100px]" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay" />
    </div>
  );
}

function GlassButton({
  href,
  children,
  primary = false,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
}: {
  href?: string;
  children: React.ReactNode;
  primary?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const baseClasses = `relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 backdrop-blur-md overflow-hidden ${className}`;
  
  const variantClasses = primary
    ? 'bg-gradient-to-r from-yellow-500/80 to-amber-500/80 text-white border border-white/20 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:border-white/40'
    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-lg';

  const inner = (
    <>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {primary && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-white/20 to-yellow-500/0 z-0"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        className={`${baseClasses} ${variantClasses}`}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
    >
      {inner}
    </motion.button>
  );
}

function SignupCTA() {
  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-white/10 bg-zinc-950/80 backdrop-blur-xl px-3 py-3 text-white md:px-4"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          <span className="text-xs font-semibold tracking-wide text-zinc-200 md:text-sm">
            Bot-Shield verification is live now.
          </span>
        </div>
        <GlassButton href={SECURE_PLAN_LINKS.bot_shield} primary className="!py-2 !px-4 !text-xs">
          Get Verified
        </GlassButton>
      </div>
    </motion.div>
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-5 py-3 text-sm font-semibold tracking-wide text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
      >
        <Check size={16} />
        Access granted
      </motion.div>
    );
  }

  return (
    <div className="mt-8">
      {!showInput ? (
        <GlassButton onClick={() => setShowInput(true)}>
          <KeyRound size={16} />
          Beta Tester? Enter Access Code
        </GlassButton>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Access code"
            className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold tracking-wide text-white outline-none backdrop-blur-md transition-all focus:border-yellow-500/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(234,179,8,0.2)] placeholder:text-zinc-400"
            autoFocus
          />
          <GlassButton type="submit" disabled={loading} primary>
            {loading ? '...' : 'Enter'}
          </GlassButton>
        </motion.form>
      )}
      {error && (
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="mt-3 text-sm font-semibold tracking-wide text-red-400"
        >
          {error}
        </motion.p>
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
    <section id="verification" className="relative z-10 py-20 px-4 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-20 text-center"
        >
          <span className="inline-block rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-yellow-400 mb-4">
            Section 02 // Verification
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
            Prove you're human.
          </h2>
        </motion.div>
        <div className="grid gap-6 md:gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-colors hover:bg-white/10"
            >
              <div className="absolute -right-4 -top-4 text-[100px] font-black leading-none text-white/[0.03] select-none">
                {step.num}
              </div>
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-400 ring-1 ring-yellow-500/30">
                <ShieldCheck size={24} />
              </div>
              <h3 className="mb-3 text-2xl font-bold tracking-tight text-white">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="relative z-10 py-20 px-4 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-20 text-center"
        >
          <span className="inline-block rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400 mb-4">
            Section 03 // Founder Pricing
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-6xl mb-6">
            Pick your lane.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-300">
            Every checkout route is account-bound. Public pricing is live, plain,
            and tied to the actual launch flow.
          </p>
        </motion.div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {PRICING_PLANS.map((plan, i) => (
            <motion.a
              key={plan.name}
              href={plan.link}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 transition-all duration-300 ${
                plan.popular 
                  ? 'border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.15)] hover:shadow-[0_0_40px_rgba(234,179,8,0.25)]' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              } backdrop-blur-md`}
            >
              {plan.popular && (
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none" />
              )}
              
              <div className="relative z-10">
                {plan.popular && (
                  <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 px-3 py-1 text-xs font-bold text-white shadow-[0_0_10px_rgba(234,179,8,0.4)]">
                    Most Popular
                  </span>
                )}
                {!plan.popular && (
                  <span className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
                    Live
                  </span>
                )}
                
                <div className="mb-2 text-3xl font-bold text-white md:text-4xl">
                  {plan.price}
                </div>
                <h3 className="mb-4 text-lg font-semibold text-zinc-200">
                  {plan.name}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {plan.desc}
                </p>
              </div>
              
              <div className="relative z-10 mt-8">
                <div className={`inline-flex items-center gap-2 text-sm font-semibold ${plan.popular ? 'text-yellow-400' : 'text-zinc-300'} group-hover:text-white transition-colors`}>
                  Select Plan <ChevronRight size={16} className="transition-transform group-hover:tranzinc-x-1" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center text-xs font-medium tracking-wide text-zinc-500"
        >
          Securely processed by Square. Customer purchases buy platform access
          and founder products. They are commercial transactions, not gifts.
        </motion.p>
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
    <section id="join" className="relative z-10 py-20 px-4 md:px-12 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-block rounded-full bg-stone-500/10 border border-stone-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">
            Section 05 // Join
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-6xl mb-6">
            Join the list.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-300 mb-10">
            Get early access updates without the noise. The waitlist is simple by design.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10 backdrop-blur-xl shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-stone-500/5 pointer-events-none" />
          
          <div className="relative z-10">
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  <Check size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white">You're on the list.</h3>
                <p className="text-zinc-400">
                  Launch updates will go to your address. Need help? Email support.
                </p>
              </motion.div>
            ) : (
              <form
                action={WAITLIST_FORM_ACTION}
                method="POST"
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 sm:flex-row"
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
                    size={20}
                    className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-400"
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-full border border-white/20 bg-white/5 py-4 pl-12 pr-6 text-base font-medium text-white outline-none backdrop-blur-md transition-all focus:border-yellow-500/50 focus:bg-white/10 focus:shadow-[0_0_15px_rgba(234,179,8,0.2)] placeholder:text-zinc-400"
                  />
                </div>
                <GlassButton type="submit" primary className="!py-4 sm:w-auto w-full">
                  Join Now
                </GlassButton>
              </form>
            )}
            <p className="mt-6 text-xs font-medium tracking-wide text-zinc-500">
              No spam. No bots. Just launch updates.
            </p>
          </div>
        </motion.div>
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
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-xl md:p-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <h3 className="text-2xl font-bold text-white">
            {content.title}
          </h3>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
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
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/90 p-8 text-center shadow-2xl backdrop-blur-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-400 ring-4 ring-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <ShieldCheck size={40} />
          </div>
          <h3 className="text-3xl font-bold text-white">
            Verified.
          </h3>
          <p className="mt-4 text-zinc-300 leading-relaxed">
            Your verification is complete. Square handles receipt delivery for the
            payment email used at checkout.
          </p>
          <div className="mt-8">
            <GlassButton onClick={onClose} primary className="w-full">
              Let's Go
            </GlassButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Footer({ onLegal }: { onLegal: (type: string) => void }) {
  const legalKeys = ['terms', 'privacy', 'age', 'refund'] as const;

  return (
    <footer className="relative z-10 border-t border-white/10 bg-zinc-950/50 backdrop-blur-md px-4 py-12 md:px-12 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 md:gap-16 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="text-2xl font-black tracking-tight text-white md:text-3xl">
            YouAndINotAI<span className="text-yellow-500">.</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
            Human-first social platform for dating, meetups, and real-world
            connection. Bot-Shield and account-bound checkout are live now.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-white">
            Launch Links
          </h4>
          <div className="mt-6 flex flex-col gap-4 text-sm font-medium text-zinc-400">
            <a href="#pricing" className="transition-colors hover:text-yellow-400">
              Pricing
            </a>
            <a href="#join" className="transition-colors hover:text-yellow-400">
              Waitlist
            </a>
            <a href="/support" className="transition-colors hover:text-yellow-400">
              Support
            </a>
            <a href="mailto:contact@youandinotai.com" className="transition-colors hover:text-yellow-400">
              Contact
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-wide text-white">
            Policy
          </h4>
          <div className="mt-6 flex flex-col gap-4 text-sm font-medium text-zinc-400">
            {legalKeys.map(key => (
              <button
                key={key}
                onClick={() => onLegal(key)}
                className="text-left transition-colors hover:text-yellow-400"
              >
                {LEGAL_CONTENT[key].title}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-7xl border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-zinc-500">
          © 2026 Trash Or Treasure Online Recycler LLC.
        </p>
        <p className="text-xs text-zinc-500">
          YouAndiNotAi.com is a for-profit platform.
        </p>
      </div>
    </footer>
  );
}

export function PublicSupportPage() {
  const [legalModal, setLegalModal] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-yellow-500/30 selection:text-white">
      <HeroBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <main className="flex-1 px-6 py-12 md:px-12 md:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 flex items-center justify-between">
              <GlassButton href="/">
                Back Home
              </GlassButton>
            </div>

            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:p-12 shadow-2xl"
            >
              <div className="inline-block rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-yellow-400 mb-6">
                Support Center
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl mb-6">
                How can we help?
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-zinc-300 mb-12">
                Signed-in members can use the in-app support center to chat with
                support, escalate a ticket, and review prior requests. If you
                are not signed in yet, use the email contact below or create an
                account first.
              </p>

              <div className="grid gap-6 md:grid-cols-2 mb-12">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-400">
                    <ShieldCheck size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-3">
                    Account Support
                  </h2>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    Use the support center after sign-in for payment receipts,
                    Bot-Shield verification, privacy requests, and account
                    troubleshooting.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-stone-500/20 text-stone-400">
                    <Mail size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-3">
                    Direct Contact
                  </h2>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    For general support or login issues, email the support inbox
                    and include the address tied to your account when possible.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <GlassButton href="/login" primary>
                  Sign In
                </GlassButton>
                <GlassButton href="/register">
                  Create Account
                </GlassButton>
                <GlassButton href="mailto:contact@youandinotai.com?subject=YouAndiNotAi%20Support">
                  Email Support
                </GlassButton>
                <GlassButton href="/app/support">
                  Member Support
                </GlassButton>
              </div>
            </motion.section>
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
      <div className="relative min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-yellow-500/30 selection:text-white pb-cta">
        <HeroBackground />
        
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-zinc-950/50 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-4 md:px-12 flex items-center justify-between">
            <div className="text-xl font-black tracking-tight text-white md:text-2xl">
              YouAndINotAI<span className="text-yellow-500">.</span>
            </div>

            <div className="hidden items-center gap-8 md:flex">
              {NAV_ITEMS.map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-semibold text-zinc-300 transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <GlassButton href={SECURE_PLAN_LINKS.bot_shield} primary className="!py-2 !px-5">
                Get Verified
              </GlassButton>
            </div>

            <button
              onClick={() => setMenuOpen(value => !value)}
              className="inline-flex items-center justify-center rounded-full bg-white/5 p-2 text-white md:hidden hover:bg-white/10 transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <AnimatePresence>
            {menuOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/10 bg-zinc-900/95 backdrop-blur-xl md:hidden"
              >
                <div className="flex flex-col gap-2 p-4">
                  {NAV_ITEMS.map(item => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
                    <GlassButton href={SECURE_PLAN_LINKS.bot_shield} primary className="w-full">
                      Get Verified
                    </GlassButton>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        <div className="relative z-10 pt-20">
          <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-stone-500/20 border-b border-white/10 px-4 py-2 text-center">
            <span className="text-xs font-semibold tracking-wide text-white md:text-sm">
              Founder pricing is live. Bot-Shield verification is live.
            </span>
          </div>

          <section id="about" className="relative flex min-h-[85vh] items-center px-4 py-20 md:px-12">
            <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-2 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-yellow-400 mb-6">
                  <Sparkles size={14} /> Section 01 // Human Only
                </div>
                <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl lg:text-8xl">
                  Real people.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                    Zero bot noise.
                  </span>
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-zinc-300 md:text-xl max-w-lg">
                  A human-first social platform for dating, meetups, and
                  real-world connection. AI is used to protect the experience, not
                  perform it.
                </p>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <GlassButton href={SECURE_PLAN_LINKS.bot_shield} primary className="!py-4 !px-8 text-base">
                    Get Verified
                  </GlassButton>
                  <GlassButton href="#pricing" className="!py-4 !px-8 text-base">
                    See Pricing
                  </GlassButton>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-yellow-500/30 to-amber-500/30 blur-2xl" />
                <div className="relative rounded-3xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl shadow-2xl md:p-10">
                  <h2 className="text-2xl font-bold text-white mb-4">Launch Status</h2>
                  <p className="text-zinc-300 mb-8">
                    The public surface is product-first: verification, pricing,
                    support, and profile flow.
                  </p>
                  
                  <div className="space-y-4">
                    {[
                      { title: 'Bot-Shield Flow', status: 'Live', color: 'from-green-500/20 to-emerald-500/20', text: 'text-green-400' },
                      { title: 'Founder Checkouts', status: 'Live', color: 'from-yellow-500/20 to-amber-500/20', text: 'text-yellow-400' },
                      { title: 'Profiles & Social', status: 'Waitlist', color: 'from-zinc-500/20 to-zinc-400/20', text: 'text-zinc-400' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
                        <span className="font-semibold text-white">{item.title}</span>
                        <span className={`rounded-full bg-gradient-to-r ${item.color} px-3 py-1 text-xs font-bold ${item.text}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section id="platform" className="relative z-10 py-20 px-4 md:px-12 md:py-32 bg-zinc-950/50">
            <div className="mx-auto max-w-7xl">
               <div className="grid gap-8 md:grid-cols-3">
                {PLATFORM_CARDS.map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-colors hover:bg-white/10"
                  >
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner">
                      <card.icon size={28} />
                    </div>
                    <h3 className="mb-4 text-2xl font-bold text-white">{card.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{card.body}</p>
                  </motion.div>
                ))}
               </div>
            </div>
          </section>

          <VerificationSteps />
          <PricingSection />
          <WaitlistForm />
        </div>

        <Footer onLegal={type => setLegalModal(type)} />
        <SignupCTA />
      </div>

      <AnimatePresence>
        {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
        {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
      </AnimatePresence>
    </ThemeProvider>
  );
}

