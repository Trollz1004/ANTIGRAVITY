// /api/auth/login — Redirects user to GitHub OAuth authorization page

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const origin = url.origin;

  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response(JSON.stringify({ error: 'GITHUB_CLIENT_ID not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Generate CSRF state token
  const state = crypto.randomUUID();
  const redirectUri = `${origin}/api/auth/callback`;

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', 'read:user');
  githubAuthUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': githubAuthUrl.toString(),
      'Set-Cookie': `gh_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    }
  });
}
