// Drive the page with Playwright (already installed in apps/mission-control/node_modules)
// to bypass agent-browser's headless script-execution block and verify the
// template-literal fix lands widgets in the rendered DOM.

const path = require('path');
const { chromium } = require('E:/ANTIGRAVITY\\apps\\mission-control\\node_modules\\playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('console', (msg) => console.log('[console.' + msg.type() + ']', msg.text()));
  page.on('pageerror', (err) => console.log('[pageerror]', err.message));
  page.on('requestfailed', (r) => console.log('[reqfail]', r.url(), r.failure()?.errorText));
  const url = 'http://127.0.0.1:8790/?bust=' + Date.now();
  console.log('opening', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch((e) => console.log('nav warn:', e.message));

  // wait a bit for setIntervals to fire
  await page.waitForTimeout(3000);

  const out = await page.evaluate(() => ({
    title: document.title,
    manusCredits: document.getElementById('manusCredits')?.textContent,
    manusStatus: document.getElementById('manusStatus')?.textContent,
    complianceStatus: document.getElementById('complianceStatus')?.textContent,
    fallbackStatus: document.getElementById('fallbackStatus')?.textContent,
    fallbackDetail: document.getElementById('fallbackDetail')?.textContent,
    hasUM: typeof window.updateManusCredits,
    hasUC: typeof window.updateCompliance,
    mca: window.MISSION_CONTROL_API,
  }));
  console.log(JSON.stringify(out, null, 2));

  const net = [];
  page.on('response', (r) => net.push(r.status() + ' ' + r.url()));
  await page.reload({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  console.log('--- network on reload ---');
  console.log(net.filter((u) => !u.includes('fonts.gstatic') && !u.includes('fonts.googleapis')).join('\n'));

  const shotPath = path.join('E:/ANTIGRAVITY\\scripts', 'pw-verify.png');
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('screenshot:', shotPath);

  await browser.close();
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
