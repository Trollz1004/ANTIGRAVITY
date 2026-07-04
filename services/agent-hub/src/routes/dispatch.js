const { Router } = require('express');
const { getAllRoutes, getRouting, canAutoDispatch, NODE_MAP } = require('../integrations/dispatcher');

const router = Router();

// GET /api/dispatch/routes — show all platform routing
router.get('/routes', (req, res) => {
  res.json({
    gateway: 'T5500 :3130',
    description: 'All AI sends work here. Hub dispatches to the right platform/node.',
    routes: getAllRoutes(),
    nodes: NODE_MAP
  });
});

// GET /api/dispatch/route/:platform — routing info for a specific platform
router.get('/route/:platform', (req, res) => {
  const route = getRouting(req.params.platform);
  if (!route) return res.status(404).json({ error: `Unknown platform: ${req.params.platform}` });
  res.json({
    platform: req.params.platform,
    ...route,
    auto_dispatch: canAutoDispatch(req.params.platform)
  });
});

// POST /api/dispatch/health — check which platforms are reachable
router.post('/health', async (req, res) => {
  const http = require('http');
  const routes = getAllRoutes().filter(r => r.endpoint);
  const results = [];

  for (const route of routes) {
    if (!route.endpoint || route.access === 'browser-signin' || route.access === 'desktop-app') {
      results.push({ platform: route.platform, status: 'manual', note: route.auth });
      continue;
    }

    try {
      const up = await new Promise((resolve) => {
        const url = new URL(route.endpoint);
        const req = http.get({ hostname: url.hostname, port: url.port, path: '/health', timeout: 3000 }, (res) => {
          resolve(res.statusCode < 500);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
      });
      results.push({ platform: route.platform, node: route.node, status: up ? 'up' : 'down', endpoint: route.endpoint });
    } catch {
      results.push({ platform: route.platform, node: route.node, status: 'error', endpoint: route.endpoint });
    }
  }

  res.json({ checked_at: new Date().toISOString(), results });
});

module.exports = router;
