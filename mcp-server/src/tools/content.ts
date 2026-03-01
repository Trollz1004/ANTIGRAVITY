/**
 * Content Tools — Ready-to-post social media templates
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type Platform = "x" | "reddit" | "tiktok" | "linkedin";

interface Post {
  platform: Platform;
  title?: string;
  body: string;
  hashtags?: string[];
  subreddit?: string;
  notes?: string;
}

const CONTENT_BANK: Post[] = [
  // X / Twitter posts
  {
    platform: "x",
    body: "I built a dating app where bots literally can't exist.\n\n$1 to prove you're human. 60% of every dollar goes to Shriners Children's Hospital.\n\nNo VC money. No data harvesting. Just real humans connecting.\n\nyouandinotai.com",
    hashtags: ["#ForTheKids", "#YouAndINotAI", "#DatingApp"],
  },
  {
    platform: "x",
    body: "Every dating app sells your data. We charge $1 to keep bots out and send 60% to kids' hospitals.\n\nThat's the whole business model. On-chain. Auditable.\n\nyouandinotai.com",
    hashtags: ["#ForTheKids", "#YouAndINotAI"],
  },
  {
    platform: "x",
    body: "Founding Members: $14.99/mo locked forever. First 100 get that price for life.\n\nYour subscription funds real healthcare for real kids. Every receipt shows the split.\n\nyouandinotai.com #ForTheKids",
    hashtags: ["#ForTheKids", "#YouAndINotAI"],
  },
  {
    platform: "x",
    body: "I'm an electrician from Florida who taught himself to code.\n\nBuilt an AI-powered dating app that donates 60% of revenue to Shriners Children's Hospital.\n\nNo investors. No board. Just a dad who thinks tech should help kids.\n\nyouandinotai.com",
    hashtags: ["#ForTheKids", "#IndieHacker"],
  },
  // Reddit posts
  {
    platform: "reddit",
    subreddit: "r/SideProject",
    title: "I built a dating app that donates 60% of revenue to children's hospitals",
    body: "Hey everyone — electrician from Florida here. Self-taught coder.\n\nI built YouAndINotAI, a dating app with a $1 entry fee that keeps bots out. 60% of every dollar goes to Shriners Children's Hospital. The split is enforced on-chain so I can't change it even if I wanted to.\n\nStack: React + FastAPI + Stripe + PostgreSQL. Deployed on Cloudflare Pages.\n\nNo VC money. No data harvesting. Launching April 4.\n\nWould love feedback on the concept and landing page: youandinotai.com",
    notes: "Include link in body. This sub allows it.",
  },
  {
    platform: "reddit",
    subreddit: "r/OnlineDating",
    title: "Tired of matching with bots? I built something different",
    body: "Every dating app I tried was full of bots. So I built one where you pay $1 to prove you're human. That dollar goes to Shriners Children's Hospital (60% of all revenue).\n\nNo swiping algorithms designed to keep you addicted. No premium tiers that gate basic features. Just real people who proved they're real.\n\nLaunching April 4. Early members lock in $14.99/mo for life.",
    notes: "Story-first approach. URL in comments only if sub rules require it.",
  },
  {
    platform: "reddit",
    subreddit: "r/GoodNews",
    title: "Dating app donates 60% of all revenue to Shriners Children's Hospital — launching April 4",
    body: "My name is Josh. I'm an electrician from Florida who taught himself to code. I built YouAndINotAI — a dating app where $1 proves you're human and keeps bots out.\n\n60% of every dollar goes directly to Shriners Children's Hospital. It's not a marketing gimmick — the split is enforced by a smart contract on Base blockchain. I literally cannot change it.\n\nLaunching April 4, 2026. youandinotai.com",
    notes: "Charity angle leads. Keep it genuine.",
  },
  // TikTok scripts
  {
    platform: "tiktok",
    body: "[HOOK] Every dating app is full of bots. So I built one where they literally can't exist.\n\n[BODY] It costs $1 to join. That dollar proves you're human. And 60 cents of every dollar goes to Shriners Children's Hospital.\n\nI'm an electrician from Florida. No VC money. No tech bro vibes. Just a dad who thinks dating apps should actually work.\n\n[CTA] Link in bio. Launching April 4. First 100 members lock in $14.99/mo for life.\n\n#ForTheKids #DatingApp #IndieHacker #YouAndINotAI",
    notes: "30-45 seconds. Face to camera. Authentic energy.",
  },
  // LinkedIn
  {
    platform: "linkedin",
    body: "I'm an electrician from Florida who taught himself to code.\n\nI built YouAndINotAI — a dating app that charges $1 to prove you're human (keeping bots out) and donates 60% of all revenue to Shriners Children's Hospital.\n\nThe revenue split is enforced on-chain. Auditable. Immutable. I can't change it even if I wanted to.\n\nNo VC funding. No board of directors. No exit strategy. Just a product that does what it says.\n\nLaunching April 4, 2026. Founding Members who join early lock in $14.99/mo forever.\n\nyouandinotai.com\n\n#ForTheKids #YouAndINotAI #IndieHacker #StartupLife",
    notes: "Professional tone but still Josh's voice.",
  },
];

export function registerContentTools(server: McpServer) {
  // Tool 5: Get all content
  server.tool(
    "omega_get_content",
    "Return the full content bank of ready-to-post social media content",
    {
      platform: z.enum(["x", "reddit", "tiktok", "linkedin", "all"]).default("all").describe("Filter by platform or 'all'"),
    },
    async ({ platform }) => {
      const filtered = platform === "all"
        ? CONTENT_BANK
        : CONTENT_BANK.filter(p => p.platform === platform);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ posts: filtered, count: filtered.length }, null, 2),
        }],
      };
    }
  );

  // Tool 6: Get a single X post (random from bank)
  server.tool(
    "omega_get_x_post",
    "Get a ready-to-post X/Twitter post from the content bank",
    {
      index: z.number().optional().describe("Specific post index (0-based), or omit for random"),
    },
    async ({ index }) => {
      const xPosts = CONTENT_BANK.filter(p => p.platform === "x");
      const idx = index !== undefined ? index % xPosts.length : Math.floor(Math.random() * xPosts.length);
      const post = xPosts[idx];
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            post: post.body,
            hashtags: post.hashtags,
            char_count: post.body.length,
            index: idx,
            total: xPosts.length,
          }, null, 2),
        }],
      };
    }
  );

  // Tool 7: Get a Reddit post
  server.tool(
    "omega_get_reddit_post",
    "Get a ready-to-post Reddit submission from the content bank",
    {
      subreddit: z.string().optional().describe("Filter by subreddit (e.g. 'r/SideProject')"),
    },
    async ({ subreddit }) => {
      let posts = CONTENT_BANK.filter(p => p.platform === "reddit");
      if (subreddit) {
        posts = posts.filter(p => p.subreddit?.toLowerCase().includes(subreddit.toLowerCase()));
      }
      if (posts.length === 0) {
        return { content: [{ type: "text" as const, text: "No Reddit posts found for that subreddit." }] };
      }
      const post = posts[0];
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            subreddit: post.subreddit,
            title: post.title,
            body: post.body,
            notes: post.notes,
          }, null, 2),
        }],
      };
    }
  );

  // Tool 8: Get a TikTok script
  server.tool(
    "omega_get_tiktok_script",
    "Get a TikTok video script from the content bank",
    {},
    async () => {
      const scripts = CONTENT_BANK.filter(p => p.platform === "tiktok");
      const script = scripts[Math.floor(Math.random() * scripts.length)];
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            script: script.body,
            notes: script.notes,
          }, null, 2),
        }],
      };
    }
  );
}
