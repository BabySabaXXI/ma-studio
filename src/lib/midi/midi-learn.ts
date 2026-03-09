import type { MidiMapping, ParameterTarget } from './midi-mapper';
import type { MidiMessage } from './midi-monitor';
import { midiMapper } from './midi-mapper';

export interface LearnRequest {
  target: ParameterTarget;
  trackIndex?: number;
  label: string;
}

export interface LearnResult {
  mapping: MidiMapping;
  message: MidiMessage;
}

type LearnCallback = (result: LearnResult) => void;

const STORAGE_KEY = 'ma-midi-mappings';

export class MidiLearn {
  private active = false;
  private request: LearnRequest | null = null;
  private resolve: ((result: LearnResult) => void) | null = null;
  private reject: ((reason: Error) => void) | null = null;
  private listeners: LearnCallback[] = [];

  get isActive(): boolean {
    return this.active;
  }

  get currentRequest(): LearnRequest | null {
    return this.request;
  }

  start(request: LearnRequest): Promise<LearnResult> {
    this.cancel();

    this.active = true;
    this.request = request;

    return new Promise<LearnResult>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  feed(message: MidiMessage): boolean {
    if (!this.active || !this.request) return false;

    if (message.type !== 'cc' && message.type !== 'noteon') return false;

    const mapping = this.createMapping(message, this.request);
    midiMapper.addMapping(mapping);

    const result: LearnResult = { mapping, message };

    for (const listener of this.listeners) {
      listener(result);
    }

    if (this.resolve) {
      this.resolve(result);
    }

    this.cleanup();
    return true;
  }

  cancel(): void {
    if (this.reject && this.active) {
      this.reject(new Error('Learn cancelled'));
    }
    this.cleanup();
  }

  onLearn(callback: LearnCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  save(): void {
    const mappings = midiMapper.exportMappings();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
    } catch {
      // localStorage unavailable in some contexts
    }
  }

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const mappings = JSON.parse(raw) as MidiMapping[];
      midiMapper.importMappings(mappings);
    } catch {
      // corrupt or unavailable
    }
  }

  clearSaved(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  }

  private createMapping(message: MidiMessage, request: LearnRequest): MidiMapping {
    if (message.type === 'cc' && message.controller !== undefined) {
      return {
        id: `learn-cc-${message.channel}-${message.controller}-${request.target}`,
        sourceType: 'cc',
        channel: message.channel,
        controller: message.controller,
        target: request.target,
        trackIndex: request.trackIndex,
        min: 0,
        max: 127,
        label: request.label,
      };
    }

    return {
      id: `learn-note-${message.channel}-${message.note}-${request.target}`,
      sourceType: 'note',
      channel: message.channel,
      note: message.note,
      target: request.target,
      trackIndex: request.trackIndex,
      min: 0,
      max: 127,
      label: request.label,
    };
  }

  private cleanup(): void {
    this.active = false;
    this.request = null;
    this.resolve = null;
    this.reject = null;
  }
}

export const midiLearn = new MidiLearn();
