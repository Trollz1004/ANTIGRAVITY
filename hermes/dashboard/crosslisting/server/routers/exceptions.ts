import { listOpenExceptions } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const exceptionsRouter = router({
  listOpen: protectedProcedure.query(() => listOpenExceptions()),
});
