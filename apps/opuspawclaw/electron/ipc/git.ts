import { ipcMain } from 'electron';
import simpleGit from 'simple-git';
import path from 'path';

let workspaceRoot = process.cwd();

export function setupGitHandlers() {
  // Allow dynamic workspace root switching
  const getGit = () => simpleGit(workspaceRoot);

  ipcMain.handle('git-set-root', (_, newPath) => {
    // Sanitize and resolve the path
    workspaceRoot = path.resolve(newPath);
    return true;
  });

  ipcMain.handle('git-status', async () => {
    return getGit().status();
  });

  ipcMain.handle('git-diff', async () => {
    return getGit().diff();
  });

  ipcMain.handle('git-log', async () => {
    return getGit().log();
  });

  ipcMain.handle('git-commit', async (_, message) => {
    return getGit().commit(message);
  });

  ipcMain.handle('git-push', async () => {
    return getGit().push();
  });

  ipcMain.handle('git-pull', async () => {
    return getGit().pull();
  });

  ipcMain.handle('git-branch', async () => {
    return getGit().branch();
  });

  ipcMain.handle('git-checkout', async (_, branch) => {
    return getGit().checkout(branch);
  });

  ipcMain.handle('git-create-branch', async (_, branch) => {
    return getGit().checkoutLocalBranch(branch);
  });

  ipcMain.handle('git-stage-all', async () => {
    return getGit().add('./*');
  });
}
