// Dispatcher — routes tasks to the right platform on the right node.
// Every AI sends to ONE location (T5500 :3130). This module decides where it goes.

const NODE_MAP = {
  t5500: { ip: 'localhost', name: 'T5500', role: 'Gateway + Agent Hub + all orchestration' },
  sabretooth: { ip: '192.168.0.8', name: 'Sabretooth', role: 'DREAM ONLINE ONLY — GPU 1070 8GB for game, cloud AI for events' },
  '9020': { ip: '192.168.0.5', name: '9020', role: 'Joshua workspace + browser-auth platforms' }
};

// Platform → which node runs it, how it's accessed, auth model
const PLATFORM_ROUTING = {
  // === T5500 — GATEWAY (all orchestration lives here) ===
  hermes: {
    node: 't5500',
    access: 'local-service',
    endpoint: 'http://localhost:11435',
    auth: 'none (localhost)'
  },
  'fcc-claude': {
    node: 't5500',
    access: 'fcc-proxy',
    endpoint: 'http://localhost:8082',
    auth: 'none (FCC proxy)'
  },
  opencode: {
    node: 't5500',
    access: 'local-service',
    endpoint: 'http://localhost:11435',
    auth: 'none (NVIDIA free tier via Hermes)'
  },
  github: {
    node: 't5500',
    access: 'api',
    endpoint: 'https://api.github.com',
    auth: 'token (GITHUB_TOKEN)'
  },
  slack: {
    node: 't5500',
    access: 'api',
    endpoint: 'https://slack.com/api',
    auth: 'bot token (SLACK_BOT_TOKEN)'
  },
  clawx: {
    node: 't5500',
    access: 'local-service',
    endpoint: 'ws://localhost:3110',
    auth: 'gateway token (openclaw)'
  },
  pi: {
    node: 't5500',
    access: 'local-service',
    endpoint: 'http://localhost:11435',
    auth: 'none (via Hermes router)'
  },
  cloud: {
    node: 't5500',
    access: 'openrouter',
    endpoint: 'http://localhost:11435',
    auth: 'openrouter key (via Hermes)'
  },
  ollama: {
    node: 't5500',
    access: 'local-service',
    endpoint: 'http://localhost:11434',
    auth: 'none (localhost — light models only, NOT for DREAM)'
  },

  // === SABRETOOTH — DREAM ONLINE ONLY (GPU reserved for game) ===
  '1minai': {
    node: 'sabretooth',
    access: 'cloud-api',
    endpoint: 'https://api.1min.ai',
    auth: 'cloud subscription (fast inference for DREAM events)'
  },

  // === 9020 — JOSHUA WORKSPACE (browser sign-in platforms) ===
  claude: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (Claude Max subscription — cloud)'
  },
  codex: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (OpenAI desktop)'
  },
  openai: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (OpenAI)'
  },
  grok: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (xAI desktop)'
  },
  gemini: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (Google desktop)'
  },
  chatgpt: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (OpenAI ChatGPT)'
  },
  perplexity: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (Perplexity Pro)'
  },
  cursor: {
    node: '9020',
    access: 'desktop-app',
    endpoint: null,
    auth: 'desktop app (IDE)'
  },
  desktop: {
    node: '9020',
    access: 'desktop-app',
    endpoint: null,
    auth: 'manual (any GUI desktop tool)'
  },
  commander: {
    node: '9020',
    access: 'local-service',
    endpoint: null,
    auth: 'none (Windows Terminal tasks)'
  }
};

// Fallback: T5500 is primary for everything except DREAM and browser-auth
const FALLBACK_ROUTING = {
  hermes: { fallback_node: '9020', fallback_endpoint: 'http://192.168.0.5:11436' },
  'fcc-claude': { fallback_node: '9020', fallback_endpoint: 'http://192.168.0.5:8082' },
  opencode: { fallback_node: '9020', fallback_endpoint: 'http://192.168.0.5:11436' }
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

function canAutoDispatch(platform) {
  const route = PLATFORM_ROUTING[platform];
  if (!route) return false;
  return ['local-service', 'fcc-proxy', 'api', 'openrouter', 'cloud-api'].includes(route.access);
}

module.exports = { getRouting, getNodeForPlatform, getAllRoutes, canAutoDispatch, PLATFORM_ROUTING, NODE_MAP };
