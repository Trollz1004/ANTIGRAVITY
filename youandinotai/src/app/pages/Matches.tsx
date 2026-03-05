import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
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
    api.get<MatchData[]>('/matches')
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <Heart size={24} className="text-pink-400 animate-pulse" />
          </div>
          <p className="text-gray-400 font-medium">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-scale-in">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-pink-500/20 animate-float">
            <Heart size={44} className="text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Your Matches</h1>
          <p className="text-gray-400 max-w-sm leading-relaxed">
            When you and someone else both swipe right, they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-black text-white mb-1 tracking-tight">
          Your Matches
        </h1>
        <p className="text-gray-500 text-sm mb-6">{matches.length} {matches.length === 1 ? 'connection' : 'connections'}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
        {matches.map((match) => {
          const initial = match.display_name.charAt(0).toUpperCase();
          const hue = match.display_name.charCodeAt(0) * 7 % 360;
          const bg = `hsl(${hue}, 50%, 25%)`;
          return (
            <Link
              key={match.match_id}
              to={`/app/chat/${match.match_id}`}
              className="group rounded-3xl overflow-hidden glass glass-highlight hover:border-pink-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/5 hover:scale-[1.02] no-underline"
            >
              <div
                className="w-full aspect-[3/4] bg-cover bg-center flex items-center justify-center relative"
                style={{
                  backgroundColor: bg,
                  backgroundImage: match.photos[0] ? `url(${match.photos[0]})` : undefined,
                }}
              >
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />

                {!match.photos[0] && (
                  <span className="text-5xl font-black text-white/20 relative">{initial}</span>
                )}

                {/* Chat prompt on hover */}
                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 justify-center">
                    <MessageCircle size={14} className="text-pink-400" />
                    <span className="text-xs font-medium text-white">Send message</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-bold text-sm truncate group-hover:text-pink-300 transition-colors">{match.display_name}</h3>
                <p className="text-gray-500 text-xs mt-1">
                  Matched {new Date(match.matched_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
