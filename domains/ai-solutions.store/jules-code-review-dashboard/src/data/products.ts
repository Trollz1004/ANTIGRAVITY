import { PricingTier, ProductItem, ProviderOption } from '../types';

export const PROVIDERS: ProviderOption[] = [
  {
    id: 'claude',
    name: 'Claude',
    model: 'Claude 3.7 Sonnet / Opus',
    badge: 'Anthropic',
    requiresKey: true,
    color: '#d97706',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    model: 'Gemini 2.5 Pro / Flash',
    badge: 'Google AI Studio',
    requiresKey: true,
    color: '#00d4ff',
  },
  {
    id: 'gpt',
    name: 'GPT-5.4',
    model: 'GPT-5.4 Omni & Thinking',
    badge: 'OpenAI',
    requiresKey: true,
    color: '#10b981',
  },
  {
    id: 'grok',
    name: 'Grok',
    model: 'Grok-3 DeepSearch',
    badge: 'xAI',
    requiresKey: true,
    color: '#e040fb',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    model: 'Sonar Online Research',
    badge: 'Perplexity API',
    requiresKey: true,
    color: '#38bdf8',
  },
  {
    id: 'ollama',
    name: 'Ollama Local',
    model: 'DeepSeek-R1 / Llama 3.3 (Local)',
    badge: '100% Local / Free',
    requiresKey: false,
    color: '#94a3b8',
  },
];

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$0',
    period: 'free forever',
    description: 'Local-first foundation for individual makers and tinkerers.',
    features: [
      'BYOK only (Bring Your Own Keys)',
      'Local Ollama integration (100% offline)',
      'Single-pane focused mode',
      'Monaco code editor with syntax support',
      'Local SQLite chat and session history',
      'Community discord & docs support',
    ],
    ctaText: 'Download Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$24',
    period: 'per month',
    badge: 'Most Popular',
    highlighted: true,
    description: 'The ultimate dual-agent workstation for professional builders.',
    features: [
      'Dual-Agent Boss Mode (Alpha + Beta side-by-side)',
      'Pooled API credits included ($50 monthly value)',
      'All 4 creative modes: Code, Create, Research, Chat',
      'Media Studio: Image gen, diagrams, doc exports',
      'Jules Enterprise Code Check integration included',
      'Side-by-side diff comparison & merge engine',
      'Priority routing & high-speed cloud proxy',
    ],
    ctaText: 'Start Pro Trial',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$79',
    period: 'per month',
    description: 'Collaborative scale, team governance, and dedicated proxies.',
    features: [
      'Everything included in Pro tier',
      '5 team seats with unified billing',
      'Dedicated private proxy & zero-retention guarantee',
      'Custom fine-tuned models & self-hosted endpoints',
      'Unlimited Jules Enterprise Code & Security Audits',
      'Team shared workspace templates & Git synchronization',
      'Direct developer SLA & 1-on-1 onboarding',
    ],
    ctaText: 'Contact Enterprise',
  },
];

export const PRODUCTS_CATALOG: ProductItem[] = [
  {
    id: 'opus-pro',
    name: 'OpusPawClaw Pro',
    tagline: 'Flagship dual-agent AI desktop workstation for engineers & creators',
    price: '$24',
    period: '/ month',
    badge: 'Featured Flagship',
    audience: 'Developers, Prompt Engineers, Technical Founders',
    description:
      'Orchestrate Claude, Gemini, GPT-5.4, and local Ollama side-by-side. Compare outputs in real-time, merge code directly into your repository, and run automated Jules security validations.',
    features: [
      'Dual-Agent Boss Mode with resizable split canvas',
      'Embedded Monaco code editor with Git status and terminal',
      'Media studio: Stable Diffusion, Mermaid diagrams, PDF export',
      'Research desk: Web search, citation compiler, source verification',
      'Jules Enterprise Code Check with vulnerability auto-fix',
    ],
    specs: {
      'Supported OS': 'Windows 10/11, macOS (Apple Silicon & Intel), Linux',
      'Local Footprint': 'Ultra-light Electron architecture (~140MB memory)',
      'Key Security': 'AES-256 local-only vault. Keys never touch cloud servers',
    },
    category: 'workstation',
  },
  {
    id: 'opus-enterprise',
    name: 'OpusPawClaw Enterprise',
    tagline: 'Multi-seat orchestration with custom fine-tuned endpoints',
    price: '$79',
    period: '/ month',
    badge: 'Teams & Scale',
    audience: 'Engineering Teams, Startups, Digital Agencies',
    description:
      'Empower your team with shared prompt desks, dedicated low-latency proxies, central license administration, and automated corporate code review policies.',
    features: [
      'Up to 5 collaborative seats with shared workspace sync',
      'Dedicated Cloudflare proxy with regional endpoint routing',
      'Custom LLM fine-tuning pipelines and private model connectors',
      'Comprehensive audit logs and SOC2-compliant local storage mode',
      'Priority direct SLA with core engineering team',
    ],
    specs: {
      'Seats Included': '5 active seats (expandable to 50+)',
      'Proxy Infrastructure': 'Isolated Cloudflare Worker edge instances',
      'SLA': '99.9% uptime with 1-hour priority support response',
    },
    category: 'workstation',
  },
  {
    id: 'pawclaw-kids',
    name: 'PawClaw (Young Learners)',
    tagline: 'Safe, creative AI exploration built specifically for young minds',
    price: 'Free',
    period: 'forever',
    badge: 'Kid-Safe',
    audience: 'Students, Educators, Curious Young Learners',
    description:
      'A joyful, guardrailed environment for learning coding, creative writing, science, and math. Completely isolated from unfiltered adult web access.',
    features: [
      'COPPA-compliant safety filters and positive learning guardrails',
      'Interactive visual coding puzzles and step-by-step logic tutorials',
      'Creative storymaker with kid-safe illustration generator',
      'No tracking, zero ads, no public sharing or external chat',
      'Parent & teacher companion dashboard',
    ],
    specs: {
      Compliance: '100% COPPA & Student Privacy Certified',
      Access: 'Standalone offline-first desktop application',
      Cost: 'Completely free for families and public schools',
    },
    category: 'education',
  },
  {
    id: 'jules-sentinel',
    name: 'Jules Code Sentinel',
    tagline: 'Enterprise-grade automated vulnerability and code review engine',
    price: '$19',
    period: '/ month (Included in Pro)',
    badge: 'Security Engine',
    audience: 'SecOps, Full-Stack Developers, Code Reviewers',
    description:
      'Autonomous security scanning that audits AI-generated code before you deploy. Catches OWASP Top 10 vulnerabilities, API key leaks, memory leaks, and timing attack hazards.',
    features: [
      'Live vulnerability scanner for TypeScript, Python, Go, and Rust',
      'Secret and token detection (prevents accidental git commits of keys)',
      'Automated pull-request review suggestions and refactor patches',
      'One-click remediation loop directly inside OpusPawClaw',
    ],
    specs: {
      'Scan Latency': '< 350ms average execution speed',
      'Rule Engine': '320+ proprietary security and performance rules',
      Integration: 'Native OpusPawClaw hook or standalone REST API',
    },
    category: 'security',
  },
];

export const STORE_FEATURES = [
  {
    title: 'Dual Agent Boss Mode',
    tagline: 'Two AIs, one task. Compare, merge, ship.',
    description:
      'Assign tasks simultaneously to Claude and Gemini. Inspect two distinct architectural approaches, run side-by-side diffs, and cherry-pick the optimal code in one click.',
    iconName: 'SplitSquareVertical',
    accentColor: '#00d4ff',
  },
  {
    title: 'Any AI Provider',
    tagline: 'Claude, GPT-5.4, Gemini, Grok, Ollama.',
    description:
      'Bring your own API keys or use pooled credits. Seamlessly switch between Anthropic, Google AI Studio, OpenAI, xAI, Perplexity, or fully offline local Ollama models.',
    iconName: 'Cpu',
    accentColor: '#e040fb',
  },
  {
    title: 'Monaco Code Editor',
    tagline: 'Monaco-powered. Git built in. Terminal included.',
    description:
      'The exact high-performance editing engine powering VS Code. Full syntax highlighting for 50+ languages, real-time file tree, integrated shell, and native git workflows.',
    iconName: 'Code2',
    accentColor: '#00e676',
  },
  {
    title: 'Media Studio',
    tagline: 'Generate images, render diagrams, export documents.',
    description:
      'Transform concepts into production assets. Generate UI mockups, render interactive Mermaid architectural diagrams, and export structured Markdown to PDF or DOCX.',
    iconName: 'Sparkles',
    accentColor: '#ffb300',
  },
  {
    title: 'Research Desk',
    tagline: 'Search, fetch, cite, compare. All in one surface.',
    description:
      'Deep real-time web search and citation verification. Scrape technical documentation, compare authoritative sources, and formulate synthesized research briefs.',
    iconName: 'Compass',
    accentColor: '#38bdf8',
  },
  {
    title: 'Jules Enterprise Code Check',
    tagline: 'Enterprise-grade security review before you ship.',
    description:
      'Every code generation can be verified by the Jules Security Engine. Detect leaks, injection flaws, and performance bottlenecks with one-click automated fixes.',
    iconName: 'ShieldCheck',
    accentColor: '#f43f5e',
  },
];
