/**
 * Brain hub routes — repository knowledge, Graphy graph data, optional Obsidian
 * mirroring metadata, and per-harness journals. No external memory service is
 * required for active Mission Control operation.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Express } from 'express';
import { loadBrainPlatforms, platformSummary, readJournal, writeJournal } from './brainStore.js';
import { getCatalogEntry, loadCatalog } from './catalog.js';
import { buildKnowledgeGraph, searchKnowledge } from './knowledge.js';

export type HumanToolState = 'configured' | 'unavailable' | 'not-configured';

export interface HumanToolStatus {
  id: 'repository' | 'graphy' | 'supabase' | 'obsidian';
  label: string;
  state: HumanToolState;
  detail: string;
  humanFacing: true;
  openUrl?: string;
}

type BrainEnvironment = Record<string, string | undefined>;

function obsidianStatus(environment: BrainEnvironment = process.env): {
  status: 'not-configured' | 'configured' | 'unavailable';
  vaultPath?: string;
} {
  const vaultPath = (environment.OBSIDIAN_VAULT_PATH ?? '').trim();
  if (!vaultPath) return { status: 'not-configured' };
  return existsSync(vaultPath) ? { status: 'configured', vaultPath } : { status: 'unavailable', vaultPath };
}

/** Live read of the Obsidian vault: notes + [[wikilinks]]. Same measures the
 * obsidian-graph-query skill reports (stats, orphans), computed from the files
 * so it works whether or not Obsidian is open. Never returns paths to clients. */
export function vaultSummary(vaultPath: string): { notes: number; wikilinks: number; orphans: number } {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.toLowerCase().endsWith('.md')) files.push(p);
    }
  };
  try { walk(vaultPath); } catch { return { notes: 0, wikilinks: 0, orphans: 0 }; }
  const names = new Set(files.map((f) => f.slice(vaultPath.length + 1).replace(/\\/g, '/').replace(/\.md$/i, '').toLowerCase()));
  const shorts = new Map<string, string>();
  for (const n of names) shorts.set(n.split('/').pop() as string, n);
  const degree = new Map<string, number>();
  let wikilinks = 0;
  for (const f of files) {
    const me = f.slice(vaultPath.length + 1).replace(/\\/g, '/').replace(/\.md$/i, '').toLowerCase();
    let txt = '';
    try { txt = readFileSync(f, 'utf8'); } catch { continue; }
    const seen = new Set<string>();
    for (const m of txt.matchAll(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)) {
      const raw = m[1].trim().replace(/\.md$/i, '').toLowerCase();
      const target = names.has(raw) ? raw : shorts.get(raw);
      if (!target || target === me || seen.has(target)) continue;
      seen.add(target);
      wikilinks++;
      degree.set(me, (degree.get(me) ?? 0) + 1);
      degree.set(target, (degree.get(target) ?? 0) + 1);
    }
  }
  const orphans = [...names].filter((n) => !(degree.get(n) ?? 0)).length;
  return { notes: files.length, wikilinks, orphans };
}

function safeDashboardUrl(rawValue: string | undefined): string | undefined {
  const value = (rawValue ?? '').trim();
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Human-facing readiness only. This does not open a database connection, read a
 * credential, or expose a local vault path to browser clients.
 */
export function buildHumanTools(environment: BrainEnvironment = process.env): HumanToolStatus[] {
  const supabaseDashboard = safeDashboardUrl(environment.SUPABASE_DASHBOARD_URL);
  const obsidian = obsidianStatus(environment);
  const repoRoot = (environment.MATERIALIZE_REPO_ROOT ?? '').trim() || 'C:\\ANTIGRAVITY';
  const journalsDir = join(repoRoot, '.agents', 'journals');
  const skillsDir = join(repoRoot, '.agents', 'skills');
  const journalsOk = existsSync(journalsDir);
  const skillsOk = existsSync(skillsDir);
  const journalCount = journalsOk ? readdirSync(journalsDir).length : 0;
  const skillCount = skillsOk ? readdirSync(skillsDir).filter((d) => !/--[0-9a-f]{6,}$/.test(d)).length : 0;
  const vault = obsidian.status === 'configured' && obsidian.vaultPath ? vaultSummary(obsidian.vaultPath) : null;

  return [
    {
      id: 'repository',
      label: 'Repository Knowledge',
      state: journalsOk ? 'configured' : 'unavailable',
      detail: journalsOk
        ? `Harness journals present under .agents/journals (${journalCount} lanes).`
        : 'No .agents/journals directory found at the repository root.',
      humanFacing: true,
    },
    {
      id: 'graphy',
      label: 'Graphy Context',
      state: skillsOk ? 'configured' : 'unavailable',
      detail: skillsOk ? `Skills tree present (${skillCount} skill directories).` : 'No .agents/skills directory found.',
      humanFacing: true,
    },
    {
      id: 'supabase',
      label: 'Supabase Operations Workspace',
      state: supabaseDashboard ? 'configured' : 'not-configured',
      detail: supabaseDashboard
        ? 'Human dashboard link is configured. Read-only Mission Control data access requires a separately reviewed server-side adapter.'
        : 'No human dashboard link or reviewed Mission Control read adapter is configured.',
      humanFacing: true,
      ...(supabaseDashboard ? { openUrl: supabaseDashboard } : {}),
    },
    {
      id: 'obsidian',
      label: 'Obsidian Human Knowledge Workspace',
      state: obsidian.status,
      detail:
        obsidian.status === 'configured'
          ? `Vault read live: ${vault?.notes ?? 0} notes, ${vault?.wikilinks ?? 0} wikilinks, ${vault?.orphans ?? 0} orphans. Full graph on the AIRI dashboard (:9150, Knowledge Graph). Repository journals remain authoritative.`
          : obsidian.status === 'unavailable'
            ? 'A vault location is configured but currently unavailable; it is not treated as an outage of repository knowledge.'
            : 'No optional local vault is configured. Repository knowledge and journals remain available.',
      humanFacing: true,
    },
  ];
}

export function registerBrainRoutes(app: Express): void {
  app.get('/api/brain/state', (_req, res) => {
    try {
      const platforms = loadBrainPlatforms().map(platformSummary);
      res.json({
        platforms,
        knowledge: { source: 'repository', graphEndpoint: '/api/knowledge/graph', searchEndpoint: '/api/knowledge/search' },
        graphy: { agentsEndpoint: '/api/subagents', knowledgeEndpoint: '/api/knowledge/graph' },
        obsidian: obsidianStatus(),
        humanTools: buildHumanTools(),
      });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/brain/journal/:platformId', (req, res) => {
    try {
      const journal = readJournal(req.params.platformId);
      if (!journal) return res.status(404).json({ error: `Unknown platform: ${req.params.platformId}` });
      res.json(journal);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/api/brain/journal/:platformId', (req, res) => {
    try {
      const journal = writeJournal(req.params.platformId, String(req.body?.content ?? ''));
      if (!journal) return res.status(404).json({ error: `Unknown platform: ${req.params.platformId}` });
      res.json(journal);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/brain/knowledge', (req, res) => {
    const query = String(req.query.q ?? '').trim();
    res.json({ query, hits: searchKnowledge(query) });
  });

  app.get('/api/brain/graph', (_req, res) => res.json(buildKnowledgeGraph()));

  app.get('/api/brain/catalog', (req, res) => {
    try {
      const { skills, categories } = loadCatalog();
      const query = String(req.query.q ?? '').trim().toLowerCase();
      const category = String(req.query.category ?? '').trim().toLowerCase();
      const filtered = skills.filter((skill) => {
        if (category && skill.category !== category) return false;
        return !query || [skill.id, skill.label, skill.description].some((field) => field.toLowerCase().includes(query));
      });
      res.json({ skills: filtered, categories });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/brain/catalog/:kind/:id', (req, res) => {
    try {
      const kind = req.params.kind === 'tasks' ? 'task' : 'skill';
      const entry = getCatalogEntry(req.params.id, kind);
      if (!entry) return res.status(404).json({ error: `Not found: ${req.params.kind}/${req.params.id}` });
      res.json(entry);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });
}
