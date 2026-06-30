import { withSupabase } from '@supabase/server';

/**
 * Example @supabase/server request handler.
 *
 * Runtime: Web Fetch API (Supabase Edge Functions, Cloudflare Workers,
 * Bun/Deno workers, or any adapter that accepts `export default { fetch }`).
 *
 * Required runtime environment variables, set in the hosting platform only:
 * - SUPABASE_URL
 * - SUPABASE_PUBLISHABLE_KEY
 * - SUPABASE_SECRET_KEY
 * - SUPABASE_JWKS_URL
 *
 * Do not import this from client components. `ctx.supabase` is RLS-scoped to
 * the caller's JWT; `ctx.supabaseAdmin` bypasses RLS and must stay server-only.
 */
export default {
  fetch: withSupabase({ auth: 'user' }, async (_req, ctx) => {
    const { data, error } = await ctx.supabase.from('todos').select();

    if (error) {
      return Response.json(
        { message: error.message, code: error.code },
        { status: 500 },
      );
    }

    return Response.json(data);
  }),
};
