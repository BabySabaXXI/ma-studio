import JZZ from 'jzz';

export interface MidiMessage {
  port: string;
  channel: number;
  type: 'noteon' | 'noteoff' | 'cc' | 'pitchbend' | 'aftertouch' | 'program';
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  timestamp: number;
  raw: number[];
}

type MessageListener = (message: MidiMessage) => void;

export class MidiMonitor {
  private inputs: Map<string, ReturnType<typeof JZZ.prototype.openMidiIn>> = new Map();
  private listeners: MessageListener[] = [];
  private channelFilter: Set<number> | null = null;
  private timestamps: number[] = [];
  private rateWindow = 1000;

  onMessage(listener: MessageListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  setChannelFilter(channels: number[] | null): void {
    this.channelFilter = channels ? new Set(channels) : null;
  }

  async connect(portName: string): Promise<void> {
    if (this.inputs.has(portName)) return;

    const input = await JZZ().openMidiIn(portName);
    this.inputs.set(portName, input);

    input.connect((msg: any) => {
      const parsed = this.parse(portName, msg);
      if (!parsed) return;

      if (this.channelFilter && !this.channelFilter.has(parsed.channel)) return;

      const now = Date.now();
      this.timestamps.push(now);

      for (const listener of this.listeners) {
        listener(parsed);
      }
    });
  }

  async disconnect(portName: string): Promise<void> {
    const input = this.inputs.get(portName);
    if (!input) return;

    try {
      await input.close();
    } catch {
      // already closed
    }
    this.inputs.delete(portName);
  }

  async disconnectAll(): Promise<void> {
    const names = Array.from(this.inputs.keys());
    await Promise.all(names.map((name) => this.disconnect(name)));
  }

  getMessagesPerSecond(): number {
    const now = Date.now();
    const cutoff = now - this.rateWindow;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
    return this.timestamps.length;
  }

  getConnectedPorts(): string[] {
    return Array.from(this.inputs.keys());
  }

  private parse(port: string, msg: any): MidiMessage | null {
    const data: number[] = Array.from(msg);
    if (data.length < 1) return null;

    const status = data[0];
    const type = status & 0xf0;
    const channel = (status & 0x0f) + 1;

    switch (type) {
      case 0x90: {
        const velocity = data[2] ?? 0;
        return {
          port,
          channel,
          type: velocity > 0 ? 'noteon' : 'noteoff',
          note: data[1],
          velocity,
          timestamp: Date.now(),
          raw: data,
        };
      }

      case 0x80:
        return {
          port,
          channel,
          type: 'noteoff',
          note: data[1],
          velocity: data[2] ?? 0,
          timestamp: Date.now(),
          raw: data,
        };

      case 0xb0:
        return {
          port,
          channel,
          type: 'cc',
          controller: data[1],
          value: data[2] ?? 0,
          timestamp: Date.now(),
          raw: data,
        };

      case 0xe0: {
        const lsb = data[1] ?? 0;
        const msb = data[2] ?? 0;
        return {
          port,
          channel,
          type: 'pitchbend',
          value: (msb << 7) | lsb,
          timestamp: Date.now(),
          raw: data,
        };
      }

      case 0xd0:
        return {
          port,
          channel,
          type: 'aftertouch',
          value: data[1] ?? 0,
          timestamp: Date.now(),
          raw: data,
        };

      case 0xc0:
        return {
          port,
          channel,
          type: 'program',
          value: data[1] ?? 0,
          timestamp: Date.now(),
          raw: data,
        };

      default:
        return null;
    }
  }

  destroy(): void {
    this.disconnectAll();
    this.listeners = [];
    this.timestamps = [];
    this.channelFilter = null;
  }
}

export const midiMonitor = new MidiMonitor();
