// /api/auth/me — Returns the current authenticated user or 401

export async function onRequestGet(context) {
  const { env, request } = context;

  const cookies = request.headers.get('Cookie') || '';
  const sessionCookie = cookies.split(';').map(c => c.trim()).find(c => c.startsWith('ag_session='));

  if (!sessionCookie) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const sessionToken = sessionCookie.split('=').slice(1).join('=');
  const parts = sessionToken.split('.');

  if (parts.length !== 2) {
    return new Response(JSON.stringify({ authenticated: false, error: 'invalid_token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = atob(parts[0]);
    const signature = parts[1];

    // Verify signature
    const isValid = await verifyPayload(payload, signature, env.SESSION_SECRET);
    if (!isValid) {
      return new Response(JSON.stringify({ authenticated: false, error: 'invalid_signature' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = JSON.parse(payload);

    // Check expiration
    if (data.exp && Date.now() > data.exp) {
      return new Response(JSON.stringify({ authenticated: false, error: 'expired' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'ag_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
        }
      });
    }

    // Verify user is still Trollz1004
    if (data.user !== 'Trollz1004') {
      return new Response(JSON.stringify({ authenticated: false, error: 'unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'ag_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
        }
      });
    }

    return new Response(JSON.stringify({
      authenticated: true,
      user: data.user,
      avatar: data.avatar,
      name: data.name
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ authenticated: false, error: 'parse_error' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function verifyPayload(payload, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
  return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload));
}
