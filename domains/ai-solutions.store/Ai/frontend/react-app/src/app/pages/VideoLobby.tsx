import { Link } from 'react-router-dom';
import { Phone, Shield, Video } from 'lucide-react';

/**
 * Entry for video dates when user is not yet in a match-specific room.
 */
export function VideoLobby() {
  return (
    <div className="km-page mx-auto max-w-lg px-4 py-5">
      <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--km-accent)]">
        Video
      </div>
      <h1 className="text-2xl font-semibold">Face-to-face dates</h1>
      <p className="mt-2 text-sm text-[var(--km-muted)]">
        Video opens from a match. Camera and mic stay local until both people
        accept.
      </p>

      <section className="km-card km-card-glow mt-6 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a78bfa] to-[#67e8f9] text-black">
          <Video size={28} />
        </div>
        <h2 className="mt-4 text-lg font-semibold">How video works</h2>
        <ul className="mt-3 space-y-2 text-sm text-[var(--km-muted)]">
          <li className="flex gap-2">
            <Shield size={16} className="mt-0.5 shrink-0 text-emerald-400" />{' '}
            Match first — no cold random video.
          </li>
          <li className="flex gap-2">
            <Phone
              size={16}
              className="mt-0.5 shrink-0 text-[var(--km-accent)]"
            />{' '}
            Open chat → start video on the match thread.
          </li>
          <li className="flex gap-2">
            <Video size={16} className="mt-0.5 shrink-0 text-sky-300" /> Powered
            by Daily.co rooms behind{' '}
            <code className="text-xs">/app/video/:matchId</code>.
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/app/matches" className="km-btn-gradient no-underline">
            Go to matches
          </Link>
          <Link to="/app/inbox" className="km-btn-ghost no-underline">
            Open messages
          </Link>
        </div>
      </section>
    </div>
  );
}

export default VideoLobby;
