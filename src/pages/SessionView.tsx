import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { generateAbletonSet } from '@/lib/ableton/als-generator';
import type { GeneratedSession } from '@/lib/ai/session-generator';

interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi';
  color: string;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  armed: boolean;
  samples: string[];
  instrument?: string;
}

const TE_COLORS = ['#ff6a00', '#00d4aa', '#3388ff', '#ffcc00', '#ff3333', '#a855f7', '#ededed', '#5a5a5a'];

const DEFAULT_TRACKS: Track[] = [
  { id: '1', name: 'DRUMS', type: 'audio', color: TE_COLORS[0], volume: 0.8, pan: 0, mute: false, solo: false, armed: false, samples: [] },
  { id: '2', name: 'BASS', type: 'midi', color: TE_COLORS[1], volume: 0.7, pan: 0, mute: false, solo: false, armed: false, samples: [] },
  { id: '3', name: 'KEYS', type: 'midi', color: TE_COLORS[2], volume: 0.6, pan: -0.2, mute: false, solo: false, armed: false, samples: [] },
  { id: '4', name: 'SAMPLE', type: 'audio', color: TE_COLORS[3], volume: 0.5, pan: 0.15, mute: false, solo: false, armed: false, samples: [] },
];

interface SessionViewProps {
  consumePendingSession?: () => GeneratedSession | null;
}

export function SessionView({ consumePendingSession }: SessionViewProps) {
  const [sessionName, setSessionName] = useState('UNTITLED');
  const [bpm, setBpm] = useState(85);
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [selectedTrack, setSelectedTrack] = useState<string | null>('1');
  const [isPlaying, setIsPlaying] = useState(false);

  // Apply pending AI-generated session
  useEffect(() => {
    const session = consumePendingSession?.();
    if (session) {
      setSessionName(session.name);
      setBpm(session.bpm);
      setTracks(
        session.tracks.map((t, i) => ({
          id: String(Date.now() + i),
          name: t.name,
          type: t.type,
          color: TE_COLORS[i % TE_COLORS.length],
          volume: t.volume,
          pan: t.pan,
          mute: false,
          solo: false,
          armed: false,
          samples: [],
          instrument: t.instrument,
        })),
      );
      setSelectedTrack(null);
    }
  }, [consumePendingSession]);

  const waveformData = useMemo(() =>
    tracks.map((t) => ({
      id: t.id,
      bars: Array.from({ length: 128 }, () => Math.random() * 0.9 + 0.1),
    })),
    [tracks.length],
  );

  const toggleTrackProp = (id: string, prop: 'mute' | 'solo' | 'armed') => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, [prop]: !t[prop] } : t)));
  };

  const handleAddTrack = () => {
    if (tracks.length >= 8) return;
    const newTrack: Track = {
      id: String(Date.now()),
      name: `TRACK ${tracks.length + 1}`,
      type: 'audio',
      color: TE_COLORS[tracks.length % TE_COLORS.length],
      volume: 0.7,
      pan: 0,
      mute: false,
      solo: false,
      armed: false,
      samples: [],
    };
    setTracks((prev) => [...prev, newTrack]);
  };

  const handleLoadSamples = async (trackId: string) => {
    if (!window.ma) return;
    const result = await window.ma.openFiles({ title: 'Load Samples' });
    if (result.canceled) return;
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, samples: [...t.samples, ...result.filePaths] } : t,
      ),
    );
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!window.ma) return;
    const result = await window.ma.saveFile({
      title: 'Export Ableton Live Set',
      defaultPath: `${sessionName}.als`,
    });
    if (result.canceled || !result.filePath) return;

    setExporting(true);
    try {
      // Convert UI tracks to AbletonSetConfig
      const config: AbletonSetConfig = {
        name: sessionName,
        bpm,
        timeSignature: [4, 4],
        tracks: tracks.map((t, i) => ({
          name: t.name,
          type: t.type,
          color: i,
          volume: t.volume,
          pan: t.pan,
          mute: t.mute,
          solo: t.solo,
          samples: t.samples,
        })),
        outputPath: result.filePath,
      };

      // Generate .als bytes in renderer
      const data = await generateAbletonSet(config);

      // Write to disk via main process
      const writeResult = await window.ma.ableton.writeFile(
        result.filePath,
        Array.from(data),
      );

      if (writeResult.ok) {
        // Auto-open in Ableton
        await window.ma.ableton.openInAbleton(result.filePath);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Transport Bar — TE hardware strip */}
      <div className="h-9 shrink-0 border-b border-ma-border/40 flex items-center px-3 gap-3 bg-ma-surface/50">
        <input
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value.toUpperCase())}
          className="bg-transparent text-xs font-mono font-bold text-ma-foreground border-none outline-none w-28 tracking-wider"
          placeholder="NAME..."
        />

        <div className="w-px h-4 bg-ma-border/40" />

        {/* Transport */}
        <div className="flex items-center gap-0.5">
          <button
            className={cn('transport-btn', isPlaying && 'active')}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          <button className="transport-btn" onClick={() => setIsPlaying(false)}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" />
            </svg>
          </button>
          <button className="transport-btn">
            <div className={cn('w-2.5 h-2.5', isPlaying ? 'led-record animate-blink' : 'bg-ma-red/30')} />
          </button>
        </div>

        <div className="w-px h-4 bg-ma-border/40" />

        {/* BPM display — TE seven-segment style */}
        <div className="flex items-center gap-1">
          <span className="text-3xs font-mono text-ma-muted/50">BPM</span>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-10 bg-ma-ink text-sm font-mono font-bold text-ma-orange text-center border border-ma-border/40 outline-none py-0.5"
            min={20}
            max={300}
          />
        </div>

        <div className="flex-1" />

        {/* Track count */}
        <span className="text-3xs font-mono text-ma-muted/40">{tracks.length}/8 TRACKS</span>

        <button
          onClick={handleExport}
          disabled={exporting}
          className={cn('te-btn text-3xs', exporting && 'opacity-50')}
        >
          {exporting ? 'EXPORTING...' : 'EXPORT .ALS'}
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 min-h-0 flex">
        {/* Track List — TE channel strip */}
        <div className="w-48 shrink-0 border-r border-ma-border/40 flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-ma-border/30">
            <span className="section-label">CHANNELS</span>
            <button
              onClick={handleAddTrack}
              disabled={tracks.length >= 8}
              className="text-ma-muted/50 hover:text-ma-orange disabled:opacity-20 transition-colors text-xs"
            >
              +
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'track-lane px-3 py-2 cursor-pointer',
                  selectedTrack === track.id && 'selected',
                )}
                onClick={() => setSelectedTrack(track.id)}
              >
                {/* Track header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-3xs font-mono text-ma-muted/30">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-1.5 h-1.5" style={{ backgroundColor: track.color }} />
                  <span className="text-2xs font-mono font-bold text-ma-foreground truncate flex-1 tracking-wider">
                    {track.name}
                  </span>
                  <span className="text-3xs font-mono text-ma-muted/30 uppercase">
                    {track.type === 'audio' ? 'AUD' : 'MID'}
                  </span>
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-0.5">
                  {(['mute', 'solo', 'armed'] as const).map((prop) => {
                    const labels = { mute: 'M', solo: 'S', armed: 'R' };
                    const activeColors = {
                      mute: 'text-ma-yellow bg-ma-yellow/10',
                      solo: 'text-ma-blue bg-ma-blue/10',
                      armed: 'text-ma-red bg-ma-red/10',
                    };
                    return (
                      <button
                        key={prop}
                        onClick={(e) => { e.stopPropagation(); toggleTrackProp(track.id, prop); }}
                        className={cn(
                          'text-3xs font-mono w-5 h-4 flex items-center justify-center transition-all duration-75',
                          track[prop] ? activeColors[prop] : 'text-ma-muted/20 hover:text-ma-muted/50',
                        )}
                      >
                        {labels[prop]}
                      </button>
                    );
                  })}

                  <div className="flex-1" />

                  <button
                    onClick={(e) => { e.stopPropagation(); handleLoadSamples(track.id); }}
                    className="text-3xs font-mono text-ma-muted/20 hover:text-ma-orange transition-colors"
                  >
                    +LOAD
                  </button>
                </div>

                {/* Volume meter */}
                <div className="mt-1.5 h-[2px] bg-ma-border/20 overflow-hidden">
                  <div
                    className="h-full transition-all duration-100"
                    style={{
                      width: `${track.volume * 100}%`,
                      backgroundColor: track.mute ? '#333' : track.color,
                    }}
                  />
                </div>

                {/* Sample list */}
                {track.samples.length > 0 && (
                  <div className="mt-1 space-y-0">
                    {track.samples.slice(0, 2).map((s) => (
                      <div key={s} className="text-3xs font-mono text-ma-muted/30 truncate">
                        {s.split('/').pop()}
                      </div>
                    ))}
                    {track.samples.length > 2 && (
                      <span className="text-3xs font-mono text-ma-muted/20">
                        +{track.samples.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Arrangement Area — TE sequencer grid */}
        <div className="flex-1 min-w-0 overflow-auto bg-ma-ink/50">
          <div className="h-full flex flex-col">
            {/* Timeline ruler */}
            <div className="h-5 shrink-0 border-b border-ma-border/30 flex items-end px-1 bg-ma-surface/30">
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i} className="flex-1 min-w-[4rem] flex items-end">
                  <span className="text-3xs font-mono text-ma-muted/20 pl-1">
                    {i + 1}
                  </span>
                  {/* Beat markers */}
                  <div className="flex-1 flex justify-evenly">
                    {[0, 1, 2, 3].map((b) => (
                      <div
                        key={b}
                        className={cn(
                          'w-px h-2',
                          b === 0 ? 'bg-ma-muted/20' : 'bg-ma-border/20',
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Track lanes with waveform visualization */}
            <div className="flex-1">
              {tracks.map((track) => {
                const wave = waveformData.find((w) => w.id === track.id);
                return (
                  <div
                    key={track.id}
                    className={cn(
                      'h-14 border-b border-ma-border/10 flex items-center relative',
                      selectedTrack === track.id && 'bg-ma-orange/[0.02]',
                    )}
                  >
                    {track.samples.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xs font-mono text-ma-muted/15 tracking-wider">
                          {track.type === 'audio' ? 'DROP AUDIO' : 'MIDI — RECORD OR DRAW'}
                        </span>
                      </div>
                    ) : wave ? (
                      <div className="absolute inset-0 flex items-end px-1 gap-px pb-1">
                        {wave.bars.map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 waveform-bar"
                            style={{
                              height: `${h * 80}%`,
                              backgroundColor: track.color,
                              opacity: track.mute ? 0.05 : 0.25,
                            }}
                          />
                        ))}
                      </div>
                    ) : null}

                    {/* Playhead */}
                    {isPlaying && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-ma-orange/40"
                        style={{ left: '15%', animation: 'moveRight 8s linear infinite' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar — TE info strip */}
      <div className="h-5 shrink-0 border-t border-ma-border/40 flex items-center px-3 gap-3 bg-ma-surface/30">
        <span className="text-3xs font-mono text-ma-orange">{bpm}</span>
        <span className="text-3xs font-mono text-ma-muted/30">BPM</span>
        <div className="w-px h-2 bg-ma-border/30" />
        <span className="text-3xs font-mono text-ma-muted/30">4/4</span>
        <div className="w-px h-2 bg-ma-border/30" />
        <span className="text-3xs font-mono text-ma-muted/30">{tracks.length} CH</span>
        <div className="flex-1" />
        {isPlaying && (
          <div className="flex items-center gap-1">
            <div className="led led-on" />
            <span className="text-3xs font-mono text-ma-mint/60">PLAYING</span>
          </div>
        )}
        <span className="text-3xs font-mono text-ma-muted/20">ABLETON LIVE 12 LITE</span>
      </div>
    </div>
  );
}
