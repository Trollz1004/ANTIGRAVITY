// /api/auth/callback — Handles GitHub OAuth callback
// Exchanges code for token, verifies username === "Trollz1004", sets signed session cookie

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');

  // Parse cookies
  const cookies = request.headers.get('Cookie') || '';
  const stateCookie = cookies.split(';').map(c => c.trim()).find(c => c.startsWith('gh_oauth_state='));
  const savedState = stateCookie ? stateCookie.split('=')[1] : null;

  // Clear state cookie in all responses
  const clearStateCookie = 'gh_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

  // Validate CSRF state
  if (!savedState || savedState !== returnedState) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${origin}?error=csrf_mismatch`,
        'Set-Cookie': clearStateCookie
      }
    });
  }

  if (!code) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${origin}?error=no_code`,
        'Set-Cookie': clearStateCookie
      }
    });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ANTIGRAVITY-Mission-Control'
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: `${origin}/api/auth/callback`,
        state: returnedState
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${origin}?error=token_exchange_failed`,
          'Set-Cookie': clearStateCookie
        }
      });
    }

    // Fetch GitHub user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'ANTIGRAVITY-Mission-Control'
      }
    });

    const userData = await userResponse.json();

    // HARDCODED AUTH CHECK: Only allow Trollz1004
    if (userData.login !== 'Trollz1004') {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${origin}?error=unauthorized&user=${encodeURIComponent(userData.login || 'unknown')}`,
          'Set-Cookie': clearStateCookie
        }
      });
    }

    // Create signed session token
    const sessionPayload = JSON.stringify({
      user: userData.login,
      avatar: userData.avatar_url,
      name: userData.name || userData.login,
      iat: Date.now(),
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    });

    const signature = await signPayload(sessionPayload, env.SESSION_SECRET);
    const sessionToken = btoa(sessionPayload) + '.' + signature;

    // Set session cookie and redirect to dashboard
    return new Response(null, {
      status: 302,
      headers: new Headers([
        ['Location', origin + '/'],
        ['Set-Cookie', clearStateCookie],
        ['Set-Cookie', `ag_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`]
      ])
    });

  } catch (error) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${origin}?error=server_error`,
        'Set-Cookie': clearStateCookie
      }
    });
  }
}

// HMAC-SHA256 signing using Web Crypto API
async function signPayload(payload, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
