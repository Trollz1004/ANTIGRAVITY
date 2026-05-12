import React from 'react';
import { Icon } from '../icons';

interface StubPageProps {
  title: string;
  sub: string;
  icon: keyof typeof Icon;
}

export function StubPage({ title, sub, icon }: StubPageProps) {
  const Ic = Icon[icon] ?? Icon.Sparkles;
  const words = title.split(' ');
  const lastWord = words.slice(-1)[0];
  const prefix = words.slice(0, -1).join(' ');
  return (
    <div className="page-anim">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {prefix}{prefix ? ' ' : ''}<span className="accent">{lastWord}</span>
          </h1>
          <div className="page-sub">{sub}</div>
        </div>
      </div>
      <div
        className="card card--accent"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 480, flexDirection: 'column', gap: 18 }}
      >
        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, var(--odoo) 0%, #2a1235 100%)', display: 'grid', placeItems: 'center', boxShadow: '0 12px 40px var(--odoo-glow)' }}>
          <Ic size={36} style={{ color: 'white' }}/>
        </div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.32em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>SURFACE QUEUED · NEXT ITERATION</div>
        <div style={{ maxWidth: 480, textAlign: 'center', color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6 }}>
          The design pass focused on Mission Control, Comms Gateway, Paperweight, and Hermes Node first.
          This surface is on the shortlist for the next iteration — drop a sticky in Paperweight to prioritize.
        </div>
      </div>
    </div>
  );
}
