// /api/auth/logout — Clears session and redirects to home

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  return new Response(null, {
    status: 302,
    headers: {
      'Location': url.origin + '/',
      'Set-Cookie': 'ag_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    }
  });
}
