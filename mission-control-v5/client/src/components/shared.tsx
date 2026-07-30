import { useState, type JSX } from 'react';
import type { AgentResult, Mode, TaskStatus } from '../types';

export function StatusDot({ status }: { status: TaskStatus | AgentResult['status'] }) {
  const cls =
    status === 'done'
      ? 'dot--green'
      : status === 'error'
        ? 'dot--red'
        : status === 'running'
          ? 'dot--amber dot--pulse'
          : 'dot--idle';
  return <span className={`dot ${cls}`} title={status} />;
}

export function modeBadge(mode: Mode): JSX.Element {
  return mode === 'speed' ? (
    <span className="badge badge--speed">SPD · 3.5 HAIKU</span>
  ) : (
    <span className="badge badge--reasoning">RSN · 3.5 SONNET</span>
  );
}

export function ResultBlock({ result }: { result: AgentResult }) {
  const [open, setOpen] = useState(result.status === 'error');
  const hasBody = Boolean(result.output || result.error);
  return (
    <div className="result">
      <div className="result__head" onClick={() => hasBody && setOpen((v) => !v)}>
        <StatusDot status={result.status} />
        <span className="result__agent">{result.agentId}</span>
        <span className="result__meta">
          {result.provider ? `${result.provider} · ${result.model}` : result.status.toUpperCase()}
          {typeof result.ms === 'number' ? ` · ${(result.ms / 1000).toFixed(1)}s` : ''}
          {hasBody ? (open ? '  ▾' : '  ▸') : ''}
        </span>
      </div>
      {open && result.output && <pre className="result__output">{result.output}</pre>}
      {open && result.error && (
        <pre className="result__output result__output--error">{result.error}</pre>
      )}
    </div>
  );
}
