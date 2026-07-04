function apiKeyAuth(req, res, next) {
  const key = req.headers['x-api-key'] || req.headers['api_key'];
  const expected = process.env.AGENT_HUB_API_KEY;

  if (!expected) return next();
  if (key === expected) return next();

  res.status(401).json({ error: 'Invalid or missing API key' });
}

module.exports = apiKeyAuth;
