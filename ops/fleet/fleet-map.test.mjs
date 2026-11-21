import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAP_PATH = path.join(HERE, 'fleet-map.json');
const PS_SCRIPT = path.join(HERE, 'Get-FleetEndpoint.ps1');
const FW_SCRIPT = path.join(HERE, 'firewall-allowlist.ps1');
const TUNNEL_SCRIPT = path.join(HERE, 'tunnel-targets.ps1');
const GUARDIAN_PY = path.resolve(HERE, '..', '..', 'scripts', 'clawx-control', 'opus-guardian.py');
const PY_MODULE = path.join(HERE, 'fleet_map.py');

const LOOPBACK_IP = ['127', '0', '0', '1'].join('.');
const CANONICAL_SHA256 = 'bfce109830341feea9f2a97960e15ed2cd0e3e0d4ea95c8bf03e658d1552cfd7';

const EXPECTED_ALIENWARE = [
  ['swarm-command', 8000, 'lan-guarded', 'FLEET_SHARED_TOKEN', '0.0.0.0'],
  ['free-claude-code', 8082, 'lan-guarded', 'FLEET_SHARED_TOKEN', '0.0.0.0'],
  ['opsis-studio', 8390, 'lan', '', '0.0.0.0'],
  ['media-worker', 8391, 'lan', '', '0.0.0.0'],
  ['hermes-leadgen', 8392, 'lan-guarded', 'HERMES_LEADGEN_TOKEN', '0.0.0.0'],
  ['panda-router', 8765, 'lan-guarded', 'FLEET_SHARED_TOKEN', '0.0.0.0'],
  ['alienware-hermes-dashboard', 9119, 'lan', '', '0.0.0.0'],
  ['live-npc-lab', 9127, 'lan', '', '0.0.0.0'],
  ['dreamops-bridge', 9133, 'lan', '', '0.0.0.0'],
  ['airi-dashboard', 9150, 'lan', '', '0.0.0.0'],
  ['alienware-fleet-status', 9165, 'lan', '', '0.0.0.0'],
  ['dream-engine', 9180, 'lan-guarded', 'DREAM_ENGINE_TOKEN', '0.0.0.0'],
  ['crosslisting', 3000, 'lan', '', '0.0.0.0'],
  ['alienware-ollama', 11434, 'lan-guarded', 'FLEET_SHARED_TOKEN', '0.0.0.0'],
  ['alienware-obsidian-rest', 27123, 'this machine only', 'OBSIDIAN_API_KEY', LOOPBACK_IP],
  ['alienware-obsidian-mcp', 27200, 'lan-guarded', 'FLEET_SHARED_TOKEN', '0.0.0.0'],
];

const EXPECTED_T5500 = [
  ['mission-os', 3130, 'lan-guarded', 'FLEET_SHARED_TOKEN', '0.0.0.0'],
  ['date-app-web', 3200, 'lan', '', '0.0.0.0'],
  ['date-app-api', 8000, 'lan', '', '0.0.0.0'],
  ['t5500-marketing-gateway', 8377, 'lan', 'API_SERVER_KEY', '0.0.0.0'],
  ['hermes-api', 8643, 'lan-guarded', 'FLEET_SHARED_TOKEN', '0.0.0.0'],
  ['t5500-hermes-dashboard', 9119, 'lan', '', '0.0.0.0'],
  ['t5500-live-npc-lab', 9127, 'lan', '', '0.0.0.0'],
  ['domains-server', 9160, 'lan', '', '0.0.0.0'],
  ['t5500-fleet-status', 9165, 'lan', '', '0.0.0.0'],
  ['t5500-ollama', 11434, 'lan-guarded', 'FLEET_SHARED_TOKEN', '0.0.0.0'],
  ['omniroute', 20128, 'lan', 'OMNIROUTE_API_KEY', '192.168.0.15'],
  ['ai-memory', 49374, 'lan', '', '0.0.0.0'],
  ['t5500-postgres', 5432, 'this machine only', 'POSTGRES_PASSWORD', LOOPBACK_IP],
  ['t5500-redis', 6379, 'this machine only', '', LOOPBACK_IP],
  ['t5500-obsidian-rest', 27123, 'this machine only', 'OBSIDIAN_API_KEY', LOOPBACK_IP],
];

const ACTIVE_SERVICE_EXPECTATIONS = [
  { id: 'mission-os', url: 'http://192.168.0.15:3130', bind: '0.0.0.0', tokenEnv: 'FLEET_SHARED_TOKEN' },
  { id: 'domains-server', url: 'http://192.168.0.15:9160', bind: '0.0.0.0', tokenEnv: null },
  { id: 'dateapp-frontend', url: 'http://192.168.0.15:3200', bind: '0.0.0.0', tokenEnv: null },
  { id: 'dateapp-api', url: 'http://192.168.0.15:8000', bind: '0.0.0.0', tokenEnv: null },
  { id: 'hermes-gateway', url: 'http://192.168.0.15:8643', bind: '0.0.0.0', tokenEnv: 'FLEET_SHARED_TOKEN' },
  { id: 'hermes-dashboard', url: 'http://192.168.0.15:9119', bind: '0.0.0.0', tokenEnv: null },
  { id: 'ollama-t5500', url: 'http://192.168.0.15:11434', bind: '0.0.0.0', tokenEnv: 'FLEET_SHARED_TOKEN' },
  { id: 'omniroute', url: 'http://192.168.0.15:20128', bind: '192.168.0.15', tokenEnv: 'OMNIROUTE_API_KEY' },
  { id: 'obsidian-t5500', url: `http://${LOOPBACK_IP}:27123`, bind: LOOPBACK_IP, tokenEnv: 'OBSIDIAN_API_KEY' },
  { id: 'ai-memory', url: 'http://192.168.0.15:49374', bind: '0.0.0.0', tokenEnv: null },
  { id: 'swarm-command', url: 'http://192.168.0.40:8000', bind: '0.0.0.0', tokenEnv: 'FLEET_SHARED_TOKEN' },
  { id: 'free-claude-code', url: 'http://192.168.0.40:8082', bind: '0.0.0.0', tokenEnv: 'FLEET_SHARED_TOKEN' },
  { id: 'opsis-studio', url: 'http://192.168.0.40:8390', bind: '0.0.0.0', tokenEnv: null },
  { id: 'leadgen-desk', url: 'http://192.168.0.40:8392', bind: '0.0.0.0', tokenEnv: 'HERMES_LEADGEN_TOKEN' },
  { id: 'panda-router', url: 'http://192.168.0.40:8765', bind: '0.0.0.0', tokenEnv: 'FLEET_SHARED_TOKEN' },
  { id: 'npc-lab', url: 'http://192.168.0.40:9127', bind: '0.0.0.0', tokenEnv: null },
  { id: 'dreamops-bridge', url: 'http://192.168.0.40:9133', bind: '0.0.0.0', tokenEnv: null },
  { id: 'dream-engine', url: 'http://192.168.0.40:9180', bind: '0.0.0.0', tokenEnv: 'DREAM_ENGINE_TOKEN' },
  { id: 'ollama-alienware', url: 'http://192.168.0.40:11434', bind: '0.0.0.0', tokenEnv: 'FLEET_SHARED_TOKEN' },
  { id: 'obsidian-alienware', url: `http://${LOOPBACK_IP}:27123`, bind: LOOPBACK_IP, tokenEnv: 'OBSIDIAN_API_KEY' },
  { id: 'alienware-obsidian-mcp', url: 'http://192.168.0.40:27200', bind: '0.0.0.0', tokenEnv: 'FLEET_SHARED_TOKEN' },
  { id: 'postgres', url: `http://${LOOPBACK_IP}:5432`, bind: LOOPBACK_IP, tokenEnv: 'POSTGRES_PASSWORD' },
  { id: 'redis', url: `http://${LOOPBACK_IP}:6379`, bind: LOOPBACK_IP, tokenEnv: null },
];

const FALLBACK_SERVICE_EXPECTATIONS = [
  { id: 'odysseus', port: 7011, scope: 'lan-guarded', bind: '0.0.0.0', tokenEnv: 'MISSION_OS_TOKEN' },
  { id: 'governance', port: 9134, scope: 'lan-guarded', bind: '0.0.0.0', tokenEnv: 'OFFICIAL_VOTE_TOKEN' },
  { id: 'mission-mcp', port: 3901, scope: 'lan-guarded', bind: '0.0.0.0', tokenEnv: 'MISSION_MCP_TOKEN' },
  { id: 'onemin-shim', port: 20130, scope: 'lan-guarded', bind: '0.0.0.0', tokenEnv: 'ONEMIN_SHIM_TOKEN' },
];

test('fleet-map.json matches canonical dream-online origin/main array-schema with ONLY alienware and t5500', () => {
  assert.ok(fs.existsSync(MAP_PATH), 'ops/fleet/fleet-map.json must exist');
  const raw = fs.readFileSync(MAP_PATH, 'utf8');
  assert.doesNotMatch(raw, /sabretooth/i, 'fleet-map.json must never mention retired third node');
  assert.ok(!raw.includes(['192', '168', '0', '8'].join('.')), 'fleet-map.json must never contain retired .8 IP');

  const normalized = raw.replace(/\r\n/g, '\n');
  const actualSha = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  assert.equal(
    actualSha,
    CANONICAL_SHA256,
    'ops/fleet/fleet-map.json must match canonical dream-online origin/main bytes',
  );

  const data = JSON.parse(raw);
  assert.equal(data.spine, 'docs/house/SPINE.md');
  assert.deepEqual(Object.keys(data.nodes).sort(), ['alienware', 't5500']);
  assert.equal(data.nodes.t5500.ip, '192.168.0.15');
  assert.equal(data.nodes.alienware.ip, '192.168.0.40');
  assert.equal(data.nodes.alienware.githubAccount, 'Trollz1004');
  assert.equal(data.nodes.t5500.githubAccount, 'Trollz1004');
  assert.ok(Array.isArray(data.nodes.t5500.repos) && data.nodes.t5500.repos.includes('Trollz1004/ANTIGRAVITY'));
  assert.ok(Array.isArray(data.nodes.alienware.repos) && data.nodes.alienware.repos.includes('Trollz1004/dream-online'));
  assert.ok(Array.isArray(data.nodes.alienware.harnesses) && data.nodes.alienware.harnesses.includes('gemini'));
  assert.ok(Array.isArray(data.nodes.t5500.harnesses) && data.nodes.t5500.harnesses.includes('hermes'));
  assert.ok(Array.isArray(data.services), 'canonical fleet-map.json must use array-schema for services');

  const byId = new Map(data.services.map((s) => [s.id, s]));
  assert.equal(byId.size, data.services.length, 'service IDs must be unique');

  for (const [id, port, scope, authTokenEnv, bind] of EXPECTED_ALIENWARE) {
    const svc = byId.get(id);
    assert.ok(svc, `Missing alienware service ${id}`);
    assert.equal(svc.node, 'alienware');
    assert.equal(svc.port, port);
    assert.equal(svc.scope, scope);
    assert.equal(svc.authTokenEnv, authTokenEnv);
    assert.equal(svc.bind, bind);
    assert.equal(svc.host, scope === 'this machine only' ? LOOPBACK_IP : '192.168.0.40');
  }

  for (const [id, port, scope, authTokenEnv, bind] of EXPECTED_T5500) {
    const svc = byId.get(id);
    assert.ok(svc, `Missing t5500 service ${id}`);
    assert.equal(svc.node, 't5500');
    assert.equal(svc.port, port);
    assert.equal(svc.scope, scope);
    assert.equal(svc.authTokenEnv, authTokenEnv);
    assert.equal(svc.bind, bind);
    assert.equal(svc.host, scope === 'this machine only' ? LOOPBACK_IP : '192.168.0.15');
  }

  assert.equal(data.services.length, EXPECTED_ALIENWARE.length + EXPECTED_T5500.length);

  // Explicit guard & loopback checks
  assert.equal(byId.get('panda-router').scope, 'lan-guarded');
  assert.equal(byId.get('panda-router').authTokenEnv, 'FLEET_SHARED_TOKEN');
  assert.equal(byId.get('alienware-obsidian-mcp').scope, 'lan-guarded');
  assert.equal(byId.get('alienware-obsidian-mcp').authTokenEnv, 'FLEET_SHARED_TOKEN');
  for (const localId of ['t5500-postgres', 't5500-redis', 'alienware-obsidian-rest', 't5500-obsidian-rest']) {
    const svc = byId.get(localId);
    assert.equal(svc.scope, 'this machine only');
    assert.equal(svc.host, LOOPBACK_IP);
    assert.equal(svc.bind, LOOPBACK_IP);
  }
});

test('fleet-map.mjs resolves all active services, spine/repos/harnesses helpers, repo-auxiliary fallback services with dynamic host, and canonical-only lists', async () => {
  const mod = await import('./fleet-map.mjs');
  assert.equal(mod.getSpinePath(), 'docs/house/SPINE.md');
  assert.equal(mod.getNodeIp('t5500'), '192.168.0.15');
  assert.equal(mod.getNodeIp('alienware'), '192.168.0.40');
  assert.equal(mod.getNodeHost('t5500'), '192.168.0.15');
  assert.equal(mod.getNodeHost('alienware'), '192.168.0.40');
  assert.deepEqual(mod.getAllowedNodeHosts().sort(), ['192.168.0.15', '192.168.0.40']);
  assert.ok(mod.getNodeRepos('t5500').includes('Trollz1004/ANTIGRAVITY'));
  assert.ok(mod.getNodeRepos('alienware').includes('Trollz1004/dream-online'));
  assert.ok(mod.getNodeHarnesses('t5500').includes('hermes'));
  assert.ok(mod.getNodeHarnesses('alienware').includes('gemini'));
  assert.equal(mod.getServicePort('mission-os'), 3130);
  assert.equal(mod.getServiceBindHost('mission-os'), '0.0.0.0');
  assert.equal(mod.getServiceHealthUrl('swarm-command'), 'http://192.168.0.40:8000/api/health');
  assert.equal(mod.getServicesByNode('t5500').length, EXPECTED_T5500.length);
  assert.ok(mod.getServicesByScope('this machine only').length >= 3);

  for (const exp of ACTIVE_SERVICE_EXPECTATIONS) {
    const svc = mod.getService(exp.id);
    assert.equal(mod.getServiceUrl(exp.id), exp.url, `URL mismatch for ${exp.id}`);
    assert.equal(mod.getBindHost(exp.id), exp.bind, `Bind host mismatch for ${exp.id}`);
    assert.equal(svc.tokenEnv, exp.tokenEnv, `tokenEnv mismatch for ${exp.id}`);
  }
  assert.equal(mod.getServiceUrl('mission-os', '/api/v1/status'), 'http://192.168.0.15:3130/api/v1/status');
  assert.equal(mod.getServiceUrl('domains-server', '/health'), 'http://192.168.0.15:9160/health');
  assert.equal(mod.getServiceUrl('swarm-command', '/health'), 'http://192.168.0.40:8000/health');

  // Repo-auxiliary fallback services
  for (const fb of FALLBACK_SERVICE_EXPECTATIONS) {
    const svc = mod.getService(fb.id);
    assert.equal(svc.id, fb.id);
    assert.equal(svc.node, 't5500');
    assert.equal(svc.host, '192.168.0.15');
    assert.equal(svc.port, fb.port);
    assert.equal(svc.scope, fb.scope);
    assert.equal(svc.bind, fb.bind);
    assert.equal(svc.tokenEnv, fb.tokenEnv);
    assert.equal(mod.getServiceUrl(fb.id), `http://192.168.0.15:${fb.port}`);
    assert.equal(mod.getBindHost(fb.id), fb.bind);
  }
  assert.equal(mod.getServiceUrl('official-vote', '/health'), 'http://192.168.0.15:9134/health');
  assert.equal(mod.getBindHost('official-vote'), '0.0.0.0');

  // listAllServices & listServicesByNode MUST return ONLY canonical fleet-map.json entries
  const allServices = mod.listAllServices();
  const t5500Services = mod.listServicesByNode('t5500');
  const alienwareServices = mod.listServicesByNode('alienware');
  assert.equal(allServices.length, EXPECTED_ALIENWARE.length + EXPECTED_T5500.length);
  assert.equal(t5500Services.length, EXPECTED_T5500.length);
  assert.equal(alienwareServices.length, EXPECTED_ALIENWARE.length);
  for (const fb of FALLBACK_SERVICE_EXPECTATIONS) {
    assert.ok(!allServices.some((s) => s.id === fb.id), `listAllServices must not inject fallback ${fb.id}`);
    assert.ok(!t5500Services.some((s) => s.id === fb.id), `listServicesByNode must not inject fallback ${fb.id}`);
  }

  // Fallback host must be derived dynamically from getNode('t5500', fleetMap).ip
  const customMap = {
    nodes: {
      t5500: { id: 't5500', ip: '10.99.0.15', host: '10.99.0.15' },
      alienware: { id: 'alienware', ip: '10.99.0.40', host: '10.99.0.40' },
    },
    services: [],
  };
  for (const fb of FALLBACK_SERVICE_EXPECTATIONS) {
    assert.equal(mod.getService(fb.id, customMap).host, '10.99.0.15');
    assert.equal(mod.getServiceUrl(fb.id, '', customMap), `http://10.99.0.15:${fb.port}`);
  }
  assert.equal(mod.listAllServices(customMap).length, 0);

  // Explicit entry in fleetMap overrides fallback
  const overrideMap = {
    nodes: customMap.nodes,
    services: [
      {
        id: 'odysseus',
        node: 't5500',
        host: '10.99.0.15',
        port: 17011,
        protocol: 'http',
        scope: 'lan',
        bind: '0.0.0.0',
      },
    ],
  };
  assert.equal(mod.getServiceUrl('odysseus', '', overrideMap), 'http://10.99.0.15:17011');
});

test('fleet_map.py resolves all active services, repo-auxiliary fallbacks with dynamic host, and canonical-only lists', () => {
  assert.ok(fs.existsSync(PY_MODULE), 'ops/fleet/fleet_map.py must exist');
  const script = [
    'import json, sys',
    `sys.path.insert(0, ${JSON.stringify(HERE)})`,
    'import fleet_map',
    `active_ids = ${JSON.stringify(ACTIVE_SERVICE_EXPECTATIONS.map((e) => e.id))}`,
    `fallback_ids = ${JSON.stringify(FALLBACK_SERVICE_EXPECTATIONS.map((e) => e.id))}`,
    'active_out = {',
    '  sid: {',
    '    "url": fleet_map.get_service_url(sid),',
    '    "bind": fleet_map.get_bind_host(sid),',
    '    "tokenEnv": fleet_map.get_service(sid)["tokenEnv"],',
    '  } for sid in active_ids',
    '}',
    'fb_out = {',
    '  sid: {',
    '    "url": fleet_map.get_service_url(sid),',
    '    "bind": fleet_map.get_bind_host(sid),',
    '    "host": fleet_map.get_service(sid)["host"],',
    '    "port": fleet_map.get_service(sid)["port"],',
    '    "scope": fleet_map.get_service(sid)["scope"],',
    '    "tokenEnv": fleet_map.get_service(sid)["tokenEnv"],',
    '  } for sid in fallback_ids',
    '}',
    'custom_map = {',
    '  "nodes": {"t5500": {"id": "t5500", "ip": "10.99.0.15"}, "alienware": {"id": "alienware", "ip": "10.99.0.40"}},',
    '  "services": [],',
    '}',
    'print(json.dumps({',
    '  "spine": fleet_map.get_spine_path(),',
    '  "t5500": fleet_map.get_node_ip("t5500"),',
    '  "alienware": fleet_map.get_node_ip("alienware"),',
    '  "t5500_host": fleet_map.get_node_host("t5500"),',
    '  "allowed_hosts": sorted(fleet_map.get_allowed_node_hosts()),',
    '  "t5500_repos": fleet_map.get_node_repos("t5500"),',
    '  "aw_harnesses": fleet_map.get_node_harnesses("alienware"),',
    '  "mos_port": fleet_map.get_service_port("mission-os"),',
    '  "mos_bind_alias": fleet_map.get_service_bind_host("mission-os"),',
    '  "swarm_health": fleet_map.get_service_health_url("swarm-command"),',
    '  "local_only_count": len(fleet_map.get_services_by_scope("this machine only")),',
    '  "mos_status": fleet_map.get_service_url("mission-os", "/api/v1/status"),',
    '  "official_vote": fleet_map.get_service_url("official-vote", "/health"),',
    '  "official_vote_bind": fleet_map.get_bind_host("official-vote"),',
    '  "active": active_out,',
    '  "fallbacks": fb_out,',
    '  "all_ids": [s["id"] for s in fleet_map.list_all_services()],',
    '  "t5500_count": len(fleet_map.list_services_by_node("t5500")),',
    '  "alienware_count": len(fleet_map.list_services_by_node("alienware")),',
    '  "t5500_by_node_alias": len(fleet_map.get_services_by_node("t5500")),',
    '  "custom_odysseus": fleet_map.get_service_url("odysseus", "", custom_map),',
    '  "custom_all_count": len(fleet_map.list_all_services(custom_map)),',
    '}))',
  ].join('\n');

  const out = execFileSync('python', ['-c', script], { encoding: 'utf8', timeout: 8000 }).trim();
  const parsed = JSON.parse(out);

  assert.equal(parsed.spine, 'docs/house/SPINE.md');
  assert.equal(parsed.t5500, '192.168.0.15');
  assert.equal(parsed.alienware, '192.168.0.40');
  assert.equal(parsed.t5500_host, '192.168.0.15');
  assert.deepEqual(parsed.allowed_hosts, ['192.168.0.15', '192.168.0.40']);
  assert.ok(parsed.t5500_repos.includes('Trollz1004/ANTIGRAVITY'));
  assert.ok(parsed.aw_harnesses.includes('gemini'));
  assert.equal(parsed.mos_port, 3130);
  assert.equal(parsed.mos_bind_alias, '0.0.0.0');
  assert.equal(parsed.swarm_health, 'http://192.168.0.40:8000/api/health');
  assert.ok(parsed.local_only_count >= 3);
  assert.equal(parsed.t5500_by_node_alias, EXPECTED_T5500.length);
  assert.equal(parsed.mos_status, 'http://192.168.0.15:3130/api/v1/status');
  assert.equal(parsed.official_vote, 'http://192.168.0.15:9134/health');
  assert.equal(parsed.official_vote_bind, '0.0.0.0');

  for (const exp of ACTIVE_SERVICE_EXPECTATIONS) {
    assert.deepEqual(parsed.active[exp.id], {
      url: exp.url,
      bind: exp.bind,
      tokenEnv: exp.tokenEnv,
    });
  }
  for (const fb of FALLBACK_SERVICE_EXPECTATIONS) {
    assert.deepEqual(parsed.fallbacks[fb.id], {
      url: `http://192.168.0.15:${fb.port}`,
      bind: fb.bind,
      host: '192.168.0.15',
      port: fb.port,
      scope: fb.scope,
      tokenEnv: fb.tokenEnv,
    });
    assert.ok(!parsed.all_ids.includes(fb.id), `list_all_services must not include fallback ${fb.id}`);
  }
  assert.equal(parsed.all_ids.length, EXPECTED_ALIENWARE.length + EXPECTED_T5500.length);
  assert.equal(parsed.t5500_count, EXPECTED_T5500.length);
  assert.equal(parsed.alienware_count, EXPECTED_ALIENWARE.length);
  assert.equal(parsed.custom_odysseus, 'http://10.99.0.15:7011');
  assert.equal(parsed.custom_all_count, 0);
});

test('Get-FleetEndpoint.ps1 resolves active services, repo-auxiliary fallbacks with dynamic host, and canonical-only Get-FleetServices', () => {
  assert.ok(fs.existsSync(PS_SCRIPT), 'ops/fleet/Get-FleetEndpoint.ps1 must exist');

  const cliCheck = (args) =>
    execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, ...args], {
      encoding: 'utf8',
      timeout: 8000,
    }).trim();

  assert.equal(cliCheck(['-Service', 'domains-server', '-Path', '/health']), 'http://192.168.0.15:9160/health');
  assert.equal(cliCheck(['-Service', 'postgres', '-Field', 'Bind']), LOOPBACK_IP);
  assert.equal(cliCheck(['-Node', 'alienware', '-Field', 'Ip']), '192.168.0.40');
  assert.equal(cliCheck(['-Service', 'odysseus', '-Field', 'Url']), 'http://192.168.0.15:7011');
  assert.equal(cliCheck(['-Service', 'governance', '-Field', 'TokenEnv']), 'OFFICIAL_VOTE_TOKEN');
  assert.equal(cliCheck(['-Service', 'official-vote', '-Field', 'Url']), 'http://192.168.0.15:9134');
  assert.equal(cliCheck(['-Service', 'mission-mcp', '-Field', 'Bind']), '0.0.0.0');
  assert.equal(cliCheck(['-Service', 'onemin-shim', '-Field', 'Port']), '20130');

  // Dot-sourced full coverage across all active + fallback services + dynamic host derivation
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-ps-check-'));
  try {
    const customMapPath = path.join(tmpDir, 'custom-fleet-map.json');
    fs.writeFileSync(
      customMapPath,
      JSON.stringify({
        nodes: {
          t5500: { id: 't5500', ip: '10.99.0.15', host: '10.99.0.15' },
          alienware: { id: 'alienware', ip: '10.99.0.40', host: '10.99.0.40' },
        },
        services: [],
      }),
      'utf8',
    );

    const psCommand = [
      `$ErrorActionPreference = 'Stop'`,
      `. '${PS_SCRIPT.replace(/'/g, "''")}'`,
      `$activeIds = @(${ACTIVE_SERVICE_EXPECTATIONS.map((e) => `'${e.id}'`).join(',')})`,
      `$fallbackIds = @(${FALLBACK_SERVICE_EXPECTATIONS.map((e) => `'${e.id}'`).join(',')})`,
      `$activeOut = @{}`,
      `foreach ($sid in $activeIds) {`,
      `  $svc = Get-FleetService -ServiceId $sid`,
      `  $activeOut[$sid] = @{ url = (Get-FleetServiceUrl -ServiceId $sid); bind = (Get-FleetBindHost -ServiceId $sid); tokenEnv = $svc.tokenEnv }`,
      `}`,
      `$fbOut = @{}`,
      `foreach ($sid in $fallbackIds) {`,
      `  $svc = Get-FleetService -ServiceId $sid`,
      `  $fbOut[$sid] = @{ url = (Get-FleetServiceUrl -ServiceId $sid); bind = (Get-FleetBindHost -ServiceId $sid); host = $svc.host; port = [int]$svc.port; scope = $svc.scope; tokenEnv = $svc.tokenEnv }`,
      `}`,
      `$allSvcs = @(Get-FleetServices)`,
      `$res = @{`,
      `  active = $activeOut`,
      `  fallbacks = $fbOut`,
      `  allIds = @($allSvcs | ForEach-Object { $_.id })`,
      `  customOdysseus = (Get-FleetServiceUrl -ServiceId 'odysseus' -CustomMapPath '${customMapPath.replace(/'/g, "''")}')`,
      `  customCount = @(Get-FleetServices -CustomMapPath '${customMapPath.replace(/'/g, "''")}').Count`,
      `}`,
      `$res | ConvertTo-Json -Depth 6 -Compress`,
    ].join('\n');

    const psOut = execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand], {
      encoding: 'utf8',
      timeout: 12000,
    }).trim();
    const parsed = JSON.parse(psOut);

    for (const exp of ACTIVE_SERVICE_EXPECTATIONS) {
      assert.deepEqual(parsed.active[exp.id], {
        url: exp.url,
        bind: exp.bind,
        tokenEnv: exp.tokenEnv,
      });
    }
    for (const fb of FALLBACK_SERVICE_EXPECTATIONS) {
      assert.deepEqual(parsed.fallbacks[fb.id], {
        url: `http://192.168.0.15:${fb.port}`,
        bind: fb.bind,
        host: '192.168.0.15',
        port: fb.port,
        scope: fb.scope,
        tokenEnv: fb.tokenEnv,
      });
      assert.ok(!parsed.allIds.includes(fb.id), `Get-FleetServices must not include fallback ${fb.id}`);
    }
    assert.equal(parsed.allIds.length, EXPECTED_ALIENWARE.length + EXPECTED_T5500.length);
    assert.equal(parsed.customOdysseus, 'http://10.99.0.15:7011');
    assert.equal(parsed.customCount, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('dual-schema support: array-shaped and object-shaped services with "this machine only" and authTokenEnv parse cleanly across JS, Python, and PowerShell', async () => {
  const mod = await import('./fleet-map.mjs');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-array-schema-'));
  const arrayMapPath = path.join(tmpDir, 'fleet-map.json');
  const objectMapPath = path.join(tmpDir, 'fleet-map-object.json');

  const arrayMapFixture = {
    version: '1.0.0',
    nodes: {
      alienware: { id: 'alienware', name: 'Alienware', host: '192.168.0.40', ip: '192.168.0.40', role: 'workshop' },
      t5500: { id: 't5500', name: 'T5500', host: '192.168.0.15', ip: '192.168.0.15', role: 'front-of-house' },
    },
    services: [
      {
        id: 'mission-os',
        name: 'Mission OS',
        node: 't5500',
        host: '192.168.0.15',
        port: 3130,
        protocol: 'http',
        scope: 'lan-guarded',
        bind: '0.0.0.0',
        authTokenEnv: 'MISSION_OS_TOKEN',
      },
      {
        id: 'date-app-api',
        name: 'Date App API',
        node: 't5500',
        host: '192.168.0.15',
        port: 8000,
        protocol: 'http',
        scope: 'lan',
        bind: '0.0.0.0',
        authTokenEnv: '',
      },
      {
        id: 't5500-postgres',
        name: 'Postgres',
        node: 't5500',
        host: LOOPBACK_IP,
        port: 5432,
        protocol: 'tcp',
        scope: 'this machine only',
        bind: LOOPBACK_IP,
        authTokenEnv: 'POSTGRES_PASSWORD',
      },
      {
        id: 't5500-redis',
        name: 'Redis',
        node: 't5500',
        host: LOOPBACK_IP,
        port: 6379,
        protocol: 'tcp',
        scope: 'this machine only',
        bind: LOOPBACK_IP,
        authTokenEnv: '',
      },
      {
        id: 'hermes-leadgen',
        name: 'Lead-Gen Studio',
        node: 'alienware',
        host: '192.168.0.40',
        port: 8392,
        protocol: 'http',
        scope: 'lan-guarded',
        bind: '0.0.0.0',
        authTokenEnv: 'HERMES_LEADGEN_TOKEN',
      },
    ],
  };

  const objectMapFixture = {
    schema: 'antigravity.fleet-map.v1',
    nodes: arrayMapFixture.nodes,
    services: Object.fromEntries(arrayMapFixture.services.map((s) => [s.id, s])),
  };

  try {
    fs.writeFileSync(arrayMapPath, JSON.stringify(arrayMapFixture, null, 2), 'utf8');
    fs.writeFileSync(objectMapPath, JSON.stringify(objectMapFixture, null, 2), 'utf8');

    for (const [label, mapFilePath] of [
      ['array', arrayMapPath],
      ['object', objectMapPath],
    ]) {
      const loaded = mod.loadFleetMap(mapFilePath);

      assert.equal(
        mod.getServiceUrl('mission-os', '/api/v1/status', loaded),
        'http://192.168.0.15:3130/api/v1/status',
        `${label}: mission-os`,
      );
      assert.equal(mod.getService('mission-os', loaded).tokenEnv, 'MISSION_OS_TOKEN', `${label}: tokenEnv`);
      assert.equal(
        mod.getServiceUrl('dateapp-api', '/health', loaded),
        'http://192.168.0.15:8000/health',
        `${label}: dateapp-api`,
      );
      assert.equal(mod.getServiceUrl('leadgen-desk', '', loaded), 'http://192.168.0.40:8392', `${label}: leadgen-desk`);
      assert.equal(mod.getBindHost('postgres', '', loaded), LOOPBACK_IP, `${label}: pg bind`);
      assert.equal(mod.getBindHost('redis', '', loaded), LOOPBACK_IP, `${label}: redis bind`);
      assert.equal(mod.listServicesByNode('t5500', loaded).length, 4, `${label}: t5500 count`);
      assert.equal(mod.listServicesByNode('alienware', loaded).length, 1, `${label}: alienware count`);
    }

    const pyOut = execFileSync(
      'python',
      [
        '-c',
        [
          'import json, sys',
          `sys.path.insert(0, ${JSON.stringify(HERE)})`,
          'import fleet_map',
          `fmap = fleet_map.load_fleet_map(${JSON.stringify(arrayMapPath)})`,
          `omap = fleet_map.load_fleet_map(${JSON.stringify(objectMapPath)})`,
          'print(json.dumps({',
          '  "mos": fleet_map.get_service_url("mission-os", "/api/v1/status", fmap),',
          '  "mos_obj": fleet_map.get_service_url("mission-os", "/api/v1/status", omap),',
          '  "mos_tok": fleet_map.get_service("mission-os", fmap)["tokenEnv"],',
          '  "api": fleet_map.get_service_url("dateapp-api", "/health", fmap),',
          '  "pg_bind": fleet_map.get_bind_host("postgres", None, fmap),',
          '  "t5500_count": len(fleet_map.list_services_by_node("t5500", fmap)),',
          '}))',
        ].join('\n'),
      ],
      { encoding: 'utf8', timeout: 8000 },
    ).trim();
    assert.deepEqual(JSON.parse(pyOut), {
      mos: 'http://192.168.0.15:3130/api/v1/status',
      mos_obj: 'http://192.168.0.15:3130/api/v1/status',
      mos_tok: 'MISSION_OS_TOKEN',
      api: 'http://192.168.0.15:8000/health',
      pg_bind: LOOPBACK_IP,
      t5500_count: 4,
    });

    const psTok = execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        PS_SCRIPT,
        '-MapPath',
        arrayMapPath,
        '-Service',
        'mission-os',
        '-Field',
        'TokenEnv',
      ],
      { encoding: 'utf8', timeout: 8000 },
    ).trim();
    assert.equal(psTok, 'MISSION_OS_TOKEN');

    const psObjTok = execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        PS_SCRIPT,
        '-MapPath',
        objectMapPath,
        '-Service',
        'mission-os',
        '-Field',
        'TokenEnv',
      ],
      { encoding: 'utf8', timeout: 8000 },
    ).trim();
    assert.equal(psObjTok, 'MISSION_OS_TOKEN');

    const psPgBind = execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        PS_SCRIPT,
        '-MapPath',
        arrayMapPath,
        '-Service',
        'postgres',
        '-Field',
        'Bind',
      ],
      { encoding: 'utf8', timeout: 8000 },
    ).trim();
    assert.equal(psPgBind, LOOPBACK_IP);

    const fwOut = execFileSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', FW_SCRIPT, '-MapPath', arrayMapPath],
      { encoding: 'utf8', timeout: 8000 },
    );
    assert.match(fwOut, /Skipped local-only services.*t5500-postgres.*t5500-redis/);
    assert.match(fwOut, /token=MISSION_OS_TOKEN/);
    assert.doesNotMatch(fwOut, /-LocalPort 5432/);
    assert.doesNotMatch(fwOut, /-LocalPort 6379/);

    const cfgFixturePath = path.join(tmpDir, 'cloudflared.yml');
    const legacyLoopbackTarget = ['http://', LOOPBACK_IP, ':3130'].join('');
    fs.writeFileSync(
      cfgFixturePath,
      [
        'ingress:',
        '  - hostname: mos.aidoesitall.website',
        `    service: ${legacyLoopbackTarget}`,
        '  - hostname: pg.internal',
        `    service: tcp://${LOOPBACK_IP}:5432`,
        '  - service: http_status:404',
        '',
      ].join('\n'),
      'utf8',
    );
    const tunnelOut = execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        TUNNEL_SCRIPT,
        '-ConfigPath',
        cfgFixturePath,
        '-MapPath',
        arrayMapPath,
        '-SkipProbe',
      ],
      { encoding: 'utf8', timeout: 8000 },
    );
    assert.match(tunnelOut, /\+\s*service: http:\/\/192\.168\.0\.15:3130/);
    assert.doesNotMatch(tunnelOut, /192\.168\.0\.15:5432/);

    const guardianDir = path.join(tmpDir, 'ops', 'fleet');
    fs.mkdirSync(guardianDir, { recursive: true });
    fs.copyFileSync(arrayMapPath, path.join(guardianDir, 'fleet-map.json'));
    const guardianOut = execFileSync(
      'python',
      [
        '-c',
        [
          'import importlib.util, json, pathlib',
          `spec = importlib.util.spec_from_file_location("opus_guardian", ${JSON.stringify(GUARDIAN_PY)})`,
          'mod = importlib.util.module_from_spec(spec)',
          'spec.loader.exec_module(mod)',
          `mod.ROOT = pathlib.Path(${JSON.stringify(tmpDir)})`,
          'res = mod.GuardianResult()',
          'mod.check_fleet_address_doctrine(res)',
          'print(json.dumps({"passed": len(res.passed), "failures": res.failures}))',
        ].join('\n'),
      ],
      { encoding: 'utf8', timeout: 8000 },
    ).trim();
    assert.deepEqual(JSON.parse(guardianOut), { passed: 1, failures: [] });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
