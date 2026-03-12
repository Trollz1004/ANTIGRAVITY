const UPSTREAM_BASE = 'https://dateapp-backend-io5tscl75a-ue.a.run.app/api';

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}

function textResponse(message, status = 500) {
  return jsonResponse({ detail: message }, status);
}

function normalizeErrorPayload(payload, fallback) {
  if (!payload || typeof payload !== 'object') {
    return { detail: fallback };
  }
  return {
    detail: payload.detail || payload.message || fallback,
    ...payload,
  };
}

async function upstreamJson(path, init = {}) {
  const response = await fetch(`${UPSTREAM_BASE}${path}`, init);
  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      payload: normalizeErrorPayload(
        typeof payload === 'object' ? payload : null,
        typeof payload === 'string' && payload ? payload : response.statusText,
      ),
    };
  }

  return {
    ok: true,
    status: response.status,
    payload,
  };
}

function getBearerToken(request) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim();
}

function authHeaders(request, extra = {}) {
  const headers = { ...extra };
  const auth = request.headers.get('authorization');
  if (auth) headers.authorization = auth;
  return headers;
}

function buildCurrentUser(authUser, profile) {
  const email = authUser?.email || '';
  const fallbackName = email.includes('@') ? email.split('@')[0] : 'You';
  return {
    user_id: authUser?.id || null,
    email,
    display_name: profile?.first_name || fallbackName,
    bot_shield_verified: Boolean(authUser?.is_verified),
    subscription_tier: authUser?.is_premium ? 'premium' : null,
    subscription_active: Boolean(authUser?.is_premium),
    has_profile: Boolean(profile),
  };
}

function mapProfileCard(card) {
  return {
    user_id: card.user_id,
    display_name: card.first_name,
    bio: card.bio,
    age: card.age,
    photos: Array.isArray(card.photos) ? card.photos : [],
    interests: [],
    location: card.distance_km == null ? null : `${Math.round(card.distance_km)} km away`,
    verified: false,
    subscription_active: false,
  };
}

function mapConversation(conversation) {
  return {
    match_id: conversation.match_id,
    user_id: conversation.partner_id,
    display_name: conversation.partner_name,
    photos: conversation.partner_photo ? [conversation.partner_photo] : [],
    matched_at: conversation.created_at,
    last_message_at: conversation.last_message_at,
  };
}

function mapMessage(message) {
  return {
    id: message.id,
    sender_id: message.sender_id,
    content: message.content,
    created_at: message.created_at,
  };
}

async function fetchAuthMe(request) {
  return upstreamJson('/auth/me', {
    headers: authHeaders(request),
  });
}

async function fetchMyProfile(request) {
  return upstreamJson('/profiles/me', {
    headers: authHeaders(request),
  });
}

async function handleRegister(request) {
  const body = await request.json();
  const registerResult = await upstreamJson('/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      phone: null,
    }),
  });

  if (!registerResult.ok) {
    return jsonResponse(registerResult.payload, registerResult.status);
  }

  const loginBody = new URLSearchParams();
  loginBody.set('username', body.email);
  loginBody.set('password', body.password);

  const loginResult = await upstreamJson('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: loginBody.toString(),
  });

  if (!loginResult.ok) {
    return jsonResponse(loginResult.payload, loginResult.status);
  }

  const authMe = await upstreamJson('/auth/me', {
    headers: { authorization: `Bearer ${loginResult.payload.access_token}` },
  });

  return jsonResponse({
    access_token: loginResult.payload.access_token,
    refresh_token: loginResult.payload.refresh_token,
    user_id: authMe.ok ? authMe.payload.id : null,
  });
}

async function handleLogin(request) {
  const body = await request.json();
  const form = new URLSearchParams();
  form.set('username', body.email);
  form.set('password', body.password);

  const loginResult = await upstreamJson('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  if (!loginResult.ok) {
    return jsonResponse(loginResult.payload, loginResult.status);
  }

  const authMe = await upstreamJson('/auth/me', {
    headers: { authorization: `Bearer ${loginResult.payload.access_token}` },
  });

  return jsonResponse({
    access_token: loginResult.payload.access_token,
    refresh_token: loginResult.payload.refresh_token,
    user_id: authMe.ok ? authMe.payload.id : null,
  });
}

async function handleAuthMe(request) {
  const authUser = await fetchAuthMe(request);
  if (!authUser.ok) {
    return jsonResponse(authUser.payload, authUser.status);
  }

  const profile = await fetchMyProfile(request);
  return jsonResponse(buildCurrentUser(authUser.payload, profile.ok ? profile.payload : null));
}

async function handleRefresh(request) {
  const body = await request.json().catch(() => ({}));
  const refreshToken = body.refresh_token;
  if (!refreshToken) {
    return textResponse('Missing refresh token', 400);
  }

  const result = await upstreamJson(`/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
    method: 'POST',
  });
  return jsonResponse(result.payload, result.status);
}

function deriveBirthDate(age) {
  const numericAge = Number(age);
  if (!Number.isFinite(numericAge) || numericAge < 18) {
    return '2000-01-01';
  }
  const today = new Date();
  return `${today.getUTCFullYear() - Math.trunc(numericAge)}-01-01`;
}

async function handleProfileSave(request) {
  const body = await request.json();
  const currentProfile = await fetchMyProfile(request);

  if (currentProfile.ok) {
    const patchResult = await upstreamJson('/profiles/me', {
      method: 'PATCH',
      headers: {
        ...authHeaders(request),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        first_name: body.display_name || undefined,
        bio: body.bio || null,
        looking_for: body.looking_for || null,
      }),
    });
    return jsonResponse(patchResult.payload, patchResult.status);
  }

  const createResult = await upstreamJson('/profiles/', {
    method: 'POST',
    headers: {
      ...authHeaders(request),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      first_name: body.display_name || 'You',
      birth_date: deriveBirthDate(body.age),
      gender: body.gender || 'other',
      bio: body.bio || null,
      looking_for: body.looking_for || null,
    }),
  });

  return jsonResponse(createResult.payload, createResult.status);
}

async function handleDiscover(request, url) {
  const qs = url.searchParams.toString();
  const result = await upstreamJson(`/profiles/discover${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(request),
  });

  if (!result.ok) {
    return jsonResponse(result.payload, result.status);
  }

  return jsonResponse((result.payload || []).map(mapProfileCard));
}

async function handleSwipe(request) {
  const body = await request.json();
  const result = await upstreamJson('/matches/swipe', {
    method: 'POST',
    headers: {
      ...authHeaders(request),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      target_user_id: body.target_id,
      direction: body.direction === 'like' ? 'right' : 'left',
    }),
  });

  if (!result.ok) {
    return jsonResponse(result.payload, result.status);
  }

  return jsonResponse({
    matched: Boolean(result.payload.is_match),
    match_id: result.payload.match_id || null,
  });
}

async function handleMatches(request) {
  const result = await upstreamJson('/messages/conversations', {
    headers: authHeaders(request),
  });

  if (!result.ok) {
    return jsonResponse(result.payload, result.status);
  }

  return jsonResponse((result.payload.conversations || []).map(mapConversation));
}

async function handleMessages(request, conversationId) {
  if (request.method === 'GET') {
    const result = await upstreamJson(`/messages/conversations/${conversationId}`, {
      headers: authHeaders(request),
    });

    if (!result.ok) {
      return jsonResponse(result.payload, result.status);
    }

    return jsonResponse((result.payload.messages || []).map(mapMessage));
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const result = await upstreamJson(`/messages/conversations/${conversationId}`, {
      method: 'POST',
      headers: {
        ...authHeaders(request),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ content: body.content }),
    });

    if (!result.ok) {
      return jsonResponse(result.payload, result.status);
    }

    return jsonResponse(mapMessage(result.payload));
  }

  return textResponse('Method not allowed', 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/v1/')) {
      return env.ASSETS.fetch(request);
    }

    try {
      if (url.pathname === '/api/v1/auth/register' && request.method === 'POST') {
        return handleRegister(request);
      }

      if (url.pathname === '/api/v1/auth/login' && request.method === 'POST') {
        return handleLogin(request);
      }

      if (url.pathname === '/api/v1/auth/me' && request.method === 'GET') {
        return handleAuthMe(request);
      }

      if (url.pathname === '/api/v1/auth/refresh' && request.method === 'POST') {
        return handleRefresh(request);
      }

      if (url.pathname === '/api/v1/profiles/me' && request.method === 'PUT') {
        return handleProfileSave(request);
      }

      if (url.pathname === '/api/v1/discover' && request.method === 'GET') {
        return handleDiscover(request, url);
      }

      if (url.pathname === '/api/v1/swipe' && request.method === 'POST') {
        return handleSwipe(request);
      }

      if (url.pathname === '/api/v1/matches' && request.method === 'GET') {
        return handleMatches(request);
      }

      const messageMatch = url.pathname.match(/^\/api\/v1\/messages\/([^/]+)$/);
      if (messageMatch) {
        return handleMessages(request, messageMatch[1]);
      }

      return textResponse('Not found', 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected worker error';
      return textResponse(message, 500);
    }
  },
};
