import { useEffect, useRef, useState } from 'react';
import sites from '../shared/browser-sites.json';

export interface NavState {
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface McElectronApi {
  setBounds(rect: { x: number; y: number; width: number; height: number }): void;
  navigate(url: string): void;
  goBack(): void;
  goForward(): void;
  reload(): void;
  home(): void;
  openExternal(url: string): void;
  onNavChange(cb: (s: NavState) => void): () => void;
}

// Injected by electron/preload.js when the dashboard runs inside the shell.
declare global {
  interface Window {
    mcElectron?: McElectronApi;
  }
}

const HOME = sites[0];

export default function BrowserPanel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const mc = window.mcElectron;
  const [addr, setAddr] = useState(HOME.url);
  const [nav, setNav] = useState<NavState>({
    url: HOME.url,
    title: '',
    loading: false,
    canGoBack: false,
    canGoForward: false,
  });

  // Report the viewport's pixel rect so the main process can place the native
  // WebContentsView exactly over this box (and keep it aligned on resize).
  useEffect(() => {
    if (!mc) return;
    const el = viewportRef.current;
    if (!el) return;
    const send = () => {
      const r = el.getBoundingClientRect();
      mc.setBounds({
        x: Math.round(r.left),
        y: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
      });
    };
    send();
    const ro = new ResizeObserver(send);
    ro.observe(el);
    window.addEventListener('resize', send);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', send);
    };
  }, [mc]);

  // Mirror the embedded browser's navigation state into the address bar.
  useEffect(() => {
    if (!mc) return;
    return mc.onNavChange((s) => {
      setNav(s);
      setAddr(s.url);
    });
  }, [mc]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mc) return;
    let u = addr.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) {
      u = u.includes('.') ? `https://${u}` : `https://duckduckgo.com/?q=${encodeURIComponent(u)}`;
    }
    mc.navigate(u);
  };

  const openExternal = () => {
    if (mc && nav.url) mc.openExternal(nav.url);
  };

  return (
    <aside className="browser-panel">
      <div className="browser-toolbar">
        <button
          type="button"
          className="browser-btn"
          title="Back"
          disabled={!nav.canGoBack}
          onClick={() => mc?.goBack()}
        >
          ◀
        </button>
        <button
          type="button"
          className="browser-btn"
          title="Forward"
          disabled={!nav.canGoForward}
          onClick={() => mc?.goForward()}
        >
          ▶
        </button>
        <button
          type="button"
          className={`browser-btn${nav.loading ? ' browser-btn--loading' : ''}`}
          title="Reload"
          onClick={() => mc?.reload()}
        >
          ⟳
        </button>
        <button
          type="button"
          className="browser-btn"
          title="Open Hermes (Telegram)"
          onClick={() => mc?.home()}
        >
          ⌂
        </button>
        <form className="browser-addr-form" onSubmit={submit}>
          <input
            className="browser-addr"
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="URL or search"
            spellCheck={false}
          />
        </form>
        <select
          className="browser-sites"
          value=""
          title="Saved sites"
          onChange={(e) => {
            const u = e.target.value;
            if (u) mc?.navigate(u);
            e.target.value = '';
          }}
        >
          <option value="">SITES</option>
          {sites.map((s) => (
            <option key={s.id} value={s.url}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="browser-btn"
          title="Open in browser"
          onClick={openExternal}
        >
          ⤢
        </button>
      </div>
      {/* The native WebContentsView is positioned over this box by Electron. */}
      <div className="browser-viewport" ref={viewportRef} />
    </aside>
  );
}