import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  applyDraftToCatalogProduct,
  getOperationsOverview,
  getUnifiedActivityLedger,
  listMarketplaceChannels,
  setMarketplaceChannelEnabled,
} from "../db";
import { validateListingPreflight } from "../operations";

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

const setChannelEnabledSchema = z.object({
  channelCode: z.enum([
    "ebay",
    "google_merchant",
    "facebook_marketplace",
    "mercari",
    "poshmark",
  ]),
  enabled: z.boolean(),
  operationMode: z.enum(["disabled", "review", "enabled"]).optional(),
});

const applyDraftSchema = z.object({
  productId: z.number().int().positive(),
  title: z.string().trim().max(255).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  categoryHint: z.string().trim().max(255).nullable().optional(),
  attributes: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        value: z.string().trim().max(500),
      })
    )
    .optional(),
});

export const operationsRouter = router({
  overview: protectedProcedure.query(async () => getOperationsOverview()),
  ledger: protectedProcedure.query(async () => getUnifiedActivityLedger()),
  channels: protectedProcedure.query(async () => listMarketplaceChannels()),
  setMarketplaceChannelEnabled: protectedProcedure
    .input(setChannelEnabledSchema)
    .mutation(({ input, ctx }) =>
      setMarketplaceChannelEnabled({ ...input, actorUserId: ctx.user.id })
    ),
  preflightListing: protectedProcedure
    .input(preflightSchema)
    .query(({ input }) => validateListingPreflight(input)),
  applyDraftToCatalog: protectedProcedure
    .input(applyDraftSchema)
    .mutation(({ input, ctx }) =>
      applyDraftToCatalogProduct({ ...input, actorUserId: ctx.user.id })
    ),
});
