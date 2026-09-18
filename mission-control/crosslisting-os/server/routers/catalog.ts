import { z } from "zod";
import { createCatalogProduct, listCatalogProducts, verifyCatalogProduct } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const catalogInput = z.object({
  sku: z.string().trim().min(2).max(128),
  upc: z.string().trim().max(32).optional(),
  title: z.string().trim().min(3).max(255),
  condition: z.string().trim().min(2).max(64),
  brandOrStudio: z.string().trim().max(160).optional(),
  format: z.string().trim().max(80).optional(),
  description: z.string().trim().max(5000).optional(),
});

export const catalogRouter = router({
  list: protectedProcedure.query(() => listCatalogProducts()),
  create: protectedProcedure.input(catalogInput).mutation(({ input, ctx }) =>
    createCatalogProduct({ ...input, actorUserId: ctx.user.id })
  ),
  verify: protectedProcedure.input(z.object({ productId: z.number().int().positive() })).mutation(({ input, ctx }) =>
    verifyCatalogProduct(input.productId, ctx.user.id)
  ),
});
