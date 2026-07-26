import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PhoneOff, ShieldCheck, Video } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import VideoChat from '../../components/VideoChat';

export function VideoCallPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const starting = useRef(false);

  useEffect(() => {
    if (!user?.id || !matchId) return;
    const key = `video-call-${matchId}-${user.id}`;
    if (localStorage.getItem(`${key}-started`) === '1') return;
    starting.current = true;
    localStorage.setItem(`${key}-started`, '1');
    fetch(`/api/v1/video/room/${matchId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
      },
    })
      .then(async res => {
        if (res.status === 404) {
          const fallback = await fetch(`/api/v1/matches/${matchId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
            },
          });
          if (fallback.ok) return fallback.json();
        }
        if (!res.ok) throw new Error(`Video room setup failed: ${res.status}`);
        return res.json();
      })
      .then(() => {})
      .catch(err => setError(err.message))
      .finally(() => {
        starting.current = false;
      });
  }, [matchId, user?.id]);

  if (!matchId) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="glass-strong rounded-[2rem] p-8 text-center">
          <div className="app-kicker mb-3">Video</div>
          <h1 className="app-title">missing match.</h1>
          <p className="app-subtitle mt-3">Open video from a match or conversation.</p>
          <Link to="/app/matches" className="app-button-accent mt-8 inline-flex">
            <Video size={16} /> Matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page relative">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="app-kicker">Video</div>
          <h1 className="app-title">face to face.</h1>
          <p className="app-subtitle mt-2">Camera and mic are local-only until both people accept the call.</p>
        </div>
        <button
          onClick={() => {
            if (!starting.current) localStorage.removeItem(`video-call-${matchId}-${user?.id || 'guest'}-started`);
            navigate('/app/matches');
          }}
          className="app-button-outline inline-flex items-center gap-2"
        >
          <PhoneOff size={16} /> Leave
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-[1.2rem] border-4 border-[#111111] bg-[#fff4ef] p-4 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="glass-strong rounded-[2rem] p-3 md:p-4">
        <VideoChat callId={matchId} initiator onHangUp={() => {
          if (!starting.current) localStorage.removeItem(`video-call-${matchId}-${user?.id || 'guest'}-started`);
          navigate('/app/matches');
        }} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#5c594f]">
        <ShieldCheck size={14} className="text-[#ff4f00]" />
        Matched-only · local media stays on your device until connected
      </div>
    </div>
  );
}
