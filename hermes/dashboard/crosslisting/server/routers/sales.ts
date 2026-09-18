import { z } from "zod";
import { ingestChannelSaleEvent } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const salesRouter = router({
  ingest: protectedProcedure.input(z.object({
    channelCode: z.enum(["ebay", "google_merchant", "facebook_marketplace", "mercari", "poshmark"]),
    externalEventId: z.string().trim().min(1).max(160),
    externalListingId: z.string().trim().min(1).max(160),
    quantity: z.number().int().positive().max(10000),
    occurredAt: z.coerce.date(),
    details: z.record(z.string(), z.unknown()).optional(),
  })).mutation(({ input, ctx }) => ingestChannelSaleEvent({ ...input, actorUserId: ctx.user.id })),
});
