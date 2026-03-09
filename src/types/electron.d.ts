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
    openInput: (name: string) => Promise<boolean>;
    openOutput: (name: string) => Promise<boolean>;
    send: (port: string, data: number[]) => Promise<void>;
    onMessage: (callback: (data: MidiMessage) => void) => () => void;
  };

  ableton: {
    generateSet: (config: AbletonSetConfig) => Promise<string>;
    openInAbleton: (path: string) => Promise<void>;
    getTemplates: () => Promise<SessionTemplate[]>;
  };

  ai: {
    suggest: (prompt: string, context?: Record<string, unknown>) => Promise<AISuggestion>;
    analyzeAudio: (path: string) => Promise<AudioAnalysis>;
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
  port: string;
  channel: number;
  type: 'noteon' | 'noteoff' | 'cc' | 'pitchbend' | 'aftertouch';
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
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

interface AISuggestion {
  text: string;
  suggestions: Array<{
    type: 'arrangement' | 'chord' | 'rhythm' | 'mixing' | 'general';
    content: string;
    confidence: number;
  }>;
}

interface AudioAnalysis {
  bpm: number;
  key: string;
  duration: number;
  genre: string[];
  mood: string[];
}

interface Window {
  ma: MaElectronAPI;
}
