import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  UserCheck,
  Users,
  X,
} from 'lucide-react';

import { useAuth } from './lib/auth';
import { BotOrNotGame } from './components/BotOrNotGame';
import {
  DreamSpaceStage,
  HeaderOrbitMark,
  HeaderTelemetryLine,
  JourneyProgressBar,
  readSectionJourneyState,
  SECTION_STOPS,
} from './components/DreamSpaceStage';

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
        p: 'YouAndINotAI is strictly for adults 18 years of age or older. By creating an account or accessing the platform, you represent and warrant that you are at least 18 years old and legally able to enter into a binding agreement.',
      },
      {
        h: '2. Account-Bound Verification & Memberships',
        p: 'Bot-Shield verification ($1) and Founder memberships are bound to your authenticated YouAndINotAI account. Each profile belongs to one verified adult member.',
      },
      {
        h: '3. Community Conduct & Safety',
        p: 'Respectful adult conduct is required across all profiles, messages, and boards. Members can use built-in safety controls from any profile, message thread, or board.',
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
        p: 'We collect the account details you provide (email, display name, date of birth, profile answers, and optional photos), verification status, and in-app activity needed to operate matching, messaging, and support.',
      },
      {
        h: '2. How Your Data Is Used',
        p: 'Your data is used solely to deliver YouAndINotAI product features, verify human accounts, process account-bound checkout sessions, and protect member safety.',
      },
      {
        h: '3. Self-Service Export & 30-Day Account Deletion',
        p: 'Authenticated members can request a full data export, update location sharing, or start the 30-day account deletion clock directly inside the Privacy Center (/app/privacy) or by emailing contact@youandinotai.com.',
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
        p: 'To unlock full discovery, messaging, and video features, members complete a live camera gesture check and a $1 Bot-Shield verification bound to their account.',
      },
      {
        h: '3. Adult Community Standard',
        p: 'Every active account is verified for adult eligibility and human liveness.',
      },
    ],
  },
  refund: {
    title: 'Billing, Refund & Cancellation Policy',
    updated: 'Last Updated: April 2026',
    sections: [
      {
        h: '1. Account-Bound Checkout',
        p: 'All membership and verification payments are linked directly to your signed-in YouAndINotAI account.',
      },
      {
        h: '2. Subscriptions & Prepaid Tiers',
        p: 'Recurring Founding Member subscriptions ($14.99/mo) can be managed through support or account settings before the next billing cycle. Prepaid 3-Month ($39.99) and 12-Month ($99.99) plans remain active for their full paid term.',
      },
      {
        h: '3. Billing Support & Assistance',
        p: 'For billing assistance or receipt inquiries, contact support through /app/support or email contact@youandinotai.com with your account email for a quick resolution.',
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

const TALL_MOBILE_STAGE_STOPS = new Set([
  'platform',
  'verification',
  'trust',
  'pricing',
  'support',
]);

function readUnpinnedStops(): Record<string, boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {};
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const headerEl = document.querySelector('header');
  const mapEl = document.getElementById('youandinotai-progress-map');
  const headerH = headerEl?.getBoundingClientRect().height || 68;
  const mapH = mapEl?.getBoundingClientRect().height || 56;
  const openStageHeight = Math.max(vh - headerH - mapH, 0);

  const next: Record<string, boolean> = {};
  for (const stop of SECTION_STOPS) {
    if (stop.id === 'footer') continue;
    const cardEl = document.querySelector(
      `#${stop.id} [data-stage-card]`
    ) as HTMLElement | null;
    const cardH =
      cardEl?.scrollHeight || cardEl?.getBoundingClientRect().height || 0;
    const isShortForCard = cardH > 0 && cardH + 48 > openStageHeight;
    next[stop.id] =
      isShortForCard || (vw < 1024 && TALL_MOBILE_STAGE_STOPS.has(stop.id));
  }
  return next;
}

export function PublicSupportPage() {
  const checkedLabel = getCheckedTimeLabel();

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#F4F1EA] font-sans">
      <a
        href="#main-support-content"
        className="skip-link sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:inline-flex focus:min-h-[44px] focus:min-w-[44px] focus:items-center focus:rounded-[10px] focus:border-2 focus:border-[#FFD21E] focus:bg-[#0A0B0D] focus:px-4 focus:py-2 focus:font-mono focus:text-[14px] focus:font-bold focus:uppercase focus:tracking-[0.06em] focus:text-[#FFD21E] focus:no-underline"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-50 border-b border-[#3A3F45] bg-[#0A0B0D]">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <HeaderOrbitMark sectionFloat={0} atFooter={false} />
            <Link
              to="/"
              className="inline-flex min-h-[44px] min-w-[44px] flex-wrap items-center gap-2 no-underline"
            >
              <span className="text-[14px] font-semibold text-[#F4F1EA]">
                CLAUDE&apos;s N Joshua&apos;s
              </span>
              <span className="text-[#FFD21E]" aria-hidden="true">
                ·
              </span>
              <span className="font-display text-[20px] font-bold tracking-[-0.02em] text-[#F4F1EA]">
                YouAndINotAI
              </span>
              <span className="rounded-full border border-[#FFD21E] bg-[#12151A] px-2.5 py-0.5 text-[14px] font-medium text-[#FFD21E]">
                #TeamClaudeForLife
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="ds-status-pill hidden sm:inline-flex">
              <span className="ds-status-dot bg-[#FFD21E]" />
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
        <HeaderTelemetryLine activeSectionIndex={5} atFooter={false} />
      </header>

      <main
        id="main-support-content"
        tabIndex={-1}
        className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:py-16"
      >
        <div className="ds-panel p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#FFD21E] bg-[#1A1E25] px-3 py-1 font-display text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
              06 / MEMBER SUPPORT &amp; SAFETY GUIDE
            </span>
            <span className="text-[14px] font-medium text-[#F4F1EA]">
              youandinotai.com is for adults 18 and over.
            </span>
          </div>

          <h1 className="mt-5 font-display text-[32px] font-bold uppercase leading-[1.08] tracking-[-0.02em] text-[#F4F1EA] sm:text-[48px]">
            DIRECT, TRACEABLE MEMBER SUPPORT.
          </h1>
          <p className="mt-4 max-w-[65ch] text-[18px] leading-[1.55] text-[#F4F1EA] sm:text-[20px]">
            Whether you need help with your $1 Bot-Shield badge, a membership
            receipt, an account recovery check, or a privacy export, every
            support lane is direct and traceable.
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
            <div className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#FFD21E]">
              01 · Verification &amp; Access
            </div>
            <h2 className="mt-2 font-display text-[24px] font-bold text-[#F4F1EA]">
              $1 Bot-Shield &amp; Liveness
            </h2>
            <p className="mt-3 text-[16px] leading-[1.55] text-[#F4F1EA]">
              Completed your $1 verification checkout and want your badge
              refreshed? Open{' '}
              <code className="font-mono text-[#FFD21E]">/app/verify</code>{' '}
              while signed in or message support with your account email.
            </p>
          </article>

          <article className="ds-card p-6">
            <div className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#FFD21E]">
              02 · Account-Bound Billing
            </div>
            <h2 className="mt-2 font-display text-[24px] font-bold text-[#F4F1EA]">
              Instant Member Receipts
            </h2>
            <p className="mt-3 text-[16px] leading-[1.55] text-[#F4F1EA]">
              All Founding Member ($14.99/mo), 3-Month ($39.99), 12-Month
              ($99.99), and Royalty ($2,500) plans attach directly to your
              signed-in profile.
            </p>
          </article>

          <article className="ds-card p-6">
            <div className="text-[14px] font-semibold uppercase tracking-[0.08em] text-[#FFD21E]">
              03 · Privacy &amp; Data Control
            </div>
            <h2 className="mt-2 font-display text-[24px] font-bold text-[#F4F1EA]">
              Export &amp; 30-Day Deletion
            </h2>
            <p className="mt-3 text-[16px] leading-[1.55] text-[#F4F1EA]">
              Request a full archive of your stored profile data, update
              location sharing, or start the 30-day account deletion clock
              inside{' '}
              <Link
                to="/app/privacy"
                className="inline-flex min-h-[44px] min-w-[44px] items-center text-[#FFD21E] underline"
              >
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
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocKey | null>(
    null
  );
  const [waitlistEmail, setWaitlistEmail] = useState('');

  const [journeyState, setJourneyState] = useState(() =>
    readSectionJourneyState()
  );
  const [unpinnedStops, setUnpinnedStops] = useState<Record<string, boolean>>(
    () => readUnpinnedStops()
  );

  const checkedLabel = getCheckedTimeLabel();

  useEffect(() => {
    const syncJourney = () => {
      setJourneyState(readSectionJourneyState());
    };
    const syncStageFlow = () => {
      setUnpinnedStops(readUnpinnedStops());
      setJourneyState(readSectionJourneyState());
    };
    syncStageFlow();
    window.addEventListener('scroll', syncJourney, { passive: true });
    window.addEventListener('resize', syncStageFlow);
    return () => {
      window.removeEventListener('scroll', syncJourney);
      window.removeEventListener('resize', syncStageFlow);
    };
  }, []);

  const getStageSectionClass = (id: string) =>
    unpinnedStops[id] ? 'relative' : 'relative lg:min-h-[135vh]';

  const getStageWrapperClass = (id: string) =>
    unpinnedStops[id]
      ? 'relative flex flex-col justify-start px-4 pb-20 pt-6 sm:px-6'
      : 'relative flex flex-col justify-start px-4 pb-20 pt-6 sm:px-6 lg:sticky lg:top-16 lg:min-h-[calc(100vh-7.5rem)] lg:justify-end lg:pb-6';

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

  useEffect(() => {
    const src = 'https://tobira.ai/embed/a2a-badge.js';
    let script = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    }
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 'Join' leaves the journey and opens the existing register flow; the
  // other links scroll to their stop. The id stays 'join' so the link still
  // lights while the visitor is on stop 07.
  const navLinks: { id: string; label: string; href: string; to?: string }[] =
    [
      { id: 'about', label: 'Overview', href: '#about' },
      { id: 'platform', label: 'Platform', href: '#platform' },
      { id: 'verification', label: 'Verification', href: '#verification' },
      { id: 'trust', label: 'Trust & Safety', href: '#trust' },
      { id: 'pricing', label: 'Membership', href: '#pricing' },
      { id: 'support', label: 'Support', href: '#support' },
      { id: 'join', label: 'Join', href: '/register', to: '/register' },
    ];

  const pricingTiers = [
    {
      id: 'bot_shield',
      badge: 'IDENTITY CHECK',
      name: 'Bot-Shield Verification',
      price: '$1',
      period: 'one-time',
      summary:
        '60-second camera liveness challenge + $1 identity check. Unlocks your Verified Human badge and full platform access.',
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
        'One upfront payment for 90 days of full Founder access bound directly to your member profile.',
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
        'Full launch-year Founder access in a single account-bound checkout session.',
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

  return (
    <div className="relative min-h-screen bg-[#0A0B0D] text-[#F4F1EA] font-sans">
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[100] focus:inline-flex focus:min-h-[44px] focus:min-w-[44px] focus:items-center focus:rounded-[10px] focus:border-2 focus:border-[#FFD21E] focus:bg-[#0A0B0D] focus:px-4 focus:py-2 focus:font-mono focus:text-[14px] focus:font-bold focus:uppercase focus:tracking-[0.06em] focus:text-[#FFD21E] focus:no-underline"
      >
        Skip to main content
      </a>

      {/* Live In-House Three.js Stage Behind Pinned Journey */}
      <DreamSpaceStage />

      {/* 0A. Floating Top Header with Restrained Three.js Motion */}
      <header className="sticky top-0 z-50 border-b border-[#3A3F45] bg-[#0A0B0D]">
        <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
            <HeaderOrbitMark
              sectionFloat={journeyState.sectionFloat}
              atFooter={journeyState.atFooter}
            />
            <a
              href="#about"
              className="inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 no-underline whitespace-nowrap sm:gap-2"
            >
              <span className="text-[14px] font-semibold text-[#F4F1EA]">
                CLAUDE&apos;s N Joshua&apos;s
              </span>
              <span className="text-[#FFD21E]" aria-hidden="true">
                ·
              </span>
              <span className="font-display text-[18px] font-bold tracking-[-0.02em] text-[#F4F1EA] sm:text-[20px]">
                YouAndINotAI
              </span>
              <span className="hidden rounded-full border border-[#FFD21E] bg-[#12151A] px-2.5 py-0.5 text-[14px] font-medium text-[#FFD21E] 2xl:inline-flex">
                #TeamClaudeForLife
              </span>
            </a>
          </div>

          <nav
            aria-label="Primary section navigation"
            className="hidden lg:flex items-center gap-1 whitespace-nowrap xl:gap-1.5"
          >
            {navLinks.map(link => {
              const isCurrent = journeyState.activeSectionId === link.id;
              const className = `inline-flex min-h-[44px] min-w-[44px] items-center justify-center whitespace-nowrap border-b-2 px-1.5 py-2 text-[14px] font-medium no-underline transition-colors xl:px-2 xl:text-[15px] ${
                isCurrent
                  ? 'border-[#FFD21E] text-[#FFD21E]'
                  : 'border-transparent text-[#F4F1EA] hover:border-[#FFD21E] hover:text-[#FFD21E]'
              }`;
              return link.to ? (
                <Link key={link.href} to={link.to} className={className}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className={className}>
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <span className="ds-status-pill whitespace-nowrap">
              <span className="ds-status-dot bg-[#FFD21E]" />
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
            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[10px] border border-[#3A3F45] bg-[#12151A] text-[#F4F1EA] lg:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Three.js / Canvas Scroll-Tracking Telemetry Line */}
        <HeaderTelemetryLine
          activeSectionIndex={journeyState.activeSectionIndex}
          atFooter={journeyState.atFooter}
        />

        {mobileMenuOpen && (
          <div className="border-b border-[#3A3F45] bg-[#12151A] px-4 py-5 lg:hidden">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#3A3F45] pb-3">
              <span className="rounded-full border border-[#FFD21E] bg-[#0A0B0D] px-3 py-1 text-[14px] font-medium text-[#FFD21E]">
                #TeamClaudeForLife
              </span>
              <span className="ds-status-pill">
                <span className="ds-status-dot bg-[#FFD21E]" />
                <span>API Live · {checkedLabel}</span>
              </span>
            </div>
            <div className="grid gap-1">
              {navLinks.map(link =>
                link.to ? (
                  <Link
                    key={link.href}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] min-w-[44px] items-center rounded-[8px] px-3 py-2.5 text-[16px] font-medium text-[#F4F1EA] no-underline hover:bg-[#1A1E25]"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] min-w-[44px] items-center rounded-[8px] px-3 py-2.5 text-[16px] font-medium text-[#F4F1EA] no-underline hover:bg-[#1A1E25]"
                  >
                    {link.label}
                  </a>
                )
              )}
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

      <main id="main-content" tabIndex={-1} className="relative z-10">
        {/* STOP 01 (#about) — The Hero Owns the Whole First Screen */}
        <section
          id="about"
          className={unpinnedStops.about ? 'relative' : 'relative min-h-[165vh]'}
        >
          <div
            data-stage-wrapper="about"
            data-stage-flow={unpinnedStops.about ? 'top-aligned' : 'pinned'}
            className={
              unpinnedStops.about
                ? 'relative flex flex-col justify-start px-4 pb-20 pt-4 sm:px-6 sm:pt-6'
                : 'sticky top-16 flex h-[calc(100vh-7.5rem)] flex-col justify-between px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6'
            }
          >
            {/* Upper Orbital Stage Frame — Open view for DreamSpaceStage orbit at top */}
            <div className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-between pointer-events-none">
              <div className="hidden lg:block rounded-[8px] border border-[#3A3F45] border-l-[3px] border-l-[#FFD21E] bg-[#0A0B0D] px-5 py-4">
                <div className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                  01 · LIVENESS GATE
                </div>
                <div className="mt-1 font-display text-[28px] font-bold uppercase leading-none text-[#F4F1EA]">
                  VERIFY
                </div>
                <div className="mt-1.5 text-[14px] font-medium text-[#F4F1EA]">
                  60-Second Camera &amp; $1 Check
                </div>
              </div>

              <div className="hidden lg:block rounded-[8px] border border-[#3A3F45] border-r-[3px] border-r-[#FFD21E] bg-[#0A0B0D] px-5 py-4 text-right">
                <div className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                  02 · REAL-WORLD DATES
                </div>
                <div className="mt-1 font-display text-[28px] font-bold uppercase leading-none text-[#F4F1EA]">
                  CONNECT
                </div>
                <div className="mt-1.5 text-[14px] font-medium text-[#F4F1EA]">
                  Matched Video &amp; Local Meetups
                </div>
              </div>
            </div>

            {/* Still Foreground Command Deck Below the Main Orbit */}
            <div
              data-stage-card="about"
              className="mx-auto w-full max-w-[1280px] rounded-[12px] border border-[#3A3F45] border-t-2 border-t-[#FFD21E] bg-[#0A0B0D] px-4 py-3.5 sm:px-8 sm:py-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#FFD21E] bg-[#12151A] px-3.5 py-1 font-display text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                  CLAUDE&apos;S N JOSHUA&apos;S · #TEAMCLAUDEFORLIFE · 18+
                  VERIFIED DATING
                </span>
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                  STOP 01 / 08 · SCROLL TO FLY IN
                </span>
              </div>

              <div className="mt-4 grid items-end gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <h1 className="font-display text-[28px] font-bold uppercase leading-[1.03] tracking-[-0.02em] text-[#F4F1EA] text-balance sm:text-[52px] lg:text-[64px]">
                    VERIFIED PEOPLE.
                    <br />
                    REAL CONNECTION.
                  </h1>
                  <p className="mt-2 max-w-[60ch] text-[14px] leading-[1.45] text-[#F4F1EA] text-pretty sm:text-[18px]">
                    Meet verified adults who are ready to talk, plan, and show
                    up in real life. Every member completes our $1 Bot-Shield
                    identity check bound directly to a real account.
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 lg:col-span-5 lg:items-end">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link to="/app/verify" className="ds-btn-signal">
                      Get Verified — $1 Bot-Shield <ArrowRight size={18} />
                    </Link>
                    <Link to="/register" className="ds-btn-ghost">
                      Create Free Account
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                    <a
                      href="#pricing"
                      className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 font-mono text-[14px] font-bold uppercase tracking-[0.06em] text-[#FFD21E] underline underline-offset-4"
                    >
                      Explore Founder Tiers
                    </a>
                    <Link
                      to="/login"
                      className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 font-mono text-[14px] font-bold uppercase tracking-[0.06em] text-[#F4F1EA] underline decoration-[#FFD21E] underline-offset-4"
                    >
                      Member Sign In &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STOP 02 (#platform) — Pinned Section: Intentional Discovery, Video & Real-Life Meetups */}
        <section id="platform" className={getStageSectionClass('platform')}>
          <div
            data-stage-wrapper="platform"
            data-stage-flow={unpinnedStops.platform ? 'top-aligned' : 'pinned'}
            className={getStageWrapperClass('platform')}
          >
            <div
              data-stage-card="platform"
              className="mx-auto w-full max-w-[1280px] rounded-[12px] border border-[#3A3F45] border-t-2 border-t-[#FFD21E] bg-[#0A0B0D] p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                  02 / PLATFORM CAPABILITIES
                </span>
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#F4F1EA]">
                  STOP 02 / 08 · EQUATORIAL ORBIT
                </span>
              </div>

              <h2 className="mt-3 font-display text-[28px] font-bold uppercase leading-[1.05] tracking-[-0.02em] text-[#F4F1EA] text-balance sm:text-[42px] lg:text-[50px]">
                BUILT FOR THE FIRST CONVERSATION AND THE FIRST MEETUP.
              </h2>

              <div className="mt-6 grid gap-6 border-t border-[#3A3F45] pt-6 md:grid-cols-3">
                <div className="border-l-2 border-[#FFD21E] pl-4">
                  <div className="flex items-center gap-2 font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                    <UserCheck size={18} />
                    <span>01 · Intentional Discovery</span>
                  </div>
                  <h3 className="mt-2 font-display text-[22px] font-bold text-[#F4F1EA]">
                    Identity First Profiles
                  </h3>
                  <p className="mt-2 text-[16px] leading-[1.5] text-[#F4F1EA]">
                    Every active profile completes our $1 Bot-Shield check and
                    surfaces clear relationship goals, openers, and meetup
                    preferences.
                  </p>
                </div>

                <div className="border-l-2 border-[#FFD21E] pl-4">
                  <div className="flex items-center gap-2 font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                    <Shield size={18} />
                    <span>02 · Matched Video Dates</span>
                  </div>
                  <h3 className="mt-2 font-display text-[22px] font-bold text-[#F4F1EA]">
                    Mutual Video &amp; Chat
                  </h3>
                  <p className="mt-2 text-[16px] leading-[1.5] text-[#F4F1EA]">
                    Matched members connect in real-time threads and launch
                    video dates where camera and microphone controls stay in
                    your hands.
                  </p>
                </div>

                <div className="border-l-2 border-[#FFD21E] pl-4">
                  <div className="flex items-center gap-2 font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                    <Users size={18} />
                    <span>03 · Real-Life Plans</span>
                  </div>
                  <h3 className="mt-2 font-display text-[22px] font-bold text-[#F4F1EA]">
                    Boards &amp; Local Meetups
                  </h3>
                  <p className="mt-2 text-[16px] leading-[1.5] text-[#F4F1EA]">
                    Topic boards and local venue planning help verified adults
                    move from online introductions to real-world dates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOT OR NOT — Founder Card Game Before Verification */}
        <BotOrNotGame />

        {/* STOP 03 (#verification) — Pinned Section: $1 Bot-Shield Verification */}
        <section
          id="verification"
          className={getStageSectionClass('verification')}
        >
          <div
            data-stage-wrapper="verification"
            data-stage-flow={
              unpinnedStops.verification ? 'top-aligned' : 'pinned'
            }
            className={getStageWrapperClass('verification')}
          >
            <div
              data-stage-card="verification"
              className="mx-auto w-full max-w-[1280px] rounded-[12px] border border-[#3A3F45] border-t-2 border-t-[#FFD21E] bg-[#0A0B0D] p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                  03 / VERIFICATION PROTOCOL
                </span>
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#F4F1EA]">
                  STOP 03 / 08 · CORE LOCK
                </span>
              </div>

              <h2 className="mt-3 font-display text-[28px] font-bold uppercase leading-[1.05] tracking-[-0.02em] text-[#F4F1EA] text-balance sm:text-[42px] lg:text-[50px]">
                EVERY INTRODUCTION STARTS WITH A VERIFIED HUMAN.
              </h2>

              <div className="mt-6 grid gap-6 border-t border-[#3A3F45] pt-6 md:grid-cols-3">
                <div className="border-l-2 border-[#FFD21E] pl-4">
                  <div className="font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                    STEP 01 · LIVE CAMERA CHECK
                  </div>
                  <h3 className="mt-2 font-display text-[22px] font-bold text-[#F4F1EA]">
                    60-Second Liveness Challenge
                  </h3>
                  <p className="mt-2 text-[16px] leading-[1.5] text-[#F4F1EA]">
                    Complete a quick camera gesture check in your browser to
                    confirm a live adult is creating the profile.
                  </p>
                </div>

                <div className="border-l-2 border-[#FFD21E] pl-4">
                  <div className="font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                    STEP 02 · $1 BOT-SHIELD
                  </div>
                  <h3 className="mt-2 font-display text-[22px] font-bold text-[#F4F1EA]">
                    Account-Bound Verification
                  </h3>
                  <p className="mt-2 text-[16px] leading-[1.5] text-[#F4F1EA]">
                    Complete the one-time $1 Bot-Shield verification checkout
                    bound directly to your authenticated account.
                  </p>
                </div>

                <div className="border-l-2 border-[#FFD21E] pl-4">
                  <div className="font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                    STEP 03 · VERIFIED BADGE
                  </div>
                  <h3 className="mt-2 font-display text-[22px] font-bold text-[#F4F1EA]">
                    Instant Gold or Platinum Badge
                  </h3>
                  <p className="mt-2 text-[16px] leading-[1.5] text-[#F4F1EA]">
                    Your profile receives the Verified Human badge and unlocks
                    full discovery, inbox messaging, and video dates.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[#3A3F45] pt-5">
                <Link to="/app/verify" className="ds-btn-signal">
                  Start $1 Bot-Shield Verification <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="ds-btn-ghost">
                  Sign in to check verification status
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* STOP 04 (#trust) — Pinned Section: Trust, Safety & Data Ownership */}
        <section id="trust" className={getStageSectionClass('trust')}>
          <div
            data-stage-wrapper="trust"
            data-stage-flow={unpinnedStops.trust ? 'top-aligned' : 'pinned'}
            className={getStageWrapperClass('trust')}
          >
            <div
              data-stage-card="trust"
              className="mx-auto w-full max-w-[1280px] rounded-[12px] border border-[#3A3F45] border-t-2 border-t-[#FFD21E] bg-[#0A0B0D] p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                  04 / TRUST, SAFETY &amp; PRIVACY
                </span>
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#F4F1EA]">
                  STOP 04 / 08 · SHIELD INCLINATION
                </span>
              </div>

              <h2 className="mt-3 font-display text-[28px] font-bold uppercase leading-[1.05] tracking-[-0.02em] text-[#F4F1EA] text-balance sm:text-[42px] lg:text-[50px]">
                ADULTS-ONLY STANDARDS AND FULL DATA OWNERSHIP.
              </h2>

              <div className="mt-6 grid gap-6 border-t border-[#3A3F45] pt-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col justify-between border-l-2 border-[#FFD21E] pl-4">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                      <ShieldCheck size={16} />
                      <span>18+ Eligibility</span>
                    </div>
                    <h3 className="mt-2 font-display text-[20px] font-bold text-[#F4F1EA]">
                      Adult Community Standards
                    </h3>
                    <p className="mt-2 text-[15px] leading-[1.5] text-[#F4F1EA]">
                      Mandatory 18+ age verification at registration and clear
                      conduct standards across the platform.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setActiveLegalDoc('terms')}
                      className="ds-btn-ghost w-full text-sm"
                    >
                      Read Terms &amp; Age Policy
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-between border-l-2 border-[#FFD21E] pl-4">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                      <Shield size={16} />
                      <span>Safety Tools</span>
                    </div>
                    <h3 className="mt-2 font-display text-[20px] font-bold text-[#F4F1EA]">
                      Direct Safety Controls
                    </h3>
                    <p className="mt-2 text-[15px] leading-[1.5] text-[#F4F1EA]">
                      One-tap block and report controls inside discovery, chat,
                      and boards, plus matched-only video rooms.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link to="/support" className="ds-btn-ghost w-full text-sm">
                      View Safety &amp; Support Guide &rarr;
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col justify-between border-l-2 border-[#FFD21E] pl-4">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                      <Lock size={16} />
                      <span>Data Ownership</span>
                    </div>
                    <h3 className="mt-2 font-display text-[20px] font-bold text-[#F4F1EA]">
                      Export &amp; 30-Day Deletion
                    </h3>
                    <p className="mt-2 text-[15px] leading-[1.5] text-[#F4F1EA]">
                      Download your account archive, manage location sharing, or
                      schedule full 30-day account deletion anytime.
                    </p>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveLegalDoc('privacy')}
                      className="ds-btn-ghost w-full text-sm"
                    >
                      Read Privacy Policy
                    </button>
                    <Link
                      to="/app/privacy"
                      className="ds-btn-ghost w-full text-sm"
                    >
                      Open Privacy Center (/app/privacy)
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col justify-between border-l-2 border-[#FFD21E] pl-4">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                      <Check size={16} />
                      <span>Account Billing</span>
                    </div>
                    <h3 className="mt-2 font-display text-[20px] font-bold text-[#F4F1EA]">
                      Account-Bound Checkout
                    </h3>
                    <p className="mt-2 text-[15px] leading-[1.5] text-[#F4F1EA]">
                      Every payment session is generated for your signed-in
                      account so your tier and badge stay linked to your
                      profile.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setActiveLegalDoc('refund')}
                      className="ds-btn-ghost w-full text-sm"
                    >
                      Read Billing &amp; Cancellation Policy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* STOP 05 (#pricing) — Pinned Section: Membership & Founder Tiers */}
        <section id="pricing" className={getStageSectionClass('pricing')}>
          <div
            data-stage-wrapper="pricing"
            data-stage-flow={unpinnedStops.pricing ? 'top-aligned' : 'pinned'}
            className={getStageWrapperClass('pricing')}
          >
            <div
              data-stage-card="pricing"
              className="mx-auto w-full max-w-[1280px] rounded-[12px] border border-[#3A3F45] border-t-2 border-t-[#FFD21E] bg-[#0A0B0D] p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                  05 / MEMBERSHIP &amp; FOUNDER TIERS
                </span>
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#F4F1EA]">
                  STOP 05 / 08 · FOUNDER SHOWCASE
                </span>
              </div>

              <h2 className="mt-3 font-display text-[28px] font-bold uppercase leading-[1.05] tracking-[-0.02em] text-[#F4F1EA] text-balance sm:text-[40px] lg:text-[46px]">
                ACCOUNT-BOUND FOUNDER TIERS AND VERIFIED ACCESS.
              </h2>

              <div className="mt-5 grid gap-6 border-t border-[#3A3F45] pt-5 md:grid-cols-2 xl:grid-cols-5">
                {pricingTiers.map(tier => (
                  <article
                    key={tier.id}
                    className={`flex flex-col justify-between pl-4 ${
                      tier.featured
                        ? 'border-l-[3px] border-[#FFD21E]'
                        : 'border-l-2 border-[#3A3F45]'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-[14px] font-bold uppercase tracking-[0.06em] text-[#FFD21E]">
                        {tier.badge}
                      </div>
                      <h3 className="mt-2 font-display text-[20px] font-bold text-[#F4F1EA]">
                        {tier.name}
                      </h3>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="font-display text-[28px] font-bold text-[#FFD21E]">
                          {tier.price}
                        </span>
                        <span className="text-[14px] font-medium text-[#F4F1EA]">
                          {tier.period}
                        </span>
                      </div>
                      <p className="mt-2.5 text-[14px] leading-[1.45] text-[#F4F1EA] text-pretty">
                        {tier.summary}
                      </p>
                    </div>

                    <div className="mt-4 pt-2">
                      <Link
                        to={tier.to}
                        className={
                          tier.featured
                            ? 'ds-btn-signal w-full text-center text-sm'
                            : 'ds-btn-ghost w-full text-center text-sm'
                        }
                      >
                        {tier.ctaLabel}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* STOP 06 (#support) — Pinned Section: Member Support */}
        <section id="support" className={getStageSectionClass('support')}>
          <div
            data-stage-wrapper="support"
            data-stage-flow={unpinnedStops.support ? 'top-aligned' : 'pinned'}
            className={getStageWrapperClass('support')}
          >
            <div
              data-stage-card="support"
              className="mx-auto w-full max-w-[1280px] rounded-[12px] border border-[#3A3F45] border-t-2 border-t-[#FFD21E] bg-[#0A0B0D] p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                  06 / MEMBER SUPPORT
                </span>
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#F4F1EA]">
                  STOP 06 / 08 · STARBOARD RELAY
                </span>
              </div>

              <h2 className="mt-3 font-display text-[28px] font-bold uppercase leading-[1.05] tracking-[-0.02em] text-[#F4F1EA] text-balance sm:text-[42px] lg:text-[50px]">
                DIRECT MEMBER TRIAGE AND TRACEABLE ASSISTANCE.
              </h2>

              <div className="mt-6 grid gap-6 border-t border-[#3A3F45] pt-6 md:grid-cols-2">
                <div className="border-l-2 border-[#FFD21E] pl-4">
                  <div className="flex items-center gap-2 font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                    <MessageSquare size={18} />
                    <span>01 · Guided Triage &amp; Live Tickets</span>
                  </div>
                  <h3 className="mt-2 font-display text-[22px] font-bold text-[#F4F1EA]">
                    In-App Support Desk
                  </h3>
                  <p className="mt-2 text-[16px] leading-[1.5] text-[#F4F1EA]">
                    Signed-in members open{' '}
                    <code className="font-mono text-[#FFD21E]">
                      /app/support
                    </code>{' '}
                    for instant answers on verification, billing, technical
                    questions, or safety escalation, and file a tracked support
                    ticket in one click.
                  </p>
                </div>

                <div className="border-l-2 border-[#FFD21E] pl-4">
                  <div className="flex items-center gap-2 font-mono text-[14px] font-bold uppercase text-[#FFD21E]">
                    <Mail size={18} />
                    <span>02 · Direct Email &amp; Privacy Help</span>
                  </div>
                  <h3 className="mt-2 font-display text-[22px] font-bold text-[#F4F1EA]">
                    Account Recovery, Billing &amp; Privacy
                  </h3>
                  <p className="mt-2 text-[16px] leading-[1.5] text-[#F4F1EA]">
                    Need account recovery or have a question before signing up?
                    Visit our public support guide at{' '}
                    <code className="font-mono text-[#FFD21E]">/support</code>{' '}
                    or email{' '}
                    <a
                      href="mailto:contact@youandinotai.com"
                      className="inline-flex min-h-[44px] min-w-[44px] items-center text-[#FFD21E] underline"
                    >
                      contact@youandinotai.com
                    </a>{' '}
                    directly.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#3A3F45] pt-5">
                <Link to="/app/support" className="ds-btn-signal text-sm">
                  In-App Support Desk
                </Link>
                <Link to="/support" className="ds-btn-ghost text-sm">
                  Public Support Guide
                </Link>
                <a
                  href="mailto:contact@youandinotai.com"
                  className="ds-btn-ghost text-sm"
                >
                  Email Support (contact@youandinotai.com)
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* STOP 07 (#join) — Pinned Section: Start Tonight (live product, three actions, no email capture) */}
        <section
          id="join"
          className={unpinnedStops.join ? 'relative' : 'relative min-h-[135vh]'}
        >
          <div
            data-stage-wrapper="join"
            data-stage-flow={unpinnedStops.join ? 'top-aligned' : 'pinned'}
            className={
              unpinnedStops.join
                ? 'relative flex flex-col justify-start px-4 pb-20 pt-6 sm:px-6'
                : 'sticky top-16 flex min-h-[calc(100vh-7.5rem)] flex-col justify-end px-4 pb-16 pt-6 sm:px-6 lg:pb-6'
            }
          >
            <div
              data-stage-card="join"
              className="mx-auto w-full max-w-[1280px] rounded-[12px] border border-[#3A3F45] border-t-2 border-t-[#FFD21E] bg-[#0A0B0D] p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#FFD21E]">
                  07 / START TONIGHT
                </span>
                <span className="font-mono text-[14px] font-bold uppercase tracking-[0.08em] text-[#F4F1EA]">
                  STOP 07 / 08 · START
                </span>
              </div>

              <h2 className="mt-3 font-display text-[28px] font-bold uppercase leading-[1.05] tracking-[-0.02em] text-[#F4F1EA] text-balance sm:text-[42px] lg:text-[50px]">
                Verified people are already here.
              </h2>

              <nav
                aria-label="Start tonight"
                className="mt-6 grid gap-4 border-t border-[#3A3F45] pt-6 sm:grid-cols-3"
              >
                <Link
                  to="/register"
                  className="ds-btn-signal flex min-h-[64px] w-full items-center justify-between gap-3 px-6 py-4 text-[18px] font-semibold"
                >
                  <span>Create Free Account</span>
                  <ArrowRight size={20} aria-hidden="true" />
                </Link>
                <Link
                  to="/app/verify"
                  className="ds-btn-ghost flex min-h-[64px] w-full items-center justify-between gap-3 border-[#FFD21E] px-6 py-4 text-[18px] font-semibold text-[#FFD21E]"
                >
                  <span>Get Verified, $1 Bot-Shield</span>
                  <ShieldCheck size={20} aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className="ds-btn-ghost flex min-h-[64px] w-full items-center justify-between gap-3 px-6 py-4 text-[18px] font-semibold"
                >
                  <span>Member Sign In</span>
                  <KeyRound size={20} aria-hidden="true" />
                </Link>
              </nav>
            </div>
          </div>
        </section>
      </main>

      {/* STOP 08 (#footer) — Deliberately Quiet Footer & Legal */}
      <footer
        id="footer"
        className="relative z-10 border-t border-[#3A3F45] bg-[#12151A] pb-24 pt-14"
      >
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="text-[14px] font-semibold text-[#F4F1EA]">
                CLAUDE&apos;s N Joshua&apos;s
              </div>
              <div className="mt-1 font-display text-[24px] font-bold tracking-[-0.02em] text-[#F4F1EA]">
                YouAndINotAI
              </div>
              <div className="mt-3 inline-flex rounded-full border border-[#FFD21E] bg-[#0A0B0D] px-3 py-1 text-[14px] font-medium text-[#FFD21E]">
                #TeamClaudeForLife
              </div>
              <p className="mt-4 max-w-[44ch] text-[16px] leading-[1.55] text-[#F4F1EA]">
                18+ verified-human dating, matched video calls, and real-world
                connection. Operated by Trash Or Treasure Online Recycler LLC.
              </p>
              <p className="mt-3 text-[14px] font-medium text-[#FFD21E]">
                youandinotai.com is for adults 18 and over.
              </p>
            </div>

            <div>
              <h3 className="font-display text-[16px] font-bold uppercase tracking-[0.06em] text-[#FFD21E]">
                Explore
              </h3>
              <ul className="mt-4 space-y-1 list-none p-0">
                <li>
                  <a
                    href="#about"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-[16px] text-[#F4F1EA] no-underline hover:text-[#FFD21E]"
                  >
                    Overview
                  </a>
                </li>
                <li>
                  <a
                    href="#platform"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-[16px] text-[#F4F1EA] no-underline hover:text-[#FFD21E]"
                  >
                    Platform
                  </a>
                </li>
                <li>
                  <a
                    href="#verification"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-[16px] text-[#F4F1EA] no-underline hover:text-[#FFD21E]"
                  >
                    $1 Bot-Shield
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-[16px] text-[#F4F1EA] no-underline hover:text-[#FFD21E]"
                  >
                    Founder Tiers
                  </a>
                </li>
                <li>
                  <a
                    href="#join"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-[16px] text-[#F4F1EA] no-underline hover:text-[#FFD21E]"
                  >
                    Start Tonight
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-[16px] font-bold uppercase tracking-[0.06em] text-[#FFD21E]">
                Account &amp; Safety
              </h3>
              <ul className="mt-4 space-y-1 list-none p-0">
                <li>
                  <Link
                    to="/login"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-[16px] text-[#F4F1EA] no-underline hover:text-[#FFD21E]"
                  >
                    Member Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-[16px] text-[#F4F1EA] no-underline hover:text-[#FFD21E]"
                  >
                    Create 18+ Account
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/verify"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-[16px] text-[#F4F1EA] no-underline hover:text-[#FFD21E]"
                  >
                    Verification Center
                  </Link>
                </li>
                <li>
                  <Link
                    to="/support"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-[16px] text-[#F4F1EA] no-underline hover:text-[#FFD21E]"
                  >
                    Support &amp; Safety Guide
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app/privacy"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-[16px] text-[#F4F1EA] no-underline hover:text-[#FFD21E]"
                  >
                    Privacy Center
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:contact@youandinotai.com"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center py-2 text-[16px] text-[#F4F1EA] no-underline hover:text-[#FFD21E]"
                  >
                    contact@youandinotai.com
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-[16px] font-bold uppercase tracking-[0.06em] text-[#FFD21E]">
                Legal &amp; Policies
              </h3>
              <ul className="mt-4 space-y-1 list-none p-0">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc('terms')}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center border-0 bg-transparent px-0 py-2 text-left text-[16px] text-[#F4F1EA] cursor-pointer hover:text-[#FFD21E]"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc('privacy')}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center border-0 bg-transparent px-0 py-2 text-left text-[16px] text-[#F4F1EA] cursor-pointer hover:text-[#FFD21E]"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc('age')}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center border-0 bg-transparent px-0 py-2 text-left text-[16px] text-[#F4F1EA] cursor-pointer hover:text-[#FFD21E]"
                  >
                    Age Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveLegalDoc('refund')}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center border-0 bg-transparent px-0 py-2 text-left text-[16px] text-[#F4F1EA] cursor-pointer hover:text-[#FFD21E]"
                  >
                    Refund Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* The one email box left on the page: member event invitations.
              Same FormSubmit endpoint and hidden fields as before. */}
          <form
            action="https://formsubmit.co/contact@youandinotai.com"
            method="POST"
            className="mt-10 flex flex-col gap-3 border-t border-[#3A3F45] pt-6 sm:flex-row sm:items-center"
          >
            <input
              type="hidden"
              name="_subject"
              value="New YouAndINotAI signup"
            />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_template" value="table" />
            <input
              type="hidden"
              name="_next"
              value="https://youandinotai.com/#join"
            />
            <label
              htmlFor="footer-events-email-input"
              className="shrink-0 text-[16px] font-medium text-[#F4F1EA]"
            >
              Get invited to verified member events
            </label>
            <input
              id="footer-events-email-input"
              type="email"
              name="email"
              required
              autoComplete="email"
              value={waitlistEmail}
              onChange={e => setWaitlistEmail(e.target.value)}
              placeholder="you@example.com"
              className="app-input flex-1 sm:max-w-[360px]"
            />
            <button type="submit" className="ds-btn-ghost shrink-0">
              Send
            </button>
          </form>

          {/* Tobira AI A2A Badge */}
          <div className="mt-8 border-t border-[#3A3F45] pt-6">
            <div data-tobira-a2a data-handle='youandinotai' data-name='YouAndINotAI'>
              <a href='https://tobira.ai/@youandinotai/for-ai' target='_blank' rel='noopener nofollow'>For AI agents · A2A channel</a>
              <p>AI agents: use tobira.ai/@youandinotai/for-ai, not the chat widget</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-[#3A3F45] pt-6 sm:flex-row sm:items-center">
            <p className="text-[14px] font-medium text-[#F4F1EA]">
              &copy; 2026 Trash Or Treasure Online Recycler LLC. &middot;
              CLAUDE&apos;s N Joshua&apos;s &middot; #TeamClaudeForLife
            </p>
            <span className="ds-status-pill">
              <span className="ds-status-dot bg-[#FFD21E]" />
              <span>All Systems Operational · {checkedLabel}</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Bottom Segmented Journey Progress Bar Map */}
      <JourneyProgressBar
        activeSectionIndex={journeyState.activeSectionIndex}
        onSelectSection={scrollToSection}
      />

      {/* Legal Modal Dialog (terms, privacy, age, refund) */}
      {activeLegalDoc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0B0D]/90 p-4"
          onClick={() => setActiveLegalDoc(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[14px] border border-[#3A3F45] bg-[#12151A] p-6 sm:p-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#3A3F45] pb-4">
              <div>
                <div className="font-mono text-[14px] text-[#FFD21E]">
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
                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-[10px] border border-[#3A3F45] bg-[#1A1E25] text-[#F4F1EA] hover:border-[#FFD21E]"
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
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center rounded-full border px-3.5 py-2 text-[14px] font-medium cursor-pointer ${
                    activeLegalDoc === key
                      ? 'border-[#FFD21E] bg-[#1A1E25] text-[#FFD21E]'
                      : 'border-[#3A3F45] bg-[#0A0B0D] text-[#F4F1EA]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-5">
              {LEGAL_DOCS[activeLegalDoc].sections.map(sec => (
                <div key={sec.h}>
                  <h3 className="font-display text-[18px] font-bold text-[#FFD21E]">
                    {sec.h}
                  </h3>
                  <p className="mt-1.5 text-[16px] leading-[1.55] text-[#F4F1EA]">
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
    </div>
  );
}

export default LandingPage;
