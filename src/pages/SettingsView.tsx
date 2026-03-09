import { useState, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { aiClient } from '@/lib/ai/ai-client';

interface Settings {
  apiKey: string;
  abletonPath: string;
  defaultBpm: number;
  defaultTemplate: string;
  sampleLibraryPath: string;
  autoScanMidi: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  abletonPath: '/Applications/Ableton Live 12 Lite.app',
  defaultBpm: 85,
  defaultTemplate: 'lofi-hiphop',
  sampleLibraryPath: '',
  autoScanMidi: true,
};

function loadSettings(): Settings {
  const stored = localStorage.getItem('ma-settings');
  if (stored) {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }; } catch {}
  }
  // Load API key from separate storage (shared with MentorView)
  const apiKey = localStorage.getItem('ma-api-key') || '';
  return { ...DEFAULT_SETTINGS, apiKey };
}

export function SettingsView() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Restore API key on mount
    if (settings.apiKey) {
      aiClient.setApiKey(settings.apiKey);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // Persist all settings
    localStorage.setItem('ma-settings', JSON.stringify(settings));

    // API key also stored separately for MentorView
    if (settings.apiKey) {
      localStorage.setItem('ma-api-key', settings.apiKey);
      aiClient.setApiKey(settings.apiKey);
    } else {
      localStorage.removeItem('ma-api-key');
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBrowse = async (key: 'abletonPath' | 'sampleLibraryPath') => {
    if (!window.ma) return;
    const result = await window.ma.openFiles({
      title: key === 'abletonPath' ? 'Select Ableton Live' : 'Select Sample Library',
    });
    if (!result.canceled && result.filePaths[0]) {
      updateSetting(key, result.filePaths[0]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-9 shrink-0 border-b border-ma-border/40 flex items-center px-3 gap-3 bg-ma-surface/50">
        <span className="text-xs font-mono font-bold text-ma-foreground tracking-wider">SYSTEM</span>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          className={cn(saved ? 'te-btn text-ma-mint' : 'te-btn-primary', 'text-3xs')}
        >
          {saved ? 'SAVED' : 'SAVE'}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 max-w-lg space-y-6">
        {/* AI Section */}
        <Section label="AI ENGINE">
          <Field label="CLAUDE API KEY">
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => updateSetting('apiKey', e.target.value)}
              placeholder="sk-ant-..."
              className="te-input w-full"
            />
            <p className="text-3xs font-mono text-ma-muted/20 mt-1">
              REQUIRED FOR AI MENTOR. GET AT CONSOLE.ANTHROPIC.COM
            </p>
          </Field>
        </Section>

        {/* Ableton Section */}
        <Section label="ABLETON LIVE">
          <Field label="APPLICATION PATH">
            <div className="flex gap-1.5">
              <input
                value={settings.abletonPath}
                onChange={(e) => updateSetting('abletonPath', e.target.value)}
                className="te-input flex-1"
              />
              <button
                onClick={() => handleBrowse('abletonPath')}
                className="te-btn text-3xs"
              >
                BROWSE
              </button>
            </div>
          </Field>
          <Field label="DEFAULT BPM">
            <input
              type="number"
              value={settings.defaultBpm}
              onChange={(e) => updateSetting('defaultBpm', Number(e.target.value))}
              className="te-input w-16 text-center"
              min={20}
              max={300}
            />
          </Field>
          <Field label="DEFAULT TEMPLATE">
            <select
              value={settings.defaultTemplate}
              onChange={(e) => updateSetting('defaultTemplate', e.target.value)}
              className="te-input w-full"
            >
              <option value="lofi-hiphop">LO-FI HIP HOP</option>
              <option value="jazz-hop">JAZZ HOP</option>
              <option value="ambient-drift">AMBIENT DRIFT</option>
              <option value="boom-bap">BOOM BAP</option>
              <option value="rainy-day">RAINY DAY</option>
              <option value="blank">BLANK SESSION</option>
            </select>
          </Field>
        </Section>

        {/* Samples */}
        <Section label="SAMPLE LIBRARY">
          <Field label="LIBRARY PATH">
            <div className="flex gap-1.5">
              <input
                value={settings.sampleLibraryPath}
                onChange={(e) => updateSetting('sampleLibraryPath', e.target.value)}
                placeholder="~/Music/Samples"
                className="te-input flex-1"
              />
              <button
                onClick={() => handleBrowse('sampleLibraryPath')}
                className="te-btn text-3xs"
              >
                BROWSE
              </button>
            </div>
          </Field>
        </Section>

        {/* MIDI */}
        <Section label="MIDI">
          <Field label="AUTO-SCAN ON LAUNCH">
            <button
              onClick={() => updateSetting('autoScanMidi', !settings.autoScanMidi)}
              className={cn(
                'w-10 h-5 border transition-colors duration-75 relative',
                settings.autoScanMidi
                  ? 'bg-ma-orange/20 border-ma-orange/40'
                  : 'bg-ma-ink border-ma-border',
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 w-4 h-3.5 transition-all duration-75',
                  settings.autoScanMidi
                    ? 'left-[1.25rem] bg-ma-orange'
                    : 'left-0.5 bg-ma-muted/40',
                )}
              />
            </button>
          </Field>
        </Section>

        {/* About */}
        <div className="pt-6 border-t border-ma-border/20">
          <div className="text-center space-y-1">
            <p className="text-lg font-mono font-bold text-ma-muted/20">MA</p>
            <p className="text-3xs font-mono text-ma-muted/15">v0.1.0</p>
            <p className="text-3xs font-mono text-ma-muted/10">
              ABLETON LIVE LITE AUTOMATION WRAPPER
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="section-label mb-3">{label}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-2xs font-mono text-ma-text/70 mb-1 block tracking-wider">{label}</label>
      {children}
    </div>
  );
}
