/**
 * Social Command Center MCP Server
 * 
 * Read-only operational visibility for all AIs.
 * 24 APIs · 34 Agents · Content Feed · Analytics · CORS Routing Map
 * 
 * ZERO SECRETS — all data is public platform metadata.
 * Any AI on the team can connect and see what's happening.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { PLATFORMS, PLATFORM_TYPES, getPlatformsByType, getPlatformCount, type PlatformEntry } from "./platforms.js";
import { AGENTS, AGENT_GROUPS, getAgentsByGroup, getAgentsByStatus, getAgentCount, getActiveAgentCount } from "./agents.js";
import { getFeed, addPost, updatePostStatus, getFeedByPlatform, getFeedByLlm, getFeedByStatus, getFeedAnalytics, type PostEntry } from "./feed.js";
import { ACCESS_POLICY, getAccessTier, hasPermission } from "./access-policy.js";

function jsonContent(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function createSocialCommandServer(): McpServer {
  const server = new McpServer({
    name: "social-command-center",
    version: "1.0.0",
  });

  // ═══════════════════════════════════════════════════════════
  // RESOURCES — static read-only data that any AI can browse
  // ═══════════════════════════════════════════════════════════

  server.registerResource(
    "scc-platforms-all",
    "scc://platforms/all",
    {
      title: "All 24 Platforms",
      description: "Complete platform registry with CORS routing intelligence",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "scc://platforms/all",
          mimeType: "application/json",
          text: JSON.stringify(PLATFORMS, null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "scc-agents-all",
    "scc://agents/all",
    {
      title: "All 34 Agents",
      description: "Complete agent swarm registry with status and node assignments",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "scc://agents/all",
          mimeType: "application/json",
          text: JSON.stringify(AGENTS, null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "scc-feed-all",
    "scc://feed/all",
    {
      title: "Content Feed",
      description: "All posts with LLM provenance and engagement metrics",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "scc://feed/all",
          mimeType: "application/json",
          text: JSON.stringify(getFeed(), null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "scc-analytics",
    "scc://analytics/summary",
    {
      title: "Analytics Summary",
      description: "Aggregated reach, likes, and engagement metrics by LLM and platform",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "scc://analytics/summary",
          mimeType: "application/json",
          text: JSON.stringify(getFeedAnalytics(), null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "scc-access-policy",
    "scc://access/policy",
    {
      title: "Access Policy — Threshold of Trust",
      description: "Who can read, write, orchestrate, and post. Third parties: READ ONLY. No exceptions.",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "scc://access/policy",
          mimeType: "application/json",
          text: JSON.stringify(ACCESS_POLICY, null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "scc-cors-map",
    "scc://routing/cors",
    {
      title: "CORS Routing Map",
      description: "Which APIs can be called from browser vs which need backend proxy",
      mimeType: "application/json",
    },
    async () => {
      const allPlatforms = Object.values(PLATFORMS);
      const browserDirect = allPlatforms.filter((p) => p.corsSupport === "browser");
      const backendProxy = allPlatforms.filter((p) => p.corsSupport === "backend-proxy");
      const local = allPlatforms.filter((p) => p.corsSupport === "local");
      const notApplicable = allPlatforms.filter((p) => p.corsSupport === "n/a");

      return {
        contents: [
          {
            uri: "scc://routing/cors",
            mimeType: "application/json",
            text: JSON.stringify(
              {
                summary: `${browserDirect.length} browser-direct, ${backendProxy.length} backend-proxy, ${local.length} local, ${notApplicable.length} n/a`,
                browser_direct: browserDirect.map((p) => ({ id: p.id, label: p.label, api: p.api, notes: p.notes })),
                backend_proxy: backendProxy.map((p) => ({ id: p.id, label: p.label, api: p.api, notes: p.notes })),
                local: local.map((p) => ({ id: p.id, label: p.label, api: p.api, notes: p.notes })),
                not_applicable: notApplicable.map((p) => ({ id: p.id, label: p.label, api: p.api, notes: p.notes })),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // ═══════════════════════════════════════════════════════════
  // TOOLS — query and manage the social command center
  // ═══════════════════════════════════════════════════════════

  // ── READ TOOLS ─────────────────────────────────────────────

  server.registerTool(
    "scc.getDashboard",
    {
      title: "Get Dashboard",
      description: "Return a complete operational dashboard: KPIs, active agents, live posts, CORS routing summary",
    },
    async () => {
      const analytics = getFeedAnalytics();
      return jsonContent({
        kpis: {
          total_reach: analytics.totalReach,
          total_likes: analytics.totalLikes,
          live_posts: analytics.livePosts,
          queued_posts: analytics.queuedPosts,
          draft_posts: analytics.draftPosts,
          active_agents: `${getActiveAgentCount()}/${getAgentCount()}`,
          platform_count: getPlatformCount(),
        },
        cors_summary: {
          browser_direct: Object.values(PLATFORMS).filter((p) => p.corsSupport === "browser").map((p) => p.label),
          backend_proxy_count: Object.values(PLATFORMS).filter((p) => p.corsSupport === "backend-proxy").length,
          local_count: Object.values(PLATFORMS).filter((p) => p.corsSupport === "local").length,
        },
        top_posts_by_reach: getFeed()
          .filter((p) => p.status === "Live")
          .sort((a, b) => b.reach - a.reach)
          .slice(0, 5)
          .map((p) => ({ title: p.title, platform: p.platform, llm: p.llm, reach: p.reach })),
      });
    },
  );

  server.registerTool(
    "scc.getPlatform",
    {
      title: "Get Platform",
      description: "Return detailed info for a specific platform by ID",
      inputSchema: z.object({
        platform_id: z.string().describe("Platform ID (e.g. 'youtube', 'twitter', 'ebay')"),
      }),
    },
    async ({ platform_id }) => {
      const platform = PLATFORMS[platform_id];
      if (!platform) {
        throw new Error(`Unknown platform_id: ${platform_id}. Valid: ${Object.keys(PLATFORMS).join(", ")}`);
      }
      const posts = getFeedByPlatform(platform_id);
      return jsonContent({
        platform,
        post_count: posts.length,
        live_posts: posts.filter((p) => p.status === "Live").length,
        total_reach: posts.reduce((s, p) => s + p.reach, 0),
        posts,
      });
    },
  );

  server.registerTool(
    "scc.getPlatformsByType",
    {
      title: "Get Platforms By Type",
      description: "Return all platforms of a given type",
      inputSchema: z.object({
        type: z.enum(["social", "commerce", "llm", "dispatch", "infra"]).describe("Platform type filter"),
      }),
    },
    async ({ type }) => jsonContent(getPlatformsByType(type)),
  );

  server.registerTool(
    "scc.getAgents",
    {
      title: "Get Agents",
      description: "Return agents, optionally filtered by group or status",
      inputSchema: z.object({
        group: z.string().optional().describe("Agent group filter (e.g. 'Orchestrators', 'Watchers')"),
        status: z.enum(["active", "standby", "offline"]).optional().describe("Agent status filter"),
      }),
    },
    async ({ group, status }) => {
      let result = AGENTS;
      if (group) {
        result = result.filter((a) => a.group === group);
      }
      if (status) {
        result = result.filter((a) => a.status === status);
      }
      return jsonContent({
        count: result.length,
        agents: result,
      });
    },
  );

  server.registerTool(
    "scc.getFeed",
    {
      title: "Get Feed",
      description: "Return content feed, optionally filtered by platform, LLM, or status",
      inputSchema: z.object({
        platform: z.string().optional().describe("Filter by platform ID"),
        llm: z.string().optional().describe("Filter by LLM (opus, gemini, perplexity, grok, kimi, qwen)"),
        status: z.enum(["Live", "Queued", "Draft"]).optional().describe("Filter by post status"),
      }),
    },
    async ({ platform, llm, status }) => {
      let result = getFeed();
      if (platform) result = result.filter((p) => p.platform === platform);
      if (llm) result = result.filter((p) => p.llm === llm);
      if (status) result = result.filter((p) => p.status === status);
      return jsonContent({
        count: result.length,
        posts: result,
      });
    },
  );

  server.registerTool(
    "scc.getAnalytics",
    {
      title: "Get Analytics",
      description: "Return aggregated reach, engagement, and performance metrics across all posts",
    },
    async () => jsonContent(getFeedAnalytics()),
  );

  server.registerTool(
    "scc.getCorsMap",
    {
      title: "Get CORS Map",
      description: "Return which platforms support browser-direct API calls vs which require backend proxy",
    },
    async () => {
      const allPlatforms = Object.values(PLATFORMS);
      return jsonContent({
        browser_direct: allPlatforms
          .filter((p) => p.corsSupport === "browser")
          .map((p) => ({ id: p.id, label: p.label, notes: p.notes })),
        backend_proxy: allPlatforms
          .filter((p) => p.corsSupport === "backend-proxy")
          .map((p) => ({ id: p.id, label: p.label, notes: p.notes })),
        local: allPlatforms
          .filter((p) => p.corsSupport === "local")
          .map((p) => ({ id: p.id, label: p.label, notes: p.notes })),
        recommendation: "Route all 8 social platforms through FastAPI backend for unified logging, token management, and retry logic. Use browser-direct (Facebook, YouTube) only as development shortcut or fallback.",
      });
    },
  );
  server.registerTool(
    "scc.getAccessPolicy",
    {
      title: "Get Access Policy",
      description:
        "Return the Threshold of Trust access policy. " +
        "Shows who can read, write, orchestrate, and post. " +
        "Third parties: READ ONLY — no posting, no orchestrating, no touching ANTIGRAVITY.",
    },
    async () => jsonContent(ACCESS_POLICY),
  );

  server.registerTool(
    "scc.checkPermission",
    {
      title: "Check Permission",
      description: "Check an entity's access tier and permissions",
      inputSchema: z.object({
        entity_name: z.string().describe("Name of the AI/agent/entity to check"),
        permission: z
          .enum(["read", "write", "draft", "orchestrate", "post", "deploy", "delete"])
          .optional()
          .describe("Specific permission to check"),
      }),
    },
    async ({ entity_name, permission }) => {
      const tier = getAccessTier(entity_name);
      const result: Record<string, unknown> = {
        entity: entity_name,
        tier: tier.name,
        description: tier.description,
        permissions: tier.permissions,
      };
      if (permission) {
        result.has_permission = hasPermission(entity_name, permission);
        result.checked_permission = permission;
      }
      return jsonContent(result);
    },
  );

  // ── WRITE TOOLS ────────────────────────────────────────────

  server.registerTool(
    "scc.addPost",
    {
      title: "Add Post",
      description: "Add a new post to the content feed queue",
      inputSchema: z.object({
        platform: z.string().describe("Platform ID"),
        llm: z.string().describe("LLM that created the content"),
        agent: z.string().describe("Agent that dispatched the post"),
        title: z.string().describe("Post title or headline"),
        status: z.enum(["Live", "Queued", "Draft"]).default("Draft"),
        deployed: z.string().default("—").describe("Deploy date (YYYY-MM-DD) or '—' for undeployed"),
        tags: z.array(z.string()).default([]),
      }),
    },
    async ({ platform, llm, agent, title, status, deployed, tags }) => {
      if (!PLATFORMS[platform]) {
        throw new Error(`Unknown platform: ${platform}. Valid: ${Object.keys(PLATFORMS).join(", ")}`);
      }
      const post = addPost({
        platform,
        llm,
        agent,
        title,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        status,
        deployed,
        tags,
      });
      return jsonContent({ created: post });
    },
  );

  server.registerTool(
    "scc.updatePost",
    {
      title: "Update Post",
      description: "Update a post's status and/or engagement metrics",
      inputSchema: z.object({
        post_id: z.number().describe("Post ID"),
        status: z.enum(["Live", "Queued", "Draft"]).optional(),
        reach: z.number().optional(),
        likes: z.number().optional(),
        comments: z.number().optional(),
        shares: z.number().optional(),
      }),
    },
    async ({ post_id, status, reach, likes, comments, shares }) => {
      const updated = updatePostStatus(
        post_id,
        status ?? "Live",
        { reach, likes, comments, shares },
      );
      if (!updated) {
        throw new Error(`Post not found: ${post_id}`);
      }
      return jsonContent({ updated });
    },
  );

  return server;
}
