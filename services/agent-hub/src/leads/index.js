// Mounts the leads-CRM sub-routers under whatever base path the caller chooses.
// src/index.js mounts this at /api (so routes resolve to /api/leads,
// /api/campaigns, /api/templates).
const { Router } = require('express');

const leadsRoutes = require('./routes/leads');
const campaignsRoutes = require('./routes/campaigns');
const templatesRoutes = require('./routes/templates');

const router = Router();

router.use('/leads', leadsRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/templates', templatesRoutes);

module.exports = router;
