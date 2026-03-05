import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
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
        <div className="text-gray-400 animate-pulse">Loading conversations...</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center mb-6">
          <MessageCircle size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Messages</h1>
        <p className="text-gray-400 max-w-md">
          Match with someone to start chatting!
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-black text-white mb-6">Messages</h1>
        <div className="space-y-2">
          {matches.map((match) => {
            const initial = match.display_name.charAt(0).toUpperCase();
            const bg = `hsl(${match.display_name.charCodeAt(0) * 7 % 360}, 60%, 30%)`;
            return (
              <Link
                key={match.match_id}
                to={`/app/chat/${match.match_id}`}
                className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-2xl border border-white/5 hover:border-pink-500/20 transition-colors no-underline"
              >
                <div
                  className="w-14 h-14 rounded-full bg-cover bg-center flex-shrink-0 flex items-center justify-center"
                  style={{
                    backgroundColor: bg,
                    backgroundImage: match.photos[0] ? `url(${match.photos[0]})` : undefined,
                  }}
                >
                  {!match.photos[0] && (
                    <span className="text-2xl font-black text-white/30">{initial}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm">{match.display_name}</h3>
                  <p className="text-gray-500 text-xs truncate">
                    {match.last_message_at
                      ? `Last message ${new Date(match.last_message_at).toLocaleDateString()}`
                      : 'No messages yet — say hi!'}
                  </p>
                </div>
                <MessageCircle size={18} className="text-gray-600 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
