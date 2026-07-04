const { Router } = require('express');
const { syncGitHubIssues } = require('../integrations/github');

const router = Router();

router.post('/syncGitHubTasks', async (req, res) => {
  const repo = req.body.repo || process.env.GITHUB_REPO || 'Trollz1004/ANTIGRAVITY';

  try {
    const result = await syncGitHubIssues(req.db, repo);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[github-sync]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
