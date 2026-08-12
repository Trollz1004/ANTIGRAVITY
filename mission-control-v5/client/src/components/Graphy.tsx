import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { api } from '../api';
import type { SubagentNode } from '../types';

const FILES = ['SOUL.md', 'HEARTBEAT.md', 'TOOLS.md', 'SKILLS.md'] as const;
type GraphNode = {
  id: string;
  name: string;
  kind: 'core' | 'agent' | 'skill';
  health: SubagentNode['health'];
  agentId?: string;
};
type GraphLink = { source: string; target: string; relation: 'delegation' | 'ownership' | 'blocker' | 'health' };

function skills(agent: SubagentNode) {
  return agent.files['SKILLS.md']
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*#]+|\d+[.)])\s*/, '').trim())
    .filter((line) => line && line.length < 52)
    .slice(0, 4);
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function Graphy() {
  const [agents, setAgents] = useState<SubagentNode[]>([]);
  const [selected, setSelected] = useState<SubagentNode | null>(null);
  const [file, setFile] = useState<(typeof FILES)[number]>('HEARTBEAT.md');
  const [size, setSize] = useState({ width: 900, height: 640 });
  const stage = useRef<HTMLDivElement>(null);
  const webgl = useMemo(supportsWebGL, []);

  useEffect(() => {
    const refresh = () =>
      void api.subagents().then((result) => {
        setAgents(result.agents);
        setSelected((current) => result.agents.find((agent) => agent.id === current?.id) ?? current);
      });
    refresh();
    const timer = window.setInterval(refresh, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      }),
    );
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);

  const graph = useMemo(() => {
    const nodes: GraphNode[] = [{ id: 'hermes', name: 'HERMES', kind: 'core', health: 'green' }];
    const links: GraphLink[] = [];
    for (const agent of agents) {
      nodes.push({ id: agent.id, name: agent.name, kind: 'agent', health: agent.health, agentId: agent.id });
      links.push({ source: 'hermes', target: agent.id, relation: agent.health === 'red' ? 'blocker' : 'delegation' });
      for (const [index, skill] of skills(agent).entries()) {
        const id = `${agent.id}:skill:${index}`;
        nodes.push({ id, name: skill, kind: 'skill', health: agent.health, agentId: agent.id });
        links.push({ source: agent.id, target: id, relation: 'ownership' });
      }
    }
    return { nodes, links };
  }, [agents]);

  const selectNode = (node: object) => {
    const graphNode = node as GraphNode;
    const agent = agents.find((item) => item.id === graphNode.agentId || item.id === graphNode.id);
    if (agent) {
      setSelected(agent);
      setFile('HEARTBEAT.md');
    }
  };

  return (
    <section className="graphy">
      <div className="graphy__stage" ref={stage}>
        {webgl ? (
          <>
            <ForceGraph3D
              width={size.width}
              height={size.height}
              graphData={graph}
              backgroundColor="rgba(0,0,0,0)"
              nodeLabel={(node: object) => `${(node as GraphNode).kind.toUpperCase()} · ${(node as GraphNode).name}`}
              nodeVal={(node) =>
                (node as GraphNode).kind === 'core' ? 18 : (node as GraphNode).kind === 'agent' ? 9 : 3
              }
              nodeColor={(node) =>
                ({ green: '#22c55e', yellow: '#f59e0b', red: '#ef4444' })[(node as GraphNode).health]
              }
              nodeThreeObject={(node: object) => {
                const item = node as GraphNode;
                const color =
                  item.kind === 'core'
                    ? '#a78bfa'
                    : item.kind === 'skill'
                      ? '#67e8f9'
                      : { green: '#22c55e', yellow: '#f59e0b', red: '#ef4444' }[item.health];
                return new THREE.Mesh(
                  new THREE.SphereGeometry(item.kind === 'core' ? 7 : item.kind === 'agent' ? 4.5 : 2.3, 18, 18),
                  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.35 }),
                );
              }}
              linkColor={(link) =>
                ({ delegation: '#a78bfa', ownership: '#67e8f9', blocker: '#ef4444', health: '#22c55e' })[
                  (link as GraphLink).relation
                ]
              }
              linkWidth={(link) => ((link as GraphLink).relation === 'blocker' ? 3 : 1)}
              linkDirectionalParticles={(link) => ((link as GraphLink).relation === 'delegation' ? 2 : 0)}
              linkDirectionalParticleSpeed={0.006}
              onNodeClick={selectNode}
            />
          </>
        ) : (
          <div className="graphy__fallback" role="img" aria-label="2D agent graph">
            <button className="graphy__core">
              HERMES<span>ORCHESTRATOR</span>
            </button>
            {agents.map((agent, index) => {
              const angle = (Math.PI * 2 * index) / Math.max(agents.length, 1);
              return (
                <button
                  key={agent.id}
                  className={`graphy__node graphy__node--${agent.health}`}
                  style={{ left: `${50 + Math.cos(angle) * 34}%`, top: `${50 + Math.sin(angle) * 36}%` }}
                  onClick={() => selectNode({ id: agent.id })}
                >
                  <i />
                  <div className="graphy__node-label">{agent.name}</div>
                  <div className="graphy__node-meta">
                    <span>{new Date(agent.updatedAt).toLocaleString()}</span>
                    <span>{agent.health.toUpperCase()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="graphy__legend">
          DRAG NODES · LIVE 15S <b>● HEALTHY</b> <em>● DEGRADED</em> <i>● BLOCKED</i>
        </div>
      </div>
      {selected && (
        <aside className="graphy__drawer">
          <button className="graphy__close" onClick={() => setSelected(null)} aria-label="Close">
            ×
          </button>
          <h2>{selected.name}</h2>
          <p>
            <span className={`dot dot--${selected.health}`} /> {selected.health.toUpperCase()} ·{' '}
            {new Date(selected.updatedAt).toLocaleString()}
          </p>
          <nav>
            {FILES.map((name) => (
              <button key={name} className={file === name ? 'active' : ''} onClick={() => setFile(name)}>
                {name}
              </button>
            ))}
          </nav>
          <pre>{selected.files[file] || `${file} unavailable`}</pre>
        </aside>
      )}
    </section>
  );
}