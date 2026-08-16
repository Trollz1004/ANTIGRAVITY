import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { api } from '../api';
import type { KnowledgeFilePreview, KnowledgeGraphData, KnowledgeNode, KnowledgeSearchHit } from '../types';

/** Repo knowledge graph — the whole monorepo as a searchable 3D map. */

const EXT_COLORS: Record<string, string> = {
  '.md': '#f59e0b',
  '.ts': '#67e8f9',
  '.tsx': '#67e8f9',
  '.js': '#fde047',
  '.jsx': '#fde047',
  '.py': '#34d399',
  '.html': '#e1306c',
  '.css': '#818cf8',
  '.json': '#94a3b8',
  '.yml': '#a3e635',
  '.yaml': '#a3e635',
  '.ps1': '#2ca5e0',
  '.cmd': '#2ca5e0',
  '.bat': '#2ca5e0',
  '.sh': '#2ca5e0',
};

function nodeColor(node: KnowledgeNode, highlighted: boolean): string {
  if (node.kind === 'root') return '#a78bfa';
  if (node.kind === 'area') return highlighted ? '#4ade80' : '#22c55e';
  if (node.kind === 'dir') return highlighted ? '#93c5fd' : '#475569';
  return highlighted ? '#ffffff' : (EXT_COLORS[node.ext ?? ''] ?? '#64748b');
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export default function KnowledgeGraph() {
  const [data, setData] = useState<KnowledgeGraphData | null>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<KnowledgeSearchHit[]>([]);
  const [selected, setSelected] = useState<KnowledgeNode | null>(null);
  const [preview, setPreview] = useState<KnowledgeFilePreview | null>(null);
  const [size, setSize] = useState({ width: 900, height: 640 });
  const stage = useRef<HTMLDivElement>(null);
  const webgl = useMemo(supportsWebGL, []);

  useEffect(() => {
    void api.knowledgeGraph().then(setData);
  }, []);

  useEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) }),
    );
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void api.knowledgeSearch(q).then((r) => setHits(r.hits));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const hitIds = useMemo(() => new Set(hits.map((h) => h.id)), [hits]);

  // ForceGraph mutates its input (adds x/y/z) — hand it copies, keyed for reuse.
  const graph = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    return {
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    };
  }, [data]);

  const select = (node: KnowledgeNode | null) => {
    setSelected(node);
    setPreview(null);
    if (node && node.kind === 'file') {
      void api
        .knowledgeFile(node.id)
        .then(setPreview)
        .catch(() => setPreview(null));
    }
  };

  const selectById = (id: string) => {
    const node = data?.nodes.find((n) => n.id === id) ?? null;
    select(node);
  };

  return (
    <section className="graphy">
      <div className="graphy__stage" ref={stage}>
        <div style={{ position: 'absolute', zIndex: 5, top: 10, left: 10, right: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ minWidth: 260 }}
            placeholder="Search the repo — name, path, doc content…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {hits.slice(0, 8).map((h) => (
            <button key={h.id} className="btn" title={`${h.id} (via ${h.via})`} onClick={() => selectById(h.id)}>
              {h.name}
            </button>
          ))}
          {query.trim() && hits.length === 0 && <span className="services__hint">no matches</span>}
        </div>
        {webgl && data ? (
          <ForceGraph3D
            width={size.width}
            height={size.height}
            graphData={graph}
            backgroundColor="rgba(0,0,0,0)"
            nodeLabel={(node: object) => {
              const n = node as KnowledgeNode;
              return `${n.kind.toUpperCase()} · ${n.id || n.name}${n.description ? ` — ${n.description}` : ''}`;
            }}
            nodeVal={(node) => {
              const n = node as KnowledgeNode;
              return n.kind === 'root' ? 20 : n.kind === 'area' ? 10 : n.kind === 'dir' ? 5 : 2.5;
            }}
            nodeThreeObject={(node: object) => {
              const n = node as KnowledgeNode;
              const highlighted = hitIds.has(n.id);
              const color = nodeColor(n, highlighted);
              const radius = n.kind === 'root' ? 8 : n.kind === 'area' ? 5 : n.kind === 'dir' ? 3 : highlighted ? 3.2 : 1.8;
              return new THREE.Mesh(
                new THREE.SphereGeometry(radius, 14, 14),
                new THREE.MeshStandardMaterial({
                  color,
                  emissive: color,
                  emissiveIntensity: highlighted ? 0.9 : 0.4,
                  roughness: 0.4,
                  transparent: hitIds.size > 0 && !highlighted,
                  opacity: hitIds.size > 0 && !highlighted ? 0.28 : 1,
                }),
              );
            }}
            linkColor={() => '#334155'}
            linkWidth={0.6}
            onNodeClick={(node: object) => select(node as KnowledgeNode)}
          />
        ) : (
          <div className="services__empty">{data ? 'WebGL unavailable — knowledge graph needs it.' : 'MAPPING THE REPO…'}</div>
        )}
        <div className="graphy__legend">
          KNOWLEDGE · {data ? `${data.nodes.length} NODES` : '…'} <b>● AREA</b> <em>● DOC</em> <i>● CODE</i>
        </div>
      </div>
      {selected && (
        <aside className="graphy__drawer">
          <button className="graphy__close" onClick={() => select(null)} aria-label="Close">
            ×
          </button>
          <h2>{selected.name}</h2>
          <p className="mono" style={{ fontSize: 11, color: '#64748b' }}>
            {selected.id || '(repo root)'}
          </p>
          <p>
            {selected.kind.toUpperCase()}
            {selected.size != null ? ` · ${selected.size.toLocaleString()} B` : ''}
            {selected.mtime ? ` · ${new Date(selected.mtime).toLocaleString()}` : ''}
          </p>
          {selected.description && <p>{selected.description}</p>}
          {preview && (
            <pre>
              {preview.truncated ? '[… preview capped at 40 KB …]\n\n' : ''}
              {preview.content}
            </pre>
          )}
          {selected.kind === 'file' && !preview && <p className="services__hint">loading preview…</p>}
        </aside>
      )}
    </section>
  );
}
