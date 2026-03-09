import JZZ from 'jzz';

export interface MidiPort {
  id: string;
  name: string;
  manufacturer: string;
  type: 'input' | 'output';
  connected: boolean;
}

type DeviceChangeEvent = {
  added: MidiPort[];
  removed: MidiPort[];
  all: MidiPort[];
};

type DeviceChangeListener = (event: DeviceChangeEvent) => void;

export class MidiScanner {
  private engine: any = null;
  private listeners: DeviceChangeListener[] = [];
  private knownPorts: Map<string, MidiPort> = new Map();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private polling = false;

  async init(): Promise<void> {
    this.engine = await JZZ({ sysex: true });
  }

  async scan(): Promise<MidiPort[]> {
    if (!this.engine) {
      await this.init();
    }

    const info = JZZ().info();
    const ports: MidiPort[] = [];

    for (const input of info.inputs) {
      ports.push({
        id: `in:${input.id ?? input.name}`,
        name: input.name,
        manufacturer: input.manufacturer ?? '',
        type: 'input',
        connected: true,
      });
    }

    for (const output of info.outputs) {
      ports.push({
        id: `out:${output.id ?? output.name}`,
        name: output.name,
        manufacturer: output.manufacturer ?? '',
        type: 'output',
        connected: true,
      });
    }

    return ports;
  }

  async startWatching(intervalMs = 1000): Promise<void> {
    if (this.polling) return;
    this.polling = true;

    const initial = await this.scan();
    for (const port of initial) {
      this.knownPorts.set(port.id, port);
    }

    this.pollInterval = setInterval(async () => {
      try {
        await this.detectChanges();
      } catch {
        // scan failed, device probably mid-disconnect
      }
    }, intervalMs);
  }

  stopWatching(): void {
    this.polling = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  onDeviceChange(listener: DeviceChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private async detectChanges(): Promise<void> {
    const current = await this.scan();
    const currentIds = new Set(current.map((p) => p.id));
    const previousIds = new Set(this.knownPorts.keys());

    const added: MidiPort[] = [];
    const removed: MidiPort[] = [];

    for (const port of current) {
      if (!previousIds.has(port.id)) {
        added.push(port);
      }
    }

    for (const [id, port] of this.knownPorts) {
      if (!currentIds.has(id)) {
        removed.push({ ...port, connected: false });
      }
    }

    if (added.length > 0 || removed.length > 0) {
      this.knownPorts.clear();
      for (const port of current) {
        this.knownPorts.set(port.id, port);
      }

      const event: DeviceChangeEvent = {
        added,
        removed,
        all: current,
      };

      for (const listener of this.listeners) {
        listener(event);
      }
    }
  }

  destroy(): void {
    this.stopWatching();
    this.listeners = [];
    this.knownPorts.clear();
    this.engine = null;
  }
}

export const midiScanner = new MidiScanner();
