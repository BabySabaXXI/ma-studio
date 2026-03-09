
import { gzipSync } from 'fflate';
import {
  IdGenerator,
  buildAudioTrack,
  buildMidiTrack,
  buildMasterTrack,
  buildPreHearTrack,
  buildTransport,
  buildViewStates,
  buildLiveSet,
  buildAbletonDocument,
  createXmlBuilder,
} from './als-xml';

export async function generateAbletonSet(config: AbletonSetConfig): Promise<Uint8Array> {
  const idGen = new IdGenerator(1);

  const trackObjects: Record<string, unknown>[] = [];

  for (let i = 0; i < config.tracks.length; i++) {
    const track = config.tracks[i];
    const trackId = i;

    if (track.type === 'audio') {
      const built = buildAudioTrack(track, trackId, idGen);
      (built as Record<string, unknown>).__trackType = 'audio';
      trackObjects.push(built);
    } else {
      const built = buildMidiTrack(track, trackId, idGen);
      (built as Record<string, unknown>).__trackType = 'midi';
      trackObjects.push(built);
    }
  }

  const masterTrack = buildMasterTrack(config.bpm, idGen);
  const preHearTrack = buildPreHearTrack(idGen);
  const transport = buildTransport(config.bpm, config.timeSignature);
  const viewStates = buildViewStates();

  const liveSet = buildLiveSet(trackObjects, masterTrack, preHearTrack, transport, viewStates);
  const document = buildAbletonDocument(liveSet);

  const builder = createXmlBuilder();
  const xml = builder.build(document);

  const encoder = new TextEncoder();
  const xmlBytes = encoder.encode(xml);

  const compressed = gzipSync(xmlBytes, { level: 9 });

  return compressed;
}

export async function generateAbletonSetToPath(config: AbletonSetConfig): Promise<string> {
  const data = await generateAbletonSet(config);

  if (typeof window !== 'undefined' && window.ma) {
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/gzip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = config.outputPath.endsWith('.als')
      ? config.outputPath.split('/').pop()!
      : `${config.name}.als`;
    a.click();
    URL.revokeObjectURL(url);
    return config.outputPath;
  }

  throw new Error('File system access requires Electron IPC');
}

export { IdGenerator } from './als-xml';
export { ABLETON_TRACK_COLORS, getTrackColorHex, getTrackColorIndex } from './als-colors';
