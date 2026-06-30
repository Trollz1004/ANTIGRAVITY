import { withSupabase } from '@supabase/server';

type Env = {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_JWKS_URL?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
};

export const onRequest = ({ request, env }: PagesContext) => {
  const supabaseUrl = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    env.SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secretKey = env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !publishableKey || !secretKey) {
    return Response.json(
      { ok: false, error: 'Missing Supabase server environment' },
      { status: 500 },
    );
  }

  return withSupabase(
    {
      auth: 'publishable',
      cors: false,
      env: {
        url: supabaseUrl,
        publishableKeys: { default: publishableKey },
        secretKeys: { default: secretKey },
        jwks: env.SUPABASE_JWKS_URL ? new URL(env.SUPABASE_JWKS_URL) : null,
      },
    },
    async (_req, ctx) =>
      Response.json({
        ok: true,
        authMode: ctx.authMode,
        authKeyName: ctx.authKeyName ?? null,
        hasUserClaims: Boolean(ctx.userClaims),
      }),
  )(request);
};
