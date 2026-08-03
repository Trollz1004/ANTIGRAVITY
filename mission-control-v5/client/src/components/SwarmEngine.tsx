import { useState } from 'react';
import { api } from '../api';
import type { AgentDef, Health, Mode, SwarmTask } from '../types';
import { ResultBlock, StatusDot, executorBadge } from './shared';

interface Props {
  agents: AgentDef[];
  selected: Set<string>;
  onToggleAgent: (agentId: string) => void;
  tasks: SwarmTask[];
  health: Health | null;
  onGoLibrary: () => void;
}

export default function SwarmEngine({
  agents,
  selected,
  onToggleAgent,
  tasks,
  health,
  onGoLibrary,
}: Props) {
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
            OMNIROUTE OFFLINE — no provider configured. Tasks will queue and BLOCK with an
            honest error until a provider key is set in server/.env. Zero simulated output.
          </div>
        )}
        {error && <div className="notice notice--error">{error}</div>}

        <button
          className="btn btn--primary"
          disabled={submitting || selected.size === 0 || prompt.trim().length === 0}
          onClick={submit}
        >
          {submitting
            ? 'SUBMITTING…'
            : `LAUNCH → ${selected.size} ORCHESTRATOR${selected.size === 1 ? '' : 'S'}`}
        </button>
      </section>

      <section className="swarm__feed">
        <div className="label swarm__section-title">EXECUTION FEED — LIVE</div>
        {tasks.length === 0 && <div className="kanban__empty">NO TASKS YET</div>}
        {tasks.map((task) => (
          <article key={task.id} className="run-card">
            <div className="run-card__head">
              <StatusDot status={task.status} />
              <span className="run-card__title">{task.title}</span>
              {executorBadge(task.executor)}
              <span className="result__meta">{new Date(task.createdAt).toLocaleTimeString()}</span>
            </div>
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
