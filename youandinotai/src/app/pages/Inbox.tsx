import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ChevronRight } from 'lucide-react';
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
    api.get<MatchData[]>('/matches')
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={24} className="text-blue-400 animate-pulse" />
          </div>
          <p className="text-gray-400 font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-scale-in">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20 animate-float">
            <MessageCircle size={44} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Messages</h1>
          <p className="text-gray-400 max-w-sm leading-relaxed">
            Match with someone to start chatting!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-black text-white mb-1 tracking-tight">Messages</h1>
          <p className="text-gray-500 text-sm mb-6">{matches.length} {matches.length === 1 ? 'conversation' : 'conversations'}</p>
        </div>

        <div className="space-y-2 stagger-children">
          {matches.map((match) => {
            const initial = match.display_name.charAt(0).toUpperCase();
            const hue = match.display_name.charCodeAt(0) * 7 % 360;
            const bg = `hsl(${hue}, 50%, 25%)`;
            return (
              <Link
                key={match.match_id}
                to={`/app/chat/${match.match_id}`}
                className="flex items-center gap-4 p-4 glass rounded-2xl hover:bg-white/[0.04] hover:border-pink-500/10 transition-all duration-200 no-underline group"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-14 h-14 rounded-2xl bg-cover bg-center flex items-center justify-center"
                    style={{
                      backgroundColor: bg,
                      backgroundImage: match.photos[0] ? `url(${match.photos[0]})` : undefined,
                    }}
                  >
                    {!match.photos[0] && (
                      <span className="text-2xl font-black text-white/25">{initial}</span>
                    )}
                  </div>
                  {/* Online dot placeholder */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-gray-950" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm group-hover:text-pink-300 transition-colors">{match.display_name}</h3>
                  <p className="text-gray-500 text-xs truncate mt-0.5">
                    {match.last_message_at
                      ? `Last message ${new Date(match.last_message_at).toLocaleDateString()}`
                      : 'No messages yet — say hi!'}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight size={18} className="text-gray-600 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
