/**
 * HUD context composer — turns live server data into JARVIS's house preamble.
 * Pure module: every caller injects the data, so tests never touch the network.
 * Rule of the dashboard (Joshua, 2026-09-10): REAL DATA ONLY — when a source is
 * down the preamble says so, it never fabricates state.
 */

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

const TAB_NAMES = {
  dashboard: 'Dashboard', 'mission-control': 'Mission Control', agents: 'Agents',
  graph: 'Knowledge Graph', avatar: 'Avatar', widgets: 'Widgets', scenes: 'Scenes',
  image: 'Image Gen', claude: 'Claude CLI', hermes: 'Hermes AI', jarvis: 'JARVIS',
  crosslisting: 'Crosslisting',
};

export function tabName(tab) { return TAB_NAMES[tab] || 'HUD'; }

export function hudContext({ nodes, house, vault, agents, graph, config } = {}) {
  const lines = [];
  if (!nodes && !house && !vault && !agents && !graph) {
    lines.push('All house sources unreachable — say that monitoring data is unavailable; do not invent state.');
  }
  for (const n of (nodes && Array.isArray(nodes.nodes) ? nodes.nodes : [])) {
    lines.push(`${n.name} (${n.ip}): ${n.up}/${n.total} up`);
    for (const s of n.services || []) {
      const port = s.port ? ` (:${s.port})` : '';
      if (s.up) lines.push(`UP ${clean(s.label)}${port}`);
      else lines.push(`${s.state || 'DOWN'} ${clean(s.label)}${port}${s.detail ? ' — ' + clean(s.detail) : ''}`);
    }
  }
  if (house) {
    if (house.up && Array.isArray(house.services) && house.services.length) {
      const up = house.services.filter((s) => s.up).length;
      const down = house.services.filter((s) => !s.up).map((s) => clean(s.name)).filter(Boolean);
      lines.push(`Fable's Sentry: ${up}/${house.services.length} up${down.length ? '; down: ' + down.join(', ') : ''}`);
    } else if (!house.up) {
      lines.push(`Fable's Sentry: ${house.state || 'DOWN'}${house.detail ? ' — ' + clean(house.detail) : ''}`);
    }
  }
  if (graph) {
    lines.push(`Vault ${clean(config && config.vaultName)} (${clean(config && config.vaultPath)}): ${graph.notes ?? 0} notes, ${graph.links ?? 0} wikilinks`);
  }
  if (vault) {
    lines.push(`Obsidian REST ${vault.state || (vault.up ? 'UP' : 'DOWN')}${vault.detail ? ' — ' + clean(vault.detail) : ''}`);
  }
  if (agents) {
    lines.push(`${agents.count ?? 0} skills loadable in ${clean(agents.source)}`);
  }
  if (config && config.missionControl) lines.push(`Mission Control endpoint: ${config.missionControl}`);
  if (config && config.repo) lines.push(`Repo: ${config.repo}`);
  return lines.filter(Boolean).join('\n');
}

/**
 * Final prompt for the headless CLI: the bracketed, provenance-stamped house
 * context first, the operator's question last (unquoted, untouched).
 */
export function promptWithContext({ context = '', tab = '', user = '', at = '' } = {}) {
  const head = `[House context — server-verified by the dashboard server${at ? ' at ' + at : ''}]`;
  const body = [
    head,
    `Current dashboard tab: ${tabName(tab)}`,
    clean(context),
    '[/House context]',
  ].filter((l) => l !== clean('')).join('\n');
  return `${body}\n\n${user}`.replace(/\n{3,}/g, '\n\n');
}
