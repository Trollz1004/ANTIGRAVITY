'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  Heart,
  MessageCircle,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
} from 'lucide-react';

import Membership from '../components/Membership';

const featureCards = [
  {
    icon: UserCheck,
    title: 'Verified profiles',
    body: 'Selfie verification, account status, and visible trust cues make real people easier to spot before matching.',
  },
  {
    icon: MessageCircle,
    title: 'Prompt-first matching',
    body: 'Users like or comment on a specific prompt, photo, or interest so the first message has context.',
  },
  {
    icon: CalendarCheck,
    title: 'Plans and check-ins',
    body: 'Move from chat to a clear date plan with public meetup context and a share-date/check-in path.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety stays visible',
    body: 'Report, block, restrict, freeze, and support actions stay reachable from profile and chat surfaces.',
  },
];

const mvpFlow = [
  'Create a profile with intent, interests, and one strong prompt.',
  'Verify the account before entering the main discovery lane.',
  'Discover profiles with verification, intent, availability, and compatibility context.',
  'Like or comment on a prompt to open better conversations.',
  'Use Plans to prepare a safer first meetup when chat is ready.',
];

function PhonePreview({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div
      className={`mx-auto w-full max-w-[24rem] rounded-[2.4rem] border p-3 shadow-2xl ${
        isDarkMode
          ? 'border-slate-700 bg-slate-950 shadow-blue-950/30'
          : 'border-slate-200 bg-slate-950 shadow-slate-300'
      }`}
    >
      <div className="overflow-hidden rounded-[2rem] bg-[#fff7ea] text-slate-950">
        <div className="flex items-center justify-between border-b-4 border-slate-950 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#dc2626]">
              Verified lane
            </p>
            <h2 className="text-xl font-black tracking-[-0.06em]">
              Discover
            </h2>
          </div>
          <BadgeCheck className="text-[#2563eb]" size={24} />
        </div>

        <div className="p-4">
          <div className="mb-4 rounded-[1.5rem] border-4 border-slate-950 bg-[#ffe4e6] p-4 shadow-[6px_6px_0_0_rgba(15,23,42,1)]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#dc2626]">
              Tonight's best-fit pick
            </p>
            <p className="mt-2 text-sm font-bold leading-6">
              Verified, relationship-ready, and available within your distance
              range.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border-4 border-slate-950 bg-gradient-to-br from-[#fecaca] via-[#fff7ed] to-[#dbeafe] shadow-[8px_8px_0_0_rgba(15,23,42,1)]">
            <div className="flex min-h-[21rem] items-end p-5">
              <div className="w-full">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-white px-3 py-1 text-xs font-black">
                  <ShieldCheck size={14} className="text-[#dc2626]" />
                  Selfie verified
                </div>
                <h3 className="text-4xl font-black tracking-[-0.08em]">
                  Maya, 31
                </h3>
                <p className="mt-2 text-sm font-bold text-slate-700">
                  Relationship ready - Orlando, FL
                </p>
              </div>
            </div>
            <div className="border-t-4 border-slate-950 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#dc2626]">
                Prompt
              </p>
              <p className="mt-2 text-lg font-black leading-snug">
                My ideal first date is coffee, a bookstore, and no pressure to
                perform.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <button className="min-h-12 rounded-[1rem] border-4 border-slate-950 bg-white text-sm font-black">
              Pass
            </button>
            <button className="min-h-12 rounded-[1rem] border-4 border-slate-950 bg-[#dc2626] text-sm font-black text-white">
              Comment
            </button>
            <button className="min-h-12 rounded-[1rem] border-4 border-slate-950 bg-[#2563eb] text-sm font-black text-white">
              Like
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 border-t-4 border-slate-950 bg-white px-2 py-2 text-[10px] font-black uppercase">
          {['Discover', 'Matches', 'Chat', 'Plans', 'Profile'].map((item) => (
            <div
              key={item}
              className={`rounded-xl px-1 py-2 text-center ${
                item === 'Discover' ? 'bg-slate-950 text-white' : 'text-slate-500'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <main
      className={`min-h-screen overflow-x-hidden transition-all duration-500 ${
        isDarkMode ? 'bg-[#020617] text-slate-100' : 'bg-[#fff7ed] text-slate-950'
      }`}
    >
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-30"
        style={{
          background:
            'radial-gradient(circle at 12% 16%, rgba(220,38,38,0.22), transparent 24%), radial-gradient(circle at 86% 8%, rgba(37,99,235,0.18), transparent 22%)',
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header
          className={`flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border px-5 py-4 ${
            isDarkMode
              ? 'border-slate-800 bg-slate-950/70'
              : 'border-slate-200 bg-white/80 shadow-sm'
          }`}
        >
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-red-500">
              YouAndINotAI
            </p>
            <h1 className="text-2xl font-black tracking-[-0.08em]">
              verified dating, safer plans.
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setIsDarkMode((value) => !value)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-black uppercase tracking-[0.12em] ${
              isDarkMode
                ? 'border-slate-700 bg-slate-900 text-slate-100'
                : 'border-slate-300 bg-white text-slate-900'
            }`}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            Theme
          </button>
        </header>

        <section
          className={`grid gap-8 rounded-[2.5rem] border p-6 md:grid-cols-[1.05fr_0.95fr] md:p-10 ${
            isDarkMode
              ? 'border-slate-800 bg-slate-950/72'
              : 'border-slate-200 bg-white/80 shadow-xl'
          }`}
        >
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-red-400">
              <Heart size={15} />
              Google Play MVP path
            </div>
            <h2 className="max-w-4xl text-5xl font-black leading-[0.88] tracking-[-0.09em] sm:text-6xl lg:text-7xl">
              real profiles before real dates.
            </h2>
            <p
              className={`mt-6 max-w-2xl text-lg leading-8 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              YouAndINotAI is being built around the patterns users already
              trust in top dating apps: verification, prompt-rich profiles,
              safer chat, clear intent, and simple date planning.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#membership"
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-red-950/30"
              >
                Get verified <ArrowUpRight size={16} />
              </a>
              <a
                href="#features"
                className={`inline-flex min-h-12 items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-black uppercase tracking-[0.14em] ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-900 text-slate-100'
                    : 'border-slate-300 bg-white text-slate-950'
                }`}
              >
                See features
              </a>
            </div>
          </div>

          <PhonePreview isDarkMode={isDarkMode} />
        </section>

        <section
          id="features"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className={`rounded-[2rem] border p-6 transition-transform hover:-translate-y-1 ${
                isDarkMode
                  ? 'border-slate-800 bg-slate-950/70'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <feature.icon className="mb-5 text-red-500" size={26} />
              <h3 className="text-xl font-black tracking-[-0.04em]">
                {feature.title}
              </h3>
              <p
                className={`mt-3 text-sm leading-7 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {feature.body}
              </p>
            </article>
          ))}
        </section>

        <section
          className={`grid gap-8 rounded-[2.5rem] border p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8 ${
            isDarkMode
              ? 'border-slate-800 bg-slate-950/70'
              : 'border-slate-200 bg-white shadow-sm'
          }`}
        >
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              <Sparkles size={15} />
              Build order
            </div>
            <h2 className="text-4xl font-black leading-none tracking-[-0.08em]">
              ship the trust loop first.
            </h2>
            <p
              className={`mt-4 leading-7 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              AI chemistry, group dates, and event-heavy recommendations can
              wait. The first Google Play path needs profile, verification,
              discovery, match, chat, and safe plan flow.
            </p>
          </div>
          <ol className="grid gap-3">
            {mvpFlow.map((item, index) => (
              <li
                key={item}
                className={`flex gap-4 rounded-[1.4rem] border p-4 ${
                  isDarkMode
                    ? 'border-slate-800 bg-slate-900/70'
                    : 'border-slate-200 bg-orange-50'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600 text-sm font-black text-white">
                  {index + 1}
                </span>
                <span className="font-semibold leading-7">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <Membership isDarkMode={isDarkMode} />

        <footer
          className={`py-8 text-center text-[10px] font-black uppercase tracking-[0.24em] ${
            isDarkMode ? 'text-slate-600' : 'text-slate-500'
          }`}
        >
          Payments are processed by Square. Membership and verification are
          product access transactions.
        </footer>
      </div>
    </main>
  );
}
