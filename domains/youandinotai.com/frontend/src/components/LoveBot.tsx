import React, { useState } from 'react';
import {
  Calculator,
  Gift,
  Heart,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Stars,
} from 'lucide-react';

import { ApiError, api } from '../lib/api';

type LoveBotTab = 'compatibility' | 'quotes' | 'tips' | 'gifts';
type TipCategory =
  | 'attracting_partners_neutral'
  | 'attracting_partners_feminine'
  | 'attracting_partners_masculine'
  | 'first_kiss';

interface User {
  display_name: string;
  subscription_active: boolean;
}

interface CompatibilityResponse {
  score: number;
  message: string;
}

interface QuoteResponse {
  text: string;
  author: string;
  category: string;
}

interface TipResponse {
  category: string;
  tips: string[];
}

interface GiftResponse {
  recipient: string;
  ideas: string[];
}

type LoveBotResult =
  CompatibilityResponse | QuoteResponse | TipResponse | GiftResponse | null;

const FOUNDING_MEMBER_LINK = '/app/checkout/founding_member';

const TIP_CATEGORY_OPTIONS: Array<{ value: TipCategory; label: string }> = [
  { value: 'attracting_partners_neutral', label: 'Soulmate Connection' },
  { value: 'attracting_partners_feminine', label: 'Feminine Energy' },
  { value: 'attracting_partners_masculine', label: 'Masculine Energy' },
  { value: 'first_kiss', label: 'First Kiss' },
];

function isCompatibilityResult(
  result: LoveBotResult
): result is CompatibilityResponse {
  return Boolean(result && 'score' in result && 'message' in result);
}

function isQuoteResult(result: LoveBotResult): result is QuoteResponse {
  return Boolean(result && 'text' in result && 'author' in result);
}

function isTipResult(result: LoveBotResult): result is TipResponse {
  return Boolean(result && 'tips' in result);
}

function isGiftResult(result: LoveBotResult): result is GiftResponse {
  return Boolean(result && 'ideas' in result);
}

const LoveBot: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<LoveBotTab>('compatibility');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LoveBotResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [tipCategory, setTipCategory] = useState<TipCategory>(
    'attracting_partners_neutral'
  );
  const [names, setNames] = useState({
    name1: user.display_name || 'You',
    name2: '',
  });

  const isPremium = user.subscription_active;

  const switchTab = (tab: LoveBotTab) => {
    setActiveTab(tab);
    setError(null);
    setResult(null);
  };

  const runRequest = async <T,>(task: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await task();
      setResult(data as LoveBotResult);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Concierge could not complete that request right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-gray-900/50 p-8 text-center backdrop-blur-sm">
        <Heart className="mx-auto mb-4 h-16 w-16 animate-pulse text-amber-500" />
        <h2 className="mb-2 text-2xl font-bold text-white">Unlock Concierge</h2>
        <p className="mx-auto mb-6 max-w-md text-gray-400">
          Concierge is reserved for Founding Member accounts with active premium
          access. Compatibility tools, romance prompts, dating tips, and gift
          ideas all unlock there.
        </p>
        <a
          href={FOUNDING_MEMBER_LINK}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 px-8 py-3 font-bold text-white no-underline transition-transform hover:scale-105"
        >
          Upgrade to Founding Member
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-amber-500/30 bg-black/40 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-amber-500/20 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 shadow-lg shadow-amber-500/50">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-widest uppercase">
              Concierge
            </h2>
            <p className="text-xs text-amber-300/80 font-medium">
              Because love is blind to gender.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => switchTab('compatibility')}
            className={`rounded-lg p-2 transition-colors ${
              activeTab === 'compatibility'
                ? 'bg-amber-500 text-white'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
            aria-label="Compatibility"
          >
            <Calculator className="h-5 w-5" />
          </button>
          <button
            onClick={() => switchTab('quotes')}
            className={`rounded-lg p-2 transition-colors ${
              activeTab === 'quotes'
                ? 'bg-amber-500 text-white'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
            aria-label="Quotes"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => switchTab('tips')}
            className={`rounded-lg p-2 transition-colors ${
              activeTab === 'tips'
                ? 'bg-amber-500 text-white'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
            aria-label="Tips"
          >
            <Sparkles className="h-5 w-5" />
          </button>
          <button
            onClick={() => switchTab('gifts')}
            className={`rounded-lg p-2 transition-colors ${
              activeTab === 'gifts'
                ? 'bg-amber-500 text-white'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
            aria-label="Gift ideas"
          >
            <Gift className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'compatibility' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-gray-400">
                  You
                </label>
                <input
                  value={names.name1}
                  onChange={e => setNames({ ...names, name1: e.target.value })}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 p-3 text-white outline-none transition-colors focus:border-amber-500"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-gray-400">
                  Them
                </label>
                <input
                  value={names.name2}
                  onChange={e => setNames({ ...names, name2: e.target.value })}
                  className="w-full rounded-xl border border-gray-800 bg-gray-900 p-3 text-white outline-none transition-colors focus:border-amber-500"
                  placeholder="Their name"
                />
              </div>
            </div>

            <button
              onClick={() =>
                runRequest(() =>
                  api.post<CompatibilityResponse>(
                    '/lovebot/compatibility',
                    names
                  )
                )
              }
              disabled={loading || !names.name1.trim() || !names.name2.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-4 text-lg font-bold text-white transition-all hover:bg-amber-500 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                <Sparkles className="h-6 w-6" />
              )}
              Calculate Affinity
            </button>

            {isCompatibilityResult(result) && (
              <div className="mt-8 rounded-3xl border border-amber-500/20 bg-gradient-to-b from-gray-900/80 to-amber-900/20 p-8 text-center">
                <div className="mb-2 text-6xl font-black text-amber-500">
                  {result.score}%
                </div>
                <div className="mb-4 text-xl font-semibold text-white">
                  Love Match
                </div>
                <p className="italic leading-relaxed text-gray-300">
                  "{result.message}"
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="space-y-6">
            <p className="text-center text-sm text-gray-400">
              Randomized romance prompts, love quotes, and sweet openers.
            </p>
            <button
              onClick={() =>
                runRequest(() => api.get<QuoteResponse>('/lovebot/quotes'))
              }
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-600 py-4 font-bold text-white transition-colors hover:bg-yellow-500 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
              />
              Generate Magic Quote
            </button>

            {isQuoteResult(result) && (
              <div className="relative mt-8 rounded-3xl border border-yellow-500/20 bg-gray-900/80 p-8">
                <div className="absolute -left-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-600">
                  <Stars className="h-6 w-6 text-white" />
                </div>
                <p className="mb-4 text-2xl italic leading-relaxed text-white">
                  "{result.text}"
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-yellow-400">
                    — {result.author}
                  </span>
                  <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-yellow-300">
                    {result.category}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {TIP_CATEGORY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setTipCategory(option.value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    tipCategory === option.value
                      ? 'border-amber-500/40 bg-amber-500/10 text-white'
                      : 'border-white/5 bg-gray-900/60 text-gray-400 hover:border-amber-500/20 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                runRequest(() =>
                  api.get<TipResponse>(`/lovebot/tips?category=${tipCategory}`)
                )
              }
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-4 font-bold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
              />
              Load Expert Tips
            </button>

            {isTipResult(result) && (
              <div className="space-y-3 rounded-3xl border border-rose-500/20 bg-gray-900/70 p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">
                  {TIP_CATEGORY_OPTIONS.find(
                    option => option.value === result.category
                  )?.label || 'Advice'}
                </h3>
                {result.tips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex gap-4 rounded-2xl border border-white/5 bg-black/30 p-4"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-sm font-bold text-rose-400">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm leading-relaxed text-white">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'gifts' && (
          <div className="space-y-6">
            <div className="flex gap-2 text-center">
              <button
                onClick={() =>
                  runRequest(() =>
                    api.get<GiftResponse>('/lovebot/gifts?recipient=neutral')
                  )
                }
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl border border-yellow-500/30 bg-yellow-900/20 py-4 shadow-[0_0_15px_rgba(234,179,8,0.15)] text-yellow-300 transition-all hover:bg-yellow-900/40 hover:scale-[1.02]"
              >
                <span className="text-[10px] uppercase tracking-widest opacity-80">
                  Ideas for
                </span>
                <span className="font-black uppercase tracking-[0.2em] text-white">
                  Partner
                </span>
              </button>
              <button
                onClick={() =>
                  runRequest(() =>
                    api.get<GiftResponse>('/lovebot/gifts?recipient=feminine')
                  )
                }
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl border border-amber-500/30 bg-amber-900/20 py-4 shadow-[0_0_15px_rgba(236,72,153,0.15)] text-amber-300 transition-all hover:bg-amber-900/40 hover:scale-[1.02]"
              >
                <span className="text-[10px] uppercase tracking-widest opacity-80">
                  Ideas for
                </span>
                <span className="font-black uppercase tracking-[0.2em] text-white">
                  Her
                </span>
              </button>
              <button
                onClick={() =>
                  runRequest(() =>
                    api.get<GiftResponse>('/lovebot/gifts?recipient=masculine')
                  )
                }
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl border border-stone-500/30 bg-stone-900/20 py-4 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-stone-300 transition-all hover:bg-stone-900/40 hover:scale-[1.02]"
              >
                <span className="text-[10px] uppercase tracking-widest opacity-80">
                  Ideas for
                </span>
                <span className="font-black uppercase tracking-[0.2em] text-white">
                  Him
                </span>
              </button>
            </div>

            {isGiftResult(result) && (
              <div className="space-y-3">
                <h3 className="mb-2 pl-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                  Top Gift Suggestions
                </h3>
                {result.ideas.map((idea, index) => (
                  <div
                    key={index}
                    className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-gray-900/60 p-4 transition-colors hover:border-amber-500/30"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-900/40 text-sm font-bold text-amber-500">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-sm leading-relaxed text-white">
                      {idea}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoveBot;

