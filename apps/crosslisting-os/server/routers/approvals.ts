import { z } from "zod";
import { decideApprovalRequest, requestListingApproval } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const approvalsRouter = router({
  requestListing: protectedProcedure.input(z.object({ listingId: z.number().int().positive() })).mutation(({ input, ctx }) => requestListingApproval(input.listingId, ctx.user.id)),
  decide: protectedProcedure.input(z.object({ approvalId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]), note: z.string().max(2000).optional() })).mutation(({ input, ctx }) => decideApprovalRequest({ ...input, actorUserId: ctx.user.id })),
});
