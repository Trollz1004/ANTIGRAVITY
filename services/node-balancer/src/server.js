'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const repoRoot = path.resolve(process.env.REPO_ROOT || path.join(__dirname, '..', '..', '..'));
const configPath = process.env.NODE_POOL_CONFIG || path.join(repoRoot, 'ops', 'mission-control', 'node-pool.json');
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4180);
const cursors = new Map();

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  res.end(JSON.stringify(payload, null, 2));
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function routableTargets(rule) {
  return (rule.targets || []).filter((target) => /^https?:\/\//i.test(target));
}

function matchRule(req, config) {
  const hostname = String(req.headers.host || '').split(':')[0].toLowerCase();
  const pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  const rules = config.loadBalancer?.rules || [];
  return rules.find((rule) => (rule.hostnames || []).map((h) => h.toLowerCase()).includes(hostname))
    || rules.find((rule) => pathname === `/${rule.id}` || pathname.startsWith(`/${rule.id}/`))
    || null;
}

function chooseTarget(rule) {
  const targets = routableTargets(rule);
  if (!targets.length) return null;
  const index = cursors.get(rule.id) || 0;
  cursors.set(rule.id, (index + 1) % targets.length);
  return targets[index % targets.length];
}

function proxy(req, res, target) {
  const upstream = new URL(target);
  const options = {
    hostname: upstream.hostname,
    port: upstream.port || (upstream.protocol === 'https:' ? 443 : 80),
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: upstream.host,
      'x-forwarded-host': req.headers.host || '',
      'x-forwarded-proto': 'http'
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (error) => sendJson(res, 502, { ok: false, error: error.message, target }));
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  try {
    const config = loadConfig();
    if (req.method === 'GET' && (req.url === '/health' || req.url === '/api/health')) {
      return sendJson(res, 200, { ok: true, service: 'node-balancer', configPath, routes: config.loadBalancer?.rules?.length || 0 });
    }
    if (req.method === 'GET' && req.url === '/routes') {
      return sendJson(res, 200, { ok: true, loadBalancer: config.loadBalancer });
    }
    const rule = matchRule(req, config);
    if (!rule) return sendJson(res, 404, { ok: false, error: 'no_matching_route' });
    const target = chooseTarget(rule);
    if (!target) return sendJson(res, 503, { ok: false, error: 'no_routable_targets', route: rule.id });
    return proxy(req, res, target);
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`Node balancer listening on http://${host}:${port}`);
});
