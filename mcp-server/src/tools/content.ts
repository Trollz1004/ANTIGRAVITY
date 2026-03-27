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
    body: "I built a dating app where bots can't hide behind burner profiles.\n\n$1 to verify you're human. Real identity checks. Real people.\n\nyouandinotai.com",
    hashtags: ["#YouAndINotAI", "#DatingApp", "#RealPeopleOnly"],
  },
  {
    platform: "x",
    body: "Every dating app says it wants real connections. We start by verifying the person behind the profile.\n\n$1. Real identity checks. No bot farm energy.\n\nyouandinotai.com",
    hashtags: ["#YouAndINotAI", "#RealDating"],
  },
  {
    platform: "x",
    body: "Founding Members lock in $14.99/mo. First 100 keep that rate for life.\n\nIf you wanted in before the noise shows up, this is the window.\n\nyouandinotai.com",
    hashtags: ["#YouAndINotAI", "#FoundingMember"],
  },
  {
    platform: "x",
    body: "I'm an electrician from Florida who got tired of fake profiles and built the thing I wanted to use.\n\nReal checks. Real people. No investor-scripted nonsense.\n\nyouandinotai.com",
    hashtags: ["#IndieHacker", "#YouAndINotAI"],
  },
  // Reddit posts
  {
    platform: "reddit",
    subreddit: "r/SideProject",
    title: "I built a dating app that starts with identity checks instead of fake engagement loops",
    body: "Hey everyone — electrician from Florida here. Self-taught coder.\n\nI built YouAndINotAI, a dating app with a $1 verification step that keeps obvious bots and burner-profile spam out before people start matching.\n\nStack: React + FastAPI + Square + PostgreSQL. Launching April 4.\n\nNo VC money. No data-harvesting pitch deck. Just trying to build something that feels more honest than the usual swipe casino.\n\nWould love feedback on the concept and landing page: youandinotai.com",
    notes: "Include link in body. This sub allows it.",
  },
  {
    platform: "reddit",
    subreddit: "r/OnlineDating",
    title: "Tired of matching with bots? I built something different",
    body: "Every dating app I tried was full of bots. So I built one where you pay $1 to prove you're human before you get into the community.\n\nNo fake-profile treadmill. No endless paywalls just to figure out whether the person exists. Just real people who cleared the checks.\n\nLaunching April 4. Early members lock in $14.99/mo for life.",
    notes: "Story-first approach. URL in comments only if sub rules require it.",
  },
  {
    platform: "reddit",
    subreddit: "r/GoodNews",
    title: "Dating app built around real-human verification launches April 4",
    body: "My name is Josh. I'm an electrician from Florida who taught himself to code. I built YouAndINotAI — a dating app where $1 proves you're human and helps keep fake profiles out before the matching starts.\n\nThe focus is simple: real people, cleaner onboarding, and a safer starting point than the usual swipe apps.\n\nLaunching April 4, 2026. youandinotai.com",
    notes: "Lead with verification and builder story, not finance claims.",
  },
  // TikTok scripts
  {
    platform: "tiktok",
    body: "[HOOK] Every dating app says it hates bots. I built one that starts by checking whether you're real.\n\n[BODY] It costs $1 to verify you're human. Real identity checks. Real people. Way less fake-profile nonsense.\n\nI'm an electrician from Florida. No VC script. No tech-bro theater. Just trying to build a dating app that feels normal again.\n\n[CTA] Link in bio. Launching April 4. First 100 members lock in $14.99/mo for life.\n\n#DatingApp #IndieHacker #YouAndINotAI #RealPeopleOnly",
    notes: "30-45 seconds. Face to camera. Authentic energy.",
  },
  // LinkedIn
  {
    platform: "linkedin",
    body: "I'm an electrician from Florida who taught himself to code.\n\nI built YouAndINotAI — a dating app that charges $1 to verify you're human before you join the community.\n\nThe point is straightforward: fewer fake profiles, less wasted time, and a better starting point for real people trying to connect.\n\nNo VC funding. No boardroom script. Just a product solving the problem that pushed me to build it.\n\nLaunching April 4, 2026. Founding Members who join early lock in $14.99/mo forever.\n\nyouandinotai.com\n\n#YouAndINotAI #IndieHacker #StartupLife #ConsumerApps",
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
