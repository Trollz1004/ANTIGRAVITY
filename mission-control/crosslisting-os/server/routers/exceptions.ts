import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { listOpenExceptions, resolveException } from "../db";

const resolveExceptionInput = z.object({
  exceptionId: z.number().int().positive(),
  status: z.enum(["resolved", "dismissed"]).optional(),
  note: z.string().trim().max(2000).optional(),
});

export const exceptionsRouter = router({
  listOpen: protectedProcedure.query(() => listOpenExceptions()),
  resolveException: protectedProcedure
    .input(resolveExceptionInput)
    .mutation(({ input, ctx }) =>
      resolveException({ ...input, actorUserId: ctx.user.id })
    ),
  resolve: protectedProcedure
    .input(resolveExceptionInput)
    .mutation(({ input, ctx }) =>
      resolveException({ ...input, actorUserId: ctx.user.id })
    ),
});
