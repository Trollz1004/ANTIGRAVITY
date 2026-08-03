import { useState, type JSX } from 'react';
import type { AgentResult, TaskStatus } from '../types';

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

/**
 * Executor badge. There is no speed/quality choice to display: OmniRoute picks
 * the model, and the model that actually answered is shown on each result. The
 * only routing choice worth surfacing is which chain the task was pinned to.
 */
export function executorBadge(executor?: string): JSX.Element {
  const id = (executor ?? 'auto').toUpperCase();
  return (
    <span className="badge" title="Executor chain — OmniRoute resolves the model within it">
      {id}
    </span>
  );
}

const PHASE_LABEL: Record<string, string> = {
  plan: 'PLAN',
  work: 'DELEGATE',
  validate: 'VALIDATE',
  journal: 'JOURNAL',
};

export function ResultBlock({ result }: { result: AgentResult }) {
  const [open, setOpen] = useState(result.status === 'error');
  const hasBody = Boolean(result.output || result.error || result.phases?.length);
  const phases = result.phases ?? [];
  return (
    <div className="result">
      <div className="result__head" onClick={() => hasBody && setOpen((v) => !v)}>
        <StatusDot status={result.status} />
        <span className="result__agent">{result.agentId}</span>
        <span className="result__meta">
          {result.provider ? `${result.provider} · ${result.model}` : result.status.toUpperCase()}
          {typeof result.ms === 'number' ? ` · ${(result.ms / 1000).toFixed(1)}s` : ''}
          {phases.length > 0 ? ` · ${phases.length} phases` : ''}
          {hasBody ? (open ? '  ▾' : '  ▸') : ''}
        </span>
      </div>
      {open && phases.length > 0 && (
        <ol className="result__phases">
          {phases.map((p, i) => (
            <li key={i} className={`result__phase result__phase--${p.phase}`}>
              <span className="result__phase-tag">{PHASE_LABEL[p.phase] ?? p.phase.toUpperCase()}</span>
              <span className="result__phase-detail">{p.detail}</span>
              {typeof p.ms === 'number' && (
                <span className="result__phase-ms">{(p.ms / 1000).toFixed(1)}s</span>
              )}
            </li>
          ))}
        </ol>
      )}
      {open && result.output && <pre className="result__output">{result.output}</pre>}
      {open && result.error && (
        <pre className="result__output result__output--error">{result.error}</pre>
      )}
    </div>
  );
}
