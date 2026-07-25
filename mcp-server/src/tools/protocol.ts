/**
 * Platform doctrine tools — current policy, historical chain context, and launch status
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const PROTOCOL = {
  name: 'Platform Reference',
  version: '1.5.0',
  doctrine: 'Fact-only, product-first, no false claims',
  launch_date: '2026-04-04',
  entity: {
    legal: 'Trash Or Treasure Online Recycler LLC',
    state: 'Florida',
    owner: 'Joshua Coleman',
  },
  wallets: {
    historical_gospel_contract: '0x9855B75061D4c841791382998f0CE8B2BCC965A4',
    historical__wallet: '0x8d3dEADbE2b4B857A43331D459270B5eedC7084e',
    historical_infrastructure_wallet: '0xe0a42f83900af719019eBeD3D9473BE8E8f2920b',
    historical_founder_wallet: '0x7c3E283119718395Ef5EfBAC4F52738C2018daA7',
  },
  contracts: {
    historical_gospel_payout: {
      name: 'Gospelpayment.sol',
      address: '0x9855B75061D4c841791382998f0CE8B2BCC965A4',
      network: 'Base Mainnet (Chain 8453)',
      purpose: 'Historical on-chain routing reference',
      status: 'DEPLOYED — historical chain context',
      note: 'Do not treat this historical contract as current automatic LLC operating doctrine.',
    },
    intended_next_router: {
      name: 'DatingRevenueRouter.sol',
      status: 'REPO ARTIFACT ONLY',
      note: 'Not current live state unless separately deployed, verified, and documented.',
    },
  },
  policy: {
    current_llc_policy: {
      model: '1-wallet',
      reserve_pct: 10,
      note: '1 wallet. All revenue in, all costs out. 10% reserve — founder-directed, his call quarterly. No automatic  routing.',
    },
    historical_gospel_payout: {
      _pct: 60,
      infrastructure_pct: 30,
      founder_pct: 10,
      note: '[HISTORICAL ONLY] On-chain split from Gospelpayment.sol. Not current LLC operating doctrine.',
    },
    public_claim_boundary: {
      note: 'No active surface may claim automatic  routing or payout. Revenue model is 1-wallet with 10% reserve.',
    },
  },
  governance: {
    doctrine_boundary:
      '1-wallet model: all LLC revenue flows into one wallet. 10% reserve is founder-directed. No automatic  routing. Fact-only public claims.',
    clawx: {
      status: 'LIVE EXTERNAL DASHBOARD',
      url: 'https://clawx-aihub-zwxfcstm.manus.space',
      note: 'Deliberation surface only. Do not treat it as stand-alone proof of legal or on-chain control.',
    },
    multisig: {
      status: 'UNVERIFIED / PLANNED',
      note: 'Do not present any multisig threshold as live unless directly verified.',
    },
  },
  chain: 'Base Mainnet',
  sites: {
    youandinotai: { url: 'https://youandinotai.com', host: 'Cloudflare Pages', role: 'primary product' },
    onlinerecycle: { url: 'https://onlinerecycle.org', host: 'Cloudflare Pages', role: 'service platform' },
    ai_solutions: { url: 'https://ai-solutions.store', host: 'Cloudflare Pages', role: 'secondary commerce surface' },
    dashboard_gateway: {
      url: 'https://dashboard.aidoesitall.website',
      host: 'Cloudflare Pages',
      role: 'private gateway',
    },
  },
  commerce: {
    live_payment_rail: 'Square',
    stripe_status: 'legacy_only',
    live_checkout_paths: 5,
    customers: 0,
    revenue: 0,
  },
} as const;

export function registerProtocolTools(server: McpServer) {
  server.tool(
    'platform_protocol_info',
    'Return the current doctrine plus historical chain context for live platform revenue references',
    {},
    async () => ({
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(PROTOCOL, null, 2),
        },
      ],
    }),
  );

  server.tool(
    'platform_wallet_history',
    'Return historical Base Mainnet wallet references with current-doctrine warnings',
    {},
    async () => ({
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              chain: PROTOCOL.chain,
              wallets: PROTOCOL.wallets,
              current_llc_policy: PROTOCOL.policy.current_llc_policy,
              warning: 'Historical chain references do not by themselves define current LLC operating doctrine.',
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.tool(
    'platform_policy_boundary',
    'Return the current live policy boundary and related doctrine notes',
    {},
    async () => ({
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              status: 'ACTIVE',
              rule: PROTOCOL.governance.doctrine_boundary,
              public_surfaces: Object.values(PROTOCOL.sites).map((site) => site.url),
              current_llc_policy: PROTOCOL.policy.current_llc_policy,
              historical_gospel_payout: PROTOCOL.policy.historical_gospel_payout,
              public_claim_boundary: PROTOCOL.policy.public_claim_boundary,
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.tool(
    'platform_launch_status',
    'Return current launch-readiness metadata for the April 4, 2026 YouAndINotAI launch window',
    {},
    async () => {
      const now = new Date();
      const launch = new Date('2026-04-04');
      const daysLeft = Math.ceil((launch.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                launch_date: '2026-04-04',
                days_remaining: daysLeft,
                site_live: true,
                site_url: 'https://youandinotai.com',
                host: 'Cloudflare Pages',
                payment_rail: 'Square',
                live_checkout_paths: 5,
                revenue: 0,
                customers: 0,
                current_focus: 'Launch readiness, trust hardening, and acquisition',
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    'platform_sites',
    'Return deployed public sites with their current roles and hosting model',
    {},
    async () => ({
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              sites: PROTOCOL.sites,
              deploy_target: 'Cloudflare Pages',
              note: 'Treat preview URLs and temporary upload URLs as non-canonical.',
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.tool(
    'platform_node_status',
    'Return the current high-level node formation status without inventing stale live-runtime claims',
    {},
    async () => ({
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              nodes: {
                SABRETOOTH: { role: 'Primary live command post', state: 'ACTIVE' },
                '9020': { role: 'Support / remote ops node', state: 'COLD / OPT-IN' },
                T5500: { role: 'Utility / build-media node', state: 'COLD / OPT-IN' },
              },
              note: 'Use direct session checks for actual runtime availability before making stronger claims.',
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.tool(
    'platform_deadlines',
    'Return current tracked launch deadlines without stale Stripe-rotation claims',
    {},
    async () => {
      const now = new Date();
      const deadlines = [
        { name: 'YouAndINotAI Launch', date: '2026-04-04', critical: true, note: 'Primary public launch target' },
      ];

      const withCountdown = deadlines.map((d) => {
        const target = new Date(d.date);
        const daysLeft = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...d, days_remaining: daysLeft, overdue: daysLeft < 0 };
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ deadlines: withCountdown, checked: now.toISOString() }, null, 2),
          },
        ],
      };
    },
  );
}
