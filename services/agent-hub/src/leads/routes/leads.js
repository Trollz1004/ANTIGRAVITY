const { Router } = require('express');
const { heuristic_score } = require('../scoring');
const { fireLeadHooks } = require('../hooks');

const router = Router();

const LEAD_COLUMNS = [
  'id', 'name', 'email', 'phone', 'city', 'interests', 'source', 'crm_score',
  'status', 'tags', 'notes', 'last_contacted', 'email_opens', 'email_clicks',
  'conversion_value', 'campaign_id', 'created_at', 'updated_at',
  'platform', 'stage', 'score', 'game_data', 'ai_summary'
];

// GET /api/leads — list, paginated + filterable (platform, stage, source, min_score)
router.get('/', async (req, res) => {
  const {
    limit = 50, skip = 0, platform, stage, status, source, min_score, q
  } = req.query;

  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];
  let idx = 0;

  if (platform) { idx++; query += ` AND platform = $${idx}`; params.push(platform); }
  if (stage) { idx++; query += ` AND stage = $${idx}`; params.push(stage); }
  if (status) { idx++; query += ` AND status = $${idx}`; params.push(status); }
  if (source) { idx++; query += ` AND source = $${idx}`; params.push(source); }
  if (min_score) { idx++; query += ` AND score >= $${idx}`; params.push(parseInt(min_score, 10)); }
  if (q) {
    idx++;
    query += ` AND (name ILIKE $${idx} OR email ILIKE $${idx})`;
    params.push(`%${q}%`);
  }

  query += ' ORDER BY created_at DESC';

  idx++;
  query += ` LIMIT $${idx}`;
  params.push(Math.min(parseInt(limit, 10) || 50, 500));

  idx++;
  query += ` OFFSET $${idx}`;
  params.push(parseInt(skip, 10) || 0);

  const { rows } = await req.db.query(query, params);
  res.json(rows);
});

// GET /api/leads/reports/funnel — real counts by stage (must be defined BEFORE /:id)
router.get('/reports/funnel', async (req, res) => {
  const { rows } = await req.db.query(
    `SELECT COALESCE(stage, status, 'unknown') AS stage, COUNT(*)::int AS count
     FROM leads GROUP BY COALESCE(stage, status, 'unknown') ORDER BY count DESC`
  );
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  res.json({ total, by_stage: rows });
});

// GET /api/leads/:id
router.get('/:id', async (req, res) => {
  const { rows } = await req.db.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Lead not found' });
  res.json(rows[0]);
});

// POST /api/leads — create
router.post('/', async (req, res) => {
  const body = req.body || {};

  if (!body.name || !body.email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const score = Number.isFinite(body.score) ? body.score : heuristic_score(body);

  const { rows } = await req.db.query(
    `INSERT INTO leads (name, email, phone, city, interests, source, crm_score, status, tags,
     notes, email_opens, email_clicks, conversion_value, platform, stage, score, game_data, ai_summary)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
    [
      body.name, body.email, body.phone || null, body.city || null,
      body.interests || [], body.source || null, body.crm_score ?? 0,
      body.status || 'new', body.tags || [], body.notes || '',
      body.email_opens ?? 0, body.email_clicks ?? 0, body.conversion_value ?? 0,
      body.platform || null, body.stage || null, score,
      body.game_data ? JSON.stringify(body.game_data) : null, body.ai_summary || null
    ]
  );

  const lead = rows[0];
  fireLeadHooks(lead, 'new_lead');

  res.status(201).json(lead);
});

// PUT /api/leads/:id
router.put('/:id', async (req, res) => {
  const { rows: existing } = await req.db.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Lead not found' });

  const old = existing[0];
  const data = { ...old, ...req.body, updated_at: new Date().toISOString() };

  await req.db.query(
    `UPDATE leads SET name=$1, email=$2, phone=$3, city=$4, interests=$5, source=$6,
     crm_score=$7, status=$8, tags=$9, notes=$10, email_opens=$11, email_clicks=$12,
     conversion_value=$13, platform=$14, stage=$15, score=$16, game_data=$17,
     ai_summary=$18, updated_at=$19
     WHERE id=$20`,
    [
      data.name, data.email, data.phone, data.city, data.interests, data.source,
      data.crm_score, data.status, data.tags, data.notes, data.email_opens,
      data.email_clicks, data.conversion_value, data.platform, data.stage,
      data.score, data.game_data ? JSON.stringify(data.game_data) : null,
      data.ai_summary, data.updated_at, req.params.id
    ]
  );

  res.json(data);
});

// DELETE /api/leads/:id
router.delete('/:id', async (req, res) => {
  const result = await req.db.query('DELETE FROM leads WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Lead not found' });
  res.json({ deleted: req.params.id });
});

// POST /api/leads/convert — mark stage='won', score=100, fire conversion hook
router.post('/convert', async (req, res) => {
  const { id, email } = req.body || {};
  if (!id && !email) return res.status(400).json({ error: 'id or email is required' });

  const { rows } = await req.db.query(
    id
      ? 'SELECT * FROM leads WHERE id = $1'
      : 'SELECT * FROM leads WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
    [id || email]
  );
  if (!rows.length) return res.status(404).json({ error: 'Lead not found' });

  const lead = rows[0];
  const { rows: updated } = await req.db.query(
    `UPDATE leads SET stage = 'won', score = 100, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [lead.id]
  );

  const converted = updated[0];
  fireLeadHooks(converted, 'converted');

  res.json(converted);
});

module.exports = router;
