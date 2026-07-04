const { Router } = require('express');

const router = Router();

// GET /api/campaigns
router.get('/', async (req, res) => {
  const { limit = 50, skip = 0, status } = req.query;
  let query = 'SELECT * FROM campaigns WHERE 1=1';
  const params = [];
  let idx = 0;

  if (status) { idx++; query += ` AND status = $${idx}`; params.push(status); }

  query += ' ORDER BY created_at DESC';
  idx++; query += ` LIMIT $${idx}`; params.push(Math.min(parseInt(limit, 10) || 50, 500));
  idx++; query += ` OFFSET $${idx}`; params.push(parseInt(skip, 10) || 0);

  const { rows } = await req.db.query(query, params);
  res.json(rows);
});

// GET /api/campaigns/:id
router.get('/:id', async (req, res) => {
  const { rows } = await req.db.query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Campaign not found' });
  res.json(rows[0]);
});

// POST /api/campaigns
router.post('/', async (req, res) => {
  const body = req.body || {};
  if (!body.name) return res.status(400).json({ error: 'name is required' });

  const { rows } = await req.db.query(
    `INSERT INTO campaigns (name, template_id, target_segment, status, scheduled_at,
     sent_count, open_count, click_count, bounce_count)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      body.name, body.template_id || null,
      JSON.stringify(body.target_segment || {}), body.status || 'draft',
      body.scheduled_at || null, body.sent_count ?? 0, body.open_count ?? 0,
      body.click_count ?? 0, body.bounce_count ?? 0
    ]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/campaigns/:id
router.put('/:id', async (req, res) => {
  const { rows: existing } = await req.db.query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Campaign not found' });

  const old = existing[0];
  const data = { ...old, ...req.body };

  await req.db.query(
    `UPDATE campaigns SET name=$1, template_id=$2, target_segment=$3, status=$4,
     scheduled_at=$5, sent_count=$6, open_count=$7, click_count=$8, bounce_count=$9
     WHERE id=$10`,
    [
      data.name, data.template_id, JSON.stringify(data.target_segment || {}), data.status,
      data.scheduled_at, data.sent_count, data.open_count, data.click_count,
      data.bounce_count, req.params.id
    ]
  );
  res.json(data);
});

// DELETE /api/campaigns/:id
router.delete('/:id', async (req, res) => {
  const result = await req.db.query('DELETE FROM campaigns WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Campaign not found' });
  res.json({ deleted: req.params.id });
});

module.exports = router;
