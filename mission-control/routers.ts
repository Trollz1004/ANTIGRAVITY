import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as modelProvider from "./modelProvider";
import * as paperclipIntegration from "./paperclipIntegration";
import * as ollamaCloud from "./ollamaCloud";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Chat Sessions
  chat: router({
    createSession: protectedProcedure
      .input(z.object({ title: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return await db.createChatSession(ctx.user.id, input.title);
      }),

    listSessions: protectedProcedure.query(async ({ ctx }) => {
      return await db.getChatSessions(ctx.user.id);
    }),

    updateSession: protectedProcedure
      .input(z.object({ sessionId: z.number(), title: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateChatSession(input.sessionId, input.title);
      }),

    deleteSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteChatSession(input.sessionId);
      }),

    getMessages: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getChatMessages(input.sessionId);
      }),

    addMessage: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        provider: z.string(),
        model: z.string(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createChatMessage(
          input.sessionId,
          input.role,
          input.content,
          input.provider,
          input.model,
          input.metadata
        );
      }),
  }),

  // Model Provider
  models: router({
    getAvailable: protectedProcedure
      .input(z.object({ provider: z.string() }))
      .query(async ({ ctx, input }) => {
        return await modelProvider.getAvailableModels(
          ctx.user.id,
          input.provider as modelProvider.ModelProvider
        );
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        provider: z.string(),
        model: z.string(),
        messages: z.array(z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.string(),
        })),
        systemPrompt: z.string().optional(),
        sessionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const response = await modelProvider.sendChatMessage(
            ctx.user.id,
            input.provider as modelProvider.ModelProvider,
            input.model,
            input.messages,
            input.systemPrompt
          );

          // Store the assistant message in database
          await db.createChatMessage(
            input.sessionId,
            "assistant",
            response.content,
            response.provider,
            response.model,
            response.usage
          );

          return response;
        } catch (error) {
          console.error("Failed to send message:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to send message",
          });
        }
      }),
  }),

  // Provider Settings
  settings: router({
    getProviderConfigs: protectedProcedure.query(async ({ ctx }) => {
      return await db.getProviderConfigs(ctx.user.id);
    }),

    getProviderConfig: protectedProcedure
      .input(z.object({ provider: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getProviderConfig(ctx.user.id, input.provider);
      }),

    updateProviderConfig: protectedProcedure
      .input(z.object({
        provider: z.string(),
        apiKey: z.string().optional(),
        baseUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.upsertProviderConfig(
          ctx.user.id,
          input.provider,
          input.apiKey,
          input.baseUrl
        );
      }),
  }),

  // Paperclip Integration
  paperclip: router({
    connect: protectedProcedure
      .input(z.object({
        apiUrl: z.string(),
        apiKey: z.string(),
        companyId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const client = paperclipIntegration.createPaperclipClient({
            apiUrl: input.apiUrl,
            apiKey: input.apiKey,
            companyId: input.companyId,
          });

          // Verify connection by getting company info
          const company = await client.getCompany(input.companyId);

          // Store Paperclip config
          await db.upsertProviderConfig(
            ctx.user.id,
            "paperclip",
            input.apiKey,
            input.apiUrl
          );

          // TODO: Store companyId separately or in metadata

          return { success: true, company };
        } catch (error) {
          console.error("Failed to connect to Paperclip:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to connect to Paperclip",
          });
        }
      }),

    getAgents: protectedProcedure
      .input(z.object({ companyId: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          const config = await db.getProviderConfig(ctx.user.id, "paperclip");
          if (!config) throw new Error("Paperclip not configured");

          const client = paperclipIntegration.createPaperclipClient({
            apiUrl: config.baseUrl || "",
            apiKey: config.apiKey || "",
            companyId: input.companyId,
          });

          return await client.getAgents(input.companyId);
        } catch (error) {
          console.error("Failed to get agents:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get agents",
          });
        }
      }),

    getTasks: protectedProcedure
      .input(z.object({ companyId: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          const config = await db.getProviderConfig(ctx.user.id, "paperclip");
          if (!config) throw new Error("Paperclip not configured");

          const client = paperclipIntegration.createPaperclipClient({
            apiUrl: config.baseUrl || "",
            apiKey: config.apiKey || "",
            companyId: input.companyId,
          });

          // TODO: Implement task listing in Paperclip client
          return [];
        } catch (error) {
          console.error("Failed to get tasks:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to get tasks",
          });
        }
      }),

    delegateTask: protectedProcedure
      .input(z.object({
        companyId: z.string(),
        taskId: z.string(),
        agentId: z.string(),
        context: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const config = await db.getProviderConfig(ctx.user.id, "paperclip");
          if (!config) throw new Error("Paperclip not configured");

          const client = paperclipIntegration.createPaperclipClient({
            apiUrl: config.baseUrl || "",
            apiKey: config.apiKey || "",
            companyId: input.companyId,
          });

          return await client.delegateTask(
            input.companyId,
            input.taskId,
            input.agentId,
            input.context
          );
        } catch (error) {
          console.error("Failed to delegate task:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delegate task",
          });
        }
      }),
  }),

  // Ollama Cloud Integration
  ollamaCloud: router({
    listModels: protectedProcedure.query(async ({ ctx }) => {
      try {
        const config = await db.getProviderConfig(ctx.user.id, "ollama");
        if (!config || !config.apiKey) {
          return [];
        }

        const client = ollamaCloud.createOllamaCloudClient({
          apiKey: config.apiKey,
          endpoint: config.baseUrl || "https://ollama.com/v1",
        });

        return await client.listModels();
      } catch (error) {
        console.error("Failed to list Ollama Cloud models:", error);
        return [];
      }
    }),

    validateKey: protectedProcedure
      .input(z.object({
        apiKey: z.string(),
        endpoint: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const isValid = await ollamaCloud.validateOllamaCloudKey(
            input.apiKey,
            input.endpoint
          );
          return { valid: isValid };
        } catch (error) {
          return { valid: false };
        }
      }),
  }),

  // Manus API Integration
  manus: router({
    createTask: protectedProcedure
      .input(z.object({
        taskId: z.string(),
        prompt: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createManusTask(ctx.user.id, input.taskId, input.prompt);
      }),

    updateTaskStatus: protectedProcedure
      .input(z.object({
        taskId: z.string(),
        status: z.enum(["pending", "running", "completed", "failed", "stopped"]),
        result: z.string().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.updateManusTaskStatus(
          input.taskId,
          input.status,
          input.result,
          input.metadata
        );
      }),

    getTask: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getManusTask(input.taskId);
      }),

    listTasks: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserManusTasks(ctx.user.id);
    }),
  }),

  // FETCHER Agent
  fetcher: router({
    getQualifiedLeads: protectedProcedure
      .input(z.object({ hoursAgo: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getQualifiedFetcherLogs(ctx.user.id, input.hoursAgo || 24);
      }),

    logLead: protectedProcedure
      .input(z.object({
        source: z.string(),
        title: z.string(),
        url: z.string(),
        budget: z.number().optional(),
        postedAt: z.date().optional(),
        deliverable: z.string().optional(),
        estimatedHourlyRate: z.number().optional(),
        qualified: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createFetcherLog({
          userId: ctx.user.id,
          ...input,
        });
      }),

    scanForLeads: protectedProcedure
      .mutation(async ({ ctx }) => {
        try {
          // TODO: Implement FETCHER scanning logic
          // This will scan Reddit, Upwork, Fiverr for leads
          return {
            success: true,
            message: "Lead scan initiated",
            leadsFound: 0,
          };
        } catch (error) {
          console.error("Failed to scan for leads:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to scan for leads",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
