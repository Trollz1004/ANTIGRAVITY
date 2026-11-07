import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  KeyRound,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';

import { useAuth } from './lib/auth';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { DreamSpaceStage } from './components/DreamSpaceStage';

type LegalDocKey = 'terms' | 'privacy' | 'age' | 'refund';

const LEGAL_DOCS: Record<
  LegalDocKey,
  { title: string; updated: string; sections: { h: string; p: string }[] }
> = {
  terms: {
    title: 'Terms of Service',
    updated: 'Last Updated: April 2026',
    sections: [
      {
        h: '1. 18+ Eligibility',
        p: 'YouAndINotAI is strictly for adults 18 years of age or older. By creating an account or accessing the platform, you represent and warrant that you are at least 18 years old and legally able to enter into a binding contract.',
      },
      {
        h: '2. Account-Bound Verification & Memberships',
        p: 'Bot-Shield verification ($1) and Founder memberships are bound to your authenticated YouAndINotAI account. Sharing accounts, automated scraping, or impersonating another person is grounds for immediate account termination.',
      },
      {
        h: '3. Community Conduct & Safety',
        p: 'Harassment, non-consensual content, spam, unauthorized advertising, and deceptive identity practices are prohibited. Members may block or report any account at any time from profiles, messages, or boards.',
      },
      {
        h: '4. Operator & Governing Law',
        p: 'YouAndINotAI is operated by Trash Or Treasure Online Recycler LLC in the State of Florida, USA.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last Updated: April 2026',
    sections: [
      {
        h: '1. Data We Collect',
        p: 'We collect the account details you provide (email, display name, date of birth, profile prompts, and optional photos), verification status, and in-app activity needed to operate matching, messaging, and support.',
      },
      {
        h: '2. How Your Data Is Used',
        p: 'Your data is used solely to deliver YouAndINotAI product features, verify human accounts, process Square checkout sessions, and protect member safety. We do not sell personal data to third-party data brokers or ad networks.',
      },
      {
        h: '3. Self-Service Export & 30-Day Account Deletion',
        p: 'Authenticated members can request a full data export, disable location sharing, or start the 30-day account deletion clock directly inside the Privacy Center (/app/privacy) or by emailing contact@youandinotai.com.',
      },
    ],
  },
  age: {
    title: '18+ Age & Identity Policy',
    updated: 'Last Updated: April 2026',
    sections: [
      {
        h: '1. Mandatory 18+ Gate',
        p: 'youandinotai.com is for adults 18 and over. Every registration requires an explicit date-of-birth check and affirmative 18+ confirmation before an account is created.',
      },
      {
        h: '2. Liveness & Bot-Shield Check',
        p: 'To unlock full discovery, messaging, and video features, members complete a live camera gesture check and a $1 Square Bot-Shield verification bound to their account.',
      },
      {
        h: '3. Zero Tolerance for Underage Accounts',
        p: 'Any account suspected of belonging to a minor is immediately suspended and purged.',
      },
    ],
  },
  refund: {
    title: 'Billing, Refund & Cancellation Policy',
    updated: 'Last Updated: April 2026',
    sections: [
      {
        h: '1. Square Account-Bound Checkout',
        p: 'All payments are processed securely by Square and linked to your signed-in YouAndINotAI account.',
      },
      {
        h: '2. Subscriptions & Prepaid Tiers',
        p: 'Recurring Founding Member subscriptions ($14.99/mo) may be cancelled at any time through support or your account settings before the next billing cycle. Prepaid 3-Month ($39.99) and 12-Month ($99.99) plans remain active for their paid term and do not auto-renew.',
      },
      {
        h: '3. Billing Support & Disputes',
        p: 'If a duplicate charge or technical error occurs during checkout, contact support through /app/support or email contact@youandinotai.com with your account email for prompt resolution.',
      },
    ],
  },
};

function getCheckedTimeLabel(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `checked ${hh}:${mm}`;
}

export function PublicSupportPage() {
  const checkedLabel = getCheckedTimeLabel();

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#F4F1EA] font-sans">
      <header className="sticky top-0 z-50 h-16 border-b border-[#3A3F45] bg-[#0A0B0D]/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <span className="text-[14px] font-semibold text-[#C9CBCE]">
              CLAUDE&apos;s N Joshua&apos;s
            </span>
            <span className="text-[#3A3F45]">/</span>
            <span className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#F4F1EA]">
              YouAndINotAI
            </span>
            <span className="hidden rounded-full border border-[#FFD21E] bg-[#12151A] px-2.5 py-0.5 text-[14px] font-medium text-[#FFD21E] sm:inline-flex">
              #TeamClaudeForLife
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="ds-status-pill hidden md:inline-flex">
              <span className="ds-status-dot bg-[#58D68D]" />
              <span>Support Online · {checkedLabel}</span>
            </span>
            <Link to="/login" className="ds-btn-ghost text-sm">
              Sign In
            </Link>
            <Link to="/" className="ds-btn-signal text-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="ds-panel p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#3A3F45] bg-[#1A1E25] px-3 py-1 font-display text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
              08 / MEMBER SUPPORT &amp; SAFETY GUIDE
            </span>
            <span className="text-[14px] text-[#9DA3AA]">
              youandinotai.com is for adults 18 and over.
            </span>
          </div>

          <h1 className="mt-5 font-display text-[32px] font-bold leading-[1.08] tracking-[-0.02em] text-[#F4F1EA] sm:text-[48px]">
            Support that does not hide behind a maze.
          </h1>
          <p className="mt-4 max-w-[65ch] text-[18px] leading-[1.55] text-[#C9CBCE] sm:text-[20px]">
            Whether you need help with your $1 Bot-Shield badge, a Square
            membership receipt, an account recovery check, or a privacy export,
            every support lane is direct and traceable.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="ds-btn-signal">
              Sign In for Ticket Tracking <ArrowRight size={16} />
            </Link>
            <Link to="/app/support" className="ds-btn-ghost">
              Open In-App Support Desk
            </Link>
            <Link to="/register" className="ds-btn-ghost">
              Create 18+ Account
            </Link>
            <a href="mailto:contact@youandinotai.com" className="ds-btn-ghost">
              <Mail size={16} /> contact@youandinotai.com
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <article className="ds-card p-6">
            <div className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#9DA3AA]">
              01 · Verification &amp; Access
            </div>
            <h2 className="mt-2 font-display text-[24px] font-bold text-[#F4F1EA]">
              $1 Bot-Shield &amp; Liveness
            </h2>
            <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
              Completed your $1 Square checkout and need your badge refreshed?
              Open <code className="font-mono text-[#FFD21E]">/app/verify</code>{' '}
              while signed in or message support with the email tied to your
              account.
            </p>
          </article>

          <article className="ds-card p-6">
            <div className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#9DA3AA]">
              02 · Square Billing
            </div>
            <h2 className="mt-2 font-display text-[24px] font-bold text-[#F4F1EA]">
              Account-Bound Receipts
            </h2>
            <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
              All Founding Member ($14.99/mo), 3-Month ($39.99), 12-Month
              ($99.99), and Royalty ($2,500) plans run through Square and attach
              directly to your signed-in profile.
            </p>
          </article>

          <article className="ds-card p-6">
            <div className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#9DA3AA]">
              03 · Privacy &amp; Data Control
            </div>
            <h2 className="mt-2 font-display text-[24px] font-bold text-[#F4F1EA]">
              Export &amp; 30-Day Deletion
            </h2>
            <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
              Request a full archive of your stored profile data, turn off
              location sharing, or start the 30-day account deletion clock
              inside{' '}
              <Link to="/app/privacy" className="text-[#FFD21E] underline">
                /app/privacy
              </Link>
              .
            </p>
          </article>
        </div>
      </main>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { user, betaAccess } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocKey | null>(
    null
  );
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [betaCode, setBetaCode] = useState('');
  const [betaStatus, setBetaStatus] = useState<{
    type: 'idle' | 'loading' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const checkedLabel = getCheckedTimeLabel();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLegalDoc(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleBetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = betaCode.trim();
    if (!cleaned) {
      setBetaStatus({
        type: 'error',
        message: 'Enter your beta invite code first.',
      });
      return;
    }
    setBetaStatus({ type: 'loading', message: 'Verifying invite code...' });
    try {
      await betaAccess(cleaned);
      const nextUser = useAuth.getState().user;
      navigate(nextUser?.has_profile ? '/app' : '/app/profile');
    } catch (err: any) {
      setBetaStatus({
        type: 'error',
        message: err?.message || 'That beta code could not be verified.',
      });
    }
  };

  const navLinks = [
    { label: 'Overview', href: '#about' },
    { label: 'Platform', href: '#platform' },
    { label: 'Verification', href: '#verification' },
    { label: 'Trust & Safety', href: '#trust' },
    { label: 'Membership', href: '#pricing' },
    { label: 'Support', href: '#support' },
    { label: 'Early Access', href: '#join' },
  ];

  const pricingTiers = [
    {
      id: 'bot_shield',
      badge: 'IDENTITY CHECK',
      name: 'Bot-Shield Verification',
      price: '$1',
      period: 'one-time',
      summary:
        '60-second camera liveness challenge + $1 Square check. Unlocks your Verified Human badge and full platform access.',
      ctaLabel: 'Verify Now — $1',
      to: '/app/verify',
      featured: false,
    },
    {
      id: 'founding_member',
      badge: 'RECOMMENDED · LOCKED RATE',
      name: 'Founding Member',
      price: '$14.99',
      period: '/month',
      summary:
        'Locked-for-life founder rate while active. Platinum Founder badge, priority discovery, video dates, and romance concierge.',
      ctaLabel: 'Join as Founding Member',
      to: '/app/checkout/founding_member',
      featured: true,
    },
    {
      id: '3_month',
      badge: 'SINGLE PAYMENT',
      name: '3-Month Founder',
      price: '$39.99',
      period: '3 months prepaid',
      summary:
        'One upfront Square payment for 90 days of full Founder access without recurring monthly billing.',
      ctaLabel: 'Choose 3-Month Plan',
      to: '/app/checkout/3_month',
      featured: false,
    },
    {
      id: '12_month',
      badge: 'BEST ANNUAL VALUE',
      name: '12-Month Founder',
      price: '$99.99',
      period: '1 year prepaid',
      summary:
        'Full launch-year Founder access in a single account-bound Square checkout session.',
      ctaLabel: 'Choose Annual Plan',
      to: '/app/checkout/12_month',
      featured: false,
    },
    {
      id: 'royalty',
      badge: 'LIMITED TIER',
      name: 'Royalty Card',
      price: '$2,500',
      period: 'limited founder edition',
      summary:
        'Top-tier founder standing with direct concierge onboarding and lifetime Royalty designation.',
      ctaLabel: 'Inquire / Checkout',
      to: '/app/checkout/royalty',
      featured: false,
    },
  ];

  const showcaseCells = [
    {
      index: '01',
      title: 'Bot-Shield Liveness',
      desc: 'Live camera gesture check + $1 Square verification before discovery.',
    },
    {
      index: '02',
      title: 'Intentional Discovery',
      desc: 'Profiles surface clear dating goals, prompts, and meetup comfort.',
    },
    {
      index: '03',
      title: 'Real-Time Messaging',
      desc: 'Matched-only threads with conversation prompts and safety controls.',
    },
    {
      index: '04',
      title: 'Matched Video Dates',
      desc: 'Camera and microphone stay local until both members accept the call.',
    },
    {
      index: '05',
      title: 'Community Boards',
      desc: 'Topic boards for local introductions, dating advice, and group plans.',
    },
    {
      index: '06',
      title: 'Safe Local Meetups',
      desc: 'Public venue planning and check-in reminders for first dates.',
    },
    {
      index: '07',
      title: 'Privacy & Data Control',
      desc: 'Self-service data export, location toggle, and 30-day account deletion.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0A0B0D] text-[#F4F1EA] font-sans">
      {/* Live In-House Three.js Stage Behind Hero & Scroll */}
      <DreamSpaceStage />

      {/* 0A. Fixed Top Header Bar */}
      <header className="sticky top-0 z-50 h-16 border-b border-[#3A3F45] bg-[#0A0B0D]/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
          <a
            href="#about"
            className="flex items-center gap-2 no-underline shrink-0 whitespace-nowrap"
          >
            <span className="text-[14px] font-semibold text-[#C9CBCE]">
              CLAUDE&apos;s N Joshua&apos;s
            </span>
            <span className="text-[#3A3F45]" aria-hidden="true">
              ·
            </span>
            <span className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#F4F1EA]">
              YouAndINotAI
            </span>
            <span className="hidden rounded-full border border-[#FFD21E] bg-[#12151A] px-2.5 py-0.5 text-[14px] font-medium text-[#FFD21E] xl:inline-flex">
              #TeamClaudeForLife
            </span>
          </a>

          <nav
            aria-label="Primary section navigation"
            className="hidden lg:flex items-center gap-3.5 whitespace-nowrap"
          >
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="whitespace-nowrap border-b-2 border-transparent py-1 text-[15px] font-medium text-[#9DA3AA] no-underline transition-colors hover:border-[#FFD21E] hover:text-[#F4F1EA]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <span className="ds-status-pill whitespace-nowrap">
              <span className="ds-status-dot bg-[#58D68D]" />
              <span>API Live · {checkedLabel}</span>
            </span>
            {user ? (
              <Link
                to="/app"
                className="ds-btn-ghost whitespace-nowrap px-3.5 py-2 text-[15px]"
              >
                Open App
              </Link>
            ) : (
              <Link
                to="/login"
                className="ds-btn-ghost whitespace-nowrap px-3.5 py-2 text-[15px]"
              >
                Sign In
              </Link>
            )}
            <Link
              to="/app/verify"
              className="ds-btn-signal whitespace-nowrap px-4 py-2 text-[15px]"
            >
              Get Verified
            </Link>
          </div>

          <button
            type="button"
            aria-label={
              mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#3A3F45] bg-[#12151A] text-[#F4F1EA] lg:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-b border-[#3A3F45] bg-[#12151A] px-4 py-5 lg:hidden">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#3A3F45] pb-3">
              <span className="rounded-full border border-[#FFD21E] bg-[#0A0B0D] px-3 py-1 text-[14px] font-medium text-[#FFD21E]">
                #TeamClaudeForLife
              </span>
              <span className="ds-status-pill">
                <span className="ds-status-dot bg-[#58D68D]" />
                <span>API Live · {checkedLabel}</span>
              </span>
            </div>
            <div className="grid gap-1">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-[8px] px-3 py-2.5 text-[16px] font-medium text-[#F4F1EA] no-underline hover:bg-[#1A1E25]"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#3A3F45] pt-4">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="ds-btn-ghost w-full"
              >
                Sign In
              </Link>
              <Link
                to="/app/verify"
                onClick={() => setMobileMenuOpen(false)}
                className="ds-btn-signal w-full"
              >
                Get Verified
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 0B. Prompt / Live Launch Band */}
      <div className="relative z-10 border-b border-[#3A3F45] bg-[#12151A] px-4 py-2.5">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 text-[14px] text-[#C9CBCE]">
          <div className="flex items-center gap-2.5">
            <span className="ds-status-dot bg-[#FFD21E]" />
            <span>
              Bot-Shield human verification ($1) and account-bound Square
              founder memberships are live now.
            </span>
          </div>
          <span className="text-[14px] text-[#9DA3AA]">
            youandinotai.com is for adults 18 and over.
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Section 01 (#about) — Hero Over Live 3D Stage */}
        <section
          id="about"
          className="mx-auto flex min-h-[calc(100vh-104px)] max-w-[1280px] items-center px-4 py-16 sm:px-6 lg:py-24"
        >
          <div className="grid w-full items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#3A3F45] bg-[#12151A] px-3.5 py-1.5 font-display text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                <span>
                  CLAUDE&apos;S N JOSHUA&apos;S · #TEAMCLAUDEFORLIFE · 18+
                  VERIFIED DATING
                </span>
              </div>

              <h1 className="mt-6 font-display text-[40px] font-bold uppercase leading-[1.05] tracking-[-0.02em] text-[#F4F1EA] sm:text-[56px] lg:text-[72px]">
                VERIFIED PEOPLE.
                <br />
                REAL CONNECTION.
              </h1>

              <p className="mt-6 max-w-[62ch] text-[18px] leading-[1.55] text-[#C9CBCE] sm:text-[20px]">
                Meet verified adults who are ready to talk, plan, and show up in
                real life. Every member completes our $1 Bot-Shield identity
                check, and every membership is bound directly to a real account.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link to="/app/verify" className="ds-btn-signal">
                  Get Verified — $1 Bot-Shield <ArrowRight size={18} />
                </Link>
                <Link to="/register" className="ds-btn-ghost">
                  Create Free Account
                </Link>
                <a
                  href="#pricing"
                  className="px-2 py-2 text-[16px] font-medium text-[#C9CBCE] underline decoration-[#3A3F45] underline-offset-4 hover:decoration-[#FFD21E] hover:text-[#F4F1EA]"
                >
                  Explore Founder Tiers
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                {[
                  { label: '01 · Bot-Shield ($1)', href: '#verification' },
                  { label: '02 · Trust & Safety', href: '#trust' },
                  { label: '03 · Square Tiers', href: '#pricing' },
                  { label: '04 · Direct Support', href: '#support' },
                  { label: '05 · Beta & Waitlist', href: '#join' },
                ].map(pill => (
                  <a
                    key={pill.href}
                    href={pill.href}
                    className="rounded-full border border-[#3A3F45] bg-[#1A1E25] px-3.5 py-1.5 text-[14px] font-medium text-[#C9CBCE] no-underline transition-colors hover:border-[#FFD21E] hover:text-[#F4F1EA]"
                  >
                    {pill.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <aside className="ds-glass border-l-[3px] border-l-[#FFD21E] p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-[#9DA3AA]">
                    LAUNCH STATUS · VERIFIED ACCESS
                  </span>
                  <span className="ds-status-pill">
                    <span className="ds-status-dot bg-[#58D68D]" />
                    <span>Live · {checkedLabel}</span>
                  </span>
                </div>

                <div className="mt-6 divide-y divide-[#3A3F45] border-y border-[#3A3F45]">
                  <div className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <div className="text-[14px] font-medium text-[#9DA3AA]">
                        01 · Bot-Shield Identity Check
                      </div>
                      <div className="mt-0.5 text-[16px] font-semibold text-[#F4F1EA]">
                        Camera Liveness + Square Verification
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#3A3F45] bg-[#1A1E25] px-3 py-1 font-mono text-[14px] text-[#FFD21E]">
                      $1 Live on Square
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <div className="text-[14px] font-medium text-[#9DA3AA]">
                        02 · Account-Bound Memberships
                      </div>
                      <div className="mt-0.5 text-[16px] font-semibold text-[#F4F1EA]">
                        Founding · 3-Mo · 12-Mo · Royalty
                      </div>
                    </div>
                    <span className="shrink-0 text-[14px] font-medium text-[#C9CBCE]">
                      Square Checkout
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <div className="text-[14px] font-medium text-[#9DA3AA]">
                        03 · Member Safety &amp; Privacy
                      </div>
                      <div className="mt-0.5 text-[16px] font-semibold text-[#F4F1EA]">
                        18+ Gate · Data Export · 30-Day Delete
                      </div>
                    </div>
                    <span className="shrink-0 text-[14px] font-medium text-[#58D68D]">
                      Active
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <Link
                    to="/login"
                    className="text-[16px] font-medium text-[#FFD21E] no-underline hover:underline"
                  >
                    Already a member? Sign in to your account &rarr;
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Section 02 — Statement 1: Verified Identity */}
        <section className="border-t border-[#3A3F45] py-20 lg:py-28">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="max-w-[900px]">
              <div className="font-mono text-[14px] uppercase tracking-[0.08em] text-[#9DA3AA]">
                02 / IDENTITY
              </div>
              <h2 className="mt-4 font-display text-[32px] font-bold leading-[1.05] tracking-[-0.02em] text-[#F4F1EA] sm:text-[48px] lg:text-[56px]">
                Every introduction starts with a verified human.
              </h2>
              <p className="mt-5 max-w-[65ch] text-[18px] leading-[1.55] text-[#C9CBCE] sm:text-[20px]">
                A live camera liveness check and a $1 Square verification bind
                each profile to a real person before they enter discovery or
                messaging.
              </p>
            </div>
          </div>
        </section>

        {/* Section 03 — Statement 2: Real-Life Matching */}
        <section className="border-t border-[#3A3F45] py-20 lg:py-28">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="max-w-[900px]">
              <div className="font-mono text-[14px] uppercase tracking-[0.08em] text-[#9DA3AA]">
                03 / INTENTION
              </div>
              <h2 className="mt-4 font-display text-[32px] font-bold leading-[1.05] tracking-[-0.02em] text-[#F4F1EA] sm:text-[48px] lg:text-[56px]">
                Designed for the first conversation and the first meetup.
              </h2>
              <p className="mt-5 max-w-[65ch] text-[18px] leading-[1.55] text-[#C9CBCE] sm:text-[20px]">
                Clear dating intent, shared availability, video calls, and local
                meetup planning help members move naturally from a match to a
                real-world plan.
              </p>
            </div>
          </div>
        </section>

        {/* Section 04 (#platform) — Three Platform Pillars */}
        <section
          id="platform"
          className="border-t border-[#3A3F45] py-20 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="font-mono text-[14px] uppercase tracking-[0.08em] text-[#9DA3AA]">
              04 / THE PLATFORM
            </div>
            <h2 className="mt-3 font-display text-[32px] font-bold tracking-[-0.02em] text-[#F4F1EA] sm:text-[40px]">
              Built for genuine human connection
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <article className="ds-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#3A3F45] bg-[#12151A] text-[#FFD21E]">
                  <UserCheck size={20} strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 font-display text-[24px] font-bold text-[#F4F1EA]">
                  Identity First
                </h3>
                <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                  Every active profile completes our $1 Bot-Shield check and
                  liveness challenge so you always know a real person is on the
                  other side of the conversation.
                </p>
              </article>

              <article className="ds-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#3A3F45] bg-[#12151A] text-[#FFD21E]">
                  <Shield size={20} strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 font-display text-[24px] font-bold text-[#F4F1EA]">
                  AI as a Shield
                </h3>
                <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                  Protective AI works behind the scenes to safeguard account
                  security, verify liveness, and surface safety tools—while
                  every profile, prompt, and message belongs to a real member.
                </p>
              </article>

              <article className="ds-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#3A3F45] bg-[#12151A] text-[#FFD21E]">
                  <Users size={20} strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 font-display text-[24px] font-bold text-[#F4F1EA]">
                  Built for Real Life
                </h3>
                <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                  From one-on-one discovery and matched video calls to community
                  boards and local meetup plans, every feature is built to help
                  you connect offline.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Section 05 — Two-Phase Member Journey */}
        <section className="border-t border-[#3A3F45] py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="font-mono text-[14px] uppercase tracking-[0.08em] text-[#9DA3AA]">
              05 / MEMBER JOURNEY
            </div>
            <div className="mt-6 grid overflow-hidden rounded-[14px] border border-[#3A3F45] bg-[#12151A] md:grid-cols-2 md:divide-x md:divide-[#3A3F45]">
              <div className="p-8 sm:p-10">
                <div className="font-mono text-[14px] font-medium text-[#FFD21E]">
                  01
                </div>
                <h3 className="mt-3 font-display text-[28px] font-bold uppercase leading-[1.08] tracking-[-0.02em] text-[#F4F1EA] sm:text-[32px]">
                  VERIFY
                  <br />
                  YOUR ACCOUNT
                </h3>
                <p className="mt-4 text-[16px] leading-[1.55] text-[#C9CBCE] sm:text-[18px]">
                  Create your 18+ account, complete your profile prompts, and
                  pass the 60-second Liveness + $1 Bot-Shield check to unlock
                  full discovery, messaging, and video.
                </p>
              </div>

              <div className="border-t border-[#3A3F45] p-8 sm:p-10 md:border-t-0">
                <div className="font-mono text-[14px] font-medium text-[#FFD21E]">
                  02
                </div>
                <h3 className="mt-3 font-display text-[28px] font-bold uppercase leading-[1.08] tracking-[-0.02em] text-[#F4F1EA] sm:text-[32px]">
                  CONNECT
                  <br />
                  IN REAL LIFE
                </h3>
                <p className="mt-4 text-[16px] leading-[1.55] text-[#C9CBCE] sm:text-[18px]">
                  Browse verified profiles with clear dating intent, start real
                  conversations, launch matched-only video dates, and plan safe
                  public meetups.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 06 (#verification) — How $1 Bot-Shield Verification Works */}
        <section
          id="verification"
          className="border-t border-[#3A3F45] py-20 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="font-mono text-[14px] uppercase tracking-[0.08em] text-[#9DA3AA]">
              06 / BOT-SHIELD VERIFICATION
            </div>
            <h2 className="mt-3 font-display text-[32px] font-bold tracking-[-0.02em] text-[#F4F1EA] sm:text-[40px]">
              Three steps to your Verified Human badge
            </h2>
            <p className="mt-4 max-w-[65ch] text-[18px] leading-[1.55] text-[#C9CBCE] sm:text-[20px]">
              Verification takes under a minute and permanently binds your
              Verified badge and Trust Score to your authenticated account.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <article className="ds-card p-6">
                <div className="font-mono text-[14px] font-medium text-[#FFD21E]">
                  STEP 01
                </div>
                <h3 className="mt-3 font-display text-[24px] font-bold text-[#F4F1EA]">
                  Live Camera Gesture Check
                </h3>
                <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                  Complete a quick, in-browser camera liveness challenge (no
                  third-party app install required). Camera frames stay local to
                  your session.
                </p>
              </article>

              <article className="ds-card p-6">
                <div className="font-mono text-[14px] font-medium text-[#FFD21E]">
                  STEP 02
                </div>
                <h3 className="mt-3 font-display text-[24px] font-bold text-[#F4F1EA]">
                  $1 Square Account-Bound Checkout
                </h3>
                <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                  Complete a one-time $1 payment on Square tied directly to your
                  signed-in account to confirm real-world payment ownership.
                </p>
              </article>

              <article className="ds-card p-6">
                <div className="font-mono text-[14px] font-medium text-[#FFD21E]">
                  STEP 03
                </div>
                <h3 className="mt-3 font-display text-[24px] font-bold text-[#F4F1EA]">
                  Instant Gold or Platinum Badge
                </h3>
                <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                  Your profile receives the Verified Human badge (or Founding
                  Member Platinum badge) and unlocks discovery, inbox, and
                  video.
                </p>
              </article>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/app/verify" className="ds-btn-signal">
                Start $1 Bot-Shield Verification <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="text-[16px] font-medium text-[#C9CBCE] underline decoration-[#3A3F45] underline-offset-4 hover:decoration-[#FFD21E] hover:text-[#F4F1EA]"
              >
                Sign in to check verification status
              </Link>
            </div>
          </div>
        </section>

        {/* Section 07 (#trust) — Trust, Safety, Privacy & Account Protection (Restored!) */}
        <section
          id="trust"
          className="border-t border-[#3A3F45] py-20 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="font-mono text-[14px] uppercase tracking-[0.08em] text-[#9DA3AA]">
              07 / TRUST, SAFETY &amp; PRIVACY
            </div>
            <h2 className="mt-3 font-display text-[32px] font-bold tracking-[-0.02em] text-[#F4F1EA] sm:text-[40px]">
              Safety tools, privacy controls, and clear standards built into
              every screen
            </h2>
            <p className="mt-4 max-w-[65ch] text-[18px] leading-[1.55] text-[#C9CBCE] sm:text-[20px]">
              YouAndINotAI is an adults-only (18+) platform. Your safety
              controls, data export, and account deletion tools are always one
              click away.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <article className="ds-card flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.06em] text-[#FFD21E]">
                    <ShieldCheck size={18} />
                    <span>18+ Eligibility</span>
                  </div>
                  <h3 className="mt-3 font-display text-[24px] font-bold text-[#F4F1EA]">
                    18+ Adult Community &amp; Conduct Standards
                  </h3>
                  <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                    Mandatory 18+ age verification at registration, clear
                    community standards, and zero tolerance for impersonation or
                    harassment.
                  </p>
                </div>
                <div className="mt-6 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc('terms')}
                    className="ds-btn-ghost text-sm"
                  >
                    Read Terms &amp; Age Policy
                  </button>
                </div>
              </article>

              <article className="ds-card flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.06em] text-[#FFD21E]">
                    <Shield size={18} />
                    <span>Safety Tools</span>
                  </div>
                  <h3 className="mt-3 font-display text-[24px] font-bold text-[#F4F1EA]">
                    Verified Safety &amp; Abuse Escalation
                  </h3>
                  <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                    One-tap block and report controls inside discovery, chat,
                    and boards, plus matched-only video rooms where camera and
                    mic stay local until both members accept.
                  </p>
                </div>
                <div className="mt-6 pt-2">
                  <Link to="/support" className="ds-btn-ghost text-sm">
                    View Safety &amp; Support Guide &rarr;
                  </Link>
                </div>
              </article>

              <article className="ds-card flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.06em] text-[#FFD21E]">
                    <Lock size={18} />
                    <span>Data Ownership</span>
                  </div>
                  <h3 className="mt-3 font-display text-[24px] font-bold text-[#F4F1EA]">
                    Privacy by Default &amp; Data Ownership
                  </h3>
                  <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                    Download your stored account snapshot, disable location
                    sharing at any time, or schedule full account deletion with
                    a transparent 30-day review window.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc('privacy')}
                    className="ds-btn-ghost text-sm"
                  >
                    Read Privacy Policy
                  </button>
                  <Link to="/app/privacy" className="ds-btn-ghost text-sm">
                    Open Privacy Center (/app/privacy)
                  </Link>
                </div>
              </article>

              <article className="ds-card flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.06em] text-[#FFD21E]">
                    <Check size={18} />
                    <span>Square Checkout</span>
                  </div>
                  <h3 className="mt-3 font-display text-[24px] font-bold text-[#F4F1EA]">
                    Account-Bound Square Security
                  </h3>
                  <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                    Every payment session is generated for your signed-in
                    account and verified via signed Square webhooks so your tier
                    or badge never gets lost.
                  </p>
                </div>
                <div className="mt-6 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc('refund')}
                    className="ds-btn-ghost text-sm"
                  >
                    Read Billing &amp; Cancellation Policy
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Section 08 (#support) — Member Support & Direct Assistance */}
        <section
          id="support"
          className="border-t border-[#3A3F45] py-20 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="font-mono text-[14px] uppercase tracking-[0.08em] text-[#9DA3AA]">
              08 / MEMBER SUPPORT
            </div>
            <h2 className="mt-3 font-display text-[32px] font-bold tracking-[-0.02em] text-[#F4F1EA] sm:text-[40px]">
              Direct support that never hides behind a maze
            </h2>

            <div className="mt-8 grid overflow-hidden rounded-[14px] border border-[#3A3F45] bg-[#12151A] md:grid-cols-2 md:divide-x md:divide-[#3A3F45]">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.06em] text-[#FFD21E]">
                  <MessageSquare size={18} />
                  <span>Guided Triage &amp; Live Tickets</span>
                </div>
                <h3 className="mt-3 font-display text-[24px] font-bold text-[#F4F1EA]">
                  In-App Support Desk &amp; Guided Triage
                </h3>
                <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                  Signed-in members can open{' '}
                  <code className="font-mono text-[#FFD21E]">/app/support</code>{' '}
                  for instant answers on verification, billing, technical
                  issues, or safety escalation, and file a tracked support
                  ticket in one click.
                </p>
              </div>

              <div className="border-t border-[#3A3F45] p-6 sm:p-8 md:border-t-0">
                <div className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.06em] text-[#FFD21E]">
                  <Mail size={18} />
                  <span>Direct Email &amp; Privacy Requests</span>
                </div>
                <h3 className="mt-3 font-display text-[24px] font-bold text-[#F4F1EA]">
                  Account Recovery, Billing &amp; Privacy Help
                </h3>
                <p className="mt-3 text-[16px] leading-[1.55] text-[#C9CBCE]">
                  Locked out of your account or have a question before signing
                  up? Visit our public support page at{' '}
                  <code className="font-mono text-[#FFD21E]">/support</code> or
                  email{' '}
                  <a
                    href="mailto:contact@youandinotai.com"
                    className="text-[#FFD21E] underline"
                  >
                    contact@youandinotai.com
                  </a>{' '}
                  directly.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/login" className="ds-btn-ghost text-sm">
                Sign In
              </Link>
              <Link to="/register" className="ds-btn-ghost text-sm">
                Create Account
              </Link>
              <Link to="/support" className="ds-btn-ghost text-sm">
                Public Support Guide
              </Link>
              <Link to="/app/support" className="ds-btn-signal text-sm">
                In-App Support Desk
              </Link>
              <a
                href="mailto:contact@youandinotai.com"
                className="ds-btn-ghost text-sm"
              >
                Email Support (contact@youandinotai.com)
              </a>
            </div>
          </div>
        </section>

        {/* Section 09 (#pricing) — Membership & Founder Tiers (Square Live) */}
        <section
          id="pricing"
          className="border-t border-[#3A3F45] py-20 lg:py-24"
        >
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="font-mono text-[14px] uppercase tracking-[0.08em] text-[#9DA3AA]">
              09 / MEMBERSHIP &amp; FOUNDER TIERS
            </div>
            <h2 className="mt-3 font-display text-[32px] font-bold tracking-[-0.02em] text-[#F4F1EA] sm:text-[40px]">
              Transparent, account-bound pricing on Square
            </h2>
            <p className="mt-4 max-w-[65ch] text-[18px] leading-[1.55] text-[#C9CBCE] sm:text-[20px]">
              Start with the $1 Bot-Shield check or lock in a Founding Member
              tier. Every checkout session is created for your signed-in
              account.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {pricingTiers.map(tier => (
                <article
                  key={tier.id}
                  className={
                    tier.featured
                      ? 'ds-card-signal-left flex flex-col justify-between p-6'
                      : 'ds-card flex flex-col justify-between p-6'
                  }
                >
                  <div>
                    <div
                      className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[14px] ${
                        tier.featured
                          ? 'border-[#FFD21E] bg-[#12151A] font-semibold text-[#FFD21E]'
                          : 'border-[#3A3F45] bg-[#12151A] text-[#9DA3AA]'
                      }`}
                    >
                      {tier.badge}
                    </div>
                    <h3 className="mt-4 font-display text-[24px] font-bold text-[#F4F1EA]">
                      {tier.name}
                    </h3>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="font-display text-[32px] font-bold text-[#F4F1EA]">
                        {tier.price}
                      </span>
                      <span className="text-[14px] text-[#9DA3AA]">
                        {tier.period}
                      </span>
                    </div>
                    <p className="mt-4 text-[16px] leading-[1.5] text-[#C9CBCE]">
                      {tier.summary}
                    </p>
                  </div>

                  <div className="mt-6 pt-2">
                    <Link
                      to={tier.to}
                      className={
                        tier.featured
                          ? 'ds-btn-signal w-full text-center'
                          : 'ds-btn-ghost w-full text-center'
                      }
                    >
                      {tier.ctaLabel}
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-6 text-[14px] text-[#9DA3AA]">
              All payments are processed securely by Square and bound directly
              to your authenticated YouAndINotAI account.
            </p>
          </div>
        </section>

        {/* Section 10 (#join) — Early Access Waitlist & Beta Access Code */}
        <section id="join" className="border-t border-[#3A3F45] py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="font-mono text-[14px] uppercase tracking-[0.08em] text-[#9DA3AA]">
              10 / EARLY ACCESS &amp; BETA
            </div>
            <h2 className="mt-3 font-display text-[32px] font-bold tracking-[-0.02em] text-[#F4F1EA] sm:text-[40px]">
              Join the launch list or enter your beta invite code
            </h2>
            <p className="mt-4 max-w-[65ch] text-[18px] leading-[1.55] text-[#C9CBCE] sm:text-[20px]">
              Receive direct launch milestones, profile rollout notices, and
              local meetup updates.
            </p>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {/* Panel A — Waitlist Email Form */}
              <div className="ds-panel p-6 sm:p-8">
                <div className="font-mono text-[14px] uppercase tracking-[0.08em] text-[#FFD21E]">
                  WAITLIST UPDATES
                </div>
                <h3 className="mt-2 font-display text-[24px] font-bold text-[#F4F1EA]">
                  Get Launch &amp; Meetup Milestones
                </h3>
                <p className="mt-2 text-[16px] text-[#C9CBCE]">
                  Add your email to receive regional rollout notices and
                  verified member event invitations.
                </p>

                <form
                  action="https://formsubmit.co/contact@youandinotai.com"
                  method="POST"
                  className="mt-6 space-y-4"
                >
                  <input
                    type="hidden"
                    name="_subject"
                    value="New YouAndINotAI Early Access Signup!"
                  />
                  <input type="hidden" name="_captcha" value="false" />
                  <input type="hidden" name="_template" value="table" />
                  <input
                    type="hidden"
                    name="_next"
                    value="https://youandinotai.com/#join"
                  />

                  <div>
                    <label
                      htmlFor="waitlist-email-input"
                      className="block text-[14px] font-medium text-[#C9CBCE]"
                    >
                      Email address
                    </label>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                      <input
                        id="waitlist-email-input"
                        type="email"
                        name="email"
                        required
                        value={waitlistEmail}
                        onChange={e => setWaitlistEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="app-input flex-1"
                      />
                      <button type="submit" className="ds-btn-signal shrink-0">
                        Join the Waitlist
                      </button>
                    </div>
                  </div>
                  <p className="text-[14px] text-[#9DA3AA]">
                    Direct product updates only. Unsubscribe or request deletion
                    anytime.
                  </p>
                </form>
              </div>

              {/* Panel B — Beta Access Code Form */}
              <div className="ds-panel p-6 sm:p-8">
                <div className="flex items-center gap-2 font-mono text-[14px] uppercase tracking-[0.08em] text-[#FFD21E]">
                  <KeyRound size={16} />
                  <span>INVITE CODE ACCESS</span>
                </div>
                <h3 className="mt-2 font-display text-[24px] font-bold text-[#F4F1EA]">
                  Have a Beta Invite Code?
                </h3>
                <p className="mt-2 text-[16px] text-[#C9CBCE]">
                  Enter your founder or beta invite code to unlock your member
                  session immediately.
                </p>

                <form onSubmit={handleBetaSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="landing-beta-code-input"
                      className="block text-[14px] font-medium text-[#C9CBCE]"
                    >
                      Beta access code
                    </label>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                      <input
                        id="landing-beta-code-input"
                        type="text"
                        value={betaCode}
                        onChange={e => setBetaCode(e.target.value)}
                        placeholder="ENTER-CODE"
                        className="app-input flex-1 font-mono uppercase"
                      />
                      <button
                        type="submit"
                        disabled={betaStatus.type === 'loading'}
                        className="ds-btn-ghost shrink-0"
                      >
                        {betaStatus.type === 'loading'
                          ? 'Checking...'
                          : 'Unlock Beta Access'}
                      </button>
                    </div>
                  </div>

                  {betaStatus.message && (
                    <p
                      className={`text-[14px] ${
                        betaStatus.type === 'error'
                          ? 'text-[#FF6B6B]'
                          : 'text-[#C9CBCE]'
                      }`}
                    >
                      {betaStatus.message}
                    </p>
                  )}
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Section 11 — Platform by the Numbers Strip */}
        <section className="border-t border-[#3A3F45] py-16 lg:py-20">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="grid overflow-hidden rounded-[14px] border border-[#3A3F45] bg-[#12151A] sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  stat: '$1',
                  desc: 'Bot-Shield human liveness & checkout verification',
                },
                {
                  stat: '3',
                  desc: 'Verification steps from account creation to Verified badge',
                },
                {
                  stat: '5',
                  desc: 'Account-bound Square tiers from $1 check to Royalty',
                },
                {
                  stat: '18+',
                  desc: 'Adults-only community with full data export & deletion controls',
                },
              ].map((item, idx) => (
                <div
                  key={item.stat}
                  className={`p-6 sm:p-8 ${
                    idx > 0
                      ? 'border-t border-[#3A3F45] lg:border-l lg:border-t-0'
                      : ''
                  }`}
                >
                  <div className="font-display text-[40px] font-bold leading-none text-[#FFD21E] sm:text-[56px]">
                    {item.stat}
                  </div>
                  <p className="mt-3 text-[16px] leading-[1.45] text-[#C9CBCE]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 12 — Climax + 4x2 Product & Trust Showcase Grid */}
        <section className="border-t border-[#3A3F45] py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className="max-w-[920px]">
              <div className="font-display text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                CLAUDE&apos;S N JOSHUA&apos;S · #TEAMCLAUDEFORLIFE
              </div>
              <h2 className="mt-3 font-display text-[32px] font-bold uppercase leading-[1.06] tracking-[-0.02em] text-[#F4F1EA] sm:text-[48px] lg:text-[56px]">
                REAL PEOPLE. VERIFIED PROFILES. READY WHEN YOU ARE.
              </h2>
            </div>

            <div className="mt-12 grid overflow-hidden rounded-[14px] border border-[#3A3F45] bg-[#3A3F45] gap-px sm:grid-cols-2 lg:grid-cols-4">
              {showcaseCells.map(cell => (
                <div key={cell.index} className="bg-[#1A1E25] p-6">
                  <div className="font-mono text-[14px] text-[#9DA3AA]">
                    {cell.index}
                  </div>
                  <h3 className="mt-3 font-display text-[20px] font-bold text-[#F4F1EA]">
                    {cell.title}
                  </h3>
                  <p className="mt-2 text-[16px] leading-[1.5] text-[#C9CBCE]">
                    {cell.desc}
                  </p>
                </div>
              ))}

              <Link
                to="/app/verify"
                className="flex flex-col justify-between border border-[#FFD21E] bg-[#1A1E25] p-6 no-underline transition-colors hover:bg-[#12151A]"
              >
                <div>
                  <div className="font-mono text-[14px] font-bold text-[#FFD21E]">
                    YOU?
                  </div>
                  <h3 className="mt-3 font-display text-[24px] font-bold text-[#F4F1EA]">
                    Claim Your Verified Spot
                  </h3>
                  <p className="mt-2 text-[16px] leading-[1.5] text-[#C9CBCE]">
                    Complete Liveness + $1 Bot-Shield verification and meet real
                    people.
                  </p>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 font-semibold text-[#FFD21E]">
                  <span>Verify your profile for $1</span>
                  <ArrowRight size={16} />
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Section 13 — Footer */}
      <footer className="relative z-10 border-t border-[#3A3F45] bg-[#12151A]">
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="text-[14px] font-semibold text-[#C9CBCE]">
                CLAUDE&apos;s N Joshua&apos;s
              </div>
              <div className="mt-1 font-display text-[24px] font-bold tracking-[-0.02em] text-[#F4F1EA]">
                YouAndINotAI
              </div>
              <div className="mt-3 inline-flex rounded-full border border-[#FFD21E] bg-[#0A0B0D] px-3 py-1 text-[14px] font-medium text-[#FFD21E]">
                #TeamClaudeForLife
              </div>
              <p className="mt-4 max-w-[44ch] text-[16px] leading-[1.55] text-[#C9CBCE]">
                18+ verified-human dating, matched video calls, and real-world
                connection. Operated by Trash Or Treasure Online Recycler LLC.
              </p>
              <p className="mt-3 text-[14px] font-medium text-[#9DA3AA]">
                youandinotai.com is for adults 18 and over.
              </p>
            </div>

            <div>
              <h3 className="font-display text-[16px] font-bold uppercase tracking-[0.06em] text-[#F4F1EA]">
                Launch Links
              </h3>
              <ul className="mt-4 space-y-2.5 list-none p-0">
                <li>
                  <a
                    href="#about"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    Overview
                  </a>
                </li>
                <li>
                  <a
                    href="#platform"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    Platform Pillars
                  </a>
                </li>
                <li>
                  <a
                    href="#verification"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    $1 Bot-Shield Verification
                  </a>
                </li>
                <li>
                  <a
                    href="#trust"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    Trust &amp; Safety
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    Founder Tiers &amp; Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#join"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    Early Access &amp; Beta Code
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-[16px] font-bold uppercase tracking-[0.06em] text-[#F4F1EA]">
                Account &amp; Support
              </h3>
              <ul className="mt-4 space-y-2.5 list-none p-0">
                <li>
                  <Link
                    to="/login"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/verify"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    Verify Profile ($1)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/support"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    Public Support Guide
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/support"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    In-App Support Desk
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/privacy"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    Privacy &amp; Delete Account
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:contact@youandinotai.com"
                    className="text-[16px] text-[#C9CBCE] no-underline hover:text-[#FFD21E]"
                  >
                    contact@youandinotai.com
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-[16px] font-bold uppercase tracking-[0.06em] text-[#F4F1EA]">
                Policy &amp; Privacy
              </h3>
              <ul className="mt-4 space-y-2.5 list-none p-0">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc('terms')}
                    className="border-0 bg-transparent p-0 text-left text-[16px] text-[#C9CBCE] cursor-pointer hover:text-[#FFD21E]"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc('privacy')}
                    className="border-0 bg-transparent p-0 text-left text-[16px] text-[#C9CBCE] cursor-pointer hover:text-[#FFD21E]"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc('age')}
                    className="border-0 bg-transparent p-0 text-left text-[16px] text-[#C9CBCE] cursor-pointer hover:text-[#FFD21E]"
                  >
                    Age Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc('refund')}
                    className="border-0 bg-transparent p-0 text-left text-[16px] text-[#C9CBCE] cursor-pointer hover:text-[#FFD21E]"
                  >
                    Refund Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#3A3F45] pt-6 sm:flex-row sm:items-center">
            <p className="text-[14px] text-[#9DA3AA]">
              &copy; 2026 Trash Or Treasure Online Recycler LLC. &middot;
              CLAUDE&apos;s N Joshua&apos;s &middot; #TeamClaudeForLife
            </p>
            <span className="ds-status-pill">
              <span className="ds-status-dot bg-[#58D68D]" />
              <span>All Systems Operational · {checkedLabel}</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Legal Modal Dialog (terms, privacy, age, refund) */}
      {activeLegalDoc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0B0D]/80 p-4 backdrop-blur-md"
          onClick={() => setActiveLegalDoc(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[14px] border border-[#3A3F45] bg-[#12151A] p-6 sm:p-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#3A3F45] pb-4">
              <div>
                <div className="font-mono text-[14px] text-[#9DA3AA]">
                  {LEGAL_DOCS[activeLegalDoc].updated}
                </div>
                <h2
                  id="legal-modal-title"
                  className="mt-1 font-display text-[28px] font-bold text-[#F4F1EA]"
                >
                  {LEGAL_DOCS[activeLegalDoc].title}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close legal policy modal"
                onClick={() => setActiveLegalDoc(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#3A3F45] bg-[#1A1E25] text-[#F4F1EA] hover:border-[#FFD21E]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-b border-[#3A3F45] pb-4">
              {(
                [
                  ['terms', 'Terms of Service'],
                  ['privacy', 'Privacy Policy'],
                  ['age', 'Age Policy'],
                  ['refund', 'Refund Policy'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveLegalDoc(key)}
                  className={`rounded-full border px-3 py-1 text-[14px] font-medium cursor-pointer ${
                    activeLegalDoc === key
                      ? 'border-[#FFD21E] bg-[#1A1E25] text-[#FFD21E]'
                      : 'border-[#3A3F45] bg-[#0A0B0D] text-[#C9CBCE]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-5">
              {LEGAL_DOCS[activeLegalDoc].sections.map(sec => (
                <div key={sec.h}>
                  <h3 className="font-display text-[18px] font-bold text-[#F4F1EA]">
                    {sec.h}
                  </h3>
                  <p className="mt-1.5 text-[16px] leading-[1.55] text-[#C9CBCE]">
                    {sec.p}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end border-t border-[#3A3F45] pt-4">
              <button
                type="button"
                onClick={() => setActiveLegalDoc(null)}
                className="ds-btn-signal"
              >
                Close Policy
              </button>
            </div>
          </div>
        </div>
      )}

      <CookieConsentBanner />
    </div>
  );
}

export default LandingPage;
