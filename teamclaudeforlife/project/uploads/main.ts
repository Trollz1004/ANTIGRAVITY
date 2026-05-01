import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Store from 'electron-store';
import { fileURLToPath } from 'url';
import { setupOllamaHandlers } from './ipc/ollama.js';
import { setupFilesHandlers } from './ipc/files.js';
import { setupGitHandlers } from './ipc/git.js';
import { setupTerminalHandlers } from './ipc/terminal.js';
import { setupStorageHandlers } from '../src/lib/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store() as any;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const bounds = store.get('windowBounds', { width: 1200, height: 800 }) as any;
  
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 1200,
    minHeight: 800,
    frame: false,
    backgroundColor: '#0a0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.on('resize', () => {
    if (mainWindow) store.set('windowBounds', mainWindow.getBounds());
  });

  mainWindow.on('moved', () => {
    if (mainWindow) store.set('windowBounds', mainWindow.getBounds());
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  setupOllamaHandlers();
  setupFilesHandlers();
  setupGitHandlers();
  setupTerminalHandlers(mainWindow);
  setupStorageHandlers();

  ipcMain.handle('get-config', (_, key) => store.get(key));
  ipcMain.handle('set-config', (_, key, value) => store.set(key, value));
  ipcMain.handle('verify-age', (_, isVerified) => {
    store.set('ageVerified', isVerified);
    return true;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
