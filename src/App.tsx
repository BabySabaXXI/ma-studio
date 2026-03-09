import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Titlebar } from './components/layout/Titlebar';
import { Sidebar } from './components/layout/Sidebar';
import { SessionView } from './pages/SessionView';
import { MidiView } from './pages/MidiView';
import { MentorView } from './pages/MentorView';
import { SettingsView } from './pages/SettingsView';
import { WelcomeView } from './pages/WelcomeView';
import type { GeneratedSession } from './lib/ai/session-generator';

export type View = 'welcome' | 'session' | 'midi' | 'mentor' | 'settings';

export function App() {
  const [view, setView] = useState<View>('welcome');
  const pendingSessionRef = useRef<GeneratedSession | null>(null);

  const handleCreateSession = useCallback((session: GeneratedSession) => {
    pendingSessionRef.current = session;
    setView('session');
  }, []);

  const consumePendingSession = useCallback(() => {
    const session = pendingSessionRef.current;
    pendingSessionRef.current = null;
    return session;
  }, []);

  const views: Record<View, React.ReactNode> = {
    welcome: <WelcomeView onNavigate={setView} />,
    session: <SessionView consumePendingSession={consumePendingSession} />,
    midi: <MidiView />,
    mentor: <MentorView onCreateSession={handleCreateSession} />,
    settings: <SettingsView />,
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-ma-bg overflow-hidden">
      <Titlebar />
      <div className="flex flex-1 min-h-0">
        <Sidebar active={view} onNavigate={setView} />
        <main className="flex-1 min-w-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              {views[view]}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
