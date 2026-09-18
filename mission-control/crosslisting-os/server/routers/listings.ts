import { z } from "zod";
import { createListingPayloadPreview } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const listingsRouter = router({
  preview: protectedProcedure
    .input(z.object({ productId: z.number().int().positive(), channelCode: z.enum(["ebay", "google_merchant", "facebook_marketplace", "mercari", "poshmark"]), price: z.number().positive().max(1000000) }))
    .mutation(({ input, ctx }) => createListingPayloadPreview({ ...input, actorUserId: ctx.user.id })),
});
