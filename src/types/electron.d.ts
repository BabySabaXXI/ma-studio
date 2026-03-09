interface MaElectronAPI {
  openFiles: (options?: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
  }) => Promise<{ canceled: boolean; filePaths: string[] }>;

  saveFile: (options?: {
    title?: string;
    defaultPath?: string;
    buttonLabel?: string;
  }) => Promise<{ canceled: boolean; filePath?: string }>;

  openPath: (path: string) => Promise<string>;
  showInFolder: (path: string) => void;
  getPath: (name: string) => Promise<string>;

  midi: {
    getInputs: () => Promise<MidiPort[]>;
    getOutputs: () => Promise<MidiPort[]>;
    openInput: (name: string) => Promise<{ ok: boolean; error?: string }>;
    openOutput: (name: string) => Promise<{ ok: boolean; error?: string }>;
    send: (port: string, data: number[]) => Promise<{ ok: boolean; error?: string }>;
    onMessage: (callback: (data: MidiMessage) => void) => () => void;
  };

  ableton: {
    writeFile: (filePath: string, data: number[]) => Promise<{ ok: boolean; path?: string; error?: string }>;
    openInAbleton: (path: string) => Promise<{ ok: boolean; error?: string }>;
    getTemplates: () => Promise<Array<{ id: string; name: string; bpm: number }>>;
  };

  platform: string;
}

interface MidiPort {
  id: string;
  name: string;
  manufacturer: string;
  type: 'input' | 'output';
  connected: boolean;
}

interface MidiMessage {
  channel: number;
  type: 'noteOn' | 'noteOff' | 'cc' | 'other';
  note?: number;
  velocity?: number;
  raw: number[];
}

interface AbletonSetConfig {
  name: string;
  bpm: number;
  timeSignature: [number, number];
  tracks: TrackConfig[];
  outputPath: string;
}

interface TrackConfig {
  name: string;
  type: 'audio' | 'midi';
  color: number;
  samples?: string[];     // file paths for audio tracks
  instrument?: string;    // instrument preset for midi tracks
  volume: number;         // 0-1
  pan: number;            // -1 to 1
  mute: boolean;
  solo: boolean;
}

interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  bpm: number;
  tracks: TrackConfig[];
  tags: string[];
}

interface Window {
  ma: MaElectronAPI;
}
