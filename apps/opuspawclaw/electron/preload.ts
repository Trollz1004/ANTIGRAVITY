import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('opuspawclaw', {
  chat: (provider: string, model: string, messages: any[]) => ipcRenderer.invoke('chat', provider, model, messages),
  models: (provider: string) => ipcRenderer.invoke('models', provider),
  streamChat: (provider: string, model: string, messages: any[], apiKey: string) => ipcRenderer.invoke('stream-chat', provider, model, messages, apiKey),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  listDir: (dirPath: string) => ipcRenderer.invoke('list-dir', dirPath),
  gitStatus: () => ipcRenderer.invoke('git-status'),
  gitDiff: () => ipcRenderer.invoke('git-diff'),
  gitLog: () => ipcRenderer.invoke('git-log'),
  gitCommit: (message: string) => ipcRenderer.invoke('git-commit', message),
  gitPush: () => ipcRenderer.invoke('git-push'),
  gitPull: () => ipcRenderer.invoke('git-pull'),
  gitBranch: () => ipcRenderer.invoke('git-branch'),
  gitCheckout: (branch: string) => ipcRenderer.invoke('git-checkout', branch),
  gitCreateBranch: (branch: string) => ipcRenderer.invoke('git-create-branch', branch),
  gitStageAll: () => ipcRenderer.invoke('git-stage-all'),
  spawnTerminal: () => ipcRenderer.invoke('spawn-terminal'),
  writeToTerminal: (data: string) => ipcRenderer.send('write-terminal', data),
  killTerminal: () => ipcRenderer.invoke('kill-terminal'),
  onTerminalData: (callback: (data: string) => void) => {
    ipcRenderer.on('terminal-data', (_, data) => callback(data));
  },
  terminalExec: (command: string) => {
    ipcRenderer.send('write-terminal', command + '\r\n');
    return Promise.resolve(true);
  },
  getConfig: (key: string) => ipcRenderer.invoke('get-config', key),
  setConfig: (key: string, value: any) => ipcRenderer.invoke('set-config', key, value),
  verifyAge: (isVerified: boolean) => ipcRenderer.invoke('verify-age', isVerified),
  // Storage
  getConversations: () => ipcRenderer.invoke('get-conversations'),
  createConversation: (title: string, mode: string) => ipcRenderer.invoke('create-conversation', title, mode),
  getMessages: (conversationId: number) => ipcRenderer.invoke('get-messages', conversationId),
  addMessage: (conversationId: number, role: string, content: string, model: string) => ipcRenderer.invoke('add-message', conversationId, role, content, model),
  // Ollama Management
  ollamaTags: () => ipcRenderer.invoke('ollama-tags'),
  ollamaChat: (payload: any) => ipcRenderer.invoke('ollama-chat', payload),
  ollamaPull: (model: string) => ipcRenderer.invoke('ollama-pull', model),
  ollamaDelete: (model: string) => ipcRenderer.invoke('ollama-delete', model)
});
