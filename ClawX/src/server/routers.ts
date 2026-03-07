import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { callProvider } from "./ai-providers";
import {
  createProposal,
  getProposals,
  getProposal,
  castVote,
  getVotesForProposal,
  getGovernanceStats,
  VOTERS,
  TIER_CONFIG,
} from "./governance";
import {
  createConversation,
  getConversations,
  getConversation,
  updateConversationTitle,
  deleteConversation,
  addMessage,
  getMessages,
  addUsageLog,
  getUsageStats,
  getUsageTimeline,
} from "./db";
import {
  saveUserApiKey,
  deleteUserApiKey,
  getUserApiKeyMeta,
  getUserApiKeys,
} from "./api-keys";
import { AI_PROVIDER_SLUGS, PROVIDER_CONFIGS } from "../shared/ai-providers";
import type { AiProviderSlug, ChatMessage } from "../shared/ai-providers";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── API Key Management (per-user, encrypted server-side) ──────
  apiKeys: router({
    /**
     * List stored key metadata for the current user.
     * Returns hints only — plaintext keys are NEVER sent to the frontend.
     */
    list: protectedProcedure.query(({ ctx }) => getUserApiKeyMeta(ctx.user.id)),

    /**
     * Save or update a key for a specific provider.
     * The plaintext key is encrypted before storage.
     */
    save: protectedProcedure
      .input(
        z.object({
          providerSlug: z.enum(AI_PROVIDER_SLUGS),
          key: z.string().min(8, "API key must be at least 8 characters"),
          label: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await saveUserApiKey(ctx.user.id, input.providerSlug, input.key, input.label);
        return { success: true };
      }),

    /**
     * Delete a stored key for a specific provider.
     */
    delete: protectedProcedure
      .input(z.object({ providerSlug: z.enum(AI_PROVIDER_SLUGS) }))
      .mutation(async ({ ctx, input }) => {
        await deleteUserApiKey(ctx.user.id, input.providerSlug);
        return { success: true };
      }),
  }),

  // ─── Conversations ─────────────────────────────────────────────
  conversations: router({
    list: protectedProcedure.query(({ ctx }) => getConversations(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => getConversation(input.id, ctx.user.id)),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().optional(),
          mode: z.enum(["single", "broadcast"]).default("single"),
          selectedProviders: z.array(z.string()).optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createConversation({
          userId: ctx.user.id,
          title: input.title ?? "New Chat",
          mode: input.mode,
          selectedProviders: input.selectedProviders,
        })
      ),

    updateTitle: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string() }))
      .mutation(({ input }) => updateConversationTitle(input.id, input.title)),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteConversation(input.id)),
  }),

  // ─── Messages ──────────────────────────────────────────────────
  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(({ input }) => getMessages(input.conversationId)),

    send: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string().min(1),
          providers: z.array(z.enum(AI_PROVIDER_SLUGS)).min(1),
          modelOverrides: z.record(z.string(), z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Load user's stored API keys (decrypted, server-side only)
        const userApiKeys = await getUserApiKeys(ctx.user.id);

        // Save user message
        await addMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
        });

        // Get conversation history for context
        const history = await getMessages(input.conversationId);
        const chatMessages: ChatMessage[] = history.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }));

        // Call all selected providers in parallel, injecting user keys
        const results = await Promise.allSettled(
          input.providers.map(async (slug) => {
            const modelOverride: string | undefined = input.modelOverrides?.[slug];
            const response = await callProvider(slug, chatMessages, userApiKeys, modelOverride);

            // Save assistant message
            await addMessage({
              conversationId: input.conversationId,
              role: "assistant",
              content: response.error
                ? `[Error from ${slug}]: ${response.error}`
                : response.content,
              providerSlug: slug,
              model: response.model,
              inputTokens: response.inputTokens,
              outputTokens: response.outputTokens,
              responseTimeMs: response.responseTimeMs,
            });

            // Log usage
            const config = PROVIDER_CONFIGS[slug];
            const cost =
              (response.inputTokens * (config?.costPerInputToken ?? 0)) / 1000 +
              (response.outputTokens * (config?.costPerOutputToken ?? 0)) / 1000;

            await addUsageLog({
              userId: ctx.user.id,
              providerSlug: slug,
              model: response.model,
              inputTokens: response.inputTokens,
              outputTokens: response.outputTokens,
              responseTimeMs: response.responseTimeMs,
              estimatedCost: cost.toFixed(6),
            });

            return { slug, ...response };
          })
        );

        return results.map((r, i) => {
          if (r.status === "fulfilled") return r.value;
          return {
            slug: input.providers[i],
            content: "",
            inputTokens: 0,
            outputTokens: 0,
            responseTimeMs: 0,
            model: "unknown",
            error: r.reason instanceof Error ? r.reason.message : "Unknown error",
          };
        });
      }),
  }),

  // ─── Providers ─────────────────────────────────────────────────
  providers: router({
    /**
     * List all providers with availability status.
     * Checks both env vars AND user-stored keys.
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      const userKeyMeta = await getUserApiKeyMeta(ctx.user.id);
      const userKeyMap = new Map(userKeyMeta.map((k) => [k.providerSlug, k]));

      return AI_PROVIDER_SLUGS.map((slug) => {
        const config = PROVIDER_CONFIGS[slug];
        const hasEnvKey = checkEnvKey(slug);
        const userKey = userKeyMap.get(slug);
        const hasUserKey = !!(userKey?.isActive);
        const hasKey = hasEnvKey || hasUserKey;

        return {
          ...config,
          isAvailable: hasKey,
          status: hasKey ? ("ready" as const) : ("no-key" as const),
          keySource: hasUserKey ? ("user" as const) : hasEnvKey ? ("env" as const) : ("none" as const),
          keyHint: userKey?.keyHint ?? null,
        };
      });
    }),
  }),

  // ─── Analytics ─────────────────────────────────────────────────
  analytics: router({
    stats: protectedProcedure.query(({ ctx }) => getUsageStats(ctx.user.id)),

    timeline: protectedProcedure
      .input(z.object({ days: z.number().min(1).max(90).default(7) }))
      .query(({ ctx, input }) => getUsageTimeline(ctx.user.id, input.days)),
  }),

  // ─── JoshuaCLAW Governance ────────────────────────────────────
  governance: router({
    voters: publicProcedure.query(() => VOTERS),
    tiers: publicProcedure.query(() => TIER_CONFIG),
    stats: protectedProcedure.query(() => getGovernanceStats()),

    proposals: router({
      list: protectedProcedure
        .input(z.object({ status: z.string().optional() }).optional())
        .query(({ input }) => getProposals(input?.status)),

      get: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(({ input }) => getProposal(input.id)),

      create: protectedProcedure
        .input(
          z.object({
            title: z.string().min(1),
            description: z.string().min(1),
            tier: z.enum(["critical", "operational"]),
            category: z.string().min(1),
            proposedBy: z.string().min(1),
          })
        )
        .mutation(({ input }) => createProposal(input)),
    }),

    votes: router({
      list: protectedProcedure
        .input(z.object({ proposalId: z.number() }))
        .query(({ input }) => getVotesForProposal(input.proposalId)),

      cast: protectedProcedure
        .input(
          z.object({
            proposalId: z.number(),
            voterSlug: z.string().min(1),
            vote: z.enum(["approve", "reject"]),
            reasoning: z.string().optional(),
          })
        )
        .mutation(({ input }) => castVote(input)),
    }),
  }),
});

/** Check if an env-level API key is configured for a provider */
function checkEnvKey(slug: AiProviderSlug): boolean {
  switch (slug) {
    case "manus":
      return true; // Always available via built-in LLM
    case "claude":
      return !!process.env.ANTHROPIC_API_KEY;
    case "gemini":
      return !!process.env.GEMINI_API_KEY;
    case "perplexity":
      return !!process.env.SONAR_API_KEY;
    case "grok":
      return !!process.env.XAI_API_KEY;
    case "codex":
      return !!process.env.OPENAI_API_KEY;
    default:
      return false;
  }
}

export type AppRouter = typeof appRouter;
