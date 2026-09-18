import { z } from "zod";
import { createAutomationProfile, listAutomationProfiles } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const profileInput = z.object({
  name: z.string().trim().min(3).max(120),
  purpose: z.string().trim().min(10).max(5000),
  memorySummary: z.string().trim().max(3000).optional(),
  skillKeys: z.array(z.string().trim().min(1).max(80)).max(12),
  allowedActions: z.array(z.enum(["prepare", "validate", "route", "draft"])) .min(1).max(4),
  channelScope: z.array(z.enum(["ebay", "google_merchant", "facebook_marketplace", "mercari", "poshmark"])) .min(1).max(5),
});

export const profilesRouter = router({
  list: protectedProcedure.query(() => listAutomationProfiles()),
  create: protectedProcedure.input(profileInput).mutation(({ input, ctx }) => createAutomationProfile({ ...input, actorUserId: ctx.user.id })),
});
