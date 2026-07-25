'use client';

import React from 'react';
import { BadgeCheck, ShieldCheck, MapPin } from 'lucide-react';

interface ProfileCardProps {
  name?: string;
  age?: number;
  location?: string;
  quote?: string;
  tags?: string[];
  verified?: boolean;
  freeThisWeekend?: boolean;
  className?: string;
}

export default function ProfileCard({
  name = "Maya",
  age = 31,
  location = "Orlando, FL",
  quote = "My ideal first date is coffee, a bookstore, and no pressure to perform.",
  tags = ["Coffee", "Bookstores", "Low pressure"],
  verified = true,
  freeThisWeekend = true,
  className = "",
}: ProfileCardProps) {
  return (
    <div className={`premium-card w-full max-w-[380px] lg:max-w-[460px] xl:max-w-[520px] overflow-hidden mx-auto ${className}`}>
      {/* Top status bar */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2 text-xs">
        {freeThisWeekend && (
          <span className="inline-flex items-center rounded-full bg-[var(--accent-warm)]/20 text-[var(--accent-warm)] px-2.5 py-0.5 font-semibold">
            Free this weekend
          </span>
        )}
        {verified && (
          <span className="inline-flex items-center gap-1 text-[var(--accent-primary)]">
            <ShieldCheck size={14} /> Selfie verified
          </span>
        )}
      </div>

      {/* Photo placeholder area (styled like the screenshot) */}
      <div className="relative h-[280px] lg:h-[320px] bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface)] flex items-center justify-center">
        {/* Placeholder silhouette / image area */}
        <div className="w-4/5 h-4/5 rounded-[var(--radius-lg)] border-2 border-[var(--border-strong)] bg-[var(--bg)]/60" />
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {verified && (
            <div className="chip chip-verified text-[10px] px-2.5 py-0.5">
              <BadgeCheck size={12} />
              SELFIE VERIFIED
            </div>
          )}
          <div className="inline-flex items-center gap-1 rounded-full bg-orange-500/90 text-white text-[10px] font-bold px-2.5 py-0.5 tracking-widest">
            SAFETY TOOL
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="px-4 pt-4 pb-3 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl lg:text-2xl font-black tracking-[-0.04em]">
              {name} {age}
            </div>
            <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
              <MapPin size={14} /> {location}
            </div>
          </div>
        </div>

        {/* Conversation starter box — "PROMPT" replaced */}
        <div className="mt-4 rounded-[var(--radius-lg)] bg-[var(--surface-elevated)] border border-[var(--border)] p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-1.5">
            Conversation starter
          </div>
          <div className="text-[15px] lg:text-base leading-snug font-medium text-[var(--text)]">
            “{quote}”
          </div>
        </div>

        {/* Interest tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs px-3 py-1 rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom actions (matching the app feel) */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--surface)] border-t border-[var(--border)] text-sm">
        <button className="btn-secondary py-2 text-xs">Pass</button>
        <button className="btn-secondary py-2 text-xs">Comment</button>
        <button className="btn-primary py-2 text-xs">Like</button>
      </div>
    </div>
  );
}
