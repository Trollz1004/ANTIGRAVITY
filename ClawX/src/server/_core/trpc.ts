import { initTRPC, TRPCError } from '@trpc/server';
import type { Request, Response } from 'express';

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
}

export interface Context {
  req: Request;
  res: Response;
  user: AuthUser | null;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
