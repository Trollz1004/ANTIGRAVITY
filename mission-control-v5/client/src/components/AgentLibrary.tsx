import { useMemo, useState } from 'react';
import type { AgentDef, CategoryDef } from '../types';

interface Props {
  agents: AgentDef[];
  categories: CategoryDef[];
  selected: Set<string>;
  onDeploy: (agentId: string) => void;
}

export default function AgentLibrary({ agents, categories, selected, onDeploy }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const agent of agents) map.set(agent.category, (map.get(agent.category) ?? 0) + 1);
    return map;
  }, [agents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((agent) => {
      if (category && agent.category !== category) return false;
      if (q && !agent.id.includes(q) && !agent.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agents, query, category]);

  const catLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? id.toUpperCase();

  return (
    <div className="library">
      <aside className="library__sidebar">
        <button
          className={`library__cat ${category === '' ? 'library__cat--active' : ''}`}
          onClick={() => setCategory('')}
        >
          <span>ALL DIVISIONS</span>
          <span className="library__cat-count">{agents.length}</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`library__cat ${category === cat.id ? 'library__cat--active' : ''}`}
            onClick={() => setCategory(category === cat.id ? '' : cat.id)}
          >
            <span>{cat.label}</span>
            <span className="library__cat-count">{counts.get(cat.id) ?? 0}</span>
          </button>
        ))}
      </aside>

      <div className="library__content">
        <div className="library__toolbar">
          <input
            className="input library__search"
            placeholder="SEARCH AGENTS…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
          />
          <span className="label">
            {filtered.length}/{agents.length} AGENTS · {categories.length} DIVISIONS
          </span>
        </div>

        <div className="library__grid">
          {filtered.map((agent) => {
            const isSelected = selected.has(agent.id);
            return (
              <article
                key={agent.id}
                className={`agent-card ${isSelected ? 'agent-card--selected' : ''}`}
              >
                <div className="agent-card__top">
                  <span className="agent-card__name">{agent.name}</span>
                  <span className="agent-card__cat">{catLabel(agent.category)}</span>
                </div>
                <p className="agent-card__desc">{agent.description}</p>
                <div className="agent-card__actions">
                  <button
                    className={`btn ${isSelected ? '' : 'btn--primary'}`}
                    onClick={() => onDeploy(agent.id)}
                  >
                    {isSelected ? 'DEPLOYED ✓' : 'DEPLOY'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
