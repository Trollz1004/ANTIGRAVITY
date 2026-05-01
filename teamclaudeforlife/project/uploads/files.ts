import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';

let workspaceRoot = process.cwd();

export function setupFilesHandlers() {
  ipcMain.handle('set-workspace', (_, newPath) => {
    workspaceRoot = newPath;
  });

  const resolveSafePath = (targetPath: string) => {
    const resolved = path.resolve(workspaceRoot, targetPath);
    if (!resolved.startsWith(workspaceRoot)) {
      throw new Error('Path escapes workspace root');
    }
    return resolved;
  };

  ipcMain.handle('read-file', async (_, filePath) => {
    return fs.readFile(resolveSafePath(filePath), 'utf-8');
  });

  ipcMain.handle('write-file', async (_, filePath, content) => {
    return fs.writeFile(resolveSafePath(filePath), content, 'utf-8');
  });

  ipcMain.handle('list-dir', async (_, dirPath) => {
    const safePath = resolveSafePath(dirPath || '.');
    const entries = await fs.readdir(safePath, { withFileTypes: true });
    return entries.map(e => ({ name: e.name, isDirectory: e.isDirectory() }));
  });

  ipcMain.handle('delete-file', async (_, filePath) => {
    return fs.unlink(resolveSafePath(filePath));
  });

  ipcMain.handle('create-dir', async (_, dirPath) => {
    return fs.mkdir(resolveSafePath(dirPath), { recursive: true });
  });
}
