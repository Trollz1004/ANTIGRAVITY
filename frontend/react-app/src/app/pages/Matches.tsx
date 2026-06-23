import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Heart, MessageCircle, ShieldCheck } from 'lucide-react';

import { api } from '../../lib/api';

interface MatchData {
  match_id: string;
  user_id: string;
  display_name: string;
  photos: string[];
  matched_at: string;
  last_message_at: string | null;
}

export function Matches() {
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
            <Heart size={26} className="animate-pulse" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5c594f]">
            Loading matches
          </p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="glass-strong glass-highlight max-w-xl rounded-[2rem] p-8 text-center">
          <div className="app-kicker mb-3">Matches</div>
          <h1 className="app-title">no matches yet.</h1>
          <p className="app-subtitle mt-4">
            Like or comment on a prompt in Discover. Mutual interest opens chat,
            then Plans helps move the conversation safely offline.
          </p>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            <div className="rounded-[1.2rem] border-4 border-[#111111] bg-white p-4">
              <ShieldCheck size={18} className="mb-2 text-[#ff4f00]" />
              <div className="text-xs font-black uppercase tracking-[0.12em]">
                Verify
              </div>
            </div>
            <div className="rounded-[1.2rem] border-4 border-[#111111] bg-white p-4">
              <Heart size={18} className="mb-2 text-[#ff4f00]" />
              <div className="text-xs font-black uppercase tracking-[0.12em]">
                Match
              </div>
            </div>
            <div className="rounded-[1.2rem] border-4 border-[#111111] bg-white p-4">
              <CalendarCheck size={18} className="mb-2 text-[#ff4f00]" />
              <div className="text-xs font-black uppercase tracking-[0.12em]">
                Plan
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="app-page-inner">
        <div className="mb-8">
          <div className="app-kicker mb-3">Matches</div>
          <h1 className="app-title">mutual connections.</h1>
          <p className="app-subtitle mt-4">
            {matches.length}{' '}
            {matches.length === 1 ? 'connection is' : 'connections are'} ready
            for a real conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
          {matches.map(match => {
            const initial = match.display_name.charAt(0).toUpperCase();
            const hue = (match.display_name.charCodeAt(0) * 7) % 360;
            const bg = `hsl(${hue}, 50%, 32%)`;
            return (
              <Link
                key={match.match_id}
                to={`/app/chat/${match.match_id}`}
                className="glass-strong glass-highlight group rounded-[2rem] p-3 no-underline transition-all duration-200 hover:-translate-y-1"
              >
                <div
                  className="relative flex aspect-[4/5] items-end overflow-hidden rounded-[1.5rem] border-4 border-[#111111] bg-cover bg-center"
                  style={{
                    backgroundColor: bg,
                    backgroundImage: match.photos[0]
                      ? `url(${match.photos[0]})`
                      : undefined,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
                  {!match.photos[0] && (
                    <span className="relative mx-auto mb-16 text-6xl font-black text-white/30">
                      {initial}
                    </span>
                  )}
                  <div className="relative flex w-full items-center justify-between gap-3 p-4 text-white">
                    <div>
                      <h3 className="text-lg font-black tracking-[-0.05em]">
                        {match.display_name}
                      </h3>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                        Matched{' '}
                        {new Date(match.matched_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border-2 border-white bg-white/10">
                      <MessageCircle size={18} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
