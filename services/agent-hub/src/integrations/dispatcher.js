// Dispatcher — routes tasks to the right platform on the right node.
// Every AI sends to ONE location (T5500 :3130). This module decides where it goes.

const NODE_MAP = {
  sabretooth: { ip: '192.168.0.8', name: 'Sabretooth', role: 'GPU + Dream + services' },
  '9020': { ip: '192.168.0.5', name: '9020', role: 'Business + Joshua workspace' },
  t5500: { ip: 'localhost', name: 'T5500', role: 'Gateway + Agent Hub host' }
};

// Platform → which node runs it, how it's accessed, auth model
const PLATFORM_ROUTING = {
  hermes: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://192.168.0.8:11435',
    auth: 'none (localhost)'
  },
  'fcc-claude': {
    node: 'sabretooth',
    access: 'fcc-proxy',
    endpoint: 'http://192.168.0.8:8082',
    auth: 'none (FCC proxy)'
  },
  claude: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (claude.ai desktop)'
  },
  codex: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (OpenAI desktop)'
  },
  opencode: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://192.168.0.8:11435',
    auth: 'none (NVIDIA free tier via Hermes)'
  },
  openai: {
    node: '9020',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (OpenAI)'
  },
  ollama: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://192.168.0.8:11434',
    auth: 'none (localhost GPU)'
  },
  cloud: {
    node: 'sabretooth',
    access: 'openrouter',
    endpoint: 'http://192.168.0.8:11435',
    auth: 'openrouter key (via Hermes)'
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
  github: {
    node: 't5500',
    access: 'api',
    endpoint: 'https://api.github.com',
    auth: 'token (GITHUB_TOKEN)'
  },
  '1minai': {
    node: 'sabretooth',
    access: 'desktop-app',
    endpoint: null,
    auth: 'desktop app (Sabretooth only)'
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
  clawx: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'ws://192.168.0.8:3110',
    auth: 'gateway token (openclaw)'
  },
  pi: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://192.168.0.8:11435',
    auth: 'none (via Hermes router)'
  },
  slack: {
    node: 't5500',
    access: 'api',
    endpoint: 'https://slack.com/api',
    auth: 'bot token (SLACK_BOT_TOKEN)'
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

// Fallback routing when primary node is down
const FALLBACK_ROUTING = {
  hermes: { fallback_node: '9020', fallback_endpoint: 'http://192.168.0.5:11436' },
  ollama: { fallback_node: '9020', fallback_endpoint: 'http://192.168.0.5:11434' },
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
  return ['local-service', 'fcc-proxy', 'api', 'openrouter'].includes(route.access);
}

module.exports = { getRouting, getNodeForPlatform, getAllRoutes, canAutoDispatch, PLATFORM_ROUTING, NODE_MAP };
