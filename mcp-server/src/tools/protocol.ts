/**
 * Protocol Tools — Wallet addresses, split logic, doctrine, and status
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const PROTOCOL = {
  name: "Protocol Omega",
  version: "1.4.1",
  doctrine: "Until no kid is in need",
  launch_date: "2026-04-04",
  entity: {
    legal: "Trash Or Treasure Online Recycler LLC",
    state: "Florida",
    owner: "Joshua Coleman",
  },
  wallets: {
    gospel_contract: "0x9855B75061D4c841791382998f0CE8B2BCC965A4",
    charity_fund_60: "0x8d3dEADbE2b4B857A43331D459270B5eedC7084e",
    infrastructure_30: "0xe0a42f83900af719019eBeD3D9473BE8E8f2920b",
    founder_ops_10: "0x7c3E283119718395Ef5EfBAC4F52738C2018daA7",
  },
  contracts: {
    gospel_donation: {
      name: "GospelDonation.sol",
      address: "0x9855B75061D4c841791382998f0CE8B2BCC965A4",
      network: "Base Mainnet (Chain 8453)",
      purpose: "Historical 60/30/10 revenue router reference — deployed and verified on BaseScan",
      status: "DEPLOYED — historical on-chain context",
      multisig: "Gnosis Safe 2-of-2 (3rd fiduciary signer pending for 2-of-3)",
    },
  },
  splits: {
    current_llc_policy: {
      charitable_cap: 10,
      operating_reserve: 90,
      note: "Current founder-directed conservative policy for LLC operations. Do not market it as universal tax law.",
    },
    legacy_protocol_omega: {
      shriners: 60,
      v8_infrastructure: 30,
      founder: 10,
      note: "Historical on-chain 60/30/10 reference only. Not current live LLC operating doctrine.",
    },
    omega: {
      note: "Charity-side isolated lane. Do not assume 100% charity routing unless separately documented as current safe doctrine.",
    },
  },
  iron_wall: "ENIGMA (profit) and OMEGA (charity) NEVER cross. Separation is absolute.",
  gnosis_safe: "3-of-5 multisig controls contract upgrades",
  chain: "Base Mainnet",
  sites: {
    youandinotai: { url: "youandinotai.com", host: "Cloudflare Pages", entity: "ENIGMA" },
    onlinerecycle: { url: "onlinerecycle.org", host: "Cloudflare Pages", entity: "ENIGMA" },
    ai_solutions: { url: "ai-solutions.store", host: "Cloudflare Pages", entity: "OMEGA" },
  },
  stripe: {
    account: "acct_1T3DVxIO6LWQSQoI",
    key_expires: "~March 10, 2026",
    products: 10,
    customers: 0,
    revenue: 0,
  },
} as const;

export function registerProtocolTools(server: McpServer) {
  // Tool 9: Full protocol info
  server.tool(
    "omega_protocol_info",
    "Return the complete Protocol Omega specification: wallets, splits, contracts, doctrine",
    {},
    async () => {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(PROTOCOL, null, 2),
        }],
      };
    }
  );

  // Tool 10: Wallet addresses
  server.tool(
    "omega_wallets",
    "Return all Protocol Omega Base Mainnet wallet addresses",
    {},
    async () => {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            chain: PROTOCOL.chain,
            wallets: PROTOCOL.wallets,
            multisig: PROTOCOL.gnosis_safe,
          }, null, 2),
        }],
      };
    }
  );

  // Tool 11: Iron Wall check
  server.tool(
    "omega_iron_wall",
    "Verify the Iron Wall separation between ENIGMA (profit) and OMEGA (charity)",
    {},
    async () => {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            status: "ENFORCED",
            rule: PROTOCOL.iron_wall,
            enigma_sites: ["youandinotai.com", "onlinerecycle.org"],
            omega_sites: ["ai-solutions.store"],
            current_llc_policy: PROTOCOL.splits.current_llc_policy,
            legacy_protocol_omega: PROTOCOL.splits.legacy_protocol_omega,
            omega_split: PROTOCOL.splits.omega,
          }, null, 2),
        }],
      };
    }
  );

  // Tool 12: Launch status
  server.tool(
    "omega_launch_status",
    "Return current launch readiness status for YouAndINotAI April 4 launch",
    {},
    async () => {
      const now = new Date();
      const launch = new Date("2026-04-04");
      const daysLeft = Math.ceil((launch.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            launch_date: "2026-04-04",
            days_remaining: daysLeft,
            site_live: true,
            site_url: "youandinotai.com",
            host: "Cloudflare Pages",
            stripe_live: true,
            stripe_key_expires: "~March 10, 2026",
            payment_links: 5,
            revenue: 0,
            customers: 0,
            blocker: "TRAFFIC — code and payments are ready, need eyeballs",
            social_posts_ready: true,
            email_sequence_ready: true,
          }, null, 2),
        }],
      };
    }
  );

  // Tool 13: Site map
  server.tool(
    "omega_sites",
    "Return all deployed sites with their hosts, entities, and URLs",
    {},
    async () => {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            sites: PROTOCOL.sites,
            deploy_target: "Cloudflare Pages ONLY",
            dead: ["Netlify (locked)", "GitHub Pages (removed)"],
          }, null, 2),
        }],
      };
    }
  );

  // Tool 14: Node status
  server.tool(
    "omega_node_status",
    "Return the status of all compute nodes in the formation",
    {},
    async () => {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            nodes: {
              T5500: { status: "ACTIVE", role: "Primary", gpu: "GTX 1070 8GB", brain: "Claude Opus 4.6" },
              SABRETOOTH: { status: "OFFLINE", role: "Secondary", note: "Not accessible" },
              "9020": { status: "OFFLINE", role: "Tertiary", note: "Not accessible" },
            },
            agents: {
              opus: { status: "ACTIVE", role: "CLI + Strategy", location: "T5500" },
              gemini: { status: "ACTIVE", role: "Hands-on-keyboard", location: "Browser" },
              comet: { status: "ACTIVE", role: "Research + Audits", location: "Browser" },
            },
          }, null, 2),
        }],
      };
    }
  );

  // Tool 15: Deadline tracker
  server.tool(
    "omega_deadlines",
    "Return all critical deadlines and their countdown status",
    {},
    async () => {
      const now = new Date();
      const deadlines = [
        { name: "Stripe Key Rotation", date: "2026-03-10", critical: true, note: "All 5 checkout links die if not rotated" },
        { name: "YouAndINotAI Launch", date: "2026-04-04", critical: true, note: "First revenue target" },
      ];

      const withCountdown = deadlines.map(d => {
        const target = new Date(d.date);
        const daysLeft = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...d, days_remaining: daysLeft, overdue: daysLeft < 0 };
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ deadlines: withCountdown, checked: now.toISOString() }, null, 2),
        }],
      };
    }
  );
}
