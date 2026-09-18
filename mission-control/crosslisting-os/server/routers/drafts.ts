import { z } from "zod";
import { createReviewOnlyDraft } from "../drafts";
import { recordOperationsActivity } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const draftInput = z.object({
  kind: z.enum(["title", "description", "category_attributes"]),
  factualRecord: z.string().trim().min(10).max(12000),
  reviewAcknowledgement: z.literal(true),
});

export const draftsRouter = router({
  create: protectedProcedure.input(draftInput).mutation(async ({ input, ctx }) => {
    const correlationId = `draft-${ctx.user.id}-${Date.now()}`;
    try {
      const draft = await createReviewOnlyDraft(input);
      await recordOperationsActivity({
        category: "listing",
        action: "review_only_ai_draft_created",
        subjectType: "draft",
        actorUserId: ctx.user.id,
        correlationId,
        outcome: "succeeded",
        details: { kind: input.kind, needsReview: true, warningCount: draft.warnings.length },
      });
      return draft;
    } catch (error) {
      await recordOperationsActivity({
        category: "listing",
        action: "review_only_ai_draft_failed",
        subjectType: "draft",
        actorUserId: ctx.user.id,
        correlationId,
        outcome: "failed",
        details: { kind: input.kind },
      });
      throw error;
    }
  }),
});
