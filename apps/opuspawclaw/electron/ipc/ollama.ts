import { ipcMain } from 'electron';

export function setupOllamaHandlers() {
  const getOllamaHost = () => {
    // Priority: Environment Variable > Default Localhost
    return process.env.OLLAMA_HOST || 'http://localhost:11434';
  };

  ipcMain.handle('ollama-tags', async () => {
    const res = await fetch(`${getOllamaHost()}/api/tags`);
    return res.json();
  });

  ipcMain.handle('ollama-chat', async (_, payload) => {
    const res = await fetch(`${getOllamaHost()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!payload.stream) return res.json();
    return res.text();
  });

  ipcMain.handle('ollama-pull', async (_, model) => {
    const res = await fetch(`${getOllamaHost()}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: false })
    });
    return res.json();
  });

  ipcMain.handle('ollama-delete', async (_, model) => {
    try {
      const res = await fetch(`${getOllamaHost()}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model })
      });
      return res.status === 200;
    } catch (error) {
      return false;
    }
  });
}
