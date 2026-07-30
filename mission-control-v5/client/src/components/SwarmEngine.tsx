import { useState } from 'react';
import { api } from '../api';
import type { AgentDef, Health, Mode, SwarmTask } from '../types';
import { ResultBlock, StatusDot, modeBadge } from './shared';

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
  const [mode, setMode] = useState<Mode>('speed');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const routerLive = health?.routerLive ?? false;
  const selectedAgents = agents.filter((agent) => selected.has(agent.id));

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.createTask({
        title: title.trim() || undefined,
        prompt,
        agentIds: [...selected],
        mode,
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
        <div className="label swarm__section-title">01 — AGENTS</div>
        <div className="swarm__selected">
          {selectedAgents.length === 0 && (
            <button className="chip chip--empty" onClick={onGoLibrary}>
              NO AGENTS SELECTED — OPEN LIBRARY
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

        <div className="label swarm__section-title">02 — MODEL MODE</div>
        <div className="mode-toggle">
          <button
            className={`mode-toggle__option ${mode === 'speed' ? 'mode-toggle__option--active' : ''}`}
            onClick={() => setMode('speed')}
          >
            SPEED
            <small>Claude 3.5 Haiku — fast, cheaper</small>
          </button>
          <button
            className={`mode-toggle__option ${mode === 'reasoning' ? 'mode-toggle__option--active' : ''}`}
            onClick={() => setMode('reasoning')}
          >
            REASONING
            <small>Claude 3.5 Sonnet — deeper analysis</small>
          </button>
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
          placeholder="Write the task / prompt for the selected agents…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        {!routerLive && (
          <div className="notice">
            OMNI ROUTER OFFLINE — no provider configured. Tasks will queue and BLOCK with an
            honest error until a provider key is set in server/.env. Zero simulated output.
          </div>
        )}
        {error && <div className="notice notice--error">{error}</div>}

        <button
          className="btn btn--primary"
          disabled={submitting || selected.size === 0 || prompt.trim().length === 0}
          onClick={submit}
        >
          {submitting ? 'SUBMITTING…' : `LAUNCH SWARM → ${selected.size} AGENT${selected.size === 1 ? '' : 'S'}`}
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
              {modeBadge(task.mode)}
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
