import { ipcMain, BrowserWindow } from 'electron';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import os from 'os';
import path from 'path';

let ptyProcess: ChildProcessWithoutNullStreams | null = null;
let terminalCwd = process.cwd();

export function setupTerminalHandlers(mainWindow: BrowserWindow | null) {
  ipcMain.handle('spawn-terminal', () => {
    if (ptyProcess) ptyProcess.kill();
    
    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    
    ptyProcess = spawn(shell, [], {
      cwd: terminalCwd,
      env: {
        ...process.env,
        OPUS_WORKSPACE: terminalCwd // Information for the shell environment
      }
    });

    ptyProcess.stdout.on('data', (data) => {
      if (mainWindow) {
        mainWindow.webContents.send('terminal-data', data.toString());
      }
    });

    ptyProcess.stderr.on('data', (data) => {
      if (mainWindow) {
        mainWindow.webContents.send('terminal-data', data.toString());
      }
    });

    return true;
  });

  ipcMain.handle('terminal-set-cwd', (_, newCwd) => {
    // Security: Restrict terminal to certain base paths if necessary
    // Here we resolve relative to current process as a baseline
    terminalCwd = path.resolve(newCwd);
    return true;
  });

  ipcMain.on('write-terminal', (_, data) => {
    if (ptyProcess) ptyProcess.stdin.write(data);
  });

  ipcMain.handle('kill-terminal', () => {
    if (ptyProcess) {
      ptyProcess.kill();
      ptyProcess = null;
    }
    return true;
  });
}
