import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncGraphyLearningsToObsidian } from './live-tabs-backend.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALIENWARE_VAULT = 'C:\\DREAM\\Antigravity';

test('docs/memory-layer/agent-workflow-graphy.json is valid JSON and enforces Task 15 policy', () => {
  const raw = fs.readFileSync(path.join(ROOT, 'docs', 'memory-layer', 'agent-workflow-graphy.json'), 'utf8');
  const doc = JSON.parse(raw);

  const mandatory = doc.universalSkills?.mandatory || [];
  const expectedMandatory = [
    'verification-before-completion',
    'find-skills',
    'create-skills',
    'brainstorming',
    'caveman',
    'i-have-adhd',
    'agent-browser',
    'agent-reach',
    'subagent-driven-development',
    'self-improving-agent',
    'self-improving-system',
  ];
  assert.deepEqual(mandatory, expectedMandatory);

  const core = doc.universalSkills?.core || [];
  assert.ok(!core.includes('tdd'), 'duplicate tdd must be removed in favor of test-driven-development');
  assert.deepEqual(core, [
    'systematic-debugging',
    'test-driven-development',
    'supabase',
    'supabase-postgres-best-practices',
    'system-connector',
    'openviking',
  ]);

  const mem = doc.universalSkills?.memoryLayer;
  assert.equal(mem?.authoritative, 'Obsidian vault in-repo (markdown, committed)');
  assert.equal(mem?.recall?.containerTag, 'repo_antigravity__02249b9e7104105f');
  assert.equal(mem?.recall?.authoritative, false);

  const perNode = mem?.obsidianVaults?.perNodeVaults;
  assert.equal(perNode?.T5500, 'C:\\ANTIGRAVITY\\Antigravity');
  assert.equal(perNode?.Alienware, ALIENWARE_VAULT);
  assert.equal(perNode?.Sabretooth, 'C:\\Ai-Dream-Team\\Antigravity');

  const obsSkills = mem?.obsidianVaults?.skills || [];
  assert.deepEqual(obsSkills, [
    'obsidian-save',
    'obsidian-think',
    'obsidian-wiki-fold',
    'obsidian-markdown',
  ]);
  for (const s of obsSkills) {
    assert.ok(!s.includes(':'), `Skill ${s} must be Hermes-loadable (no claude-obsidian:* colon names)`);
    const skillMdPath = path.join(ROOT, '.agents', 'skills', s, 'SKILL.md');
    assert.ok(fs.existsSync(skillMdPath), `Missing ${skillMdPath}`);
  }
});

test('.agents/harness-config/hermes.yaml is well-formed and makes Obsidian authoritative', () => {
  const yamlText = fs.readFileSync(path.join(ROOT, '.agents', 'harness-config', 'hermes.yaml'), 'utf8');
  assert.match(yamlText, /authoritative:\s*Obsidian vault in-repo \(markdown, committed\)/);
  assert.match(yamlText, /obsidian_mirror:\s*authoritative/);
  assert.match(yamlText, /T5500:\s*C:\\ANTIGRAVITY\\Antigravity/);
  assert.ok(yamlText.includes(`Alienware: ${ALIENWARE_VAULT}`));
  assert.match(yamlText, /Sabretooth:\s*C:\\Ai-Dream-Team\\Antigravity/);
  assert.ok(!yamlText.includes('containerTag'), 'Supermemory is retired from the Hermes config (#318)');
  assert.ok(!/^\s*-\s*tdd\s*$/m.test(yamlText), 'hermes.yaml must not list duplicate tdd skill');
  assert.ok(!yamlText.includes('claude-obsidian:'), 'hermes.yaml must not use claude-obsidian:* skill names');
});

test('syncGraphyLearningsToObsidian writes markdown with YAML frontmatter to vault', () => {
  const tmpVault = fs.mkdtempSync(path.join(os.tmpdir(), 'obsidian-vault-test-'));
  try {
    const res = syncGraphyLearningsToObsidian({
      vaultRoot: tmpVault,
      relPath: 'memory-graph/test-graphy.md',
      title: 'Test Graphy Sync',
      summary: 'Unit test summary',
      findings: '- Verified Graphy -> Obsidian markdown write',
      source: 'hermes-policy.test.mjs',
    });
    assert.equal(res.ok, true);
    const written = fs.readFileSync(res.fullPath, 'utf8');
    assert.match(written, /^---\r?\ntitle: "Test Graphy Sync"/);
    assert.match(written, /\[\[00 HOME\]\]/);
    assert.match(written, /Verified Graphy -> Obsidian markdown write/);
  } finally {
    fs.rmSync(tmpVault, { recursive: true, force: true });
  }
});
