// Dispatcher — routes tasks to the right platform.
// ALL platforms run on Sabretooth :3130. T5500 = gateway only. 9020 = inactive.

const { PLATFORMS } = require('../platforms');

const NODE_MAP = {
  sabretooth: { ip: '192.168.0.8', name: 'Sabretooth', role: 'Agent Hub + DREAM + all services' },
  t5500: { ip: 'localhost', name: 'T5500', role: 'Gateway only — Cloudflare tunnels' },
  '9020': { ip: '192.168.0.5', name: '9020', role: 'Inactive' }
};

const PLATFORM_ROUTING = {
  // === ALL on Sabretooth ===
  hermes: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://localhost:11435',
    auth: 'none (localhost)'
  },
  'fcc-claude': {
    node: 'sabretooth',
    access: 'fcc-proxy',
    endpoint: 'http://localhost:8082',
    auth: 'none (FCC proxy)'
  },
  claude: {
    node: 'sabretooth',
    access: 'cloud-subscription',
    endpoint: null,
    auth: 'Claude Max subscription — Sup@ user guide sphere in DREAM'
  },
  opencode: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://localhost:11435',
    auth: 'none (NVIDIA free tier via Hermes)'
  },
  ollama: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://localhost:11434',
    auth: 'none (localhost)'
  },
  cloud: {
    node: 'sabretooth',
    access: 'openrouter',
    endpoint: 'http://localhost:11435',
    auth: 'openrouter key (via Hermes)'
  },
  '1minai': {
    node: 'sabretooth',
    access: 'desktop-app',
    endpoint: null,
    auth: 'desktop app — cloud AI for DREAM NPCs'
  },
  clawx: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'ws://localhost:3110',
    auth: 'gateway token (openclaw)'
  },
  pi: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://localhost:11435',
    auth: 'none (via Hermes router)'
  },
  github: {
    node: 'sabretooth',
    access: 'api',
    endpoint: 'https://api.github.com',
    auth: 'token (GITHUB_TOKEN)'
  },
  slack: {
    node: 'sabretooth',
    access: 'api',
    endpoint: 'https://slack.com/api',
    auth: 'bot token (SLACK_BOT_TOKEN)'
  },
  codex: {
    node: 'sabretooth',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (OpenAI desktop)'
  },
  openai: {
    node: 'sabretooth',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (OpenAI)'
  },
  grok: {
    node: 'sabretooth',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (xAI desktop)'
  },
  gemini: {
    node: 'sabretooth',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (Google desktop)'
  },
  chatgpt: {
    node: 'sabretooth',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (OpenAI ChatGPT)'
  },
  perplexity: {
    node: 'sabretooth',
    access: 'browser-signin',
    endpoint: null,
    auth: 'browser (Perplexity Pro)'
  },
  cursor: {
    node: 'sabretooth',
    access: 'desktop-app',
    endpoint: null,
    auth: 'desktop app (IDE)'
  },
  desktop: {
    node: 'sabretooth',
    access: 'desktop-app',
    endpoint: null,
    auth: 'manual (any GUI desktop tool)'
  },
  commander: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: null,
    auth: 'none (Windows Terminal tasks)'
  },
  odysseus: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://127.0.0.1:7000',
    auth: 'admin login (local only)'
  }
};

const FALLBACK_ROUTING = {};

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

// Validates that every entry in the single source-of-truth PLATFORMS list
// (src/platforms.js) has a matching PLATFORM_ROUTING entry here, and vice
// versa. Mismatches are logged as warnings — this must never crash startup.
function validatePlatformRouting() {
  const routingKeys = Object.keys(PLATFORM_ROUTING);
  const missingRouting = PLATFORMS.filter((p) => !routingKeys.includes(p));
  const missingPlatform = routingKeys.filter((p) => !PLATFORMS.includes(p));

  if (missingRouting.length) {
    console.warn(
      `[agent-hub] WARNING: platform(s) missing from PLATFORM_ROUTING: ${missingRouting.join(', ')}`
    );
  }
  if (missingPlatform.length) {
    console.warn(
      `[agent-hub] WARNING: PLATFORM_ROUTING entry(ies) not in PLATFORMS: ${missingPlatform.join(', ')}`
    );
  }

  return { missingRouting, missingPlatform };
}

module.exports = {
  getRouting,
  getNodeForPlatform,
  getAllRoutes,
  canAutoDispatch,
  validatePlatformRouting,
  PLATFORM_ROUTING,
  NODE_MAP
};
