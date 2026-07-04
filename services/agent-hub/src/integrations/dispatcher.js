// Dispatcher — routes tasks to the right platform on the right node.
// Every AI sends to ONE location (T5500 :3130). This module decides where it goes.

const NODE_MAP = {
  sabretooth: { ip: '192.168.0.8', name: 'Sabretooth' },
  '9020': { ip: '192.168.0.5', name: '9020' },
  t5500: { ip: 'localhost', name: 'T5500' }
};

// Platform → which node runs it, and how it's accessed
const PLATFORM_ROUTING = {
  hermes: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://192.168.0.8:11435',
    auth: 'none'
  },
  claude: {
    node: 'sabretooth',
    access: 'fcc-proxy',
    endpoint: 'http://192.168.0.8:8082',
    auth: 'none'
  },
  codex: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (OpenAI)'
  },
  ollama: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://192.168.0.8:11434',
    auth: 'none'
  },
  github: {
    node: 't5500',
    access: 'api',
    endpoint: 'https://api.github.com',
    auth: 'token (GITHUB_TOKEN)'
  },
  chatgpt: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (OpenAI)'
  },
  gemini: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (Google)'
  },
  grok: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (xAI)'
  },
  cloud: {
    node: 'sabretooth',
    access: 'openrouter',
    endpoint: 'http://192.168.0.8:11435',
    auth: 'openrouter-key'
  },
  '1minai': {
    node: 'sabretooth',
    access: 'desktop-app',
    endpoint: null,
    auth: 'browser (1min.ai app — Sabretooth only)'
  }
};

// Priority routing: if primary node is down, try fallback
const FALLBACK_ROUTING = {
  hermes: { fallback_node: '9020', fallback_endpoint: 'http://192.168.0.5:11436' },
  ollama: { fallback_node: '9020', fallback_endpoint: 'http://192.168.0.5:11434' },
  claude: { fallback_node: '9020', fallback_endpoint: 'http://192.168.0.5:8082' }
};

function getRouting(platform) {
  return PLATFORM_ROUTING[platform] || null;
}

function getNodeForPlatform(platform) {
  const route = PLATFORM_ROUTING[platform];
  return route ? route.node : null;
}

function getAllRoutes() {
  return Object.entries(PLATFORM_ROUTING).map(([platform, config]) => ({
    platform,
    ...config,
    fallback: FALLBACK_ROUTING[platform] || null
  }));
}

// Determine if a task can be auto-dispatched (local services) or needs manual pickup (browser-auth)
function canAutoDispatch(platform) {
  const route = PLATFORM_ROUTING[platform];
  if (!route) return false;
  return ['local-service', 'fcc-proxy', 'api', 'openrouter'].includes(route.access);
}

module.exports = { getRouting, getNodeForPlatform, getAllRoutes, canAutoDispatch, PLATFORM_ROUTING, NODE_MAP };
