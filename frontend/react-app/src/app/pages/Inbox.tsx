import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

import { api } from '../../lib/api';

interface MatchData {
  match_id: string;
  user_id: string;
  display_name: string;
  photos: string[];
  matched_at: string;
  last_message_at: string | null;
}

export function Inbox() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<MatchData[]>('/matches')
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="glass-strong rounded-[2rem] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border-4 border-[#111111] bg-[#111111] text-white">
            <MessageCircle size={26} className="animate-pulse" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5c594f]">
            Loading conversations
          </p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="glass-strong glass-highlight max-w-xl rounded-[2rem] p-8 text-center">
          <div className="app-kicker mb-3">Messages</div>
          <h1 className="app-title">no messages yet.</h1>
          <p className="app-subtitle mt-4">
            Match first, then start from the prompt or shared interest that made
            the match happen.
          </p>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-[1.4rem] border-4 border-[#111111] bg-white p-4">
              <Sparkles size={18} className="mb-2 text-[#ff4f00]" />
              <h2 className="text-sm font-black uppercase tracking-[0.12em]">
                Better opener
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#5c594f]">
                Comment on a prompt instead of sending a blank greeting.
              </p>
            </div>
            <div className="rounded-[1.4rem] border-4 border-[#111111] bg-white p-4">
              <ShieldCheck size={18} className="mb-2 text-[#ff4f00]" />
              <h2 className="text-sm font-black uppercase tracking-[0.12em]">
                Safety stays visible
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#5c594f]">
                Report, block, freeze, and date-plan tools stay reachable.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="app-page-inner max-w-5xl">
        <div className="mb-8">
          <div className="app-kicker mb-3">Messages</div>
          <h1 className="app-title">active conversations.</h1>
          <p className="app-subtitle mt-4">
            {matches.length}{' '}
            {matches.length === 1 ? 'thread is' : 'threads are'} waiting on the
            next move.
          </p>
        </div>

        <div className="space-y-4 stagger-children">
          {matches.map(match => {
            const initial = match.display_name.charAt(0).toUpperCase();
            const hue = (match.display_name.charCodeAt(0) * 7) % 360;
            const bg = `hsl(${hue}, 50%, 32%)`;
            return (
              <Link
                key={match.match_id}
                to={`/app/chat/${match.match_id}`}
                className="glass-strong glass-highlight group flex items-center gap-4 rounded-[1.8rem] p-4 no-underline transition-all duration-200 hover:-translate-y-1"
              >
                <div className="relative shrink-0">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] border-4 border-[#111111] bg-cover bg-center text-2xl font-black text-white/40"
                    style={{
                      backgroundColor: bg,
                      backgroundImage: match.photos[0]
                        ? `url(${match.photos[0]})`
                        : undefined,
                    }}
                  >
                    {!match.photos[0] && initial}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#111111] bg-[#ff4f00]" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-black tracking-[-0.04em] text-[#111111]">
                    {match.display_name}
                  </h3>
                  <p className="mt-1 truncate text-sm font-medium text-[#5c594f]">
                    {match.last_message_at
                      ? `Last message ${new Date(
                          match.last_message_at
                        ).toLocaleDateString()}`
                      : 'No messages yet. Open the thread and start it.'}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border-4 border-[#111111] bg-[#111111] text-white shadow-[4px_4px_0_0_rgba(17,17,17,1)] transition-transform group-hover:-translate-y-0.5">
                  <ChevronRight size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
