function apiKeyAuth(req, res, next) {
  const key = req.headers['x-api-key'] || req.headers['api_key'];
  const expected = process.env.AGENT_HUB_API_KEY;

  // Fail-closed: if the key is missing/empty at request time, deny.
  // (src/index.js also refuses to start the server without this env var set,
  // but the middleware must never silently allow requests through.)
  if (!expected) return res.status(401).json({ error: 'Invalid or missing API key' });
  if (key === expected) return next();

  res.status(401).json({ error: 'Invalid or missing API key' });
}

module.exports = apiKeyAuth;
