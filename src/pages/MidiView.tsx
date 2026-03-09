import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface MidiDevice {
  id: string;
  name: string;
  type: 'input' | 'output';
  connected: boolean;
  manufacturer: string;
}

interface MidiActivity {
  channel: number;
  type: string;
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
}

const MOCK_DEVICES: MidiDevice[] = [
  { id: '1', name: 'MPK Mini MK3', type: 'input', connected: true, manufacturer: 'Akai' },
  { id: '2', name: 'MPK Mini MK3', type: 'output', connected: true, manufacturer: 'Akai' },
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function noteToName(note: number): string {
  return `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

const MAPPINGS = [
  { id: 'vol-1', param: 'CH1 VOLUME', cc: 'CC 01', source: 'KNOB 1' },
  { id: 'vol-2', param: 'CH2 VOLUME', cc: 'CC 02', source: 'KNOB 2' },
  { id: 'vol-3', param: 'CH3 VOLUME', cc: 'CC 03', source: 'KNOB 3' },
  { id: 'pan-1', param: 'CH1 PAN', cc: 'CC 10', source: 'KNOB 5' },
  { id: 'trig-1', param: 'PAD BANK A', cc: 'N 36-43', source: 'PADS 1-8' },
];

export function MidiView() {
  const [devices] = useState<MidiDevice[]>(MOCK_DEVICES);
  const [activity] = useState<MidiActivity[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [learnMode, setLearnMode] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header strip */}
      <div className="h-9 shrink-0 border-b border-ma-border/40 flex items-center px-3 gap-3 bg-ma-surface/50">
        <span className="text-xs font-mono font-bold text-ma-foreground tracking-wider">MIDI</span>
        <div className="flex-1" />
        <button onClick={handleScan} disabled={isScanning} className="te-btn text-3xs">
          {isScanning ? 'SCANNING...' : 'SCAN'}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6">
        {/* Devices */}
        <div>
          <div className="section-label mb-2">CONNECTED DEVICES</div>
          {devices.length === 0 ? (
            <div className="te-display py-6 text-center">
              <p className="text-xs font-mono text-ma-muted/40">NO DEVICES DETECTED</p>
              <p className="text-3xs font-mono text-ma-muted/20 mt-1">CONNECT A CONTROLLER AND SCAN</p>
            </div>
          ) : (
            <div className="space-y-1">
              {devices.map((device, i) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-3 py-2 bg-ma-surface border border-ma-border/30"
                >
                  <div className={cn('led', device.connected ? 'led-on' : 'led-off')} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono font-bold text-ma-foreground tracking-wider">
                      {device.name}
                    </div>
                    <div className="text-3xs font-mono text-ma-muted/40">
                      {device.manufacturer} — {device.type.toUpperCase()}
                    </div>
                  </div>
                  <span className={cn(
                    'text-3xs font-mono px-2 py-0.5',
                    device.connected ? 'text-ma-mint bg-ma-mint/5' : 'text-ma-muted/20',
                  )}>
                    {device.connected ? 'ACTIVE' : 'OFF'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Mappings */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="section-label">MAPPINGS</span>
            <button
              onClick={() => setLearnMode(!learnMode)}
              className={cn(
                'text-3xs font-mono px-2 py-0.5 transition-all duration-75',
                learnMode
                  ? 'text-ma-red bg-ma-red/10 animate-blink'
                  : 'text-ma-muted/40 hover:text-ma-orange',
              )}
            >
              {learnMode ? '● LEARN' : 'MIDI LEARN'}
            </button>
          </div>

          <div className="te-display">
            {MAPPINGS.map((mapping) => (
              <div
                key={mapping.id}
                onClick={() => setSelectedMapping(selectedMapping === mapping.id ? null : mapping.id)}
                className={cn(
                  'flex items-center gap-3 py-1.5 cursor-pointer transition-colors duration-75 border-b border-ma-border/15 last:border-b-0',
                  selectedMapping === mapping.id ? 'bg-ma-orange/[0.03]' : 'hover:bg-ma-surface/30',
                )}
              >
                <span className="text-2xs font-mono text-ma-foreground w-28 tracking-wider">{mapping.param}</span>
                <span className="text-3xs font-mono text-ma-orange/50 w-14">{mapping.cc}</span>
                <span className="text-3xs font-mono text-ma-muted/30 flex-1">{mapping.source}</span>
                {learnMode && selectedMapping === mapping.id && (
                  <span className="text-3xs font-mono text-ma-red animate-blink">WAITING</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Monitor */}
        <div>
          <div className="section-label mb-2">MONITOR</div>
          <div className="te-display h-28 overflow-y-auto">
            {activity.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-3xs font-mono text-ma-muted/20">PLAY CONTROLLER TO SEE MESSAGES</span>
              </div>
            ) : (
              activity.map((msg, i) => (
                <div key={i} className="flex gap-2 text-3xs font-mono text-ma-muted/50 py-0.5">
                  <span className="text-ma-muted/20 w-6">CH{msg.channel}</span>
                  <span className="text-ma-orange/50 w-10">{msg.type}</span>
                  {msg.note !== undefined && <span className="w-8">{noteToName(msg.note)}</span>}
                  {msg.velocity !== undefined && <span className="text-ma-muted/30">V{msg.velocity}</span>}
                  {msg.controller !== undefined && <span className="w-8">CC{msg.controller}</span>}
                  {msg.value !== undefined && <span className="text-ma-muted/30">{msg.value}</span>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Keyboard — TE step-sequencer style */}
        <div>
          <div className="section-label mb-2">KEYBOARD</div>
          <div className="flex h-12 gap-px">
            {Array.from({ length: 25 }, (_, i) => {
              const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
              return (
                <div
                  key={i}
                  className={cn(
                    'transition-colors duration-75',
                    isBlack
                      ? 'w-2.5 h-7 bg-ma-bg border border-ma-border/30 -mx-1 z-10 relative'
                      : 'flex-1 h-12 bg-ma-elevated border border-ma-border/20 hover:bg-ma-orange/10',
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
