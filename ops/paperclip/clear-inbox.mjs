import http from 'node:http';

const postDismiss = (key) => new Promise((resolve, reject) => {
  const req = http.request('http://127.0.0.1:4747/api/companies/88ebbf4a-a225-4bc5-abdb-cebdb59be57e/inbox-dismissals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve({ key, status: res.statusCode }));
  });
  req.on('error', reject);
  req.write(JSON.stringify({ itemKey: key, kind: 'dismiss' }));
  req.end();
});

const get = (url) => new Promise((resolve, reject) => {
  http.get(url, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve(JSON.parse(body)));
  }).on('error', reject);
});

(async () => {
  const runs = await get('http://127.0.0.1:4747/api/companies/88ebbf4a-a225-4bc5-abdb-cebdb59be57e/heartbeat-runs');
  const failed = runs.filter(r => ['failed', 'timed_out'].includes(r.status));
  console.log(`Dismissing ${failed.length} failed runs...`);
  for (const r of failed) {
    await postDismiss(`run:${r.id}`);
  }
  
  // Also check if any approvals or join requests or attention items exist
  const badges = await get('http://127.0.0.1:4747/api/companies/88ebbf4a-a225-4bc5-abdb-cebdb59be57e/sidebar-badges');
  console.log('SIDEBAR BADGES RESULT:');
  console.log(JSON.stringify(badges, null, 2));

  const dashboard = await get('http://127.0.0.1:4747/api/companies/88ebbf4a-a225-4bc5-abdb-cebdb59be57e/dashboard');
  console.log('DASHBOARD TASKS:');
  console.log(JSON.stringify(dashboard.tasks, null, 2));
})();
