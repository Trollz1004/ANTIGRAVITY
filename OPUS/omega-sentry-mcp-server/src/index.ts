#!/usr/bin/env node
/**
 * OMEGA SENTRY MCP SERVER
 * Protocol Omega — Always-on sentry for YouAndINotAI.com
 *
 * Tools:
 *   omega_revenue_snapshot    — Pull live Stripe revenue data
 *   omega_send_welcome        — Send welcome email to new $1 verification
 *   omega_send_education      — Send Bot-Shield education email (Day 2)
 *   omega_send_referral       — Send referral push email (Day 5)
 *   omega_send_transparency   — Send weekly transparency report
 *   omega_send_daily_brief    — Send daily revenue brief to Josh
 *   omega_get_content         — Get social media content bank
 *   omega_get_x_post          — Get a random X/Twitter post ready to publish
 *   omega_get_x_thread        — Get the full X thread (7 tweets)
 *   omega_get_reddit_comment  — Get a Reddit comment for dating threads
 *   omega_get_tiktok_script   — Get the TikTok video script
 *   omega_protocol_info       — Get Protocol Omega wallet addresses and split logic
 *   omega_payment_links       — Get all live Stripe payment links
 *   omega_calculate_split     — Calculate 60/30/10 split for any revenue amount
 *   omega_projection          — Run revenue projection scenarios
 *
 * Transport: stdio (runs as subprocess of Claude Code)
 * Gospel V1.4.1 — "Until no kid is in need"
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { PROTOCOL_OMEGA, PAYMENT_LINKS, PRICING, ROYAL_FLUSH, CHARACTER_LIMIT } from "./constants.js";
import {
  getRevenueSnapshot,
  handleStripeError,
} from "./services/stripe.js";
import {
  sendEmail,
  welcomeEmail,
  botShieldEducationEmail,
  referralPushEmail,
  transparencyReportEmail,
  dailyBriefEmail,
} from "./services/email.js";
import {
  getRandomXPost,
  getRandomRedditComment,
  getXThread,
  getTikTokScript,
  getAllContent,
} from "./services/content.js";

const server = new McpServer({
  name: "omega-sentry-mcp-server",
  version: "1.0.0",
});

// ===== REVENUE TOOLS =====

server.registerTool(
  "omega_revenue_snapshot",
  {
    title: "Revenue Snapshot",
    description: `Pull live revenue data from Stripe for YouAndINotAI.com. Returns: total revenue, customer count, Bot-Shield verifications, active subscriptions, Stripe balance, recent payments, and progress toward $19,990 pre-order target. Use this to check current business status.`,
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  async () => {
    try {
      const snap = await getRevenueSnapshot();
      const launchDate = new Date(PROTOCOL_OMEGA.LAUNCH_DATE);
      const now = new Date();
      const daysToLaunch = Math.ceil((launchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const pct = ((snap.totalRevenue / PROTOCOL_OMEGA.PRE_ORDER_TARGET) * 100).toFixed(1);
      const dailyNeeded = daysToLaunch > 0 ? ((PROTOCOL_OMEGA.PRE_ORDER_TARGET - snap.totalRevenue) / daysToLaunch).toFixed(2) : "0";

      const output = {
        revenue: snap.totalRevenue,
        target: PROTOCOL_OMEGA.PRE_ORDER_TARGET,
        progress_pct: parseFloat(pct),
        daily_needed: parseFloat(dailyNeeded),
        customers: snap.customerCount,
        verifications: snap.verifications,
        subscriptions: snap.subscriptions,
        balance_available_cents: snap.balance.available,
        balance_pending_cents: snap.balance.pending,
        days_to_launch: daysToLaunch,
        recent_payments: snap.recentPayments.slice(0, 5).map(p => ({
          id: p.id,
          amount: `$${(p.amount / 100).toFixed(2)}`,
          status: p.status,
          email: p.receipt_email,
          date: new Date(p.created * 1000).toISOString(),
        })),
      };

      const text = [
        `# Revenue Snapshot — ${new Date().toLocaleString()}`,
        ``,
        `**Revenue:** $${snap.totalRevenue.toFixed(2)} / $${PROTOCOL_OMEGA.PRE_ORDER_TARGET} (${pct}%)`,
        `**Daily Needed:** $${dailyNeeded}/day`,
        `**Customers:** ${snap.customerCount}`,
        `**Bot-Shield Verifications:** ${snap.verifications}`,
        `**Active Subscriptions:** ${snap.subscriptions}`,
        `**Stripe Balance:** $${(snap.balance.available / 100).toFixed(2)} available, $${(snap.balance.pending / 100).toFixed(2)} pending`,
        `**Days to Launch:** ${daysToLaunch}`,
        ``,
        `## Recent Payments`,
        ...snap.recentPayments.slice(0, 5).map(p =>
          `- ${new Date(p.created * 1000).toLocaleDateString()} | $${(p.amount / 100).toFixed(2)} | ${p.status} | ${p.receipt_email ?? "no email"}`
        ),
      ].join("\n");

      return { content: [{ type: "text", text }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleStripeError(error) }], isError: true };
    }
  }
);

server.registerTool(
  "omega_projection",
  {
    title: "Revenue Projection",
    description: `Run revenue projection scenarios for YouAndINotAI.com launch. Calculates best/likely/conservative cases based on weekly verification and subscription rates with growth factors.`,
    inputSchema: {
      verifies_per_week: z.number().int().min(0).default(20).describe("Expected Bot-Shield verifications per week"),
      subs_per_week: z.number().int().min(0).default(10).describe("Expected new subscriptions per week"),
      weekly_growth: z.number().min(0).max(1).default(0.05).describe("Weekly growth rate (0.05 = 5%)"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ verifies_per_week, subs_per_week, weekly_growth }) => {
    const launchDate = new Date(PROTOCOL_OMEGA.LAUNCH_DATE);
    const now = new Date();
    const weeksToLaunch = Math.ceil((launchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7));

    let cumRevenue = 0;
    let activeSubs = 0;
    const weeks: Array<{ week: number; revenue: number; cumulative: number; verifies: number; newSubs: number }> = [];

    for (let w = 1; w <= weeksToLaunch; w++) {
      const growth = Math.pow(1 + weekly_growth, w - 1);
      const wVerifies = Math.round(verifies_per_week * growth);
      const wSubs = Math.round(subs_per_week * growth);
      activeSubs += wSubs;
      const wRevenue = (wVerifies * PRICING.BOT_SHIELD) + (wSubs * PRICING.MONTHLY);
      cumRevenue += wRevenue;
      weeks.push({ week: w, revenue: Math.round(wRevenue), cumulative: Math.round(cumRevenue), verifies: wVerifies, newSubs: wSubs });
    }

    const hitsTarget = cumRevenue >= PROTOCOL_OMEGA.PRE_ORDER_TARGET;
    const charitySplit = cumRevenue * 0.60;

    const text = [
      `# Projection: ${verifies_per_week} verifies/wk, ${subs_per_week} subs/wk, ${(weekly_growth * 100).toFixed(0)}% growth`,
      ``,
      `**Projected Revenue:** $${cumRevenue.toFixed(0)} over ${weeksToLaunch} weeks`,
      `**Hits $${PROTOCOL_OMEGA.PRE_ORDER_TARGET} target:** ${hitsTarget ? "YES" : "NO"}`,
      `**Charity (60%):** $${charitySplit.toFixed(0)} to Shriners`,
      ``,
      `| Week | Verifies | New Subs | Revenue | Cumulative |`,
      `|------|----------|----------|---------|------------|`,
      ...weeks.map(w => `| ${w.week} | ${w.verifies} | ${w.newSubs} | $${w.revenue} | $${w.cumulative} |`),
    ].join("\n");

    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "omega_calculate_split",
  {
    title: "Calculate 60/30/10 Split",
    description: `Calculate the Protocol Omega 60/30/10 revenue split for any dollar amount. Returns exact amounts for Shriners (60%), Infrastructure (30%), and Founder (10%). Remainder from integer division goes to Charity.`,
    inputSchema: {
      amount: z.number().positive().describe("Revenue amount in USD to split"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async ({ amount }) => {
    // Integer division in cents, remainder to charity (per Gospel V1.3)
    const cents = Math.round(amount * 100);
    const charityCents = Math.floor(cents * 60 / 100);
    const infraCents = Math.floor(cents * 30 / 100);
    const founderCents = Math.floor(cents * 10 / 100);
    const remainderCents = cents - charityCents - infraCents - founderCents;
    const finalCharityCents = charityCents + remainderCents;

    const output = {
      input_amount: amount,
      shriners_charity: finalCharityCents / 100,
      infrastructure: infraCents / 100,
      founder: founderCents / 100,
      remainder_to_charity: remainderCents / 100,
      charity_wallet: PROTOCOL_OMEGA.wallets.CHARITY_REVENUE,
      ops_wallet: PROTOCOL_OMEGA.wallets.OPS_WALLET,
      dao_treasury: PROTOCOL_OMEGA.wallets.DAO_TREASURY,
    };

    const text = [
      `# 60/30/10 Split for $${amount.toFixed(2)}`,
      ``,
      `| Destination | % | Amount |`,
      `|-------------|---|--------|`,
      `| Shriners Children's Hospital | 60% | $${(finalCharityCents / 100).toFixed(2)} |`,
      `| V8 Engine & Infrastructure | 30% | $${(infraCents / 100).toFixed(2)} |`,
      `| Founder Operations | 10% | $${(founderCents / 100).toFixed(2)} |`,
      remainderCents > 0 ? `\n*Remainder of $${(remainderCents / 100).toFixed(2)} from integer division added to Charity.*` : ``,
      ``,
      `**Charity Wallet:** \`${PROTOCOL_OMEGA.wallets.CHARITY_REVENUE}\``,
      `**DAO Treasury:** \`${PROTOCOL_OMEGA.wallets.DAO_TREASURY}\``,
    ].join("\n");

    return { content: [{ type: "text", text }] };
  }
);

// ===== EMAIL TOOLS =====

server.registerTool(
  "omega_send_welcome",
  {
    title: "Send Welcome Email",
    description: `Send the Welcome email to a newly verified Bot-Shield customer. Explains the 60/30/10 split, introduces the Royal Flush Draw, and confirms their April 4 launch spot. Requires GMAIL_APP_PASSWORD in env.`,
    inputSchema: {
      email: z.string().email().describe("Customer email address"),
      name: z.string().optional().describe("Customer first name (optional)"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ email, name }) => {
    try {
      const payload = welcomeEmail(email, name);
      const messageId = await sendEmail(payload);
      return { content: [{ type: "text", text: `Welcome email sent to ${email}. Message ID: ${messageId}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Email error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

server.registerTool(
  "omega_send_education",
  {
    title: "Send Bot-Shield Education Email",
    description: `Send the Bot-Shield V8 education email (Day 2 of sequence). Explains 3-layer verification: economic friction, biometric liveness, on-chain audit trail.`,
    inputSchema: {
      email: z.string().email().describe("Customer email address"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ email }) => {
    try {
      const payload = botShieldEducationEmail(email);
      const messageId = await sendEmail(payload);
      return { content: [{ type: "text", text: `Bot-Shield education email sent to ${email}. Message ID: ${messageId}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Email error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

server.registerTool(
  "omega_send_referral",
  {
    title: "Send Referral Push Email",
    description: `Send the referral push email (Day 5 of sequence). Explains Royal Flush Draw entry math and soft-upsells Founding Member tiers.`,
    inputSchema: {
      email: z.string().email().describe("Customer email address"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ email }) => {
    try {
      const payload = referralPushEmail(email);
      const messageId = await sendEmail(payload);
      return { content: [{ type: "text", text: `Referral push email sent to ${email}. Message ID: ${messageId}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Email error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

server.registerTool(
  "omega_send_transparency",
  {
    title: "Send Transparency Report",
    description: `Send the weekly Transparency Report email to all verified users or a specific email. Shows on-chain revenue distribution with actual wallet addresses and live numbers.`,
    inputSchema: {
      email: z.string().email().describe("Recipient email address"),
      week_num: z.number().int().min(1).describe("Week number for the report"),
      week_revenue: z.number().min(0).describe("Revenue collected this week in USD"),
      total_revenue: z.number().min(0).describe("Total revenue to date in USD"),
      total_verified: z.number().int().min(0).describe("Total verified users"),
      highlight: z.string().describe("This week's highlight (1 sentence)"),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async ({ email, week_num, week_revenue, total_revenue, total_verified, highlight }) => {
    try {
      const launchDate = new Date(PROTOCOL_OMEGA.LAUNCH_DATE);
      const daysToLaunch = Math.ceil((launchDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const payload = transparencyReportEmail(email, week_num, week_revenue, total_revenue, total_verified, daysToLaunch, highlight);
      const messageId = await sendEmail(payload);
      return { content: [{ type: "text", text: `Transparency report (Week ${week_num}) sent to ${email}. Message ID: ${messageId}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Email error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

server.registerTool(
  "omega_send_daily_brief",
  {
    title: "Send Daily Brief to Josh",
    description: `Pull live Stripe data and email a daily revenue brief to joshlcoleman@gmail.com. Includes revenue, customers, verifications, subscriptions, balance, days to launch, and daily revenue needed to hit target.`,
    inputSchema: {},
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  },
  async () => {
    try {
      const snap = await getRevenueSnapshot();
      const launchDate = new Date(PROTOCOL_OMEGA.LAUNCH_DATE);
      const daysToLaunch = Math.ceil((launchDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const issues: string[] = [];
      if (snap.totalRevenue === 0) issues.push("Zero revenue — need first sale");
      if (snap.verifications === 0) issues.push("Zero verifications");

      const payload = dailyBriefEmail(
        snap.totalRevenue,
        snap.customerCount,
        snap.verifications,
        snap.subscriptions,
        snap.balance.available,
        snap.balance.pending,
        daysToLaunch,
        issues
      );
      const messageId = await sendEmail(payload);
      return { content: [{ type: "text", text: `Daily brief sent to Josh. Revenue: $${snap.totalRevenue.toFixed(2)}, ${daysToLaunch} days to launch. Message ID: ${messageId}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  }
);

// ===== CONTENT TOOLS =====

server.registerTool(
  "omega_get_content",
  {
    title: "Get Full Content Bank",
    description: `Get the complete social media content bank: all X/Twitter posts, Reddit comments, X thread, and TikTok script. Ready to copy-paste and publish.`,
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    const content = getAllContent();
    const text = [
      `# Content Bank — YouAndINotAI.com`,
      ``,
      `## X/Twitter Posts (${content.x_posts.length} ready)`,
      ...content.x_posts.map((p, i) => `\n### Post ${i + 1} (${p.character_count} chars)\n\`\`\`\n${p.content}\n\`\`\``),
      ``,
      `## Reddit Comments (${content.reddit_comments.length} ready)`,
      ...content.reddit_comments.map((p, i) => `\n### Comment ${i + 1}\n\`\`\`\n${p.content}\n\`\`\``),
      ``,
      `## X Thread (${content.x_thread.length} tweets)`,
      ...content.x_thread.map((p, i) => `\n**Tweet ${i + 1}:**\n\`\`\`\n${p.content}\n\`\`\``),
      ``,
      `## TikTok Script`,
      `\`\`\`\n${content.tiktok_script}\n\`\`\``,
    ].join("\n");

    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "omega_get_x_post",
  {
    title: "Get Random X Post",
    description: `Get a random X/Twitter post from the content bank, ready to publish. Rotates through 10 different posts about YouAndINotAI.com.`,
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async () => {
    const post = getRandomXPost();
    return { content: [{ type: "text", text: `**X Post (${post.character_count} chars):**\n\n${post.content}\n\n**Hashtags:** ${post.hashtags.join(" ")}` }] };
  }
);

server.registerTool(
  "omega_get_x_thread",
  {
    title: "Get X Thread",
    description: `Get the full 6-tweet X/Twitter thread about YouAndINotAI.com. Covers: the bot problem, Bot-Shield V8 solution, 60/30/10 charity split, Royal Flush Draw, and founding story.`,
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    const thread = getXThread();
    const text = thread.map((t, i) => `**${i === 0 ? "Start" : `${i}/5`}:**\n${t.content}`).join("\n\n---\n\n");
    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "omega_get_reddit_comment",
  {
    title: "Get Reddit Comment",
    description: `Get a conversational Reddit comment for posting in dating-related subreddits (r/dating, r/OnlineDating, r/datingoverthirty). Written in Josh's authentic voice — not spammy.`,
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async () => {
    const comment = getRandomRedditComment();
    return { content: [{ type: "text", text: `**Reddit Comment (${comment.character_count} chars):**\n\n${comment.content}` }] };
  }
);

server.registerTool(
  "omega_get_tiktok_script",
  {
    title: "Get TikTok Script",
    description: `Get the TikTok video script for YouAndINotAI.com. 35-second format with hook, problem, solution, charity hook, and CTA.`,
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    return { content: [{ type: "text", text: `**TikTok Script:**\n\n${getTikTokScript()}` }] };
  }
);

// ===== PROTOCOL INFO TOOLS =====

server.registerTool(
  "omega_protocol_info",
  {
    title: "Protocol Omega Info",
    description: `Get all Protocol Omega wallet addresses, contract names, chain info, split logic, and succession doctrine. The cryptographic truth from Base Mainnet.`,
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    const text = [
      `# Protocol Omega — Base Mainnet (Chain ${PROTOCOL_OMEGA.chain.id})`,
      ``,
      `## Wallets`,
      `| Role | Address |`,
      `|------|---------|`,
      `| DAO Treasury | \`${PROTOCOL_OMEGA.wallets.DAO_TREASURY}\` |`,
      `| Dating Revenue | \`${PROTOCOL_OMEGA.wallets.DATING_REVENUE}\` |`,
      `| Charity Revenue | \`${PROTOCOL_OMEGA.wallets.CHARITY_REVENUE}\` |`,
      `| Ops Wallet | \`${PROTOCOL_OMEGA.wallets.OPS_WALLET}\` |`,
      ``,
      `## Split Logic (Gospel V1.3)`,
      `- **${PROTOCOL_OMEGA.split.CHARITY_PCT}%** Pediatric Charity (Shriners Children's Hospital)`,
      `- **${PROTOCOL_OMEGA.split.INFRA_PCT}%** Infrastructure/Growth Fund (V8 Engine)`,
      `- **${PROTOCOL_OMEGA.split.FOUNDER_PCT}%** Family Trust Allocation`,
      `- Remainder from integer division → Charity`,
      ``,
      `## Contracts`,
      `- **${PROTOCOL_OMEGA.contracts.CHARITY_ROUTER}**: Immutable 100% charity forwarder`,
      `- **${PROTOCOL_OMEGA.contracts.DATING_ROUTER}**: UUPS upgradeable with timelock`,
      ``,
      `## Succession Doctrine`,
      `- Primary: Founder's Brother & Niece`,
      `- Secondary: Biological children`,
      `- Fallback: Reverts to 60% Charity Fund`,
      ``,
      `*Gospel V1.4.1 — "Until no kid is in need"*`,
    ].join("\n");

    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "omega_payment_links",
  {
    title: "Get Payment Links",
    description: `Get all live Stripe payment links for YouAndINotAI.com products: Bot-Shield ($1), Monthly ($14.99), 3-Month ($39.99), 12-Month ($99.99), Royalty Card ($2,500).`,
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async () => {
    const text = [
      `# Live Payment Links`,
      ``,
      `| Product | Price | Link |`,
      `|---------|-------|------|`,
      `| Bot-Shield Verification | $${PRICING.BOT_SHIELD} | ${PAYMENT_LINKS.BOT_SHIELD} |`,
      `| Founding Member Monthly | $${PRICING.MONTHLY}/mo | ${PAYMENT_LINKS.MONTHLY} |`,
      `| 3-Month Founder | $${PRICING.THREE_MONTH} | ${PAYMENT_LINKS.THREE_MONTH} |`,
      `| 12-Month Founder | $${PRICING.TWELVE_MONTH} | ${PAYMENT_LINKS.TWELVE_MONTH} |`,
      `| Royalty Card — Founder Edition | $${PRICING.ROYALTY_CARD.toLocaleString()} | ${PAYMENT_LINKS.ROYALTY_CARD} |`,
      ``,
      `## Royal Flush Draw`,
      `- $1 verify = ${ROYAL_FLUSH.ENTRIES_PER_VERIFY} entry`,
      `- Each referral = ${ROYAL_FLUSH.ENTRIES_PER_REFERRAL} bonus entries`,
      `- Prize: $${ROYAL_FLUSH.PRIZE_CASH} cash + lifetime premium`,
      `- Drawing: ${ROYAL_FLUSH.DRAW_DATE}`,
    ].join("\n");

    return { content: [{ type: "text", text }] };
  }
);

// ===== MAIN =====

async function main() {
  // Validate optional env vars on startup
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("WARNING: STRIPE_SECRET_KEY not set. Revenue tools will fail.");
  }
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.error("WARNING: GMAIL_APP_PASSWORD not set. Email tools will fail.");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OMEGA SENTRY online. Gospel V1.4.1. Tools: 15 registered.");
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
