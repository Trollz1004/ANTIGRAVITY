import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FRONTEND_DIR = path.join(REPO_ROOT, 'domains', 'youandinotai.com', 'frontend');
const LOCAL_BIND_HOST = ['127', '0', '0', '1'].join('.');

/**
 * Look up a reply from a fixture path-to-reply map for any /api/v1 request path or URL.
 * Returns {} for any path not listed in the fixture.
 */
export function resolveFixtureReply(fixture, rawPathOrUrl) {
  if (!fixture || typeof fixture !== 'object') {
    return {};
  }
  const input = String(rawPathOrUrl || '').trim();
  if (!input) {
    return {};
  }

  let pathname = input;
  let search = '';
  try {
    const parsed = new URL(input, 'http://eyes.invalid');
    pathname = parsed.pathname;
    search = parsed.search || '';
  } catch {
    const qIndex = input.indexOf('?');
    if (qIndex >= 0) {
      pathname = input.slice(0, qIndex);
      search = input.slice(qIndex);
    }
  }

  const stripped = pathname.startsWith('/api/v1') ? pathname.slice('/api/v1'.length) || '/' : pathname;

  const candidates = [`${stripped}${search}`, `${pathname}${search}`, stripped, pathname];

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(fixture, key)) {
      return fixture[key];
    }
  }
  return {};
}

function findSparePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, LOCAL_BIND_HOST, () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

function ensureFrontendNodeModules() {
  const localModules = path.join(FRONTEND_DIR, 'node_modules');
  const viteBin = path.join(localModules, 'vite', 'bin', 'vite.js');
  if (fs.existsSync(viteBin)) {
    return viteBin;
  }

  const parentDir = path.dirname(REPO_ROOT);
  const entries = fs.existsSync(parentDir) ? fs.readdirSync(parentDir, { withFileTypes: true }) : [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('ANTIGRAVITY')) {
      continue;
    }
    const candidateModules = path.join(
      parentDir,
      entry.name,
      'domains',
      'youandinotai.com',
      'frontend',
      'node_modules',
    );
    const candidateVite = path.join(candidateModules, 'vite', 'bin', 'vite.js');
    if (fs.existsSync(candidateVite)) {
      try {
        if (!fs.existsSync(localModules)) {
          fs.symlinkSync(candidateModules, localModules, 'junction');
        }
        if (fs.existsSync(viteBin)) {
          return viteBin;
        }
      } catch {
        return candidateVite;
      }
    }
  }

  throw new Error(`Vite binary not found under ${FRONTEND_DIR}. Install frontend dependencies first.`);
}

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return;
      }
    } catch {
      // Server still starting
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Timed out waiting for Vite server at ${url}`);
}

export function parseCliArgs(argv) {
  const positional = [];
  const flags = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = 'true';
      }
    } else {
      positional.push(arg);
    }
  }

  const route = flags.route || positional[0] || '/app/admin/affiliates';
  const fixturePath = path.resolve(
    flags.fixture || positional[1] || path.join(__dirname, 'fixtures', 'founder-affiliates.json'),
  );
  const outDir = path.resolve(flags.out || flags.output || positional[2] || path.join(__dirname, 'out'));
  const selector = flags.selector || positional[3] || 'main';

  const fixtureStem = path.basename(fixturePath, path.extname(fixturePath));
  const defaultPrefix =
    fixtureStem === 'founder-affiliates' || route === '/app/admin/affiliates'
      ? 'eyes-founder-page'
      : `eyes-${fixtureStem}`;
  const namePrefix = flags.name || flags.prefix || defaultPrefix;
  const url = flags.url || '';

  return { route, fixturePath, outDir, selector, namePrefix, url };
}

async function captureViewport(
  browser,
  { baseUrl, route, fixture, selector, width, height, screenshotPath, pageErrors },
) {
  const context = await browser.newContext({
    viewport: { width, height },
  });

  await context.addInitScript((token) => {
    window.localStorage.setItem('access_token', token);
    window.localStorage.setItem('cookie_consent_accepted', 'true');
  }, 'eyes-made-up-access-token');

  await context.route('**/*', async (routeHandler) => {
    const reqUrl = routeHandler.request().url();
    if (reqUrl.includes('/api/v1/')) {
      const reply = resolveFixtureReply(fixture, reqUrl);
      await routeHandler.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(reply),
      });
      return;
    }

    if (reqUrl.startsWith(baseUrl) || reqUrl.startsWith('data:') || reqUrl.startsWith('blob:')) {
      await routeHandler.continue();
      return;
    }

    // Block any external network call (e.g., fonts or third-party widgets)
    await routeHandler.abort();
  });

  const page = await context.newPage();
  page.on('pageerror', (err) => {
    pageErrors.push(err?.message || String(err));
  });

  const targetUrl = `${baseUrl}${route.startsWith('/') ? route : `/${route}`}`;
  await page.goto(targetUrl, { waitUntil: 'networkidle' });

  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(300);

  await page.screenshot({ path: screenshotPath, fullPage: true });

  const finalPath = new URL(page.url()).pathname;
  const visibleText = (await locator.innerText()).trim();
  const scrollsSideways = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );

  await context.close();
  return { finalPath, visibleText, scrollsSideways };
}

function maskUserPath(filePath) {
  let out = String(filePath || '');
  if (process.env.LOCALAPPDATA) {
    out = out.split(process.env.LOCALAPPDATA).join('%LOCALAPPDATA%');
  }
  if (process.env.USERPROFILE) {
    out = out.split(process.env.USERPROFILE).join('%USERPROFILE%');
  }
  return out;
}

export async function shootPage(options) {
  const { route, fixturePath, outDir, selector, namePrefix, url } = options;
  fs.mkdirSync(outDir, { recursive: true });

  if (url) {
    let browser;
    try {
      const { chromium } = await import('playwright');
      try {
        browser = await chromium.launch({
          channel: 'msedge',
          headless: true,
        });
      } catch {
        browser = await chromium.launch({ headless: true });
      }
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const pageErrors = [];
      const page = await context.newPage();
      page.on('pageerror', (err) => {
        pageErrors.push(err?.message || String(err));
      });
      await page.goto(url, { waitUntil: 'networkidle' });
      const locator = page.locator(selector || 'body').first();
      await locator.waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(300);
      const picturePath = path.join(outDir, `${namePrefix}.png`);
      await page.screenshot({ path: picturePath, fullPage: true });
      const visibleText = (await locator.innerText()).trim();
      const scrollsSideways = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      await context.close();
      const report = {
        route: url,
        finalPath: url,
        phoneFinalPath: url,
        selector: selector || 'body',
        visibleText,
        scrollsSideways,
        desktopScrollsSideways: scrollsSideways,
        phoneScrollsSideways: false,
        pageErrors,
        desktopPicture: maskUserPath(picturePath),
        phonePicture: maskUserPath(picturePath),
      };
      return {
        report,
        reportPath: '',
        desktopPath: maskUserPath(picturePath),
        phonePath: maskUserPath(picturePath),
      };
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const viteBin = ensureFrontendNodeModules();
  const port = await findSparePort();
  const baseUrl = `http://${LOCAL_BIND_HOST}:${port}`;

  const viteProc = spawn(
    process.execPath,
    [viteBin, '--host', LOCAL_BIND_HOST, '--port', String(port), '--strictPort'],
    {
      cwd: FRONTEND_DIR,
      env: {
        ...process.env,
        VITE_API_URL: `${baseUrl}/api/v1`,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    },
  );

  let browser;
  try {
    await waitForServer(baseUrl);

    const { chromium } = await import('playwright');
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
    });

    const desktopPath = path.join(outDir, `${namePrefix}-DESKTOP.png`);
    const phonePath = path.join(outDir, `${namePrefix}-PHONE.png`);
    const reportPath = path.join(outDir, `${namePrefix}.json`);
    const pageErrors = [];

    const desktopResult = await captureViewport(browser, {
      baseUrl,
      route,
      fixture,
      selector,
      width: 1440,
      height: 900,
      screenshotPath: desktopPath,
      pageErrors,
    });

    const phoneResult = await captureViewport(browser, {
      baseUrl,
      route,
      fixture,
      selector,
      width: 412,
      height: 915,
      screenshotPath: phonePath,
      pageErrors,
    });

    const report = {
      route,
      finalPath: desktopResult.finalPath,
      phoneFinalPath: phoneResult.finalPath,
      selector,
      visibleText: desktopResult.visibleText,
      scrollsSideways: desktopResult.scrollsSideways || phoneResult.scrollsSideways,
      desktopScrollsSideways: desktopResult.scrollsSideways,
      phoneScrollsSideways: phoneResult.scrollsSideways,
      pageErrors,
      desktopPicture: maskUserPath(desktopPath),
      phonePicture: maskUserPath(phonePath),
    };

    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    return {
      report,
      reportPath: maskUserPath(reportPath),
      desktopPath: maskUserPath(desktopPath),
      phonePath: maskUserPath(phonePath),
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (!viteProc.killed) {
      viteProc.kill();
    }
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  const opts = parseCliArgs(process.argv.slice(2));
  shootPage(opts)
    .then(({ report, reportPath }) => {
      console.log(
        JSON.stringify(
          {
            finalPath: report.finalPath,
            scrollsSideways: report.scrollsSideways,
            desktopScrollsSideways: report.desktopScrollsSideways,
            phoneScrollsSideways: report.phoneScrollsSideways,
            pageErrors: report.pageErrors,
            desktopPicture: report.desktopPicture,
            phonePicture: report.phonePicture,
            reportPath,
          },
          null,
          2,
        ),
      );
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}
