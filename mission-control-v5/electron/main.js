/**
 * MISSION CONTROL v5 — Electron shell.
 *
 * One window, two views:
 *   - left  ~2/3 : the React dashboard (localhost:5173 in dev, or built client)
 *   - right ~1/3 : a real Chromium WebContentsView = the integrated browser.
 *
 * The browser view defaults to the Hermes Telegram URL baked into
 * client/src/shared/browser-sites.json, so it loads on every restart. Its
 * session partition (persist:mc-browser) keeps sign-in cookies across
 * restarts, so Telegram QR login and Chrome Remote Desktop persist.
 *
 * The dashboard reports the browser viewport's pixel rect over IPC; main
 * positions the native WebContentsView exactly over it.
 */
const { app, BrowserWindow, WebContentsView, ipcMain, shell } = require('electron');
const path = require('path');

const SITES = require(path.join(__dirname, '..', 'client', 'src', 'shared', 'browser-sites.json'));
const HOME_URL = SITES[0].url;
const DASH_URL = process.env.MC_DASH_URL || 'http://localhost:5173';

let win = null;
let browser = null;

function history(wc) {
  return (
    wc.navigationHistory || {
      canGoBack: () => wc.canGoBack(),
      goBack: () => wc.goBack(),
      canGoForward: () => wc.canGoForward(),
      goForward: () => wc.goForward(),
    }
  );
}

function pushState() {
  if (!win || !browser || win.isDestroyed()) return;
  const wc = browser.webContents;
  const h = history(wc);
  win.webContents.send('browser:nav-change', {
    url: wc.getURL(),
    title: wc.getTitle(),
    loading: wc.isLoading(),
    canGoBack: h.canGoBack(),
    canGoForward: h.canGoForward(),
  });
}

function attachBrowser() {
  browser = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      partition: 'persist:mc-browser',
    },
  });
  win.contentView.addChildView(browser);
  const wc = browser.webContents;
  wc.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  wc.on('did-navigate', pushState);
  wc.on('did-navigate-in-page', pushState);
  wc.on('page-title-updated', pushState);
  wc.on('did-start-loading', pushState);
  wc.on('did-stop-loading', pushState);
  wc.loadURL(HOME_URL);
}

function loadDashboard(url, attempts = 0) {
  win.loadURL(url).catch(() => {
    if (attempts < 60) {
      setTimeout(() => loadDashboard(url, attempts + 1), 500);
    } else {
      win.loadURL(
        'data:text/html,<body style="background:%230a0a0a;color:%23f4f4f4;font-family:monospace;padding:2rem"><h3>Dashboard not reachable</h3><p>Start the dev server: npm run dev (client :5173, server :3151)</p></body>',
      );
    }
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    title: 'Mission Control v5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  attachBrowser();
  loadDashboard(DASH_URL);
}

app.whenReady().then(createWindow);
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC: dashboard -> main ───────────────────────────────────────────────────
ipcMain.on('browser:set-bounds', (_e, rect) => {
  if (!browser) return;
  browser.setBounds({
    x: Math.max(0, Math.round(rect.x || 0)),
    y: Math.max(0, Math.round(rect.y || 0)),
    width: Math.max(0, Math.round(rect.width || 0)),
    height: Math.max(0, Math.round(rect.height || 0)),
  });
  pushState();
});
ipcMain.on('browser:navigate', (_e, url) => browser && browser.webContents.loadURL(url));
ipcMain.on('browser:back', () => {
  if (!browser) return;
  const h = history(browser.webContents);
  if (h.canGoBack()) h.goBack();
});
ipcMain.on('browser:forward', () => {
  if (!browser) return;
  const h = history(browser.webContents);
  if (h.canGoForward()) h.goForward();
});
ipcMain.on('browser:reload', () => browser && browser.webContents.reload());
ipcMain.on('browser:home', () => browser && browser.webContents.loadURL(HOME_URL));
ipcMain.on('browser:open-external', (_e, url) => {
  if (url) shell.openExternal(url);
});
