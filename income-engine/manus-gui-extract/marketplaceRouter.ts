import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as square from "./squarePayments";
import * as db from "./db";

export const marketplaceRouter = router({
  createPaymentLink: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      tier: z.enum(["bronze", "silver", "gold"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const leads = await db.getQualifiedFetcherLogs(ctx.user.id, 24);
      const lead = leads.find((l: any) => l.id === input.leadId);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

      try {
        const link = await square.createPaymentLink({
          tier: input.tier,
          leadId: lead.id,
          title: lead.title,
          source: lead.source,
          budget: lead.budget ?? undefined,
          url: lead.url,
          deliverable: lead.deliverable ?? undefined,
        });
        return link;
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Square payment link creation failed",
        });
      }
    }),

  getTiers: protectedProcedure.query(() => square.LEAD_TIERS),

  getRecentSales: protectedProcedure.query(async () => {
    try {
      return await square.listOrders(20);
    } catch {
      return [];
    }
  }),
});
