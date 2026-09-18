import { z } from "zod";
import { listInventoryRecords, moveInventory } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const inventoryRouter = router({
  list: protectedProcedure.query(() => listInventoryRecords()),
  move: protectedProcedure
    .input(z.object({ productId: z.number().int().positive(), movementType: z.enum(["receive", "reserve", "release", "sale"]), quantity: z.number().int().positive().max(10000) }))
    .mutation(({ input, ctx }) => moveInventory({ ...input, actorUserId: ctx.user.id })),
});
