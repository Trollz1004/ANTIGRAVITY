import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
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
        <div className="text-gray-400 animate-pulse">Loading matches...</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-400 to-pink-500 flex items-center justify-center mb-6">
          <Heart size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Your Matches</h1>
        <p className="text-gray-400 max-w-md">
          When you and someone else both swipe right, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <h1 className="text-2xl font-black text-white mb-6">
        Your Matches ({matches.length})
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {matches.map((match) => {
          const initial = match.display_name.charAt(0).toUpperCase();
          const bg = `hsl(${match.display_name.charCodeAt(0) * 7 % 360}, 60%, 30%)`;
          return (
            <div
              key={match.match_id}
              className="bg-gray-800 rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/30 transition-colors cursor-pointer"
            >
              <div
                className="w-full aspect-square bg-cover bg-center flex items-center justify-center"
                style={{
                  backgroundColor: bg,
                  backgroundImage: match.photos[0] ? `url(${match.photos[0]})` : undefined,
                }}
              >
                {!match.photos[0] && (
                  <span className="text-5xl font-black text-white/30">{initial}</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-white font-bold text-sm truncate">{match.display_name}</h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Matched {new Date(match.matched_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
