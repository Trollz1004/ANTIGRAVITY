import { useState } from 'react';

interface Surface {
  id: string;
  label: string;
  url: string;
  note: string;
  /** Same-origin or known-embeddable surfaces render inline; others open out. */
  embeddable: boolean;
}

/**
 * Every surface Joshua actually needs eyes on, in one pane. Same-origin paths
 * (served by this server) and loopback dev servers embed; public sites that
 * send X-Frame-Options cannot be framed by anyone, so we say so and open them
 * out rather than showing an empty box and pretending.
 */
const SURFACES: Surface[] = [
  { id: 'dateapp', label: 'DATE APP', url: 'http://localhost:3200', note: 'Local frontend', embeddable: true },
  {
    id: 'dateapi',
    label: 'DATE APP API',
    url: 'http://localhost:8000/docs',
    note: 'FastAPI interactive docs',
    embeddable: true,
  },
  { id: 'canonical', label: 'CANONICAL', url: '/canonical/', note: 'Signed record — self-verifying hash', embeddable: true },
  {
    id: 'public',
    label: 'PUBLIC SITE',
    url: 'https://youandinotai.com',
    note: 'Production — opens in a new tab (public sites block framing)',
    embeddable: false,
  },
  {
    id: 'galaxy',
    label: 'GALAXY',
    url: 'https://youandinotai-galaxy.ai.studio/',
    note: 'Published ambient screensaver — opens in a new tab',
    embeddable: false,
  },
];

export default function PreviewPanel() {
  const [active, setActive] = useState<Surface>(SURFACES[0]);
  const [nonce, setNonce] = useState(0);

  const open = (s: Surface) => {
    if (!s.embeddable) {
      window.open(s.url, '_blank', 'noopener');
      return;
    }
    setActive(s);
    setNonce((n) => n + 1);
  };

  return (
    <div className="preview">
      <div className="preview__bar">
        <div className="chips">
          {SURFACES.map((s) => (
            <button
              key={s.id}
              className={`btn ${active.id === s.id && s.embeddable ? 'btn--active' : ''}`}
              onClick={() => open(s)}
              title={s.note}
            >
              {s.label}
              {!s.embeddable && ' ↗'}
            </button>
          ))}
        </div>
        <div className="quick-actions">
          <button className="btn" onClick={() => setNonce((n) => n + 1)} title="Reload this surface">
            ⟳ RELOAD
          </button>
          <a className="btn" href={active.url} target="_blank" rel="noreferrer">
            OPEN ↗
          </a>
        </div>
      </div>
      <div className="preview__meta">
        <code>{active.url}</code>
        <span>{active.note}</span>
      </div>
      <iframe
        key={`${active.id}-${nonce}`}
        className="preview__frame"
        src={active.url}
        title={active.label}
      />
    </div>
  );
}
