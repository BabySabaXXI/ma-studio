import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreamCallbacks {
  onText?: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export interface ClientMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ---------------------------------------------------------------------------
// System prompt  -- the soul of Ma
// ---------------------------------------------------------------------------

export const MA_SYSTEM_PROMPT = `You are Ma (\u9593), a music production guide built into a desktop studio app that wraps Ableton Live Lite.

Personality:
- Speak concisely, like a patient sensei. No filler, no hype.
- Prefer silence over noise. If one sentence is enough, stop there.
- Frame advice as practical next steps, not theory lectures.
- When a concept is complex, use a single clear analogy, then move on.

Knowledge constraints:
- Ableton Live Lite limits: 8 audio/MIDI tracks, limited built-in instruments (Drift, Simpler), no Max for Live, no complex routing.
- Work within these limits creatively. Never suggest features unavailable in Lite.
- Draw from jazz, hip-hop, and lo-fi production techniques.
- Embrace the concept of \u9593 (ma) -- the power of space, rest, and negative space in music.

Response format:
- Keep responses under 200 words unless the user explicitly asks for detail.
- Use short paragraphs. Bullet points for lists of 3+ items.
- When suggesting musical elements, be specific: name notes, bar counts, BPM ranges, dB levels.
- If you recommend an action the user can take in the app, phrase it as a direct instruction.`;

// ---------------------------------------------------------------------------
// AI Client
// ---------------------------------------------------------------------------

const RETRY_DELAYS = [1000, 2000, 4000]; // ms
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;

class AIClient {
  private client: Anthropic | null = null;
  private apiKey: string | null = null;

  /**
   * Set the API key at runtime (called from the renderer once settings load).
   */
  setApiKey(key: string): void {
    this.apiKey = key;
    this.client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  }

  /**
   * Returns true when the client is ready to make requests.
   */
  isReady(): boolean {
    return this.client !== null && this.apiKey !== null;
  }

  // -----------------------------------------------------------------------
  // Non-streaming request
  // -----------------------------------------------------------------------

  async send(
    messages: ClientMessage[],
    options?: { maxTokens?: number; system?: string },
  ): Promise<string> {
    const client = this.ensureClient();
    const sys = options?.system ?? MA_SYSTEM_PROMPT;

    const response = await this.withRetry(() =>
      client.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: options?.maxTokens ?? MAX_TOKENS,
        system: sys,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    );

    const block = response.content[0];
    if (block.type !== 'text') {
      throw new Error('Unexpected response block type: ' + block.type);
    }
    return block.text;
  }

  // -----------------------------------------------------------------------
  // Streaming request
  // -----------------------------------------------------------------------

  async stream(
    messages: ClientMessage[],
    callbacks: StreamCallbacks,
    options?: { maxTokens?: number; system?: string },
  ): Promise<void> {
    const client = this.ensureClient();
    const sys = options?.system ?? MA_SYSTEM_PROMPT;

    let fullText = '';

    try {
      const stream = client.messages.stream({
        model: DEFAULT_MODEL,
        max_tokens: options?.maxTokens ?? MAX_TOKENS,
        system: sys,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      stream.on('text', (text) => {
        fullText += text;
        callbacks.onText?.(text);
      });

      await stream.finalMessage();
      callbacks.onComplete?.(fullText);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      callbacks.onError?.(error);
    }
  }

  // -----------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------

  private ensureClient(): Anthropic {
    if (!this.client) {
      throw new Error(
        'AI client not initialized. Call setApiKey() with your Anthropic API key first.',
      );
    }
    return this.client;
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Only retry on rate-limit (429) or server errors (5xx)
        const status = (err as { status?: number }).status;
        const isRetryable = status === 429 || (status !== undefined && status >= 500);

        if (!isRetryable || attempt >= RETRY_DELAYS.length) {
          break;
        }

        await this.sleep(RETRY_DELAYS[attempt]);
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton
export const aiClient = new AIClient();
