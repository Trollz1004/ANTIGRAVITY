import { withSupabase } from '@supabase/server';

/**
 * Public health/smoke handler for @supabase/server wiring.
 *
 * If deployed as a Supabase Edge Function with `auth: 'none'`, add this to
 * supabase/config.toml for the function:
 *
 * [functions.supabase-health]
 * verify_jwt = false
 */
export default {
  fetch: withSupabase({ auth: 'none' }, async (_req, ctx) => {
    return Response.json({
      ok: true,
      authMode: ctx.authMode,
      hasUserClaims: Boolean(ctx.userClaims),
    });
  }),
};
