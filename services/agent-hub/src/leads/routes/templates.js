const { Router } = require('express');

const router = Router();

// GET /api/templates
router.get('/', async (req, res) => {
  const { limit = 50, skip = 0, category } = req.query;
  let query = 'SELECT * FROM templates WHERE 1=1';
  const params = [];
  let idx = 0;

  if (category) { idx++; query += ` AND category = $${idx}`; params.push(category); }

  query += ' ORDER BY created_at DESC';
  idx++; query += ` LIMIT $${idx}`; params.push(Math.min(parseInt(limit, 10) || 50, 500));
  idx++; query += ` OFFSET $${idx}`; params.push(parseInt(skip, 10) || 0);

  const { rows } = await req.db.query(query, params);
  res.json(rows);
});

// GET /api/templates/:id
router.get('/:id', async (req, res) => {
  const { rows } = await req.db.query('SELECT * FROM templates WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Template not found' });
  res.json(rows[0]);
});

// POST /api/templates
router.post('/', async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.subject || !body.html_content) {
    return res.status(400).json({ error: 'name, subject, and html_content are required' });
  }

  const { rows } = await req.db.query(
    `INSERT INTO templates (name, subject, html_content, category, variables)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [body.name, body.subject, body.html_content, body.category || null, body.variables || []]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/templates/:id
router.put('/:id', async (req, res) => {
  const { rows: existing } = await req.db.query('SELECT * FROM templates WHERE id = $1', [req.params.id]);
  if (!existing.length) return res.status(404).json({ error: 'Template not found' });

  const old = existing[0];
  const data = { ...old, ...req.body };

  await req.db.query(
    `UPDATE templates SET name=$1, subject=$2, html_content=$3, category=$4, variables=$5 WHERE id=$6`,
    [data.name, data.subject, data.html_content, data.category, data.variables, req.params.id]
  );
  res.json(data);
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res) => {
  const result = await req.db.query('DELETE FROM templates WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Template not found' });
  res.json({ deleted: req.params.id });
});

module.exports = router;
