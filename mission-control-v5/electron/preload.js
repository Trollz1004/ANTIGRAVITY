const { contextBridge, ipcRenderer } = require('electron');

// Bridge between the React dashboard and the Electron main process so the
// dashboard can drive the embedded browser view. Exposed as window.mcElectron.
contextBridge.exposeInMainWorld('mcElectron', {
  setBounds: (rect) => ipcRenderer.send('browser:set-bounds', rect),
  navigate: (url) => ipcRenderer.send('browser:navigate', url),
  goBack: () => ipcRenderer.send('browser:back'),
  goForward: () => ipcRenderer.send('browser:forward'),
  reload: () => ipcRenderer.send('browser:reload'),
  home: () => ipcRenderer.send('browser:home'),
  openExternal: (url) => ipcRenderer.send('browser:open-external', url),
  onNavChange: (cb) => {
    const handler = (_e, state) => cb(state);
    ipcRenderer.on('browser:nav-change', handler);
    return () => ipcRenderer.removeListener('browser:nav-change', handler);
  },
});