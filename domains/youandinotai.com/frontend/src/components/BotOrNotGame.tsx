import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, RotateCcw, ShieldCheck } from 'lucide-react';

export type BotVariant = 'tin-can' | 'toaster' | 'radar' | 'valve' | 'gear';

export interface BotOrNotCard {
  id: string;
  indexLabel: string;
  kind: 'human' | 'bot';
  title: string;
  subtitle: string;
  imageSrc?: string;
  imageAlt?: string;
  botVariant?: BotVariant;
  joke: string;
}

export const BOT_OR_NOT_CARDS: BotOrNotCard[] = [
  {
    id: 'josh-blazer',
    indexLabel: '01 / 10',
    kind: 'human',
    title: 'Founder Josh · Blazer Check',
    subtitle: 'CANDIDATE 01 · LATE-NIGHT DEPLOY',
    imageSrc: '/bot-or-not/josh-portrait-blazer.jpg',
    imageAlt: 'Founder Josh in a black blazer and cap',
    joke: 'Human. Verified. Still debugging at 3 AM.',
  },
  {
    id: 'bot-tin-can',
    indexLabel: '02 / 10',
    kind: 'bot',
    title: 'TIN-CAN-9000 · Illustrated Unit',
    subtitle: 'CANDIDATE 02 · CHASSIS REV 4.2',
    botVariant: 'tin-can',
    joke: 'Bot. Still gets more sleep than Josh on deploy night.',
  },
  {
    id: 'josh-suit',
    indexLabel: '03 / 10',
    kind: 'human',
    title: 'Founder Josh · Suit & Tie',
    subtitle: 'CANDIDATE 03 · BOARDROOM BUILD',
    imageSrc: '/bot-or-not/josh-portrait-suit.jpg',
    imageAlt: 'Founder Josh in a charcoal suit and tie',
    joke: "Bot? No. Just hasn't slept since the last deploy.",
  },
  {
    id: 'bot-toaster',
    indexLabel: '04 / 10',
    kind: 'bot',
    title: 'SERVO-UNIT-404 · Illustrated Unit',
    subtitle: 'CANDIDATE 04 · COPPER COIL MK II',
    botVariant: 'toaster',
    joke: "Bot. Built from spare toaster parts and Josh's 4 AM coffee mugs.",
  },
  {
    id: 'josh-art-deco',
    indexLabel: '05 / 10',
    kind: 'human',
    title: 'Founder Josh · Cap & Watch',
    subtitle: 'CANDIDATE 05 · ART DECO PORTRAIT',
    imageSrc: '/bot-or-not/josh-portrait-art-deco.jpg',
    imageAlt: 'Illustrated art deco portrait of Founder Josh in a cap',
    joke: 'Real human. The beard is not AI-generated, we checked.',
  },
  {
    id: 'bot-radar',
    indexLabel: '06 / 10',
    kind: 'bot',
    title: 'CRON-BOT-3000 · Illustrated Unit',
    subtitle: 'CANDIDATE 06 · OSCILLOSCOPE HEAD',
    botVariant: 'radar',
    joke: 'Bot. Speaks only in status codes, just like Josh before espresso.',
  },
  {
    id: 'josh-cartoon',
    indexLabel: '07 / 10',
    kind: 'human',
    title: 'Founder Josh · Sketch Edition',
    subtitle: 'CANDIDATE 07 · CAFFEINE POWERED',
    imageSrc: '/bot-or-not/josh-portrait-cartoon.jpg',
    imageAlt: 'Illustrated cartoon portrait of Founder Josh smiling',
    joke: 'Human. Powered by cold brew and stubbornness, zero neural nets.',
  },
  {
    id: 'bot-valve',
    indexLabel: '08 / 10',
    kind: 'bot',
    title: 'VALVE-MECH-08 · Illustrated Unit',
    subtitle: 'CANDIDATE 08 · VACUUM TUBE ARRAY',
    botVariant: 'valve',
    joke: "Bot. Has fewer loose screws than Josh's weekend git branches.",
  },
  {
    id: 'josh-sticker',
    indexLabel: '09 / 10',
    kind: 'human',
    title: 'Founder Josh · Sticker Check',
    subtitle: 'CANDIDATE 09 · WRISTWATCH CHECK',
    imageSrc: '/bot-or-not/josh-sticker.jpg',
    imageAlt: 'Chibi sticker illustration of Founder Josh checking his watch',
    joke: 'Real human. Checks his watch like he is not three hours late for dinner.',
  },
  {
    id: 'bot-gear',
    indexLabel: '10 / 10',
    kind: 'bot',
    title: 'GEAR-DROID-77 · Illustrated Unit',
    subtitle: 'CANDIDATE 10 · DUAL ANTENNA RIG',
    botVariant: 'gear',
    joke: 'Bot. Programmed to never wear a baseball cap with a suit like Josh.',
  },
];

function RobotIllustration({ variant }: { variant: BotVariant }) {
  return (
    <svg
      data-testid="bot-or-not-robot-svg"
      viewBox="0 0 280 200"
      role="img"
      aria-label={`Illustrated robot card (${variant})`}
      className="h-full w-full max-h-[180px] sm:max-h-[210px]"
    >
      <rect
        x="4"
        y="4"
        width="272"
        height="192"
        rx="12"
        fill="#0A0B0D"
        stroke="#3A3F45"
        strokeWidth="2"
      />
      {/* Subtle circuit grid lines */}
      <line x1="20" y1="40" x2="260" y2="40" stroke="#1A1E25" strokeWidth="2" />
      <line
        x1="20"
        y1="160"
        x2="260"
        y2="160"
        stroke="#1A1E25"
        strokeWidth="2"
      />

      {/* Antenna assembly */}
      <line
        x1="140"
        y1="16"
        x2="140"
        y2="46"
        stroke="#FFD21E"
        strokeWidth="4"
      />
      <circle
        cx="140"
        cy="16"
        r="8"
        fill="#FFD21E"
        stroke="#0A0B0D"
        strokeWidth="2"
      />
      {variant === 'gear' || variant === 'radar' ? (
        <>
          <line
            x1="96"
            y1="24"
            x2="110"
            y2="46"
            stroke="#F4F1EA"
            strokeWidth="3"
          />
          <circle cx="94" cy="22" r="5" fill="#F4F1EA" />
          <line
            x1="184"
            y1="24"
            x2="170"
            y2="46"
            stroke="#F4F1EA"
            strokeWidth="3"
          />
          <circle cx="186" cy="22" r="5" fill="#F4F1EA" />
        </>
      ) : null}

      {/* Side ear bolts / vacuum tubes */}
      <rect
        x="58"
        y="78"
        width="18"
        height="36"
        rx="4"
        fill="#12151A"
        stroke="#FFD21E"
        strokeWidth="2.5"
      />
      <rect
        x="204"
        y="78"
        width="18"
        height="36"
        rx="4"
        fill="#12151A"
        stroke="#FFD21E"
        strokeWidth="2.5"
      />

      {/* Main metallic robot head chassis */}
      <rect
        x="76"
        y="46"
        width="128"
        height="104"
        rx={variant === 'toaster' ? '18' : '8'}
        fill="#12151A"
        stroke="#F4F1EA"
        strokeWidth="3"
      />

      {/* Forehead telemetry plate */}
      <rect
        x="98"
        y="56"
        width="84"
        height="12"
        rx="3"
        fill="#0A0B0D"
        stroke="#3A3F45"
        strokeWidth="1.5"
      />
      <circle cx="110" cy="62" r="3" fill="#FFD21E" />
      <circle cx="122" cy="62" r="3" fill="#F4F1EA" />
      <circle cx="134" cy="62" r="3" fill="#FFD21E" />

      {/* Robot optic sensors (eyes) */}
      {variant === 'radar' || variant === 'valve' ? (
        <>
          <rect
            x="94"
            y="78"
            width="36"
            height="24"
            rx="4"
            fill="#0A0B0D"
            stroke="#FFD21E"
            strokeWidth="2.5"
          />
          <rect
            x="150"
            y="78"
            width="36"
            height="24"
            rx="4"
            fill="#0A0B0D"
            stroke="#FFD21E"
            strokeWidth="2.5"
          />
          <circle cx="112" cy="90" r="6" fill="#FFD21E" />
          <circle cx="168" cy="90" r="6" fill="#FFD21E" />
        </>
      ) : (
        <>
          <circle
            cx="112"
            cy="90"
            r="15"
            fill="#0A0B0D"
            stroke="#FFD21E"
            strokeWidth="3"
          />
          <circle
            cx="168"
            cy="90"
            r="15"
            fill="#0A0B0D"
            stroke="#FFD21E"
            strokeWidth="3"
          />
          <circle cx="112" cy="90" r="6" fill="#FFD21E" />
          <circle cx="168" cy="90" r="6" fill="#FFD21E" />
        </>
      )}

      {/* Oscilloscope / speaker grille mouth */}
      <rect
        x="96"
        y="116"
        width="88"
        height="22"
        rx="4"
        fill="#0A0B0D"
        stroke="#F4F1EA"
        strokeWidth="2"
      />
      <polyline
        points="102,127 114,119 126,135 140,119 154,135 166,119 178,127"
        fill="none"
        stroke="#FFD21E"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Neck & shoulder bolts */}
      <rect
        x="118"
        y="150"
        width="44"
        height="14"
        fill="#1A1E25"
        stroke="#F4F1EA"
        strokeWidth="2"
      />
      <rect
        x="52"
        y="164"
        width="176"
        height="22"
        rx="6"
        fill="#12151A"
        stroke="#FFD21E"
        strokeWidth="2.5"
      />
      <text
        x="140"
        y="179"
        textAnchor="middle"
        fill="#FFD21E"
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fontWeight="700"
      >
        BOT CHASSIS // 100% SYNTH
      </text>
    </svg>
  );
}

export function BotOrNotGame() {
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const param = new URLSearchParams(window.location.search).get(
      'botOrNotCard'
    );
    const parsed = param ? parseInt(param, 10) : NaN;
    if (
      !Number.isNaN(parsed) &&
      parsed >= 0 &&
      parsed < BOT_OR_NOT_CARDS.length
    ) {
      return parsed;
    }
    return 0;
  });

  const [flipped, setFlipped] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      new URLSearchParams(window.location.search).get('botOrNotFlipped') === '1'
    );
  });

  const [lastGuess, setLastGuess] = useState<'human' | 'bot' | null>(null);
  const [score, setScore] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (
      params.has('botOrNotCard') ||
      params.has('botOrNotFlipped') ||
      window.location.hash === '#bot-or-not'
    ) {
      const scrollTarget = () => {
        const el = document.getElementById('bot-or-not');
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const top = Math.max(0, rect.top + window.scrollY - 64);
        window.scrollTo({ top, behavior: 'instant' as ScrollBehavior });
      };
      scrollTarget();
      const id = window.setTimeout(scrollTarget, 120);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, []);

  const card = BOT_OR_NOT_CARDS[currentIndex];
  const isGuessCorrect = lastGuess !== null && lastGuess === card.kind;

  const handleGuess = (guess: 'human' | 'bot') => {
    if (!flipped) {
      setScore(prev => ({
        correct: prev.correct + (guess === card.kind ? 1 : 0),
        total: prev.total + 1,
      }));
    }
    setLastGuess(guess);
    setFlipped(true);
  };

  const handleNextCard = () => {
    setFlipped(false);
    setLastGuess(null);
    setCurrentIndex(prev => (prev + 1) % BOT_OR_NOT_CARDS.length);
  };

  const handleReset = () => {
    setFlipped(false);
    setLastGuess(null);
  };

  return (
    <section
      id="bot-or-not"
      aria-label="Bot or Not founder game"
      className="relative min-h-[calc(100vh-4rem)] px-3 pb-24 pt-3 sm:px-6 sm:pb-28 sm:pt-8 lg:min-h-[120vh] lg:py-10"
    >
      <div
        data-stage-card="bot-or-not"
        className="mx-auto w-full max-w-[1280px] rounded-[12px] border border-[#3A3F45] border-t-2 border-t-[#FFD21E] bg-[#0A0B0D] p-3.5 sm:p-6 lg:p-8"
      >
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="font-mono text-[12px] font-bold uppercase tracking-[0.05em] text-[#FFD21E] sm:text-[14px]">
            BOT OR NOT · TROLL THE FOUNDER · #TeamClaudeForLife
          </span>
          <span className="font-mono text-[12px] font-bold uppercase tracking-[0.05em] text-[#F4F1EA] sm:text-[14px]">
            CARD {card.indexLabel} · SCORE {score.correct}/{score.total}
          </span>
        </div>

        <div className="mt-1.5 flex flex-col justify-between gap-1.5 sm:mt-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-[21px] font-bold uppercase leading-[1.06] tracking-[-0.02em] text-[#F4F1EA] sm:text-[34px]">
              BOT OR NOT? SPOT FOUNDER JOSH.
            </h2>
            <p className="mt-0.5 text-[14px] leading-[1.35] text-[#F4F1EA] sm:mt-1 sm:text-[16px]">
              Humans here are only Josh. Bots are illustrated tin cans. Tap{' '}
              <strong className="text-[#FFD21E]">Bot</strong> or{' '}
              <strong className="text-[#FFD21E]">Not</strong> to flip the card.
            </p>
          </div>
          <span className="hidden rounded-full border border-[#FFD21E] bg-[#12151A] px-3 py-1 font-mono text-[14px] font-bold text-[#FFD21E] sm:inline-flex">
            CLAUDE&apos;s N Joshua&apos;s · #TeamClaudeForLife
          </span>
        </div>

        {/* Single Active Card Stage */}
        <div
          data-testid="bot-or-not-card"
          data-card-id={card.id}
          data-card-kind={card.kind}
          data-flipped={flipped ? 'true' : 'false'}
          data-reduced-motion={reducedMotion ? 'true' : 'false'}
          className={`mt-2.5 rounded-[12px] border-2 sm:mt-4 ${
            flipped ? 'border-[#FFD21E]' : 'border-[#3A3F45]'
          } bg-[#12151A] p-3 sm:p-5 ${
            reducedMotion ? '' : 'transition-colors duration-200'
          }`}
        >
          {!flipped ? (
            /* CARD FRONT */
            <div className="grid items-center gap-3 sm:gap-4 lg:grid-cols-12">
              <div className="flex flex-col items-center justify-center overflow-hidden rounded-[10px] border border-[#3A3F45] bg-[#0A0B0D] p-2 sm:p-3 lg:col-span-5">
                {card.kind === 'human' && card.imageSrc ? (
                  <img
                    src={card.imageSrc}
                    alt={card.imageAlt || card.title}
                    className="h-[148px] w-auto max-w-full rounded-[8px] object-contain sm:h-[220px]"
                  />
                ) : (
                  <div className="flex h-[148px] w-full items-center justify-center sm:h-[220px]">
                    <RobotIllustration
                      variant={card.botVariant || 'tin-can'}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-between gap-2.5 sm:gap-4 lg:col-span-7">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#3A3F45] bg-[#0A0B0D] px-2.5 py-0.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-[#FFD21E] sm:px-3 sm:py-1 sm:text-[14px]">
                    {card.subtitle}
                  </div>
                  <h3 className="mt-1.5 font-display text-[19px] font-bold text-[#F4F1EA] sm:mt-2 sm:text-[26px]">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-[14px] leading-[1.35] text-[#F4F1EA] sm:mt-1.5 sm:text-[15px] sm:leading-[1.45]">
                    One card at a time. Make the call: is this an illustrated
                    tin-can bot, or Founder Josh running on 3 AM espresso?
                  </p>
                </div>

                {/* Bot or Not Tap Targets (>= 44x44px) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    data-testid="bot-or-not-btn-bot"
                    onClick={() => handleGuess('bot')}
                    className="ds-btn-ghost min-h-[44px] min-w-[44px] w-full border-2 border-[#FFD21E] bg-[#0A0B0D] py-2 font-display text-[17px] font-bold uppercase tracking-[0.06em] text-[#FFD21E] sm:text-[18px]"
                  >
                    Bot
                  </button>
                  <button
                    type="button"
                    data-testid="bot-or-not-btn-not"
                    onClick={() => handleGuess('human')}
                    className="ds-btn-signal min-h-[44px] min-w-[44px] w-full py-2 font-display text-[17px] font-bold uppercase tracking-[0.06em] sm:text-[18px]"
                  >
                    Not
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CARD BACK (FLIPPED ANSWER + ONE-LINE JOKE) */
            <div className="grid items-center gap-2.5 sm:gap-4 lg:grid-cols-12">
              <div className="flex flex-col items-center justify-center overflow-hidden rounded-[10px] border border-[#FFD21E] bg-[#0A0B0D] p-2 sm:p-3 lg:col-span-5">
                {card.kind === 'human' && card.imageSrc ? (
                  <img
                    src={card.imageSrc}
                    alt={card.imageAlt || card.title}
                    className="h-[124px] w-auto max-w-full rounded-[8px] object-contain sm:h-[205px]"
                  />
                ) : (
                  <div className="flex h-[124px] w-full items-center justify-center sm:h-[205px]">
                    <RobotIllustration
                      variant={card.botVariant || 'tin-can'}
                    />
                  </div>
                )}
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#FFD21E] bg-[#12151A] px-2.5 py-0.5 font-mono text-[12px] font-bold uppercase text-[#FFD21E] sm:mt-2 sm:px-3 sm:text-[14px]">
                  <Check size={14} aria-hidden="true" />
                  <span>
                    {card.kind === 'human'
                      ? 'VERIFIED HUMAN · FOUNDER JOSH'
                      : 'ILLUSTRATED BOT · ZERO HUMANS'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-2 sm:gap-3 lg:col-span-7">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="rounded-full bg-[#FFD21E] px-2.5 py-0.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-[#0A0B0D] sm:px-3 sm:py-1 sm:text-[14px]">
                      {card.kind === 'human'
                        ? 'ANSWER: NOT A BOT (HUMAN)'
                        : 'ANSWER: 100% BOT'}
                    </span>
                    <span className="rounded-full border border-[#3A3F45] bg-[#0A0B0D] px-2.5 py-0.5 font-mono text-[12px] font-bold uppercase text-[#F4F1EA] sm:px-3 sm:py-1 sm:text-[14px]">
                      {lastGuess === null
                        ? 'CARD FLIPPED'
                        : isGuessCorrect
                          ? 'SPOT ON · YOU CALLED IT'
                          : 'PLOT TWIST · FOOLED YOU'}
                    </span>
                  </div>

                  <h3 className="mt-1.5 font-display text-[18px] font-bold text-[#FFD21E] sm:mt-2.5 sm:text-[22px]">
                    {card.title}
                  </h3>

                  {/* One-line founder roast / joke */}
                  <p
                    data-testid="bot-or-not-joke"
                    className="mt-1.5 rounded-[8px] border-l-4 border-[#FFD21E] bg-[#0A0B0D] p-2.5 font-display text-[16px] font-bold leading-[1.3] text-[#F4F1EA] sm:mt-2 sm:p-3.5 sm:text-[22px]"
                  >
                    &ldquo;{card.joke}&rdquo;
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-0.5 sm:gap-3 sm:pt-1">
                  <button
                    type="button"
                    data-testid="bot-or-not-next"
                    onClick={handleNextCard}
                    className="ds-btn-signal min-h-[44px] min-w-[44px] flex-1 py-2"
                  >
                    <span>Next Card</span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="ds-btn-ghost min-h-[44px] min-w-[44px] py-2"
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    <span>Flip Back</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Single Concluding Button Wired to Existing Verification Route (/app/verify) */}
        <div className="mt-3 flex flex-col items-stretch justify-between gap-2 border-t border-[#3A3F45] pt-3 sm:mt-4 sm:flex-row sm:items-center sm:gap-3 sm:pt-4">
          <span className="hidden font-mono text-[14px] font-bold uppercase tracking-[0.06em] text-[#F4F1EA] sm:inline">
            REAL HUMANS ONLY · NO AI FACES · NO MEMBER PHOTOS
          </span>
          <Link
            to="/app/verify"
            data-testid="bot-or-not-verify-cta"
            className="ds-btn-signal min-h-[44px] min-w-[44px] justify-center px-3 py-2 text-center text-[14px] font-bold sm:px-5 sm:py-3 sm:text-[16px]"
          >
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Prove you&apos;re not a bot: Get Verified for $1</span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default BotOrNotGame;
