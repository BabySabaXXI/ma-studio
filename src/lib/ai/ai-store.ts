import { createStore } from 'zustand/vanilla';
import { aiClient, type ClientMessage } from './ai-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AISuggestion {
  text: string;
  suggestions: Array<{
    type: 'arrangement' | 'chord' | 'rhythm' | 'mixing' | 'general';
    content: string;
    confidence: number;
  }>;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIState {
  messages: AIMessage[];
  isLoading: boolean;
  suggestions: AISuggestion | null;
  error: string | null;
}

interface AIActions {
  /** Send a user message and get a streamed response. */
  sendMessage: (content: string) => Promise<void>;
  /** Send a prompt and parse the response into structured suggestions. */
  getSuggestion: (prompt: string) => Promise<AISuggestion>;
  /** Clear conversation history. */
  clearHistory: () => void;
  /** Set the API key on the underlying client. */
  setApiKey: (key: string) => void;
}

export type AIStore = AIState & AIActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function buildClientMessages(messages: AIMessage[]): ClientMessage[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Attempt to parse the AI response text into structured suggestions.
 * Falls back to a single "general" suggestion if parsing fails.
 */
function parseSuggestions(text: string): AISuggestion {
  const suggestions: AISuggestion['suggestions'] = [];

  // Detect arrangement sections
  const arrangementPattern =
    /\b(intro|verse|chorus|bridge|outro|pre-?chorus|drop|breakdown)\b/gi;
  if (arrangementPattern.test(text)) {
    suggestions.push({
      type: 'arrangement',
      content: text,
      confidence: 0.85,
    });
  }

  // Detect chord-related content
  const chordPattern =
    /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13)?)\b/g;
  const chordMatches = text.match(chordPattern);
  if (chordMatches && chordMatches.length >= 3) {
    suggestions.push({
      type: 'chord',
      content: text,
      confidence: 0.8,
    });
  }

  // Detect mixing content
  const mixingPattern = /\b(dB|pan|EQ|volume|freq|high.?pass|low.?cut|stereo)\b/gi;
  if (mixingPattern.test(text)) {
    suggestions.push({
      type: 'mixing',
      content: text,
      confidence: 0.75,
    });
  }

  // Detect rhythm content
  const rhythmPattern = /\b(BPM|tempo|swing|groove|beat|bar|measure|quantize)\b/gi;
  if (rhythmPattern.test(text)) {
    suggestions.push({
      type: 'rhythm',
      content: text,
      confidence: 0.7,
    });
  }

  // Always include a general suggestion as fallback
  if (suggestions.length === 0) {
    suggestions.push({
      type: 'general',
      content: text,
      confidence: 0.9,
    });
  }

  return { text, suggestions };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const aiStore = createStore<AIStore>((set, get) => ({
  // State
  messages: [],
  isLoading: false,
  suggestions: null,
  error: null,

  // Actions
  setApiKey(key: string) {
    aiClient.setApiKey(key);
  },

  async sendMessage(content: string) {
    if (!aiClient.isReady()) {
      set({ error: 'API key not configured. Open Settings to add your Anthropic key.' });
      return;
    }

    const userMessage: AIMessage = {
      id: makeId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    const assistantMessage: AIMessage = {
      id: makeId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Add empty assistant message that we fill via streaming
    set((state) => ({
      messages: [...state.messages, assistantMessage],
    }));

    try {
      const history = buildClientMessages(get().messages.slice(0, -1)); // exclude empty assistant msg

      await aiClient.stream(history, {
        onText(text) {
          set((state) => {
            const msgs = [...state.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.id === assistantMessage.id) {
              msgs[msgs.length - 1] = { ...last, content: last.content + text };
            }
            return { messages: msgs };
          });
        },
        onComplete(fullText) {
          const parsed = parseSuggestions(fullText);
          set((state) => {
            const msgs = [...state.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.id === assistantMessage.id) {
              msgs[msgs.length - 1] = {
                ...last,
                content: fullText,
                timestamp: Date.now(),
              };
            }
            return {
              messages: msgs,
              suggestions: parsed,
              isLoading: false,
            };
          });
        },
        onError(error) {
          set((state) => {
            // Remove the empty assistant message on error
            const msgs = state.messages.filter((m) => m.id !== assistantMessage.id);
            return {
              messages: msgs,
              isLoading: false,
              error: error.message,
            };
          });
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== assistantMessage.id),
        isLoading: false,
        error: message,
      }));
    }
  },

  async getSuggestion(prompt: string): Promise<AISuggestion> {
    if (!aiClient.isReady()) {
      throw new Error('API key not configured.');
    }

    set({ isLoading: true, error: null });

    try {
      const text = await aiClient.send([{ role: 'user', content: prompt }]);
      const parsed = parseSuggestions(text);
      set({ suggestions: parsed, isLoading: false });
      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed.';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  clearHistory() {
    set({ messages: [], suggestions: null, error: null });
  },
}));
