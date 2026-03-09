import { motion } from 'framer-motion';
import type { View } from '@/App';

interface WelcomeViewProps {
  onNavigate: (view: View) => void;
}

const QUICK_ACTIONS = [
  {
    id: 'new-session',
    view: 'session' as View,
    icon: '▶',
    title: 'NEW SESSION',
    description: 'Template or blank canvas',
  },
  {
    id: 'midi-setup',
    view: 'midi' as View,
    icon: '◆',
    title: 'CONNECT',
    description: 'Scan MIDI controllers',
  },
  {
    id: 'ask-mentor',
    view: 'mentor' as View,
    icon: '◎',
    title: 'ASK AI',
    description: 'Production guidance',
  },
];

const TEMPLATES = [
  { name: 'LO-FI HIP HOP', bpm: 85, tracks: 4, key: 'Am' },
  { name: 'JAZZ HOP', bpm: 90, tracks: 4, key: 'Dm' },
  { name: 'AMBIENT DRIFT', bpm: 70, tracks: 3, key: 'C' },
  { name: 'BOOM BAP', bpm: 92, tracks: 4, key: 'Fm' },
  { name: 'RAINY DAY', bpm: 75, tracks: 4, key: 'Em' },
];

export function WelcomeView({ onNavigate }: WelcomeViewProps) {
  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      {/* Header — TE style bold display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <div className="flex items-baseline gap-3 mb-2">
          <h1 className="font-display text-4xl font-bold text-ma-foreground tracking-tight">
            MA
          </h1>
          <span className="text-xs font-mono text-ma-orange tracking-wider">v0.1</span>
        </div>
        <p className="text-xs font-mono text-ma-muted max-w-sm leading-relaxed">
          ABLETON LIVE LITE AUTOMATION.<br />
          LOAD TRACKS. MAP MIDI. CREATE.
        </p>
      </motion.div>

      {/* Quick Actions — TE hardware button style */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="section-label mb-2">ACTIONS</div>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.view)}
              className="group text-left p-3 bg-ma-surface border border-ma-border
                         hover:border-ma-orange/40 active:bg-ma-orange/5 transition-all duration-75"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-ma-orange text-sm">{action.icon}</span>
                <span className="text-3xs font-mono text-ma-muted/40">
                  {String(QUICK_ACTIONS.indexOf(action) + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-xs font-mono font-bold text-ma-foreground tracking-wider">
                {action.title}
              </h3>
              <p className="text-3xs font-mono text-ma-muted mt-1">{action.description}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Templates — TE list display */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <div className="section-label mb-2">TEMPLATES</div>
        <div className="te-display">
          <div className="space-y-0">
            {TEMPLATES.map((tpl, i) => (
              <button
                key={tpl.name}
                onClick={() => onNavigate('session')}
                className="w-full text-left group flex items-center gap-3 py-2
                           hover:bg-ma-orange/[0.03] transition-colors duration-75
                           border-b border-ma-border/20 last:border-b-0"
              >
                <span className="text-3xs font-mono text-ma-muted/30 w-4">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-xs font-mono text-ma-foreground flex-1 tracking-wider">
                  {tpl.name}
                </span>
                <span className="text-3xs font-mono text-ma-orange/60">{tpl.key}</span>
                <span className="text-3xs font-mono text-ma-muted/40">{tpl.bpm}</span>
                <span className="text-3xs font-mono text-ma-muted/30">{tpl.tracks}T</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* System info — TE status display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="section-label mb-2">STATUS</div>
        <div className="flex gap-4 text-3xs font-mono text-ma-muted/30">
          <div className="flex items-center gap-1.5">
            <div className="led led-on" />
            <span>ABLETON LIVE 12 LITE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="led led-midi" />
            <span>MIDI READY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="led led-on" />
            <span>AI CONNECTED</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
