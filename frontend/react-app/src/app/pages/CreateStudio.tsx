import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Image as ImageIcon,
  Sparkles,
  UserRound,
  Video,
  Wand2,
} from 'lucide-react';

type Tab = 'character' | 'image' | 'video';

/**
 * Kiss Me–style Create hub: Character / Image / Video tabs.
 * Animate-from-photo lives under Character → Animate Avatar.
 */
export function CreateStudio() {
  const [tab, setTab] = useState<Tab>('character');

  return (
    <div className="km-page mx-auto max-w-lg px-4 py-5">
      {/* Profile strip */}
      <section className="km-card km-card-glow p-4">
        <div className="flex items-center gap-3">
          <div className="km-avatar-ring">
            <div className="flex h-full w-full items-center justify-center bg-[var(--km-surface-2)] text-[var(--km-muted)]">
              <UserRound size={28} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold">Your profile</div>
            <p className="truncate text-sm text-[var(--km-muted)]">
              Build a human-first presence. Optional animated avatar.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Free Plan</div>
            <div className="text-xs text-[var(--km-muted)]">Upgrade unlocks Elite tools</div>
          </div>
          <Link to="/app/preorder" className="km-btn-gradient px-5 py-2.5 text-sm no-underline">
            Upgrade
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { label: 'Model', to: '/app/profile' },
            { label: 'Shop', to: '/app/preorder' },
            { label: 'Task', to: '/app/verify' },
            { label: 'Group', to: '/app/boards' },
          ].map(x => (
            <Link key={x.label} to={x.to} className="km-pill no-underline">
              {x.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="km-tabs mt-6">
        {(
          [
            { id: 'character' as const, label: 'Character' },
            { id: 'image' as const, label: 'Image' },
            { id: 'video' as const, label: 'Video' },
          ] as const
        ).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`km-tab ${tab === t.id ? 'km-tab-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="mt-8 flex min-h-[280px] flex-col items-center justify-center text-center">
        {tab === 'character' && (
          <>
            <div className="mb-3 text-sm text-[var(--km-muted)]">No Character</div>
            <p className="mb-6 max-w-xs text-sm text-[var(--km-muted)]">
              Start with your real photos. Optionally animate one photo into a soft looping avatar
              for chat — you stay verified human.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Link to="/app/profile" className="km-btn-gradient w-full justify-center no-underline">
                <Wand2 size={18} /> Start Creating
              </Link>
              <Link to="/app/avatar" className="km-btn-ghost w-full justify-center no-underline">
                <Sparkles size={18} /> Animate my photo
              </Link>
            </div>
          </>
        )}

        {tab === 'image' && (
          <>
            <ImageIcon className="mb-3 text-[var(--km-muted)]" size={36} />
            <div className="mb-2 text-sm font-semibold">Image studio</div>
            <p className="mb-6 max-w-xs text-sm text-[var(--km-muted)]">
              Upload profile photos. AI only helps with framing/safety checks — never fakes who you
              are.
            </p>
            <Link to="/app/profile" className="km-btn-gradient no-underline">
              Manage photos
            </Link>
          </>
        )}

        {tab === 'video' && (
          <>
            <Video className="mb-3 text-[var(--km-muted)]" size={36} />
            <div className="mb-2 text-sm font-semibold">Video dates</div>
            <p className="mb-6 max-w-xs text-sm text-[var(--km-muted)]">
              Face-to-face calls with matches. Camera stays off until both accept.
            </p>
            <Link to="/app/video-lobby" className="km-btn-gradient no-underline">
              Open video lobby
            </Link>
          </>
        )}
      </section>
    </div>
  );
}

export default CreateStudio;
