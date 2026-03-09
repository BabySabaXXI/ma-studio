import { createStore } from 'zustand/vanilla';
import type { MidiPort } from './midi-scanner';
import type { MidiMessage } from './midi-monitor';
import type { MidiMapping, ParameterTarget } from './midi-mapper';
import type { LearnRequest } from './midi-learn';
import { midiScanner } from './midi-scanner';
import { midiMonitor } from './midi-monitor';
import { midiMapper } from './midi-mapper';
import { midiLearn } from './midi-learn';

const MAX_MESSAGE_HISTORY = 200;

export interface MidiState {
  ports: MidiPort[];
  connectedInputs: string[];
  connectedOutputs: string[];
  mappings: MidiMapping[];
  learnActive: boolean;
  learnTarget: LearnRequest | null;
  messages: MidiMessage[];
  messagesPerSecond: number;
  scanning: boolean;
  error: string | null;
}

export interface MidiActions {
  scan: () => Promise<void>;
  startWatching: () => Promise<void>;
  stopWatching: () => void;
  connectInput: (portName: string) => Promise<void>;
  disconnectInput: (portName: string) => Promise<void>;
  startLearn: (target: ParameterTarget, label: string, trackIndex?: number) => void;
  stopLearn: () => void;
  addMapping: (mapping: MidiMapping) => void;
  removeMapping: (id: string) => void;
  loadPresetForPort: (portName: string) => void;
  saveMappings: () => void;
  loadMappings: () => void;
  clearMessages: () => void;
  destroy: () => void;
}

export type MidiStore = MidiState & MidiActions;

export const midiStore = createStore<MidiStore>((set, get) => {
  let rateInterval: ReturnType<typeof setInterval> | null = null;

  const messageUnsub = midiMonitor.onMessage((message) => {
    const state = get();

    const consumed = midiLearn.feed(message);
    if (consumed) return;

    set({
      messages: [message, ...state.messages].slice(0, MAX_MESSAGE_HISTORY),
    });
  });

  const learnUnsub = midiLearn.onLearn((result) => {
    set({
      learnActive: false,
      learnTarget: null,
      mappings: midiMapper.getAllMappings(),
    });
  });

  return {
    ports: [],
    connectedInputs: [],
    connectedOutputs: [],
    mappings: [],
    learnActive: false,
    learnTarget: null,
    messages: [],
    messagesPerSecond: 0,
    scanning: false,
    error: null,

    async scan() {
      set({ scanning: true, error: null });
      try {
        const ports = await midiScanner.scan();
        set({ ports, scanning: false });
      } catch (e) {
        set({
          scanning: false,
          error: e instanceof Error ? e.message : 'Scan failed',
        });
      }
    },

    async startWatching() {
      const unsub = midiScanner.onDeviceChange((event) => {
        set({ ports: event.all });
      });

      await midiScanner.startWatching();

      rateInterval = setInterval(() => {
        set({ messagesPerSecond: midiMonitor.getMessagesPerSecond() });
      }, 500);
    },

    stopWatching() {
      midiScanner.stopWatching();
      if (rateInterval) {
        clearInterval(rateInterval);
        rateInterval = null;
      }
    },

    async connectInput(portName: string) {
      try {
        await midiMonitor.connect(portName);
        const state = get();
        set({
          connectedInputs: [...state.connectedInputs, portName],
          error: null,
        });
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : `Failed to connect ${portName}`,
        });
      }
    },

    async disconnectInput(portName: string) {
      await midiMonitor.disconnect(portName);
      const state = get();
      set({
        connectedInputs: state.connectedInputs.filter((n) => n !== portName),
      });
    },

    startLearn(target, label, trackIndex) {
      const request: LearnRequest = { target, label, trackIndex };
      set({ learnActive: true, learnTarget: request });
      midiLearn.start(request);
    },

    stopLearn() {
      midiLearn.cancel();
      set({ learnActive: false, learnTarget: null });
    },

    addMapping(mapping) {
      midiMapper.addMapping(mapping);
      set({ mappings: midiMapper.getAllMappings() });
    },

    removeMapping(id) {
      midiMapper.removeMapping(id);
      set({ mappings: midiMapper.getAllMappings() });
    },

    loadPresetForPort(portName) {
      const preset = midiMapper.autoDetectAndLoad(portName);
      set({ mappings: midiMapper.getAllMappings() });
    },

    saveMappings() {
      midiLearn.save();
    },

    loadMappings() {
      midiLearn.load();
      set({ mappings: midiMapper.getAllMappings() });
    },

    clearMessages() {
      set({ messages: [], messagesPerSecond: 0 });
    },

    destroy() {
      get().stopWatching();
      midiMonitor.destroy();
      midiScanner.destroy();
      messageUnsub();
      learnUnsub();
      if (rateInterval) {
        clearInterval(rateInterval);
        rateInterval = null;
      }
    },
  };
});
