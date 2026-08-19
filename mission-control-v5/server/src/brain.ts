/**
 * Brain hub routes — repository knowledge, Graphy graph data, optional Obsidian
 * mirroring metadata, and per-harness journals. No external memory service is
 * required for active Mission Control operation.
 */
import { existsSync } from 'node:fs';
import type { Express } from 'express';
import { loadBrainPlatforms, platformSummary, readJournal, writeJournal } from './brainStore.js';
import { getCatalogEntry, loadCatalog } from './catalog.js';
import { buildKnowledgeGraph, searchKnowledge } from './knowledge.js';

function obsidianStatus(): { status: 'not-configured' | 'configured' | 'unavailable'; vaultPath?: string } {
  const vaultPath = (process.env.OBSIDIAN_VAULT_PATH ?? '').trim();
  if (!vaultPath) return { status: 'not-configured' };
  return existsSync(vaultPath) ? { status: 'configured', vaultPath } : { status: 'unavailable', vaultPath };
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
