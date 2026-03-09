import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { aiClient, type ClientMessage } from '@/lib/ai/ai-client';
import { generateSessionFromPrompt, isSessionRequest, type GeneratedSession } from '@/lib/ai/session-generator';

interface Message {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: Date;
  session?: GeneratedSession;
}

const STARTER_PROMPTS = [
  'Set up a session like Feather by Nujabes',
  'Create a chill lo-fi beat session',
  'How do I start making a beat?',
  'What MIDI controller for beginners?',
  'Explain sampling simply',
  'Best lo-fi production techniques?',
];

interface MentorViewProps {
  onCreateSession?: (session: GeneratedSession) => void;
}

export function MentorView({ onCreateSession }: MentorViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'mentor',
      content: 'MA PRODUCTION GUIDE ONLINE. WHAT DO YOU WANT TO CREATE?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [apiKeySet, setApiKeySet] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  // Check if API key is configured
  useEffect(() => {
    const stored = localStorage.getItem('ma-api-key');
    if (stored) {
      aiClient.setApiKey(stored);
      setApiKeySet(true);
    }
  }, []);

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || isLoading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    // Check if this is a session creation request
    if (isSessionRequest(content) && aiClient.isReady()) {
      try {
        const { session, response } = await generateSessionFromPrompt(content);
        const mentorMsg: Message = {
          id: String(Date.now() + 1),
          role: 'mentor',
          content: session
            ? `SESSION READY: "${session.name}" — ${session.bpm} BPM, ${session.tracks.length} TRACKS\n\n${response}`
            : response,
          timestamp: new Date(),
          session: session || undefined,
        };
        setMessages((prev) => [...prev, mentorMsg]);
        setIsLoading(false);
        return;
      } catch {
        // Fall through to normal chat
      }
    }

    if (aiClient.isReady()) {
      // Build message history for context
      const history: ClientMessage[] = messages
        .filter((m) => m.id !== '0')
        .map((m) => ({
          role: m.role === 'mentor' ? 'assistant' as const : 'user' as const,
          content: m.content,
        }));
      history.push({ role: 'user', content });

      try {
        await aiClient.stream(history, {
          onText: (chunk) => {
            setStreamingText((prev) => prev + chunk);
          },
          onComplete: (fullText) => {
            const mentorMsg: Message = {
              id: String(Date.now() + 1),
              role: 'mentor',
              content: fullText,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, mentorMsg]);
            setStreamingText('');
            setIsLoading(false);
          },
          onError: (error) => {
            const mentorMsg: Message = {
              id: String(Date.now() + 1),
              role: 'mentor',
              content: `CONNECTION ERROR: ${error.message}. CHECK YOUR API KEY IN SETTINGS.`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, mentorMsg]);
            setStreamingText('');
            setIsLoading(false);
          },
        });
      } catch {
        setIsLoading(false);
        setStreamingText('');
      }
    } else {
      // Fallback to local responses when no API key
      setTimeout(() => {
        const localSession = getLocalSession(content);
        const mentorMsg: Message = {
          id: String(Date.now() + 1),
          role: 'mentor',
          content: localSession
            ? `SESSION READY: "${localSession.name}" — ${localSession.bpm} BPM, ${localSession.tracks.length} TRACKS`
            : getLocalResponse(content),
          timestamp: new Date(),
          session: localSession || undefined,
        };
        setMessages((prev) => [...prev, mentorMsg]);
        setIsLoading(false);
      }, 800);
    }
  };

  const handleSetApiKey = () => {
    const key = prompt('Enter your Anthropic API key:');
    if (key && key.startsWith('sk-')) {
      localStorage.setItem('ma-api-key', key);
      aiClient.setApiKey(key);
      setApiKeySet(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-9 shrink-0 border-b border-ma-border/40 flex items-center px-3 gap-3 bg-ma-surface/50">
        <span className="text-xs font-mono font-bold text-ma-foreground tracking-wider">AI MENTOR</span>
        <div className="flex items-center gap-1">
          <div className={cn('led', apiKeySet ? 'led-on' : 'led-off')} />
          <span className={cn('text-3xs font-mono', apiKeySet ? 'text-ma-mint/50' : 'text-ma-muted/30')}>
            {apiKeySet ? 'CLAUDE' : 'LOCAL'}
          </span>
        </div>
        <div className="flex-1" />
        {!apiKeySet && (
          <button
            onClick={handleSetApiKey}
            className="text-3xs font-mono text-ma-orange/50 hover:text-ma-orange transition-colors"
          >
            SET API KEY
          </button>
        )}
        <button
          onClick={() => setMessages([messages[0]])}
          className="text-3xs font-mono text-ma-muted/30 hover:text-ma-muted transition-colors"
        >
          CLEAR
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('mb-3 max-w-lg', msg.role === 'user' && 'ml-auto')}
            >
              {msg.role === 'mentor' ? (
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 shrink-0 mt-0.5 bg-ma-orange flex items-center justify-center">
                    <span className="text-3xs font-mono font-bold text-black">M</span>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-ma-text leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.session && (
                      <div className="mt-2 space-y-1.5">
                        <div className="te-display py-2 px-3">
                          {msg.session.tracks.map((t, i) => (
                            <div key={i} className="flex items-center gap-2 py-0.5">
                              <span className="text-3xs font-mono text-ma-muted/30 w-4">{String(i + 1).padStart(2, '0')}</span>
                              <span className="text-2xs font-mono text-ma-foreground flex-1">{t.name}</span>
                              <span className="text-3xs font-mono text-ma-muted/40">{t.type.toUpperCase()}</span>
                              {t.instrument && <span className="text-3xs font-mono text-ma-orange/40">{t.instrument}</span>}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => onCreateSession?.(msg.session!)}
                          className="te-btn-primary text-3xs w-full"
                        >
                          CREATE SESSION →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="te-display py-2 px-3">
                  <p className="text-xs font-mono text-ma-foreground">{msg.content}</p>
                </div>
              )}
            </motion.div>
          ))}

          {/* Streaming text */}
          {streamingText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-3 flex items-start gap-2"
            >
              <div className="w-4 h-4 shrink-0 mt-0.5 bg-ma-orange flex items-center justify-center">
                <span className="text-3xs font-mono font-bold text-black">M</span>
              </div>
              <p className="text-xs font-mono text-ma-text leading-relaxed whitespace-pre-wrap">{streamingText}</p>
            </motion.div>
          )}

          {isLoading && !streamingText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-3 flex items-start gap-2"
            >
              <div className="w-4 h-4 shrink-0 mt-0.5 bg-ma-orange flex items-center justify-center">
                <span className="text-3xs font-mono font-bold text-black">M</span>
              </div>
              <div className="flex gap-1 items-center h-4">
                <div className="w-1 h-1 bg-ma-orange animate-blink" />
                <div className="w-1 h-1 bg-ma-orange animate-blink" style={{ animationDelay: '0.3s' }} />
                <div className="w-1 h-1 bg-ma-orange animate-blink" style={{ animationDelay: '0.6s' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3"
          >
            <div className="section-label mb-2">SUGGESTIONS</div>
            <div className="grid grid-cols-2 gap-1.5">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="text-left text-3xs font-mono text-ma-muted/50 hover:text-ma-orange
                             bg-ma-surface px-2.5 py-2 border border-ma-border/20
                             hover:border-ma-orange/20 transition-all duration-75"
                >
                  {prompt.toUpperCase()}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-ma-border/40 px-3 py-2 bg-ma-surface/30">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ASK ANYTHING..."
            rows={1}
            className="te-input flex-1 min-h-[2rem] max-h-20 resize-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={cn(
              'te-btn h-8',
              input.trim() && !isLoading ? 'te-btn-primary' : '',
            )}
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}

function getLocalResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('lo-fi') || q.includes('lofi') || q.includes('beat')) {
    return 'START WITH DRUMS. SIMPLE BOOM-BAP AT 80-90 BPM. LAYER VINYL CRACKLE ON TOP. ADD A RHODES OR DETUNED PIANO. KEEP SPACE — SILENCE MATTERS MORE THAN SOUND. USE SIMPLER IN ABLETON TO LOAD A JAZZ PIANO SAMPLE, PITCH IT DOWN.';
  }
  if (q.includes('midi') || q.includes('controller')) {
    return 'AKAI MPK MINI IS SOLID FOR STARTING. 8 PADS FOR FINGER DRUMMING, 8 KNOBS FOR TWEAKING. CONNECT IT — MA AUTO-MAPS KNOBS TO TRACK VOLUMES AND PANS. PADS TRIGGER SAMPLES. START BY PLAYING. MUSCLE MEMORY > THEORY.';
  }
  if (q.includes('sampling') || q.includes('sample')) {
    return 'SAMPLING = BORROWING A MOMENT FROM ONE PIECE TO BUILD SOMETHING NEW. FIND A JAZZ RECORD, ISOLATE A CHORD OR MELODY, PITCH IT, CHOP IT, LAYER IT. START SIMPLE: ONE SAMPLE, ONE DRUM PATTERN, ONE BASS LINE.';
  }
  if (q.includes('arrang')) {
    return '4 BARS INTRO → 8 BARS VERSE → 4 BARS TRANSITION → 8 BARS CHORUS → REPEAT. DON\'T OVERTHINK IT. MANY GREAT BEATS ARE JUST A LOOP THAT BREATHES. ADD AND REMOVE ELEMENTS EVERY 4 OR 8 BARS.';
  }
  if (q.includes('mix') || q.includes('drum') || q.includes('bass')) {
    return 'DRUMS AND BASS FIGHT FOR THE SAME FREQUENCIES. CUT LOW-MIDS FROM BASS TO GIVE KICK SPACE. PAN HATS SLIGHTLY RIGHT, KEEP KICK AND BASS CENTER. VOLUME: DRUMS FIRST AT -6DB, BASS UNDERNEATH. LEAVE HEADROOM.';
  }
  return 'GOOD QUESTION. THE SIMPLEST PATH YIELDS THE DEEPEST RESULTS. TELL ME MORE ABOUT WHAT YOU\'RE BUILDING AND I\'LL GUIDE THE NEXT STEP.\n\n(SET YOUR ANTHROPIC API KEY FOR FULL AI RESPONSES)';
}

function getLocalSession(question: string): GeneratedSession | null {
  const q = question.toLowerCase();

  if (q.includes('feather') || q.includes('nujabes')) {
    return {
      name: 'FEATHER STUDY',
      bpm: 84,
      tracks: [
        { name: 'DRUMS', type: 'midi', instrument: 'drums', volume: 0.75, pan: 0 },
        { name: 'UPRIGHT BASS', type: 'midi', instrument: 'bass', volume: 0.65, pan: 0 },
        { name: 'RHODES', type: 'midi', instrument: 'rhodes', volume: 0.55, pan: -0.15 },
        { name: 'STRINGS', type: 'midi', instrument: 'strings', volume: 0.4, pan: 0.2 },
        { name: 'VINYL', type: 'audio', volume: 0.2, pan: 0 },
      ],
      notes: 'Gentle jazz-hop in the style of Nujabes. Soft drums, walking bass, warm Rhodes. Add vinyl crackle for texture.',
    };
  }

  if (q.includes('lo-fi') || q.includes('lofi') || q.includes('chill')) {
    return {
      name: 'CHILL SESSION',
      bpm: 80,
      tracks: [
        { name: 'DRUMS', type: 'midi', instrument: 'drums', volume: 0.8, pan: 0 },
        { name: 'BASS', type: 'midi', instrument: 'bass', volume: 0.7, pan: 0 },
        { name: 'KEYS', type: 'midi', instrument: 'keys', volume: 0.55, pan: -0.2 },
        { name: 'SAMPLE', type: 'audio', volume: 0.45, pan: 0.1 },
      ],
      notes: 'Classic lo-fi hip hop template. Layer your own samples on the audio track.',
    };
  }

  if (isSessionRequest(q)) {
    return {
      name: 'NEW SESSION',
      bpm: 85,
      tracks: [
        { name: 'DRUMS', type: 'midi', instrument: 'drums', volume: 0.8, pan: 0 },
        { name: 'BASS', type: 'midi', instrument: 'bass', volume: 0.7, pan: 0 },
        { name: 'MELODY', type: 'midi', instrument: 'keys', volume: 0.6, pan: -0.15 },
        { name: 'TEXTURE', type: 'audio', volume: 0.35, pan: 0 },
      ],
      notes: 'Basic 4-track starter. Set your API key for AI-generated custom sessions.',
    };
  }

  return null;
}
