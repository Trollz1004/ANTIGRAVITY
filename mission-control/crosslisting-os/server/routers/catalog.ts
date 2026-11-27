import { z } from "zod";
import {
  addProductMedia,
  createCatalogProduct,
  listCatalogProducts,
  updateCatalogProduct,
  verifyCatalogProduct,
  verifyProductMedia,
} from "../db";
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

const catalogUpdateInput = z.object({
  productId: z.number().int().positive(),
  sku: z.string().trim().min(2).max(128).optional(),
  upc: z.string().trim().max(32).nullable().optional(),
  title: z.string().trim().min(3).max(255).optional(),
  condition: z.string().trim().min(2).max(64).optional(),
  conditionNotes: z.string().trim().max(2000).nullable().optional(),
  brandOrStudio: z.string().trim().max(160).nullable().optional(),
  format: z.string().trim().max(80).nullable().optional(),
  attributes: z.record(z.string(), z.unknown()).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
});

const catalogAddMediaInput = z.object({
  productId: z.number().int().positive(),
  url: z.string().trim().url().max(2048),
  altText: z.string().trim().max(255).nullable().optional(),
  mediaType: z.enum(["image", "video", "document"]).optional(),
  isPrimary: z.boolean().optional(),
});

const catalogVerifyMediaInput = z.object({
  mediaId: z.number().int().positive(),
  productId: z.number().int().positive().optional(),
});

export const catalogRouter = router({
  list: protectedProcedure.query(() => listCatalogProducts()),
  create: protectedProcedure
    .input(catalogInput)
    .mutation(({ input, ctx }) =>
      createCatalogProduct({ ...input, actorUserId: ctx.user.id })
    ),
  update: protectedProcedure
    .input(catalogUpdateInput)
    .mutation(({ input, ctx }) =>
      updateCatalogProduct({ ...input, actorUserId: ctx.user.id })
    ),
  verify: protectedProcedure
    .input(z.object({ productId: z.number().int().positive() }))
    .mutation(({ input, ctx }) =>
      verifyCatalogProduct(input.productId, ctx.user.id)
    ),
  addMedia: protectedProcedure
    .input(catalogAddMediaInput)
    .mutation(({ input, ctx }) =>
      addProductMedia({ ...input, actorUserId: ctx.user.id })
    ),
  verifyMedia: protectedProcedure
    .input(catalogVerifyMediaInput)
    .mutation(({ input, ctx }) =>
      verifyProductMedia({
        mediaId: input.mediaId,
        productId: input.productId,
        actorUserId: ctx.user.id,
      })
    ),
});
