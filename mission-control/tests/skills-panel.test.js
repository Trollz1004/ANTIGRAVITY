import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import {
  parseFrontmatter, listSkillsIn, mergeSkills, enabledPlugins, parseMcpList,
  obsidianSecondBrainCommands, launchPreloadSkillName, findSkillFile, loadOnRestart, buildSkillsPanel,
} from '../lib/skills-panel.mjs';

describe('parseFrontmatter', () => {
  it('reads name, description, and a flat related_skills list', () => {
    const text = `---
name: sabretooth-node
description: "Fable's launch skill on the Sabretooth node."
metadata:
  node: sabretooth
  related_skills: [judge-house, fables-house, i-have-adhd]
---
# body`;
    const fm = parseFrontmatter(text);
    expect(fm.name).toBe('sabretooth-node');
    expect(fm.description).toMatch(/launch skill/);
    expect(fm.relatedSkills).toEqual(['judge-house', 'fables-house', 'i-have-adhd']);
  });

  it('returns {} for text with no frontmatter fence', () => {
    expect(parseFrontmatter('just a markdown file')).toEqual({});
  });
});

describe('listSkillsIn', () => {
  function fakeFs(tree) {
    return {
      exists: (p) => Object.hasOwn(tree, p),
      readdir: (p) => tree[p].dirs || [],
      readFile: (p) => { if (!(p in tree)) throw new Error('ENOENT'); return tree[p]; },
    };
  }

  it('lists skills with a SKILL.md and skips a --hash Paperclip clone', () => {
    const dir = 'skills';
    const skillFile = join(dir, 'ab-testing', 'SKILL.md');
    const tree = {
      [skillFile]: '---\nname: ab-testing\ndescription: "A/B testing playbook"\n---\n',
    };
    const list = listSkillsIn(dir, {
      exists: (p) => p === dir || p === skillFile,
      readdir: () => ['ab-testing', 'ab-testing--deadbeef1234'],
      readFile: (p) => { if (!(p in tree)) throw new Error('ENOENT'); return tree[p]; },
    });
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('ab-testing');
    expect(list[0].description).toBe('A/B testing playbook');
  });

  it('returns [] for a missing directory', () => {
    expect(listSkillsIn('/nope', { exists: () => false })).toEqual([]);
  });
});

describe('mergeSkills', () => {
  it('de-dupes by id, first list wins', () => {
    const a = [{ id: 'x', name: 'X from A', description: '' }];
    const b = [{ id: 'x', name: 'X from B', description: '' }, { id: 'y', name: 'Y', description: '' }];
    const merged = mergeSkills([a, b]);
    expect(merged.map((s) => s.id)).toEqual(['x', 'y']);
    expect(merged[0].name).toBe('X from A');
  });
});

describe('enabledPlugins', () => {
  it('lists only enabled plugins, versioned from the plugin list, names/versions only', () => {
    const settingsJson = { enabledPlugins: { 'github@claude-plugins-official': true, 'firebase@claude-plugins-official': false } };
    const pluginListJson = [{ id: 'github@claude-plugins-official', version: '1.2.3', scope: 'user', installPath: 'C:\\secret\\path' }];
    const out = enabledPlugins({ settingsJson, pluginListJson });
    expect(out).toEqual([{ id: 'github@claude-plugins-official', version: '1.2.3', scope: 'user' }]);
    expect(JSON.stringify(out)).not.toContain('secret');
  });

  it('returns [] when settings has no enabledPlugins', () => {
    expect(enabledPlugins({})).toEqual([]);
  });
});

describe('parseMcpList', () => {
  it('parses connected and needs-authentication lines, dropping the URL', () => {
    const text = [
      'Checking MCP server health…',
      'claude.ai Claude Docs: https://api.anthropic.com/v1/pages/mcp - \u2714 Connected',
      'claude.ai Magicweave: https://mcp.magicweave.xyz/mcp - ! Needs authentication',
    ].join('\n');
    const out = parseMcpList(text);
    expect(out).toEqual([
      { name: 'claude.ai Claude Docs', state: 'Connected', connected: true },
      { name: 'claude.ai Magicweave', state: 'Needs authentication', connected: false },
    ]);
    expect(JSON.stringify(out)).not.toContain('https://');
  });

  it('returns [] for empty input', () => {
    expect(parseMcpList('')).toEqual([]);
  });
});

describe('obsidianSecondBrainCommands', () => {
  it('reads name + one-line description from each command file', () => {
    const installPath = 'plug';
    const fsImpl = {
      exists: (p) => p === join(installPath, 'commands'),
      readdir: () => ['obsidian-daily.md'],
      readFile: () => '---\ndescription: Create or update today\'s daily note\n---\nbody',
    };
    const out = obsidianSecondBrainCommands({ installPath, ...fsImpl });
    expect(out).toEqual([{ id: 'obsidian-daily', description: "Create or update today's daily note" }]);
  });

  it('returns [] with no install path', () => {
    expect(obsidianSecondBrainCommands({})).toEqual([]);
  });
});

describe('launchPreloadSkillName + findSkillFile + loadOnRestart', () => {
  const launchCmdText = ':claude\nclaude --continue --dangerously-skip-permissions "/sabretooth-node"\n';

  it('extracts the preloaded skill name from drift.cmd', () => {
    expect(launchPreloadSkillName(launchCmdText)).toBe('sabretooth-node');
  });

  it('returns null when drift.cmd has no claude preload line', () => {
    expect(launchPreloadSkillName('echo hi')).toBeNull();
  });

  it('finds the first matching root for a skill file', () => {
    const roots = ['a', 'b'];
    const target = join('b', 'sabretooth-node', 'SKILL.md');
    const f = findSkillFile('sabretooth-node', roots, { exists: (p) => p === target });
    expect(f).toBe(target);
  });

  it('loadOnRestart reports the skill and its related_skills', () => {
    const roots = [join('ops', 'skills')];
    const target = join('ops', 'skills', 'sabretooth-node', 'SKILL.md');
    const readFile = () => '---\nname: sabretooth-node\nmetadata:\n  related_skills: [judge-house, fables-house]\n---\n';
    const r = loadOnRestart({ launchCmdText, roots, readFile, exists: (p) => p === target });
    expect(r.skill).toBe('sabretooth-node');
    expect(r.relatedSkills).toEqual(['judge-house', 'fables-house']);
  });

  it('loadOnRestart is honest when the skill file is not found anywhere', () => {
    const r = loadOnRestart({ launchCmdText, roots: ['nope'], exists: () => false });
    expect(r.skill).toBe('sabretooth-node');
    expect(r.relatedSkills).toEqual([]);
    expect(r.error).toMatch(/not found/);
  });
});

describe('buildSkillsPanel', () => {
  it('assembles every section and counts, never throwing on missing pieces', () => {
    const r = buildSkillsPanel({
      settingsJson: { enabledPlugins: { 'github@claude-plugins-official': true } },
      pluginListJson: [{ id: 'github@claude-plugins-official', version: '1.0.0', scope: 'user' }],
      mcpListText: 'claude.ai Claude Docs: https://x - \u2714 Connected',
      obsidianPluginInstallPath: '',
      launchCmdText: 'claude --continue "/sabretooth-node"',
      homeDir: '/home', repoRoot: '/repo',
      fsImpl: { exists: () => false, readdir: () => [], readFile: () => { throw new Error('ENOENT'); } },
    });
    expect(r.plugins).toHaveLength(1);
    expect(r.mcpServers).toHaveLength(1);
    expect(r.userSkills).toEqual([]);
    expect(r.projectSkills).toEqual([]);
    expect(r.counts).toEqual({ plugins: 1, mcpServers: 1, userSkills: 0, projectSkills: 0 });
    expect(r.loadOnRestart.skill).toBe('sabretooth-node');
  });
});
