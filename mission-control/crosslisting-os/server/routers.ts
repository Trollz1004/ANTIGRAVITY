import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { operationsRouter } from "./routers/operations";
import { catalogRouter } from "./routers/catalog";
import { draftsRouter } from "./routers/drafts";
import { profilesRouter } from "./routers/profiles";
import { inventoryRouter } from "./routers/inventory";
import { listingsRouter } from "./routers/listings";
import { exceptionsRouter } from "./routers/exceptions";
import { salesRouter } from "./routers/sales";
import { approvalsRouter } from "./routers/approvals";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  operations: operationsRouter,
  catalog: catalogRouter,
  drafts: draftsRouter,
  profiles: profilesRouter,
  inventory: inventoryRouter,
  listings: listingsRouter,
  exceptions: exceptionsRouter,
  sales: salesRouter,
  approvals: approvalsRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
