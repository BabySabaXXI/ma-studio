import { cn } from '@/lib/cn';
import type { View } from '@/App';

interface SidebarProps {
  active: View;
  onNavigate: (view: View) => void;
}

const NAV_ITEMS: Array<{ id: View; label: string; icon: string }> = [
  { id: 'session', label: 'SEQ', icon: '▶' },
  { id: 'midi', label: 'MIDI', icon: '◆' },
  { id: 'mentor', label: 'AI', icon: '◎' },
  { id: 'settings', label: 'SYS', icon: '⚙' },
];

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <nav className="w-12 shrink-0 border-r border-ma-border/40 flex flex-col items-center pt-3 pb-2 gap-0.5 bg-ma-bg">
      {/* Home */}
      <button
        onClick={() => onNavigate('welcome')}
        className={cn(
          'w-10 h-8 flex items-center justify-center transition-all duration-75',
          active === 'welcome'
            ? 'text-ma-orange bg-ma-orange/5'
            : 'text-ma-muted hover:text-ma-foreground',
        )}
      >
        <span className="text-xs font-mono font-bold">MA</span>
      </button>

      <div className="w-6 h-px bg-ma-border/40 my-1" />

      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={cn(
            'w-10 h-10 flex flex-col items-center justify-center gap-0.5 transition-all duration-75 relative',
            active === item.id
              ? 'text-ma-orange'
              : 'text-ma-muted/60 hover:text-ma-foreground',
          )}
          title={item.label}
        >
          <span className="text-[10px] leading-none">{item.icon}</span>
          <span className="text-3xs font-mono tracking-wider">{item.label}</span>
          {active === item.id && (
            <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-ma-orange" />
          )}
        </button>
      ))}

      <div className="flex-1" />

      {/* Status LEDs */}
      <div className="flex flex-col items-center gap-2 mb-1">
        <div className="flex flex-col items-center gap-0.5">
          <div className="led led-midi" />
          <span className="text-3xs font-mono text-ma-muted/30">M</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <div className="led led-on" />
          <span className="text-3xs font-mono text-ma-muted/30">C</span>
        </div>
      </div>
    </nav>
  );
}
