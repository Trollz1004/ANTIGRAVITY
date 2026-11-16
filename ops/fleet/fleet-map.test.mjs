import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAP_PATH = path.join(HERE, 'fleet-map.json');
const PS_SCRIPT = path.join(HERE, 'Get-FleetEndpoint.ps1');
const PY_MODULE = path.join(HERE, 'fleet_map.py');

const EXPECTED_T5500 = [
  ['ssh', 22, 'lan', null, '0.0.0.0'],
  ['mission-os', 3130, 'lan-guarded', 'MISSION_OS_TOKEN', '0.0.0.0'],
  ['dateapp-frontend', 3200, 'lan', null, '0.0.0.0'],
  ['postgres', 5432, 'local-only', null, '127.0.0.1'],
  ['redis', 6379, 'local-only', null, '127.0.0.1'],
  ['odysseus', 7011, 'lan-guarded', 'MISSION_OS_TOKEN', '0.0.0.0'],
  ['dateapp-api', 8000, 'lan', null, '0.0.0.0'],
  ['hermes-gateway', 8643, 'lan-guarded', 'MISSION_OS_TOKEN', '0.0.0.0'],
  ['hermes-dashboard', 9119, 'lan-guarded', 'MISSION_OS_TOKEN', '0.0.0.0'],
  ['domains-server', 9160, 'lan', null, '0.0.0.0'],
  ['ollama-t5500', 11434, 'lan-guarded', 'OLLAMA_GUARD_TOKEN', '0.0.0.0'],
  ['omniroute', 20128, 'lan-guarded', 'OMNIROUTE_API_KEY', '0.0.0.0'],
  ['obsidian-t5500', 27123, 'lan-guarded', 'OBSIDIAN_REST_API_KEY', '0.0.0.0'],
  ['ai-memory', 49374, 'lan-guarded', 'AI_MEMORY_TOKEN', '0.0.0.0'],
];

const EXPECTED_ALIENWARE = [
  ['ssh-alienware', 22, 'lan', null, '0.0.0.0'],
  ['preview-4315', 4315, 'lan', null, '0.0.0.0'],
  ['swarm-command', 8000, 'lan-guarded', 'SWARM_COMMAND_TOKEN', '0.0.0.0'],
  ['free-claude-code', 8082, 'lan-guarded', 'FCC_GUARD_TOKEN', '0.0.0.0'],
  ['opsis-studio', 8390, 'lan', null, '0.0.0.0'],
  ['leadgen-desk', 8392, 'lan', null, '0.0.0.0'],
  ['panda-router', 8765, 'lan-guarded', 'PANDA_ROUTER_TOKEN', '0.0.0.0'],
  ['npc-lab', 9127, 'lan', null, '0.0.0.0'],
  ['dreamops-bridge', 9133, 'lan', null, '0.0.0.0'],
  ['dream-engine', 9180, 'lan', null, '0.0.0.0'],
  ['ollama-alienware', 11434, 'lan-guarded', 'OLLAMA_GUARD_TOKEN', '0.0.0.0'],
  ['vite-hmr', 24678, 'lan', null, '0.0.0.0'],
  ['obsidian-alienware', 27123, 'lan-guarded', 'OBSIDIAN_REST_API_KEY', '0.0.0.0'],
];

test('fleet-map.json defines ONLY t5500 and alienware with exact services, binds, and token guards', () => {
  assert.ok(fs.existsSync(MAP_PATH), 'ops/fleet/fleet-map.json must exist');
  const raw = fs.readFileSync(MAP_PATH, 'utf8');
  assert.doesNotMatch(raw, /sabretooth/i, 'fleet-map.json must never mention retired third node');
  assert.ok(!raw.includes(['192', '168', '0', '8'].join('.')), 'fleet-map.json must never contain retired .8 IP');

  const data = JSON.parse(raw);
  assert.deepEqual(Object.keys(data.nodes).sort(), ['alienware', 't5500']);
  assert.equal(data.nodes.t5500.ip, '192.168.0.15');
  assert.equal(data.nodes.alienware.ip, '192.168.0.40');

  for (const [id, port, scope, tokenEnv, bind] of EXPECTED_T5500) {
    const svc = data.services[id];
    assert.ok(svc, `Missing t5500 service ${id}`);
    assert.equal(svc.node, 't5500');
    assert.equal(svc.port, port);
    assert.equal(svc.scope, scope);
    assert.equal(svc.tokenEnv, tokenEnv);
    assert.equal(svc.bind, bind);
    assert.equal(svc.host, scope === 'local-only' ? '127.0.0.1' : '192.168.0.15');
  }

  for (const [id, port, scope, tokenEnv, bind] of EXPECTED_ALIENWARE) {
    const svc = data.services[id];
    assert.ok(svc, `Missing alienware service ${id}`);
    assert.equal(svc.node, 'alienware');
    assert.equal(svc.port, port);
    assert.equal(svc.scope, scope);
    assert.equal(svc.tokenEnv, tokenEnv);
    assert.equal(svc.bind, bind);
    assert.equal(svc.host, '192.168.0.40');
  }

  assert.equal(Object.keys(data.services).length, EXPECTED_T5500.length + EXPECTED_ALIENWARE.length);
});

test('fleet-map.mjs resolves nodes, service URLs, and bind hosts', async () => {
  const mod = await import('./fleet-map.mjs');
  assert.equal(mod.getNodeIp('t5500'), '192.168.0.15');
  assert.equal(mod.getNodeIp('alienware'), '192.168.0.40');
  assert.equal(mod.getServiceUrl('mission-os'), 'http://192.168.0.15:3130');
  assert.equal(mod.getServiceUrl('mission-os', '/api/v1/status'), 'http://192.168.0.15:3130/api/v1/status');
  assert.equal(mod.getServiceUrl('domains-server', '/health'), 'http://192.168.0.15:9160/health');
  assert.equal(mod.getServiceUrl('swarm-command', '/health'), 'http://192.168.0.40:8000/health');
  assert.equal(mod.getBindHost('mission-os'), '0.0.0.0');
  assert.equal(mod.getBindHost('postgres'), '127.0.0.1');
  assert.equal(mod.getBindHost('redis'), '127.0.0.1');
  assert.equal(mod.listServicesByNode('t5500').length, EXPECTED_T5500.length);
  assert.equal(mod.listServicesByNode('alienware').length, EXPECTED_ALIENWARE.length);
});

test('fleet_map.py resolves nodes, service URLs, and bind hosts identically', () => {
  assert.ok(fs.existsSync(PY_MODULE), 'ops/fleet/fleet_map.py must exist');
  const out = execFileSync(
    'python',
    [
      '-c',
      [
        'import json, sys',
        `sys.path.insert(0, ${JSON.stringify(HERE)})`,
        'import fleet_map',
        'print(json.dumps({',
        '  "t5500": fleet_map.get_node_ip("t5500"),',
        '  "alienware": fleet_map.get_node_ip("alienware"),',
        '  "mos": fleet_map.get_service_url("mission-os", "/api/v1/status"),',
        '  "pg_bind": fleet_map.get_bind_host("postgres"),',
        '  "mos_bind": fleet_map.get_bind_host("mission-os"),',
        '}))',
      ].join('\n'),
    ],
    { encoding: 'utf8', timeout: 8000 }
  ).trim();
  const parsed = JSON.parse(out);
  assert.deepEqual(parsed, {
    t5500: '192.168.0.15',
    alienware: '192.168.0.40',
    mos: 'http://192.168.0.15:3130/api/v1/status',
    pg_bind: '127.0.0.1',
    mos_bind: '0.0.0.0',
  });
});

test('Get-FleetEndpoint.ps1 resolves service URLs, node IPs, and bind hosts via PowerShell', () => {
  assert.ok(fs.existsSync(PS_SCRIPT), 'ops/fleet/Get-FleetEndpoint.ps1 must exist');
  const url = execFileSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, '-Service', 'domains-server', '-Path', '/health'],
    { encoding: 'utf8', timeout: 8000 }
  ).trim();
  assert.equal(url, 'http://192.168.0.15:9160/health');

  const pgBind = execFileSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, '-Service', 'postgres', '-Field', 'Bind'],
    { encoding: 'utf8', timeout: 8000 }
  ).trim();
  assert.equal(pgBind, '127.0.0.1');

  const awIp = execFileSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, '-Node', 'alienware', '-Field', 'Ip'],
    { encoding: 'utf8', timeout: 8000 }
  ).trim();
  assert.equal(awIp, '192.168.0.40');
});
