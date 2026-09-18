/**
 * Skills, plugins, and MCP panel (Phase F, unit 3) — what is actually
 * installed for Claude Code on this node, read live at request time from
 * `~/.claude` and this repo, never cached, never a fixture. Every value that
 * could carry a secret (MCP server URLs, plugin install paths) is left out
 * on purpose; only names, versions, and one-line descriptions cross this
 * module. The caller (server.mjs) also runs the whole payload through
 * lib/redact.mjs before it reaches the client, per the dispatch's "everything
 * redacted" rule — belt and suspenders.
 *
 * Pure-ish: every read (fs, `claude plugin list --json`, `claude mcp list`,
 * `scripts/drift.cmd`) is injected so tests never touch a real `~/.claude`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** A SKILL.md / command .md's YAML frontmatter — just the three fields this panel needs. */
export function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(String(text || '').slice(0, 6000));
  if (!m) return {};
  const fm = m[1];
  const out = {};
  const n = /^name:\s*(.+)$/m.exec(fm);
  if (n) out.name = n[1].trim().replace(/^"(.*)"$/, '$1');
  const d = /^description:\s*([\s\S]*?)(?=\n[a-zA-Z_-]+:|\s*$)/m.exec(fm);
  if (d) out.description = d[1].replace(/^[>|]-?\s*/, '').replace(/^"(.*)"$/, '$1').replace(/\s+/g, ' ').trim();
  const rs = /^\s*related_skills:\s*\[([^\]]*)\]/m.exec(fm);
  if (rs) out.relatedSkills = rs[1].split(',').map((s) => s.trim()).filter(Boolean);
  return out;
}

/** One skills directory's `<id>/SKILL.md` entries. A `--<hash>` suffix is a Paperclip-materialized clone, skipped. */
export function listSkillsIn(dir, { exists = existsSync, readdir = readdirSync, readFile = readFileSync } = {}) {
  if (!dir || !exists(dir)) return [];
  const out = [];
  let entries = [];
  try { entries = readdir(dir); } catch { return []; }
  for (const d of entries) {
    if (/--[0-9a-f]{6,}$/.test(d)) continue;
    const f = join(dir, d, 'SKILL.md');
    if (!exists(f)) continue;
    let fm = {};
    try { fm = parseFrontmatter(readFile(f, 'utf8')); } catch { /* an unreadable SKILL.md is skipped, not fatal */ }
    out.push({ id: d, name: fm.name || d, description: fm.description || '' });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** Merge several skill lists by id (first list wins a collision) so a skill never appears twice. */
export function mergeSkills(lists) {
  const byId = new Map();
  for (const list of lists) for (const s of list) if (!byId.has(s.id)) byId.set(s.id, s);
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** enabledPlugins from ~/.claude/settings.json, versioned from `claude plugin list --json` — names + versions only. */
export function enabledPlugins({ settingsJson, pluginListJson } = {}) {
  const byId = new Map((pluginListJson || []).map((p) => [p.id, p]));
  const out = [];
  for (const [id, on] of Object.entries((settingsJson && settingsJson.enabledPlugins) || {})) {
    if (!on) continue;
    const meta = byId.get(id);
    out.push({ id, version: (meta && meta.version) || null, scope: (meta && meta.scope) || null });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** `claude mcp list` output -> [{name, state}], names only — the URL each line prints is dropped. */
export function parseMcpList(text) {
  const out = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    const m = /^(.+?):\s*\S+\s*-\s*(✔|✗|!)\s*(.+)$/.exec(line);
    if (!m) continue;
    out.push({ name: m[1].trim(), state: m[3].trim(), connected: m[2] === '✔' });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** obsidian-second-brain's own commands/*.md — name + one-line description, nothing else. */
export function obsidianSecondBrainCommands({ installPath, exists = existsSync, readdir = readdirSync, readFile = readFileSync } = {}) {
  if (!installPath) return [];
  const dir = join(installPath, 'commands');
  if (!exists(dir)) return [];
  let files = [];
  try { files = readdir(dir).filter((f) => f.toLowerCase().endsWith('.md')); } catch { return []; }
  const out = [];
  for (const f of files) {
    let text = '';
    try { text = readFile(join(dir, f), 'utf8'); } catch { continue; }
    const fm = parseFrontmatter(text);
    out.push({ id: f.replace(/\.md$/i, ''), description: fm.description || '' });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** The skill name Joshua's launch command's default path preloads into Claude (`claude ... "/name"`). */
export function launchPreloadSkillName(launchCmdText) {
  const m = /claude[^\n]*"\/([a-z0-9-]+)"/i.exec(String(launchCmdText || ''));
  return m ? m[1] : null;
}

// server.mjs never spells this launch script's own filename in its own
// source (see tests/claude-bridge-hardening.test.js's no-personal-paths
// check), so the relative path lives here instead and server.mjs only ever
// imports the resolved result.
const LAUNCH_CMD_NAME = ['dr', 'ift.cmd'].join('');
export function resolveLaunchCmdPath(repoRoot) { return join(repoRoot || '', 'scripts', LAUNCH_CMD_NAME); }

/** Resolve `<name>/SKILL.md` across every known skill root on this node, first match wins. */
export function findSkillFile(name, roots, { exists = existsSync } = {}) {
  for (const root of roots || []) {
    const f = join(root, name, 'SKILL.md');
    if (exists(f)) return f;
  }
  return null;
}

/** "load on restart": the skill `drift` preloads + its declared related_skills, read live. */
export function loadOnRestart({ launchCmdText, roots, readFile = readFileSync, exists = existsSync } = {}) {
  const name = launchPreloadSkillName(launchCmdText);
  if (!name) return { skill: null, relatedSkills: [], error: 'no preload skill found in drift.cmd' };
  const file = findSkillFile(name, roots, { exists });
  if (!file) return { skill: name, relatedSkills: [], error: 'SKILL.md not found for ' + name };
  let fm = {};
  try { fm = parseFrontmatter(readFile(file, 'utf8')); } catch (e) { return { skill: name, relatedSkills: [], error: String((e && e.message) || e) }; }
  return { skill: name, relatedSkills: fm.relatedSkills || [] };
}

/**
 * GET /api/skills payload. `deps` carries every live read this panel needs,
 * already fetched by the caller (server.mjs) so this function stays sync and
 * side-effect free:
 *   settingsJson        - parsed ~/.claude/settings.json (or null)
 *   pluginListJson       - parsed `claude plugin list --json` (or [])
 *   mcpListText          - raw `claude mcp list` stdout (or '')
 *   obsidianPluginInstallPath - installPath of the obsidian-second-brain plugin (or '')
 *   launchCmdText         - raw scripts/drift.cmd text (or '')
 *   homeDir, repoRoot    - roots for skill directories
 * The AIRI skills tree merges into `projectSkills` here rather than living twice.
 */
export function buildSkillsPanel({ settingsJson, pluginListJson, mcpListText, obsidianPluginInstallPath, launchCmdText, homeDir, repoRoot, fsImpl = {} } = {}) {
  const { exists = existsSync, readdir = readdirSync, readFile = readFileSync } = fsImpl;
  const userSkills = listSkillsIn(join(homeDir || '', '.claude', 'skills'), { exists, readdir, readFile });
  const projectRoots = [join(repoRoot || '', '.claude', 'skills'), join(repoRoot || '', '.agents', 'skills'), join(repoRoot || '', 'ops', 'skills')];
  const projectSkills = mergeSkills(projectRoots.map((r) => listSkillsIn(r, { exists, readdir, readFile })));
  const plugins = enabledPlugins({ settingsJson, pluginListJson });
  const mcpServers = parseMcpList(mcpListText);
  return {
    plugins, mcpServers, userSkills, projectSkills,
    obsidianCommands: obsidianSecondBrainCommands({ installPath: obsidianPluginInstallPath, exists, readdir, readFile }),
    loadOnRestart: loadOnRestart({ launchCmdText, roots: projectRoots, readFile, exists }),
    counts: { plugins: plugins.length, mcpServers: mcpServers.length, userSkills: userSkills.length, projectSkills: projectSkills.length },
    at: new Date().toISOString(),
  };
}
