import { router, protectedProcedure } from "../_core/trpc";
import { getOperationsOverview, getUnifiedActivityLedger } from "../db";
import { buildSafeChannelStatus, validateListingPreflight } from "../operations";
import { z } from "zod";

const preflightSchema = z.object({
  verificationStatus: z.enum(["needs_review", "verified", "blocked"]),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().nullable().optional(),
  availableQuantity: z.number().int().nonnegative().nullable().optional(),
  imageCount: z.number().int().nonnegative().nullable().optional(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]),
  capability: z.enum(["api", "conditional", "prepared"]),
  channelEnabled: z.boolean(),
});

export const operationsRouter = router({
  overview: protectedProcedure.query(async () => getOperationsOverview()),
  ledger: protectedProcedure.query(async () => getUnifiedActivityLedger()),
  channels: protectedProcedure.query(() => buildSafeChannelStatus()),
  preflightListing: protectedProcedure.input(preflightSchema).query(({ input }) => validateListingPreflight(input)),
});
