const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DEFAULT_REPO = process.env.GITHUB_REPO || 'Trollz1004/ANTIGRAVITY';

function githubRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      headers: {
        'User-Agent': 'agent-hub/1.0',
        'Accept': 'application/vnd.github+json',
        ...(GITHUB_TOKEN ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` } : {})
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`GitHub ${res.statusCode}: ${data}`));
        resolve(JSON.parse(data));
      });
    }).on('error', reject);
  });
}

async function syncGitHubIssues(db, repo = DEFAULT_REPO) {
  const [owner, name] = repo.split('/');
  const issues = await githubRequest(`/repos/${owner}/${name}/issues?state=all&per_page=100`);

  let synced = 0;
  let closed = 0;

  for (const issue of issues) {
    if (issue.pull_request) continue;

    const { rows } = await db.query(
      'SELECT * FROM agent_tasks WHERE github_issue_number = $1 AND github_repo = $2 AND deleted_at IS NULL',
      [issue.number, repo]
    );

    if (rows.length > 0) {
      const task = rows[0];
      if (issue.state === 'closed' && task.status !== 'done') {
        await db.query(
          `UPDATE agent_tasks SET status = 'done', updated_date = NOW() WHERE id = $1`,
          [task.id]
        );
        closed++;
      }
      synced++;
    }
  }

  return { synced, closed, total_issues: issues.length };
}

module.exports = { syncGitHubIssues, githubRequest };
