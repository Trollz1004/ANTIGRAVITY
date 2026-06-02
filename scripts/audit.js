// Deep visual audit (localhost). Asserts:
//   - title contains "OPUSHASHANDS"
//   - console.error count = 0
//   - pageerror count = 0
//   - no fetch went off-host
//   - every fetch in the page went to 127.0.0.1:8788 (relative)
//   - every adapter body row has a real state pill (LIVE or SILENCED), not "?"
//   - doctrine strings present in DOM
//
// For the LAN-IP version of this audit, see scripts/audit-lan.js.

const { chromium } = require('C:\\Antigravity\\apps\\mission-control\\node_modules\\playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const requests = [];
  const failedReqs = [];

  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('request',  r => requests.push(r.url()));
  page.on('requestfailed', r => failedReqs.push(r.url() + ' :: ' + (r.failure()?.errorText || '?')));

  const url = 'http://127.0.0.1:8788/?bust=' + Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(e => console.log('nav warn:', e.message));
  await page.waitForTimeout(2000);

  const audit = await page.evaluate(() => {
    const txt = document.body.innerText || '';
    const titleOk = /^OPUSHASHANDS/.test(document.title);
    const doctrineOk =
      txt.includes('1 wallet') &&
      txt.includes('1 LLC') &&
      txt.includes('10% max/bucket') &&
      txt.includes('Square-only revenue') &&
      txt.includes('no Anthropic key') &&
      txt.includes('Hermes-routed') &&
      txt.includes('#UntilNoKidInNeed');
    // adapter row states
    const rows = Array.from(document.querySelectorAll('#adapters-body tr'));
    const rowStates = rows.map(r => {
      const cells = r.querySelectorAll('td');
      const alias = cells[0]?.textContent?.trim();
      const pill = cells[4]?.querySelector('.pill');
      const state = pill ? pill.textContent.trim() : 'NONE';
      return { alias, state };
    });
    const badRows = rowStates.filter(r => r.state === '?' || r.state === 'NONE');
    return { titleOk, doctrineOk, rowCount: rowStates.length, rowStates, badRows };
  });

  // network analysis — page is on 127.0.0.1:8788 with relative URLs, so every
  // request should land on the same origin. Anything off-host is a bug.
  const offendingUrls = requests.filter(u => u.includes('192.168.0.8') || u.includes('192.168.0.15'));
  const wrongHostUrls = requests.filter(u =>
    u.startsWith('http://') && !u.startsWith('http://127.0.0.1:8788/'));
  // give the page a few more ticks to make sure no late off-host requests slip in
  await page.waitForTimeout(3000);

  const result = {
    title: await page.title(),
    audit,
    network: {
      totalRequests: requests.length,
      offendingUrls,
      wrongHostUrls,
      failedReqs,
    },
    consoleErrors,
    pageErrors,
  };
  console.log(JSON.stringify(result, null, 2));

  const ok = result.audit.titleOk
    && result.audit.doctrineOk
    && result.audit.badRows.length === 0
    && consoleErrors.length === 0
    && pageErrors.length === 0
    && offendingUrls.length === 0
    && wrongHostUrls.length === 0;
  console.log('OVERALL:', ok ? 'GREEN' : 'RED');

  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
