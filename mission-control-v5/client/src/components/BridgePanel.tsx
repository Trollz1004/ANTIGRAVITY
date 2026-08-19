import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { BridgeStatus, BridgeTarget } from '../types';

interface BridgeMessage {
  sender: string;
  text: string;
  timestamp: string;
  error?: boolean;
}

const TARGETS: { id: BridgeTarget; label: string; hint: string }[] = [
  { id: 'hermes', label: 'HERMES', hint: 'operational bridge' },
  { id: 'openclaw', label: 'OPENCLAW', hint: 'operational bridge' },
  { id: 'opencode', label: 'OPENCODE', hint: 'operational bridge' },
];

function statusLabel(status: BridgeStatus | undefined): string {
  if (!status) return 'CHECKING';
  return status.state.toUpperCase().replace('-', ' ');
}

export default function BridgePanel() {
  const [target, setTarget] = useState<BridgeTarget>('openclaw');
  const [messages, setMessages] = useState<BridgeMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [statuses, setStatuses] = useState<BridgeStatus[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const { bridges } = await api.bridgeStatus();
        if (alive) setStatuses(bridges);
      } catch {
        if (alive) setStatuses([]);
      }
    };
    refresh();
    const poll = window.setInterval(refresh, 15_000);
    return () => {
      alive = false;
      window.clearInterval(poll);
    };
  }, []);

  const scrollToEnd = () => {
    window.setTimeout(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
    }, 30);
  };

  const send = async () => {
    const text = prompt.trim();
    if (!text || sending) return;
    setSending(true);
    setMessages((prev) => [...prev, { sender: 'you', text, timestamp: new Date().toISOString() }]);
    setPrompt('');
    scrollToEnd();
    try {
      const reply = await api.bridgeSend(target, text);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: target,
          text: err instanceof Error ? err.message : String(err),
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  const active = TARGETS.find((t) => t.id === target)!;
  const activeStatus = statuses.find((status) => status.id === target);
  const canSend = Boolean(activeStatus?.sendEnabled && activeStatus.state === 'ready');

  return (
    <div className="brain">
      <div className="brain__toolbar">
        <span className="label">BRIDGE HUB</span>
        <nav className="brain__subnav">
          {TARGETS.map((t) => (
            <button
              key={t.id}
              className={`brain__subnav-item ${target === t.id ? 'brain__subnav-item--active' : ''}`}
              onClick={() => setTarget(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
          <span className="services__hint">{active.hint}</span>
      </div>

      <div className="brain-card">
        <div className="brain-card__top">
          <span className="brain-card__name">CHAT · {active.label}</span>
          <span className={`brain-card__status mono bridge-state--${activeStatus?.state ?? 'checking'}`}>
            {statusLabel(activeStatus)}
          </span>
        </div>

        <div className="brain__result" ref={logRef} style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {messages.length === 0 && (
            <div className="services__empty">
              {canSend ? 'SEND A PROMPT TO OPEN THE OPERATIONAL BRIDGE.' : activeStatus?.detail ?? 'CHECKING BRIDGE STATUS…'}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`notice${m.error ? ' notice--error' : ''}`}>
              <div className="label">
                {m.sender.toUpperCase()} · <span className="mono">{m.timestamp.slice(11, 19)}</span>
              </div>
              <pre className="result__output brain__result-pre mono">{m.text}</pre>
            </div>
          ))}
        </div>

        <div className="brain__ask">
          <textarea
            className="textarea brain__query"
            placeholder={`Message ${active.label}…`}
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send();
            }}
          />
          <button className="btn btn--primary" disabled={!canSend || sending || prompt.trim().length === 0} onClick={send}>
            {sending ? 'SENDING…' : 'SEND →'}
          </button>
        </div>
      </div>
    </div>
  );
}
