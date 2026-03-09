import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

interface Message {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  'How do I start making a beat?',
  'What MIDI controller for beginners?',
  'Explain sampling simply',
  'Help me arrange my first track',
  'How to mix drums and bass?',
  'Best lo-fi production techniques?',
];

export function MentorView() {
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

    setTimeout(() => {
      const mentorMsg: Message = {
        id: String(Date.now() + 1),
        role: 'mentor',
        content: getMentorResponse(content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, mentorMsg]);
      setIsLoading(false);
    }, 1200);
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
          <div className="led led-on" />
          <span className="text-3xs font-mono text-ma-mint/50">ONLINE</span>
        </div>
        <div className="flex-1" />
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
                  <p className="text-xs font-mono text-ma-text leading-relaxed">{msg.content}</p>
                </div>
              ) : (
                <div className="te-display py-2 px-3">
                  <p className="text-xs font-mono text-ma-foreground">{msg.content}</p>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
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

function getMentorResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('lo-fi') || q.includes('lofi') || q.includes('beat')) {
    return 'START WITH DRUMS. SIMPLE BOOM-BAP AT 80-90 BPM. LAYER VINYL CRACKLE ON TOP. ADD A RHODES OR DETUNED PIANO. KEEP SPACE — SILENCE MATTERS MORE THAN SOUND. USE SIMPLER IN ABLETON TO LOAD A JAZZ PIANO SAMPLE, PITCH IT DOWN.';
  }
  if (q.includes('midi') || q.includes('controller')) {
    return 'AKAI MPK MINI IS SOLID FOR STARTING. 8 PADS FOR FINGER DRUMMING, 8 KNOBS FOR TWEAKING. CONNECT IT — MA AUTO-MAPS KNOBS TO TRACK VOLUMES AND PANS. PADS TRIGGER SAMPLES. START BY PLAYING. MUSCLE MEMORY > THEORY.';
  }
  if (q.includes('sampling') || q.includes('sample')) {
    return 'SAMPLING = BORROWING A MOMENT FROM ONE PIECE TO BUILD SOMETHING NEW. FIND A JAZZ RECORD, ISOLATE A CHORD OR MELODY, PITCH IT, CHOP IT, LAYER IT. NUJABES BUILT WORLDS FROM TWO-BAR LOOPS. START SIMPLE: ONE SAMPLE, ONE DRUM PATTERN, ONE BASS LINE.';
  }
  if (q.includes('arrang')) {
    return '4 BARS INTRO → 8 BARS VERSE → 4 BARS TRANSITION → 8 BARS CHORUS → REPEAT. BUT DON\'T OVERTHINK IT. MANY GREAT BEATS ARE JUST A LOOP THAT BREATHES. ADD AND REMOVE ELEMENTS EVERY 4 OR 8 BARS. START WITH EVERYTHING, THEN STRIP AWAY.';
  }
  if (q.includes('mix') || q.includes('drum') || q.includes('bass')) {
    return 'DRUMS AND BASS FIGHT FOR THE SAME FREQUENCIES. CUT LOW-MIDS FROM BASS TO GIVE KICK SPACE. PAN HATS SLIGHTLY RIGHT, KEEP KICK AND BASS CENTER. VOLUME: DRUMS FIRST AT -6DB, BASS UNDERNEATH. LEAVE HEADROOM. LESS IS MORE.';
  }
  return 'GOOD QUESTION. THE SIMPLEST PATH YIELDS THE DEEPEST RESULTS. TELL ME MORE ABOUT WHAT YOU\'RE BUILDING AND I\'LL GUIDE THE NEXT STEP.';
}
