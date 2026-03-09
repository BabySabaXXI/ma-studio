import { aiClient } from './ai-client';
import {
  arrangementPrompt,
  chordProgressionPrompt,
  mixingTipsPrompt,
  sampleSelectionPrompt,
  sessionReviewPrompt,
  beginnerGuidancePrompt,
} from './ai-prompts';
import { aiStore, type AISuggestion } from './ai-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionContext {
  bpm?: number;
  genre?: string;
  key?: string;
  mood?: string;
  tracks?: Array<{ name: string; type: 'audio' | 'midi'; volume: number; pan: number }>;
  sessionName?: string;
}

export interface SessionState {
  hasSession: boolean;
  trackCount: number;
  hasMidiTracks: boolean;
  hasAudioTracks: boolean;
  hasArrangement: boolean;
  minutesElapsed: number;
  genre?: string;
  bpm?: number;
}

export interface SessionPlan {
  genre: string;
  mood: string;
  bpm: number;
  suggestedTracks: Array<{ name: string; type: 'audio' | 'midi'; role: string }>;
  arrangement: string;
  firstStep: string;
}

// ---------------------------------------------------------------------------
// Mentor  --  high-level AI interface for the app
// ---------------------------------------------------------------------------

/**
 * General question with session awareness.
 * Injects current session context so the AI can give relevant answers.
 */
export async function askMentor(
  question: string,
  context?: SessionContext,
): Promise<AISuggestion> {
  const contextBlock = context ? formatContext(context) : '';
  const prompt = contextBlock
    ? `${contextBlock}\n\nUser question: ${question}`
    : question;

  return aiStore.getState().getSuggestion(prompt);
}

/**
 * Based on what the user has done so far, suggest the single best next action.
 */
export async function suggestNextStep(
  sessionState: SessionState,
): Promise<string> {
  const prompt = buildNextStepPrompt(sessionState);
  const text = await aiClient.send([{ role: 'user', content: prompt }], {
    maxTokens: 256,
  });
  return text;
}

/**
 * Explain a music production concept in simple terms.
 */
export async function explainConcept(concept: string): Promise<string> {
  const prompt = [
    `Explain "${concept}" to someone who has never made music before.`,
    'Use one analogy. Keep it under 80 words.',
    'If relevant to Ableton Live Lite, mention how to find or use it there.',
  ].join('\n');

  return aiClient.send([{ role: 'user', content: prompt }], {
    maxTokens: 256,
  });
}

/**
 * Generate a full session plan from scratch.
 */
export async function generateSessionPlan(
  genre: string,
  mood: string,
  skillLevel: 'beginner' | 'intermediate' | 'advanced',
): Promise<SessionPlan> {
  const prompt = [
    `Create a music production session plan.`,
    `Genre: ${genre} | Mood: ${mood} | Skill level: ${skillLevel}`,
    '',
    'Respond in this exact format (no extra text):',
    'BPM: <number>',
    'TRACKS:',
    '- <name> | <audio or midi> | <role description>',
    '(list 3-6 tracks, max 8)',
    'ARRANGEMENT:',
    '<describe sections with bar counts>',
    'FIRST STEP:',
    '<the very first thing to do>',
  ].join('\n');

  const text = await aiClient.send([{ role: 'user', content: prompt }], {
    maxTokens: 512,
  });

  return parseSessionPlan(text, genre, mood);
}

// ---------------------------------------------------------------------------
// Convenience wrappers around prompt builders
// ---------------------------------------------------------------------------

export async function getArrangementSuggestion(
  genre: string,
  bpm: number,
  trackList: string[],
): Promise<AISuggestion> {
  const prompt = arrangementPrompt(genre, bpm, trackList);
  return aiStore.getState().getSuggestion(prompt);
}

export async function getChordSuggestion(
  key: string,
  genre: string,
  mood: string,
): Promise<AISuggestion> {
  const prompt = chordProgressionPrompt(key, genre, mood);
  return aiStore.getState().getSuggestion(prompt);
}

export async function getMixingSuggestion(
  trackList: Array<{ name: string; type: 'audio' | 'midi' }>,
  genre: string,
): Promise<AISuggestion> {
  const prompt = mixingTipsPrompt(trackList, genre);
  return aiStore.getState().getSuggestion(prompt);
}

export async function getSampleSuggestion(
  genre: string,
  mood: string,
  existingTracks: string[],
): Promise<AISuggestion> {
  const prompt = sampleSelectionPrompt(genre, mood, existingTracks);
  return aiStore.getState().getSuggestion(prompt);
}

export async function reviewSession(
  config: {
    name: string;
    bpm: number;
    genre?: string;
    tracks: Array<{ name: string; type: 'audio' | 'midi'; volume: number; pan: number }>;
  },
): Promise<AISuggestion> {
  const prompt = sessionReviewPrompt(config);
  return aiStore.getState().getSuggestion(prompt);
}

export async function getBeginnerGuidance(
  currentStep: string,
  context: {
    hasCreatedSession?: boolean;
    trackCount?: number;
    hasMidi?: boolean;
    hasAudio?: boolean;
    minutesElapsed?: number;
  },
): Promise<string> {
  const prompt = beginnerGuidancePrompt(currentStep, context);
  return aiClient.send([{ role: 'user', content: prompt }], {
    maxTokens: 256,
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatContext(ctx: SessionContext): string {
  const parts: string[] = ['[Current session context]'];
  if (ctx.sessionName) parts.push(`Session: ${ctx.sessionName}`);
  if (ctx.genre) parts.push(`Genre: ${ctx.genre}`);
  if (ctx.bpm) parts.push(`BPM: ${ctx.bpm}`);
  if (ctx.key) parts.push(`Key: ${ctx.key}`);
  if (ctx.mood) parts.push(`Mood: ${ctx.mood}`);
  if (ctx.tracks && ctx.tracks.length > 0) {
    parts.push(`Tracks (${ctx.tracks.length}/8):`);
    for (const t of ctx.tracks) {
      const panLabel =
        t.pan > 0
          ? `R${Math.round(t.pan * 100)}`
          : t.pan < 0
            ? `L${Math.round(Math.abs(t.pan) * 100)}`
            : 'C';
      parts.push(`  - ${t.name} (${t.type}) vol:${Math.round(t.volume * 100)}% pan:${panLabel}`);
    }
  }
  return parts.join('\n');
}

function buildNextStepPrompt(state: SessionState): string {
  const lines: string[] = [];

  if (!state.hasSession) {
    lines.push('The user has not created a session yet.');
    lines.push('Suggest what genre/mood to start with and why.');
    return lines.join('\n');
  }

  lines.push('Current session state:');
  if (state.genre) lines.push(`  Genre: ${state.genre}`);
  if (state.bpm) lines.push(`  BPM: ${state.bpm}`);
  lines.push(`  Tracks: ${state.trackCount}/8`);
  lines.push(`  Has MIDI: ${state.hasMidiTracks ? 'yes' : 'no'}`);
  lines.push(`  Has audio: ${state.hasAudioTracks ? 'yes' : 'no'}`);
  lines.push(`  Has arrangement: ${state.hasArrangement ? 'yes' : 'no'}`);
  lines.push(`  Time spent: ${state.minutesElapsed} min`);
  lines.push('');
  lines.push('Based on this, suggest the single most impactful next step.');
  lines.push('Be specific. One sentence. An action they can do right now.');

  return lines.join('\n');
}

function parseSessionPlan(
  text: string,
  genre: string,
  mood: string,
): SessionPlan {
  // Extract BPM
  const bpmMatch = text.match(/BPM:\s*(\d+)/i);
  const bpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 120;

  // Extract tracks
  const suggestedTracks: SessionPlan['suggestedTracks'] = [];
  const trackPattern = /^-\s*(.+?)\s*\|\s*(audio|midi)\s*\|\s*(.+)$/gim;
  let match: RegExpExecArray | null;
  while ((match = trackPattern.exec(text)) !== null) {
    suggestedTracks.push({
      name: match[1].trim(),
      type: match[2].toLowerCase() as 'audio' | 'midi',
      role: match[3].trim(),
    });
  }

  // If no tracks parsed, create a sensible default
  if (suggestedTracks.length === 0) {
    suggestedTracks.push(
      { name: 'Drums', type: 'midi', role: 'rhythm foundation' },
      { name: 'Bass', type: 'midi', role: 'low-end support' },
      { name: 'Keys', type: 'midi', role: 'harmonic content' },
    );
  }

  // Extract arrangement
  const arrangementMatch = text.match(/ARRANGEMENT:\s*\n([\s\S]*?)(?=FIRST STEP:|$)/i);
  const arrangement = arrangementMatch
    ? arrangementMatch[1].trim()
    : 'Intro (4 bars) > Verse (8 bars) > Chorus (8 bars) > Verse (8 bars) > Outro (4 bars)';

  // Extract first step
  const firstStepMatch = text.match(/FIRST STEP:\s*\n?(.*)/i);
  const firstStep = firstStepMatch
    ? firstStepMatch[1].trim()
    : 'Start by laying down a simple drum pattern at the suggested BPM.';

  return { genre, mood, bpm, suggestedTracks, arrangement, firstStep };
}
