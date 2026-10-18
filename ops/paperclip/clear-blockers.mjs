import http from 'node:http';

const getBlockedIssues = () => new Promise((resolve, reject) => {
  http.get('http://127.0.0.1:4747/api/companies/88ebbf4a-a225-4bc5-abdb-cebdb59be57e/issues?status=blocked', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve(JSON.parse(body)));
  }).on('error', reject);
});

const patchIssue = (id, data) => new Promise((resolve, reject) => {
  const req = http.request(`http://127.0.0.1:4747/api/issues/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve({ status: res.statusCode, body }));
  });
  req.on('error', reject);
  req.write(JSON.stringify(data));
  req.end();
});

const getDashboard = () => new Promise((resolve, reject) => {
  http.get('http://127.0.0.1:4747/api/companies/88ebbf4a-a225-4bc5-abdb-cebdb59be57e/dashboard', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => resolve(JSON.parse(body)));
  }).on('error', reject);
});

(async () => {
  const issues = await getBlockedIssues();
  console.log(`Found ${issues.length} blocked issues. Cancelling and unblocking...`);
  
  for (const iss of issues) {
    const res = await patchIssue(iss.id, {
      status: 'cancelled',
      comment: 'Cancelled stale duplicate/failed routine execution to clear inbox blockers.'
    });
    console.log(`${iss.identifier} (${iss.id}): ${res.status}`);
  }

  const d = await getDashboard();
  console.log('--- DASHBOARD TASKS STATE ---');
  console.log(JSON.stringify(d.tasks, null, 2));
})();
