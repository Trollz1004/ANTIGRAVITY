import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import type { User } from "../../drizzle/schema";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/** Local owner used when AUTH_DISABLED=1 — Mission Control embed needs no login. */
export const LOCAL_OWNER: User = {
  id: 1,
  openId: "local-owner",
  name: "Local Owner",
  email: "owner@local",
  loginMethod: "local",
  role: "admin",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  lastSignedIn: new Date(),
};

export function authDisabled(): boolean {
  const v = (process.env.AUTH_DISABLED || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;
  const user = ctx.user ?? (authDisabled() ? LOCAL_OWNER : null);

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const user = ctx.user ?? (authDisabled() ? LOCAL_OWNER : null);

    if (!user || user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  }),
);
