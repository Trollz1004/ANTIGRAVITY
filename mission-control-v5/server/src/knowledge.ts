/**
 * KNOWLEDGE GRAPH — the repo as a navigable graph for agents and humans.
 *
 * Walks the monorepo into nodes (areas, dirs, knowledge files) and edges
 * (containment), with per-file descriptions pulled from headings/comments so
 * an agent can SEARCH the repo by meaning instead of guessing paths. Serves
 * the 3D Graphy KNOWLEDGE view and the /api/knowledge/search endpoint agents
 * hit on mission start.
 *
 * Safety: secrets and junk never enter the graph — .env*, vaults, node_modules,
 * .git, build output and lockfiles are excluded at walk time, and the file
 * preview endpoint re-validates every path against the same rules.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Repo root: server/src -> server -> mission-control-v5 -> repo. */
export const REPO_ROOT = resolve(__dirname, '..', '..', '..');

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.venv',
  '__pycache__',
  '.pnpm-store',
  '.playwright-mcp',
  'logs',
  '.next',
  '.cache',
  'coverage',
]);

/** Never graphed, never previewed. Substring match on the relative path, lowercase. */
const SECRET_PATTERNS = ['.env', 'secret', 'vault', 'credential', '.pem', '.key', 'do-not-commit', 'id_rsa'];

const KNOWLEDGE_EXTS = new Set([
  '.md', '.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.html', '.css',
  '.yml', '.yaml', '.ps1', '.cmd', '.bat', '.sh', '.toml', '.txt',
]);

const MAX_DEPTH = 4;
const MAX_CHILDREN_PER_DIR = 40;
const PREVIEW_CAP_BYTES = 40_000;
const DESCRIPTION_READ_BYTES = 4_000;
const CACHE_TTL_MS = 120_000;

export interface KnowledgeNode {
  /** Repo-relative path with forward slashes; '' for the root. */
  id: string;
  name: string;
  kind: 'root' | 'area' | 'dir' | 'file';
  ext?: string;
  size?: number;
  mtime?: string;
  /** First heading / first comment line — what this thing IS. */
  description?: string;
  /** Set on synthetic "+N more" nodes so the client can label them. */
  truncated?: number;
}

export interface KnowledgeLink {
  source: string;
  target: string;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
  builtAt: string;
  root: string;
}

function isSecretPath(relPath: string): boolean {
  const lower = relPath.toLowerCase();
  return SECRET_PATTERNS.some((p) => lower.includes(p));
}

function describeFile(absPath: string, ext: string): string {
  try {
    const head = readFileSync(absPath, { encoding: 'utf8', flag: 'r' }).slice(0, DESCRIPTION_READ_BYTES);
    const lines = head.split(/\r?\n/);
    if (ext === '.md') {
      const heading = lines.find((l) => /^#{1,3}\s+\S/.test(l));
      if (heading) return heading.replace(/^#+\s*/, '').slice(0, 120);
      const first = lines.find((l) => l.trim().length > 0);
      return (first ?? '').trim().slice(0, 120);
    }
    // Code: first doc-comment or comment line wins.
    const comment = lines.find((l) => /^\s*(\/\/|\*|\/\*\*?|#(?!!)|<!--|REM\b)/i.test(l) && l.replace(/[/*#<!\-\s]|REM/gi, '').length > 3);
    if (comment) return comment.replace(/^\s*(\/\/|\*+\/?|\/\*+|#|<!--|REM)\s*/i, '').replace(/-->\s*$/, '').trim().slice(0, 120);
    return '';
  } catch {
    return '';
  }
}

function walk(abs: string, rel: string, depth: number, nodes: KnowledgeNode[], links: KnowledgeLink[]): void {
  let entries;
  try {
    entries = readdirSync(abs, { withFileTypes: true });
  } catch {
    return;
  }
  // Dot-dirs stay: .agents/skills and .github ARE knowledge. Only the
  // EXCLUDED_DIRS junk list and secret patterns filter the walk.
  const dirs = entries.filter((e) => e.isDirectory() && !EXCLUDED_DIRS.has(e.name));
  const files = entries.filter((e) => e.isFile() && KNOWLEDGE_EXTS.has(extname(e.name).toLowerCase()));

  let emitted = 0;
  for (const entry of [...dirs, ...files]) {
    const childRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (isSecretPath(childRel)) continue;
    if (emitted >= MAX_CHILDREN_PER_DIR) {
      const remaining = dirs.length + files.length - emitted;
      const moreId = `${rel}/+more`;
      nodes.push({ id: moreId, name: `+${remaining} more`, kind: 'dir', truncated: remaining });
      links.push({ source: rel, target: moreId });
      break;
    }
    const childAbs = join(abs, entry.name);
    if (entry.isDirectory()) {
      nodes.push({ id: childRel, name: entry.name, kind: depth === 0 ? 'area' : 'dir' });
      links.push({ source: rel, target: childRel });
      emitted++;
      if (depth + 1 < MAX_DEPTH) walk(childAbs, childRel, depth + 1, nodes, links);
    } else {
      let st;
      try {
        st = statSync(childAbs);
      } catch {
        continue;
      }
      const ext = extname(entry.name).toLowerCase();
      nodes.push({
        id: childRel,
        name: entry.name,
        kind: 'file',
        ext,
        size: st.size,
        mtime: st.mtime.toISOString(),
        description: st.size < 1_000_000 ? describeFile(childAbs, ext) : '',
      });
      links.push({ source: rel, target: childRel });
      emitted++;
    }
  }
}

let cache: { graph: KnowledgeGraph; at: number } | null = null;

export function buildKnowledgeGraph(force = false): KnowledgeGraph {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.graph;
  const nodes: KnowledgeNode[] = [{ id: '', name: 'ANTIGRAVITY', kind: 'root', description: 'Canonical repository root — C:\\ANTIGRAVITY' }];
  const links: KnowledgeLink[] = [];
  walk(REPO_ROOT, '', 0, nodes, links);
  const graph: KnowledgeGraph = { nodes, links, builtAt: new Date().toISOString(), root: 'ANTIGRAVITY' };
  cache = { graph, at: Date.now() };
  return graph;
}

export interface SearchHit {
  id: string;
  name: string;
  kind: KnowledgeNode['kind'];
  description?: string;
  score: number;
  /** Why it matched: name | path | description | content. */
  via: string;
}

export function searchKnowledge(query: string, limit = 40): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const { nodes } = buildKnowledgeGraph();
  const hits: SearchHit[] = [];
  for (const n of nodes) {
    if (!n.id) continue;
    const name = n.name.toLowerCase();
    const path = n.id.toLowerCase();
    const desc = (n.description ?? '').toLowerCase();
    let score = 0;
    let via = '';
    if (name === q) { score = 100; via = 'name'; }
    else if (name.includes(q)) { score = 70; via = 'name'; }
    else if (desc.includes(q)) { score = 50; via = 'description'; }
    else if (path.includes(q)) { score = 40; via = 'path'; }
    if (score > 0) hits.push({ id: n.id, name: n.name, kind: n.kind, description: n.description, score, via });
  }
  // Content pass over markdown docs when metadata matches are thin.
  if (hits.length < 10) {
    const mdFiles = nodes.filter((n) => n.kind === 'file' && n.ext === '.md' && (n.size ?? 0) < 200_000);
    for (const n of mdFiles.slice(0, 400)) {
      if (hits.some((h) => h.id === n.id)) continue;
      try {
        const body = readFileSync(join(REPO_ROOT, n.id), 'utf8').toLowerCase();
        if (body.includes(q)) {
          hits.push({ id: n.id, name: n.name, kind: n.kind, description: n.description, score: 25, via: 'content' });
        }
      } catch {}
      if (hits.length >= limit) break;
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

export interface FilePreview {
  path: string;
  size: number;
  mtime: string;
  truncated: boolean;
  content: string;
}

export function previewFile(relPath: string): FilePreview {
  const cleaned = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const abs = resolve(REPO_ROOT, cleaned);
  const rel = relative(REPO_ROOT, abs);
  if (rel.startsWith('..') || rel.includes(`..${sep}`)) throw new Error('Path escapes the repo.');
  if (isSecretPath(rel.replace(/\\/g, '/'))) throw new Error('Path is on the secrets denylist.');
  if (rel.split(sep).some((part) => EXCLUDED_DIRS.has(part))) throw new Error('Path is excluded from the graph.');
  if (!KNOWLEDGE_EXTS.has(extname(abs).toLowerCase())) throw new Error('Not a previewable text file.');
  if (!existsSync(abs)) throw new Error('File not found.');
  const st = statSync(abs);
  if (!st.isFile()) throw new Error('Not a file.');
  const raw = readFileSync(abs, 'utf8');
  const truncated = raw.length > PREVIEW_CAP_BYTES;
  return {
    path: rel.replace(/\\/g, '/'),
    size: st.size,
    mtime: st.mtime.toISOString(),
    truncated,
    content: truncated ? raw.slice(0, PREVIEW_CAP_BYTES) : raw,
  };
}
