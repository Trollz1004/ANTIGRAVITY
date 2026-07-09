// Dispatcher - routes tasks to the right platform/node.
// Sabretooth owns Agent Hub authority. T5500 is front-door/workbench.
// Worker nodes return evidence/drafts and do not make doctrine/payment/launch decisions.

const { PLATFORMS } = require('../platforms');

const NODE_MAP = {
  sabretooth: {
    ip: '192.168.0.8',
    name: 'Sabretooth',
    role: 'Mission Control + Agent Hub authority + repo/dev workstation'
  },
  t5500: {
    ip: '192.168.0.15',
    name: 'T5500',
    role: 'Cloudflared/front-door + Hermes workbench + support gateway + OmniRouter'
  },
  '9020': {
    ip: '192.168.0.5',
    name: '9020',
    role: 'Marketing/support worker only'
  },
  'worker-web-1': {
    ip: process.env.WORKER_WEB_1_HOST || 'pending',
    name: 'worker-web-1',
    role: 'Stateless web/API replica worker'
  },
  'worker-ai-1': {
    ip: process.env.WORKER_AI_1_HOST || 'pending',
    name: 'worker-ai-1',
    role: 'AI adapter worker for OmniRouter/FCC/OpenCode/Ollama/OpenClaw'
  }
};

const urls = {
  agentHub: process.env.AGENT_HUB_URL || 'http://192.168.0.8:3130',
  hermesDashboard: process.env.HERMES_DASHBOARD_URL || 'http://192.168.0.15:9119',
  hermesWorkspace: process.env.HERMES_WORKSPACE_URL || 'http://192.168.0.15:3010',
  hermesSupport: process.env.HERMES_SUPPORT_GATEWAY_URL || 'http://192.168.0.15:9110',
  omniRouter: process.env.OMNI_ROUTER_URL || 'http://192.168.0.15:11436',
  fcc: process.env.FCC_SERVER_URL || 'http://192.168.0.15:8082',
  ollama: process.env.OLLAMA_BASE_URL || 'http://192.168.0.15:11434'
};

const PLATFORM_ROUTING = {
  hermes: {
    node: 't5500',
    access: 'local-service',
    endpoint: urls.hermesDashboard,
    auth: 'none or local dashboard session'
  },
  'fcc-claude': {
    node: 't5500',
    access: 'fcc-proxy',
    endpoint: urls.fcc,
    auth: 'none (FCC proxy) or local admin config'
  },
  claude: {
    node: 'external',
    access: 'cloud-subscription',
    endpoint: null,
    auth: 'Official Claude app/sign-in'
  },
  opencode: {
    node: 'worker-ai-1',
    access: 'omni-router',
    endpoint: urls.omniRouter,
    auth: 'routed through OmniRouter/provider env'
  },
  ollama: {
    node: 'worker-ai-1',
    access: 'local-service',
    endpoint: urls.ollama,
    auth: 'none on private LAN'
  },
  cloud: {
    node: 't5500',
    access: 'omni-router',
    endpoint: urls.omniRouter,
    auth: 'provider keys via node env only'
  },
  'omni-router': {
    node: 't5500',
    access: 'local-service',
    endpoint: urls.omniRouter,
    auth: 'provider keys via node env only'
  },
  '1minai': {
    node: 'external',
    access: 'desktop-app',
    endpoint: null,
    auth: 'desktop app/cloud subscription'
  },
  clawx: {
    node: 'worker-ai-1',
    access: 'desktop-app',
    endpoint: null,
    auth: 'OpenClaw/ClawX local app; task card only'
  },
  pi: {
    node: 'worker-ai-1',
    access: 'omni-router',
    endpoint: urls.omniRouter,
    auth: 'Pi provider/model format through configured adapter'
  },
  github: {
    node: 'external',
    access: 'api',
    endpoint: 'https://api.github.com',
    auth: 'token (GITHUB_TOKEN)'
  },
  slack: {
    node: 'external',
    access: 'api',
    endpoint: 'https://slack.com/api',
    auth: 'bot token; no posting without approval'
  },
  codex: {
    node: 'sabretooth',
    access: 'browser-signin',
    endpoint: null,
    auth: 'Official Codex/OpenAI desktop session'
  },
  openai: {
    node: 'external',
    access: 'api-or-browser',
    endpoint: urls.omniRouter,
    auth: 'OpenAI API key via OmniRouter env or official app sign-in'
  },
  grok: {
    node: 'external',
    access: 'browser-signin-or-api',
    endpoint: urls.omniRouter,
    auth: 'xAI/Grok key via OmniRouter env or official app sign-in'
  },
  gemini: {
    node: 'external',
    access: 'browser-signin-or-api',
    endpoint: urls.omniRouter,
    auth: 'Gemini key via OmniRouter env or official app sign-in'
  },
  chatgpt: {
    node: 'external',
    access: 'browser-signin',
    endpoint: null,
    auth: 'Official ChatGPT app/web'
  },
  perplexity: {
    node: 'external',
    access: 'browser-signin',
    endpoint: null,
    auth: 'Perplexity account'
  },
  cursor: {
    node: 'sabretooth',
    access: 'desktop-app',
    endpoint: null,
    auth: 'IDE app'
  },
  desktop: {
    node: 'sabretooth',
    access: 'desktop-app',
    endpoint: null,
    auth: 'manual GUI desktop tool'
  },
  commander: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: null,
    auth: 'manual Windows Terminal tasks'
  },
  odysseus: {
    node: 'sabretooth',
    access: 'local-service',
    endpoint: 'http://127.0.0.1:7000',
    auth: 'admin login (local only)'
  }
};

const FALLBACK_ROUTING = {
  codex: ['omni-router', 'opencode', 'fcc-claude'],
  claude: ['fcc-claude', 'omni-router'],
  cloud: ['omni-router', 'ollama'],
  grok: ['omni-router'],
  openai: ['omni-router']
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
  return ['local-service', 'fcc-proxy', 'api', 'openrouter', 'cloud-api', 'omni-router', 'api-or-browser', 'browser-signin-or-api'].includes(route.access);
}

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
