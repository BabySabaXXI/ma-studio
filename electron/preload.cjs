const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ma', {
  // Dialog
  openFiles: (options) => ipcRenderer.invoke('dialog:openFiles', options),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),

  // Shell
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),
  showInFolder: (path) => ipcRenderer.invoke('shell:showItemInFolder', path),

  // App
  getPath: (name) => ipcRenderer.invoke('app:getPath', name),

  // MIDI - bridged from main process
  midi: {
    getInputs: () => ipcRenderer.invoke('midi:getInputs'),
    getOutputs: () => ipcRenderer.invoke('midi:getOutputs'),
    openInput: (name) => ipcRenderer.invoke('midi:openInput', name),
    openOutput: (name) => ipcRenderer.invoke('midi:openOutput', name),
    send: (port, data) => ipcRenderer.invoke('midi:send', port, data),
    onMessage: (callback) => {
      ipcRenderer.on('midi:message', (_, data) => callback(data));
      return () => ipcRenderer.removeAllListeners('midi:message');
    },
  },

  // Ableton
  ableton: {
    writeFile: (filePath, dataArray) => ipcRenderer.invoke('ableton:writeFile', filePath, dataArray),
    openInAbleton: (path) => ipcRenderer.invoke('ableton:openInAbleton', path),
    getTemplates: () => ipcRenderer.invoke('ableton:getTemplates'),
  },

  // Platform
  platform: process.platform,
});
