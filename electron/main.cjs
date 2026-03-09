const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const isDev = !app.isPackaged;

let mainWindow;
let JZZ;
try { JZZ = require('jzz'); } catch { JZZ = null; }

// MIDI state
let midiEngine = null;
let midiInputPorts = new Map();
let midiOutputPorts = new Map();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0c0c0c',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Handlers

ipcMain.handle('dialog:openFiles', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio Files', extensions: ['wav', 'mp3', 'aiff', 'flac', 'ogg', 'm4a'] },
      { name: 'MIDI Files', extensions: ['mid', 'midi'] },
      { name: 'Ableton Sets', extensions: ['als'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    ...options,
  });
  return result;
});

ipcMain.handle('dialog:saveFile', async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Ableton Live Set', extensions: ['als'] },
    ],
    ...options,
  });
  return result;
});

ipcMain.handle('shell:openPath', async (_, filePath) => {
  return shell.openPath(filePath);
});

ipcMain.handle('shell:showItemInFolder', async (_, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('app:getPath', async (_, name) => {
  return app.getPath(name);
});

// ─── MIDI IPC Handlers ──────────────────────────────────────────────────────

async function initMidi() {
  if (!JZZ || midiEngine) return;
  try {
    midiEngine = await JZZ({ sysex: true });
  } catch (err) {
    console.error('MIDI init failed:', err.message);
  }
}

ipcMain.handle('midi:getInputs', async () => {
  await initMidi();
  if (!JZZ) return [];
  try {
    const info = JZZ().info();
    return (info.inputs || []).map((inp, i) => ({
      id: `in:${inp.id ?? inp.name ?? i}`,
      name: inp.name || `Input ${i}`,
      manufacturer: inp.manufacturer || 'Unknown',
      type: 'input',
      connected: true,
    }));
  } catch { return []; }
});

ipcMain.handle('midi:getOutputs', async () => {
  await initMidi();
  if (!JZZ) return [];
  try {
    const info = JZZ().info();
    return (info.outputs || []).map((out, i) => ({
      id: `out:${out.id ?? out.name ?? i}`,
      name: out.name || `Output ${i}`,
      manufacturer: out.manufacturer || 'Unknown',
      type: 'output',
      connected: true,
    }));
  } catch { return []; }
});

ipcMain.handle('midi:openInput', async (_, name) => {
  await initMidi();
  if (!midiEngine) return { ok: false, error: 'No MIDI engine' };
  try {
    const port = midiEngine.openMidiIn(name);
    port.connect(function (msg) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('midi:message', {
          channel: (msg[0] & 0x0f) + 1,
          type: msg[0] >= 0x90 && msg[0] < 0xa0 ? 'noteOn' :
                msg[0] >= 0x80 && msg[0] < 0x90 ? 'noteOff' :
                msg[0] >= 0xb0 && msg[0] < 0xc0 ? 'cc' : 'other',
          note: msg[1],
          velocity: msg[2],
          raw: Array.from(msg),
        });
      }
    });
    midiInputPorts.set(name, port);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('midi:openOutput', async (_, name) => {
  await initMidi();
  if (!midiEngine) return { ok: false, error: 'No MIDI engine' };
  try {
    const port = midiEngine.openMidiOut(name);
    midiOutputPorts.set(name, port);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('midi:send', async (_, portName, data) => {
  const port = midiOutputPorts.get(portName);
  if (!port) return { ok: false, error: 'Port not open' };
  try {
    port.send(data);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ─── Ableton IPC Handlers ───────────────────────────────────────────────────

ipcMain.handle('ableton:writeFile', async (_, filePath, dataArray) => {
  try {
    const buffer = Buffer.from(dataArray);
    await fs.promises.writeFile(filePath, buffer);
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('ableton:openInAbleton', async (_, filePath) => {
  return new Promise((resolve) => {
    if (process.platform === 'darwin') {
      execFile('open', [filePath], (err) => {
        resolve(err ? { ok: false, error: err.message } : { ok: true });
      });
    } else {
      shell.openPath(filePath).then((err) => {
        resolve(err ? { ok: false, error: err } : { ok: true });
      });
    }
  });
});

ipcMain.handle('ableton:getTemplates', async () => {
  // Templates are defined in the renderer bundle — just return template IDs
  return [
    { id: 'lofi-hip-hop', name: 'Lo-Fi Hip Hop', bpm: 85 },
    { id: 'jazz-hop', name: 'Jazz Hop', bpm: 90 },
    { id: 'ambient-drift', name: 'Ambient Drift', bpm: 70 },
    { id: 'boom-bap', name: 'Boom Bap', bpm: 92 },
    { id: 'rainy-day', name: 'Rainy Day', bpm: 75 },
  ];
});

// ─── Cleanup ─────────────────────────────────────────────────────────────────

app.on('before-quit', () => {
  for (const [, port] of midiInputPorts) {
    try { port.close(); } catch {}
  }
  for (const [, port] of midiOutputPorts) {
    try { port.close(); } catch {}
  }
  midiInputPorts.clear();
  midiOutputPorts.clear();
});
