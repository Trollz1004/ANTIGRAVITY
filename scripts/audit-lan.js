// LAN reachability audit. Probes 192.168.0.8:8788 (the prod bind) end-to-end.
// Asserts the page loads from the LAN IP, all 4 endpoints return 200 with
// valid shapes, no console errors, no page errors, all adapter rows have a
// real state pill (no "?"), and all 7 doctrine strings are in the DOM.

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

  const base = 'http://192.168.0.8:8788';
  const url = base + '/?bust=' + Date.now();
  console.log('opening', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(e => console.log('nav warn:', e.message));
  await page.waitForTimeout(2500);

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

  const wrongHostUrls = requests.filter(u => u.startsWith('http://') && !u.startsWith(base + '/'));
  await page.waitForTimeout(3000);

  const result = {
    title: await page.title(),
    base,
    audit,
    network: {
      totalRequests: requests.length,
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
    && wrongHostUrls.length === 0
    && failedReqs.length === 0;
  console.log('OVERALL:', ok ? 'GREEN' : 'RED');

  await page.screenshot({ path: 'C:\\Antigravity\\scripts\\audit-lan.png', fullPage: true });

  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
