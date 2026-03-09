// ---------------------------------------------------------------------------
// Structured prompt builders for Ma's AI features.
// Each function returns a user-message string ready to send to the AI client.
// ---------------------------------------------------------------------------

/**
 * Suggest arrangement structure for a track.
 */
export function arrangementPrompt(
  genre: string,
  bpm: number,
  trackList: string[],
): string {
  return [
    `Genre: ${genre} | BPM: ${bpm}`,
    `Tracks available (${trackList.length}/8 max): ${trackList.join(', ')}`,
    '',
    'Suggest a complete arrangement structure for this session.',
    'For each section (intro, verse, chorus, bridge, outro), provide:',
    '- Section name',
    '- Bar count',
    '- Which tracks should play',
    '- Energy level (1-5)',
    '',
    'Keep it simple. Favor space over density.',
  ].join('\n');
}

/**
 * Suggest chord progressions with inversions.
 */
export function chordProgressionPrompt(
  key: string,
  genre: string,
  mood: string,
): string {
  return [
    `Key: ${key} | Genre: ${genre} | Mood: ${mood}`,
    '',
    'Suggest 2-3 chord progressions that fit this context.',
    'For each progression:',
    '- List chords with roman numeral analysis',
    '- Note specific voicings or inversions that work well',
    '- Suggest rhythm/strumming pattern (whole notes, off-beat, etc.)',
    '- Indicate bars per chord',
    '',
    'Keep voicings simple enough for Ableton Drift or Simpler.',
  ].join('\n');
}

/**
 * Suggest mixing tips for a set of tracks.
 */
export function mixingTipsPrompt(
  trackList: Array<{ name: string; type: 'audio' | 'midi' }>,
  genre: string,
): string {
  const formatted = trackList
    .map((t) => `  - ${t.name} (${t.type})`)
    .join('\n');

  return [
    `Genre: ${genre}`,
    `Tracks:`,
    formatted,
    '',
    'Provide practical mixing suggestions:',
    '- Relative volume levels (dB suggestions)',
    '- Pan positions (L/C/R or degrees)',
    '- Basic EQ advice (high-pass, low-cut frequencies)',
    '- Any tracks that might clash and how to fix it',
    '',
    'Remember: Ableton Lite has limited EQ and no third-party plugins.',
    'Keep it actionable. No mastering advice -- just balance.',
  ].join('\n');
}

/**
 * Suggest what samples or sounds to add next.
 */
export function sampleSelectionPrompt(
  genre: string,
  mood: string,
  existingTracks: string[],
): string {
  const remaining = 8 - existingTracks.length;

  return [
    `Genre: ${genre} | Mood: ${mood}`,
    `Current tracks (${existingTracks.length}/8): ${existingTracks.join(', ')}`,
    `Remaining slots: ${remaining}`,
    '',
    `Suggest up to ${Math.min(remaining, 3)} sounds or samples to add.`,
    'For each suggestion:',
    '- What type of sound (kick, pad, bass, texture, etc.)',
    '- Why it fits the current mix',
    '- Where to find it in Ableton Lite\'s library (Core Library categories)',
    '',
    'Prioritize sounds that fill frequency gaps in the current arrangement.',
  ].join('\n');
}

/**
 * Review a session configuration and suggest improvements.
 */
export function sessionReviewPrompt(
  sessionConfig: {
    name: string;
    bpm: number;
    genre?: string;
    tracks: Array<{ name: string; type: 'audio' | 'midi'; volume: number; pan: number }>;
  },
): string {
  const trackDetails = sessionConfig.tracks
    .map(
      (t) =>
        `  - ${t.name} (${t.type}) | vol: ${Math.round(t.volume * 100)}% | pan: ${t.pan > 0 ? `R${Math.round(t.pan * 100)}` : t.pan < 0 ? `L${Math.round(Math.abs(t.pan) * 100)}` : 'C'}`,
    )
    .join('\n');

  return [
    `Session: "${sessionConfig.name}"`,
    `BPM: ${sessionConfig.bpm}${sessionConfig.genre ? ` | Genre: ${sessionConfig.genre}` : ''}`,
    `Tracks (${sessionConfig.tracks.length}/8):`,
    trackDetails,
    '',
    'Review this session setup. Identify:',
    '1. Any volume or panning issues',
    '2. Missing elements for the genre',
    '3. One specific improvement to try next',
    '',
    'Be direct. One paragraph max.',
  ].join('\n');
}

/**
 * Context-aware guidance for absolute beginners.
 */
export function beginnerGuidancePrompt(
  currentStep: string,
  context: {
    hasCreatedSession?: boolean;
    trackCount?: number;
    hasMidi?: boolean;
    hasAudio?: boolean;
    minutesElapsed?: number;
  },
): string {
  const status: string[] = [];
  if (context.hasCreatedSession !== undefined) {
    status.push(context.hasCreatedSession ? 'Session created' : 'No session yet');
  }
  if (context.trackCount !== undefined) {
    status.push(`${context.trackCount} tracks`);
  }
  if (context.hasMidi) status.push('has MIDI');
  if (context.hasAudio) status.push('has audio');
  if (context.minutesElapsed !== undefined) {
    status.push(`${context.minutesElapsed}min in`);
  }

  return [
    `The user is at this step: "${currentStep}"`,
    status.length > 0 ? `Context: ${status.join(' | ')}` : '',
    '',
    'Guide them through this step as if they have never used a DAW before.',
    'Use plain language. One action at a time.',
    'If they seem stuck, suggest the single easiest thing to do next.',
    'Do not overwhelm. Brevity is kindness.',
  ]
    .filter(Boolean)
    .join('\n');
}
