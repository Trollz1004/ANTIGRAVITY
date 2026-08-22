import { useState } from 'react';
import { api } from '../api';
import type { AgentDef, Health, Mode, SwarmTask } from '../types';
import { ArtifactBar, ResultBlock, StatusDot, executorBadge } from './shared';

interface Props {
  agents: AgentDef[];
  selected: Set<string>;
  onToggleAgent: (agentId: string) => void;
  tasks: SwarmTask[];
  health: Health | null;
  onGoLibrary: () => void;
}

const PHASE_ORDER = ['plan', 'work', 'validate', 'judge', 'journal', 'deliver'] as const;
function currentPhase(task: SwarmTask): string | null {
  const allPhases = task.results.flatMap((r) => r.phases ?? []);
  if (allPhases.length === 0) return task.status === 'running' ? 'plan' : null;
  // Find the last phase any agent reached
  const reached = new Set(allPhases.map((p) => p.phase));
  for (let i = PHASE_ORDER.length - 1; i >= 0; i--) {
    if (reached.has(PHASE_ORDER[i])) return PHASE_ORDER[i];
  }
  return PHASE_ORDER[0];
}

function LiveWorkPreview({ tasks }: { tasks: SwarmTask[] }) {
  const live = tasks.filter((t) => t.status === 'running' || t.status === 'queued');
  if (live.length === 0) {
    return (
      <div className="live-work live-work--idle">
        <div className="live-work__header">
          <span className="dot dot--idle" />
          <span className="live-work__title">LIVE WORK PREVIEW — IDLE</span>
        </div>
        <div className="kanban__empty">NO ACTIVE TASKS. SUBMIT A TASK ABOVE TO SEE IT EXECUTE LIVE.</div>
      </div>
    );
  }
  return (
    <div className="live-work">
      <div className="live-work__header">
        <span className="dot dot--amber dot--pulse" />
        <span className="live-work__title">LIVE WORK PREVIEW — {live.length} ACTIVE</span>
      </div>
      {live.map((task) => {
        const phase = currentPhase(task);
        const phaseLabel = phase ? phase.toUpperCase() : task.status.toUpperCase();
        return (
          <div key={task.id} className="live-work__card">
            <div className="live-work__card-head">
              <StatusDot status={task.status} />
              <strong>{task.title || task.id.slice(0, 8)}</strong>
              <span className={`badge badge--phase badge--${phase ?? 'queued'}`}>
                {phaseLabel}
              </span>
              <span className="result__meta">
                {task.results.length} orchestrator{task.results.length !== 1 ? 's' : ''} working
              </span>
            </div>
            <div className="live-work__phases">
              {PHASE_ORDER.map((p) => {
                const isReached = task.results.some((r) => (r.phases ?? []).some((ph) => ph.phase === p));
                const isCurrent = phase === p;
                return (
                  <span
                    key={p}
                    className={`phase-pip ${isReached ? 'phase-pip--done' : ''} ${isCurrent ? 'phase-pip--current' : ''}`}
                    title={p.toUpperCase()}
                  >
                    {p[0].toUpperCase()}
                  </span>
                );
              })}
            </div>
            <div className="run-card__body">
              {task.results.map((result) => (
                <ResultBlock key={result.agentId} result={result} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SwarmEngine({ agents, selected, onToggleAgent, tasks, health, onGoLibrary }: Props) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  // No speed/quality switch: OmniRoute resolves the model, and good models are
  // the default. The only routing choice worth exposing is the executor chain.
  const mode: Mode = 'reasoning';
  const [executor, setExecutor] = useState('auto');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const routerLive = health?.routerLive ?? false;
  const selectedAgents = agents.filter((agent) => selected.has(agent.id));
  const executors = health?.executors ?? [
    { id: 'auto', label: 'AUTO', description: 'OmniRoute provider order.', chain: [] },
  ];

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.createTask({
        title: title.trim() || undefined,
        prompt,
        agentIds: [...selected],
        mode,
        executor,
      });
      setTitle('');
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="swarm">
      <section className="swarm__composer">
        <div className="label swarm__section-title">01 — ORCHESTRATORS</div>
        <div className="swarm__selected">
          {selectedAgents.length === 0 && (
            <button className="chip chip--empty" onClick={onGoLibrary}>
              NO ORCHESTRATOR SELECTED — OPEN LIBRARY
            </button>
          )}
          {selectedAgents.map((agent) => (
            <button
              key={agent.id}
              className="chip"
              title="Remove from selection"
              onClick={() => onToggleAgent(agent.id)}
            >
              {agent.name} ×
            </button>
          ))}
        </div>

        <div className="label swarm__section-title">02 — EXECUTOR</div>
        <div className="mode-toggle">
          {executors.map((ex) => (
            <button
              key={ex.id}
              className={`mode-toggle__option ${executor === ex.id ? 'mode-toggle__option--active' : ''}`}
              title={ex.chain.map((l) => `${l.provider}: ${l.model}`).join(' → ') || ex.description}
              onClick={() => setExecutor(ex.id)}
            >
              {ex.label}
              <small>{ex.description}</small>
            </button>
          ))}
        </div>

        <div className="label swarm__section-title">03 — TASK</div>
        <input
          className="input"
          placeholder="TITLE (OPTIONAL)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          spellCheck={false}
        />
        <textarea
          className="textarea"
          placeholder="Describe the outcome you want. The orchestrator plans it, loads every skill that helps, delegates to sub-agents, and validates the result — it never does the work itself."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        {!routerLive && (
          <div className="notice">
            OMNIROUTE OFFLINE — no provider configured. Tasks will queue and BLOCK with an honest error until a provider
            key is set in server/.env. Zero simulated output.
          </div>
        )}
        {error && <div className="notice notice--error">{error}</div>}

        <button
          className="btn btn--primary"
          disabled={submitting || selected.size === 0 || prompt.trim().length === 0}
          onClick={submit}
        >
          {submitting ? 'SUBMITTING…' : `LAUNCH → ${selected.size} ORCHESTRATOR${selected.size === 1 ? '' : 'S'}`}
        </button>
      </section>

      <section className="swarm__feed">
        <LiveWorkPreview tasks={tasks} />
        <div className="label swarm__section-title" style={{ marginTop: 24 }}>EXECUTION FEED — ALL TASKS</div>
        {tasks.length === 0 && <div className="kanban__empty">NO TASKS YET</div>}
        {tasks.map((task) => (
          <article key={task.id} className="run-card">
            <div className="run-card__head">
              <StatusDot status={task.status} />
              <span className="run-card__title">{task.title}</span>
              {executorBadge(task.executor)}
              <span className="result__meta">{new Date(task.createdAt).toLocaleTimeString()}</span>
            </div>
            <ArtifactBar artifacts={task.artifacts} />
            <div className="run-card__body">
              {task.results.map((result) => (
                <ResultBlock key={result.agentId} result={result} />
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
