import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FRONTEND_DIR = path.join(REPO_ROOT, 'domains', 'youandinotai.com', 'frontend');
const ONLINERECYCLE_SITE_DIR = path.join(REPO_ROOT, 'domains', 'onlinerecycle.net', 'site');
const LOCAL_BIND_HOST = ['127', '0', '0', '1'].join('.');

const STATIC_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon',
};

function resolveStaticSitePath(siteRoot, rawUrlPath) {
  let cleanPath = decodeURIComponent(String(rawUrlPath || '/').split('?')[0]);
  if (cleanPath === '' || cleanPath === '/') cleanPath = '/index.html';
  const requested = path.normalize(path.join(siteRoot, cleanPath));
  if (!requested.startsWith(siteRoot)) return null;
  try {
    const st = fs.statSync(requested);
    if (st.isDirectory()) {
      const idx = path.join(requested, 'index.html');
      if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
      return null;
    }
    if (st.isFile()) return requested;
  } catch {
    const htmlCandidate = `${requested.replace(/[\\/]+$/, '')}.html`;
    if (htmlCandidate.startsWith(siteRoot) && fs.existsSync(htmlCandidate) && fs.statSync(htmlCandidate).isFile()) {
      return htmlCandidate;
    }
  }
  return null;
}

function startStaticSiteServer(siteRoot, port) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0];
      if (urlPath === '/api/booking-config') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, timezone: 'America/New_York', bookedSlots: [] }));
        return;
      }
      const filePath = resolveStaticSitePath(siteRoot, req.url || '/');
      if (!filePath) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found\n');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': STATIC_MIME[ext] || 'application/octet-stream' });
      res.end(fs.readFileSync(filePath));
    });
    srv.on('error', reject);
    srv.listen(port, LOCAL_BIND_HOST, () => resolve(srv));
  });
}

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
  const rawFixture = flags.fixture || positional[1];
  const isOnlineRecycleStatic =
    flags.site === 'onlinerecycle.net' ||
    flags.site === 'onlinerecycle' ||
    (!flags.site && !route.startsWith('/app') && Boolean(resolveStaticSitePath(ONLINERECYCLE_SITE_DIR, route)));
  const staticSiteDir = isOnlineRecycleStatic ? ONLINERECYCLE_SITE_DIR : flags.dir ? path.resolve(flags.dir) : null;

  const fixturePath = path.resolve(
    rawFixture && fs.existsSync(path.resolve(rawFixture))
      ? rawFixture
      : path.join(__dirname, 'fixtures', 'founder-affiliates.json'),
  );
  const outArg =
    rawFixture && !fs.existsSync(path.resolve(rawFixture)) && !rawFixture.endsWith('.json')
      ? rawFixture
      : flags.out || flags.output || positional[2];
  const outDir = path.resolve(outArg || path.join(__dirname, 'out'));
  const selector = flags.selector || positional[3] || 'main';

  const fixtureStem = path.basename(fixturePath, path.extname(fixturePath));
  const routeSlug = route
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.html$/i, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-');
  const defaultPrefix = staticSiteDir
    ? `eyes-${routeSlug || 'home'}`
    : fixtureStem === 'founder-affiliates' || route === '/app/admin/affiliates'
      ? 'eyes-founder-page'
      : `eyes-${fixtureStem}`;
  const namePrefix = flags.name || flags.prefix || defaultPrefix;

  return { route, fixturePath, outDir, selector, namePrefix, staticSiteDir };
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

async function loadPlaywrightChromium() {
  try {
    const mod = await import('playwright');
    return mod.chromium;
  } catch {
    const parentDir = path.dirname(REPO_ROOT);
    const entries = fs.existsSync(parentDir) ? fs.readdirSync(parentDir, { withFileTypes: true }) : [];
    const candidateRoots = [
      REPO_ROOT,
      FRONTEND_DIR,
      ...entries
        .filter((e) => e.isDirectory() && e.name.startsWith('ANTIGRAVITY'))
        .flatMap((e) => [
          path.join(parentDir, e.name),
          path.join(parentDir, e.name, 'domains', 'youandinotai.com', 'frontend'),
        ]),
    ];
    for (const root of candidateRoots) {
      const candidate = path.join(root, 'node_modules', 'playwright', 'index.mjs');
      if (fs.existsSync(candidate)) {
        const { pathToFileURL } = await import('node:url');
        const mod = await import(pathToFileURL(candidate).href);
        return mod.chromium;
      }
    }
    throw new Error('Playwright not found in local or sibling node_modules.');
  }
}

export async function shootPage(options) {
  const { route, fixturePath, outDir, selector, namePrefix, staticSiteDir } = options;
  const fixture = fixturePath && fs.existsSync(fixturePath) ? JSON.parse(fs.readFileSync(fixturePath, 'utf8')) : {};
  fs.mkdirSync(outDir, { recursive: true });

  const port = await findSparePort();
  const baseUrl = `http://${LOCAL_BIND_HOST}:${port}`;

  let viteProc = null;
  let staticSrv = null;
  if (staticSiteDir) {
    staticSrv = await startStaticSiteServer(staticSiteDir, port);
  } else {
    const viteBin = ensureFrontendNodeModules();
    viteProc = spawn(
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
  }

  let browser;
  try {
    await waitForServer(baseUrl);

    const chromium = await loadPlaywrightChromium();
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
    if (staticSrv) {
      await new Promise((r) => staticSrv.close(() => r()));
    }
    if (viteProc && !viteProc.killed) {
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
