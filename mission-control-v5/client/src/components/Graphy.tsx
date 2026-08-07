import { useEffect, useState } from 'react';
import { api } from '../api';
import type { SubagentNode } from '../types';

const FILES = ['SOUL.md', 'HEARTBEAT.md', 'TOOLS.md', 'SKILLS.md'] as const;

export default function Graphy() {
  const [agents, setAgents] = useState<SubagentNode[]>([]);
  const [selected, setSelected] = useState<SubagentNode | null>(null);
  const [file, setFile] = useState<(typeof FILES)[number]>('HEARTBEAT.md');

  useEffect(() => {
    const refresh = () => void api.subagents().then((result) => {
      setAgents(result.agents);
      setSelected((current) => result.agents.find((agent) => agent.id === current?.id) ?? current);
    });
    refresh();
    const timer = window.setInterval(refresh, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="graphy">
      <div className="graphy__stage">
        <div className="graphy__core">HERMES<span>ORCHESTRATOR</span></div>
        {agents.map((agent, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(agents.length, 1);
          const x = 50 + Math.cos(angle) * 34;
          const y = 50 + Math.sin(angle) * 36;
          return (
            <button
              key={agent.id}
              className={`graphy__node graphy__node--${agent.health}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => { setSelected(agent); setFile('HEARTBEAT.md'); }}
            >
              <i />
              <strong>{agent.name}</strong>
              <span>{agent.health.toUpperCase()}</span>
            </button>
          );
        })}
        <div className="graphy__legend">LIVE HEARTBEATS · 15S <b>● GREEN</b> <em>● YELLOW</em> <i>● RED</i></div>
      </div>
      {selected && (
        <aside className="graphy__drawer">
          <button className="graphy__close" onClick={() => setSelected(null)}>CLOSE ×</button>
          <div className={`graphy__status graphy__status--${selected.health}`}>{selected.health}</div>
          <h2>{selected.name}</h2>
          <small>{selected.id} · {new Date(selected.updatedAt).toLocaleString()}</small>
          <nav>{FILES.map((name) => <button key={name} className={file === name ? 'active' : ''} onClick={() => setFile(name)}>{name}</button>)}</nav>
          <pre>{selected.files[file] || `${file} missing`}</pre>
        </aside>
      )}
    </section>
  );
}
