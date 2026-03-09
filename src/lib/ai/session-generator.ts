import { aiClient, MA_SYSTEM_PROMPT } from './ai-client';

export interface GeneratedSession {
  name: string;
  bpm: number;
  tracks: Array<{
    name: string;
    type: 'audio' | 'midi';
    instrument?: string;
    volume: number;
    pan: number;
  }>;
  notes: string;
}

const SESSION_GEN_SYSTEM = `${MA_SYSTEM_PROMPT}

When the user asks you to create a session inspired by a song, artist, or genre, you MUST respond with a JSON block that MA can parse to auto-create the session.

Your response MUST contain exactly one JSON code block in this format:

\`\`\`json
{
  "name": "SESSION NAME",
  "bpm": 85,
  "tracks": [
    { "name": "TRACK NAME", "type": "midi", "instrument": "drums", "volume": 0.8, "pan": 0 },
    { "name": "TRACK NAME", "type": "midi", "instrument": "bass", "volume": 0.7, "pan": 0 },
    { "name": "TRACK NAME", "type": "midi", "instrument": "keys", "volume": 0.6, "pan": -0.15 },
    { "name": "TRACK NAME", "type": "audio", "volume": 0.3, "pan": 0 }
  ],
  "notes": "Brief production notes about this setup"
}
\`\`\`

Rules:
- Maximum 8 tracks (Ableton Lite limit)
- Valid instruments: drums, bass, keys, rhodes, piano, pad, strings, synth, lead, organ, guitar
- Audio tracks are for samples/recordings, MIDI tracks for virtual instruments
- Volume: 0-1, Pan: -1 (left) to 1 (right)
- BPM should match the reference song/genre
- Track names should be SHORT and UPPERCASE
- After the JSON, add a brief explanation of the setup (2-3 sentences max)`;

export async function generateSessionFromPrompt(userMessage: string): Promise<{
  session: GeneratedSession | null;
  response: string;
}> {
  if (!aiClient.isReady()) {
    return {
      session: null,
      response: 'API KEY REQUIRED FOR SESSION GENERATION. SET IT IN SETTINGS.',
    };
  }

  try {
    const response = await aiClient.send(
      [{ role: 'user', content: userMessage }],
      { system: SESSION_GEN_SYSTEM, maxTokens: 1024 },
    );

    // Try to extract JSON from the response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        const session: GeneratedSession = {
          name: String(parsed.name || 'UNTITLED').toUpperCase(),
          bpm: Number(parsed.bpm) || 85,
          tracks: (parsed.tracks || []).slice(0, 8).map((t: Record<string, unknown>) => ({
            name: String(t.name || 'TRACK').toUpperCase(),
            type: t.type === 'audio' ? 'audio' : 'midi',
            instrument: t.instrument ? String(t.instrument) : undefined,
            volume: Math.max(0, Math.min(1, Number(t.volume) || 0.7)),
            pan: Math.max(-1, Math.min(1, Number(t.pan) || 0)),
          })),
          notes: String(parsed.notes || ''),
        };

        // Get the explanation text after the JSON block
        const explanation = response.replace(/```json[\s\S]*?```/, '').trim();

        return { session, response: explanation || session.notes };
      } catch {
        return { session: null, response };
      }
    }

    return { session: null, response };
  } catch (err) {
    return {
      session: null,
      response: `ERROR: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

export function isSessionRequest(message: string): boolean {
  const lower = message.toLowerCase();
  const triggers = [
    'set up', 'setup', 'create a session', 'create session', 'make a session',
    'inspired by', 'like the song', 'similar to', 'in the style of',
    'recreate', 'make something like', 'build a session', 'new session for',
    'feather', 'nujabes', 'j dilla', 'madlib', // common reference artists
  ];
  return triggers.some((t) => lower.includes(t));
}
