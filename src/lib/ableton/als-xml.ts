
import { XMLBuilder } from 'fast-xml-parser';

const A = '@_';

export class IdGenerator {
  private current: number;

  constructor(start = 1) {
    this.current = start;
  }

  next(): number {
    return this.current++;
  }
}

function val(v: string | number | boolean): Record<string, unknown> {
  return { [A + 'Value']: String(v) };
}

function automationTarget(idGen: IdGenerator): Record<string, unknown> {
  return {
    [A + 'Id']: String(idGen.next()),
    LockEnvelope: val(0),
  };
}

function midiCCThresholds(): Record<string, unknown> {
  return {
    Min: val(64),
    Max: val(127),
  };
}

export function buildAutomationParam(
  idGen: IdGenerator,
  value: number | boolean | string,
  options?: { minRange?: number; maxRange?: number }
): Record<string, unknown> {
  const param: Record<string, unknown> = {
    LomId: val(0),
    Manual: val(value),
    MidiControllerRange: {
      Min: val(options?.minRange ?? 0),
      Max: val(options?.maxRange ?? 127),
    },
    AutomationTarget: automationTarget(idGen),
    MidiCCOnOffThresholds: midiCCThresholds(),
  };
  return param;
}

export function buildEnvelopeParam(
  idGen: IdGenerator,
  value: number | boolean | string
): Record<string, unknown> {
  return {
    LomId: val(0),
    Manual: val(value),
    AutomationTarget: automationTarget(idGen),
    MidiCCOnOffThresholds: midiCCThresholds(),
  };
}

function volumeToAbleton(normalized: number): number {
  if (normalized <= 0) return 0;
  if (normalized >= 1) return 1;
  return normalized * 0.850000023841858;
}

function panToAbleton(pan: number): number {
  return Math.max(-1, Math.min(1, pan));
}

function buildSpeaker(idGen: IdGenerator, on: boolean): Record<string, unknown> {
  return buildAutomationParam(idGen, on, { minRange: 0, maxRange: 127 });
}

function buildClipSlotList(): Record<string, unknown> {
  const slots: Record<string, unknown>[] = [];
  for (let i = 0; i < 8; i++) {
    slots.push({
      [A + 'Id']: String(i),
      LomId: val(0),
      ClipSlot: {
        LomId: val(0),
        LomIdView: val(0),
        Value: '',
      },
      HasStop: val('true'),
      NeedRefreeze: val('true'),
    });
  }
  return { ClipSlot: slots };
}

function buildSendHolder(id: number, idGen: IdGenerator): Record<string, unknown> {
  return {
    [A + 'Id']: String(id),
    Send: buildAutomationParam(idGen, 0.0001, { minRange: 0.0001, maxRange: 1 }),
    Active: val('true'),
  };
}

export function buildMixer(
  config: { volume: number; pan: number; mute: boolean; solo: boolean },
  idGen: IdGenerator,
  sendCount = 0
): Record<string, unknown> {
  const sends: Record<string, unknown>[] = [];
  for (let i = 0; i < sendCount; i++) {
    sends.push(buildSendHolder(i, idGen));
  }

  return {
    LomId: val(0),
    LomIdView: val(0),
    IsExpanded: val('true'),
    On: buildAutomationParam(idGen, !config.mute, { minRange: 0, maxRange: 127 }),
    ParametersListWrapper: { [A + 'LomId']: '0' },
    LastSelectedTimeableIndex: val(0),
    LastSelectedClipEnvelopeIndex: val(0),
    LastPresetRef: { Value: '' },
    LockedScripts: '',
    IsFolded: val('false'),
    ShouldShowPresetName: val('false'),
    UserName: val(''),
    Annotation: val(''),
    SourceContext: { Value: '' },
    Sends: sends.length > 0 ? { TrackSendHolder: sends } : '',
    Speaker: buildSpeaker(idGen, true),
    SoloSink: val('false'),
    PanMode: val(0),
    Pan: buildAutomationParam(idGen, panToAbleton(config.pan), { minRange: -1, maxRange: 1 }),
    SplitStereoPanL: buildAutomationParam(idGen, -1, { minRange: -1, maxRange: 1 }),
    SplitStereoPanR: buildAutomationParam(idGen, 1, { minRange: -1, maxRange: 1 }),
    Volume: buildAutomationParam(idGen, volumeToAbleton(config.volume), {
      minRange: 0.0003,
      maxRange: 1.09,
    }),
    ViewStateSesstionTrackWidth: val(93),
    CrossFadeState: buildAutomationParam(idGen, 1, { minRange: 0, maxRange: 2 }),
    SendsListWrapper: { [A + 'LomId']: '0' },
  };
}

function buildFileRef(filePath: string): Record<string, unknown> {
  return {
    RelativePathType: val(0),
    RelativePath: val(filePath),
    Path: val(filePath),
    Type: val(1),
    LivePackName: val(''),
    LivePackId: val(''),
    OriginalFileSize: val(0),
    OriginalCrc: val(0),
  };
}

function buildSampleRef(filePath: string): Record<string, unknown> {
  return {
    FileRef: buildFileRef(filePath),
    LastModDate: val(0),
    SourceContext: {
      SourceContext: {
        [A + 'Id']: '0',
        OriginalFileRef: buildFileRef(filePath),
        BrowserContentPath: val(''),
      },
    },
    SampleUsageHint: val(0),
    DefaultDuration: val(0),
    DefaultSampleRate: val(44100),
  };
}

function buildAudioClip(
  filePath: string,
  clipId: number,
  idGen: IdGenerator
): Record<string, unknown> {
  return {
    [A + 'Id']: String(clipId),
    LomId: val(0),
    LomIdView: val(0),
    CurrentStart: val(0),
    CurrentEnd: val(0),
    Loop: {
      LoopStart: val(0),
      LoopEnd: val(0),
      StartRelative: val(0),
      LoopOn: val('true'),
      OutMarker: val(0),
      HiddenLoopStart: val(0),
      HiddenLoopEnd: val(0),
    },
    Name: val(''),
    Annotation: val(''),
    Color: val(0),
    LaunchMode: val(0),
    LaunchQuantisation: val(0),
    TimeSignature: {
      TimeSignatures: {
        RemoteableTimeSignature: {
          [A + 'Id']: '0',
          Numerator: val(4),
          Denominator: val(4),
          Time: val(0),
        },
      },
    },
    Envelopes: { Envelopes: '' },
    ScrollerTimePreserver: { LeftTime: val(0), RightTime: val(0) },
    TimeSelection: { From: val(0), To: val(0) },
    Disabled: val('false'),
    IsWarped: val('true'),
    SampleRef: buildSampleRef(filePath),
    Onsets: { UserOnsets: '' },
    WarpMode: val(0),
    GranularityTones: val(30),
    GranularityTexture: val(65),
    FluctuationTexture: val(25),
    ComplexProFormants: val(100),
    ComplexProEnvelope: val(128),
    TransientResolution: val(6),
    TransientLoopMode: val(2),
    TransientEnvelope: val(100),
    IsPlaying: val('false'),
    Detune: val(0),
    FadeIn: { TempoCurveManager: { KeyTracks: '' } },
    FadeOut: { TempoCurveManager: { KeyTracks: '' } },
    Fades: {
      FadeInLength: val(0),
      FadeOutLength: val(0),
      ClipFadesAreInitialized: val('true'),
      CrossfadeInState: val(0),
      FadeInCurveSkew: val(0),
      FadeInCurveSlope: val(0),
      FadeOutCurveSkew: val(0),
      FadeOutCurveSlope: val(0),
      IsDefaultFadeIn: val('true'),
      IsDefaultFadeOut: val('true'),
    },
    PitchShift: val(0),
    Reverse: val('false'),
  };
}

function buildMainSequencer(
  trackType: 'audio' | 'midi',
  idGen: IdGenerator,
  samples?: string[]
): Record<string, unknown> {
  const clipSlotList = buildClipSlotList();

  if (trackType === 'audio' && samples && samples.length > 0) {
    const audioClips = samples.map((s, i) => buildAudioClip(s, i, idGen));
    (clipSlotList.ClipSlot as Record<string, unknown>[])[0] = {
      ...(clipSlotList.ClipSlot as Record<string, unknown>[])[0],
      ClipSlot: {
        LomId: val(0),
        LomIdView: val(0),
        Value: {
          AudioClip: audioClips[0],
        },
      },
    };
  }

  return {
    LomId: val(0),
    LomIdView: val(0),
    IsExpanded: val('true'),
    On: buildAutomationParam(idGen, 'true'),
    ModulationSourceCount: val(0),
    ParametersListWrapper: { [A + 'LomId']: '0' },
    Pointee: { [A + 'Id']: String(idGen.next()) },
    LastSelectedTimeableIndex: val(0),
    LastSelectedClipEnvelopeIndex: val(0),
    LastPresetRef: { Value: '' },
    LockedScripts: '',
    IsFolded: val('false'),
    ShouldShowPresetName: val('false'),
    UserName: val(''),
    Annotation: val(''),
    SourceContext: { Value: '' },
    ClipSlotList: clipSlotList,
    MonitoringEnum: val(1),
    ...(trackType === 'audio'
      ? { Sample: { Value: '' } }
      : {}),
    VolumeModulationTarget: automationTarget(idGen),
    TranspositionModulationTarget: automationTarget(idGen),
    GrainSizeModulationTarget: automationTarget(idGen),
    FluxModulationTarget: automationTarget(idGen),
    SampleOffsetModulationTarget: automationTarget(idGen),
    PitchViewScrollPosition: val(-1073741824),
    SampleOffsetModulationScrollPosition: val(-1073741824),
    Recorder: {
      IsArmed: val('false'),
      TakeCounter: val(1),
    },
  };
}

function buildSimpleInstrument(
  instrumentName: string,
  idGen: IdGenerator
): Record<string, unknown> {
  const presetMap: Record<string, { type: string; preset: string }> = {
    piano: { type: 'InstrumentGroupDevice', preset: 'Grand Piano' },
    keys: { type: 'InstrumentGroupDevice', preset: 'Electric Piano' },
    rhodes: { type: 'InstrumentGroupDevice', preset: 'Rhodes' },
    bass: { type: 'InstrumentGroupDevice', preset: 'Bass' },
    synth: { type: 'InstrumentGroupDevice', preset: 'Analog Synth' },
    pad: { type: 'InstrumentGroupDevice', preset: 'Pad' },
    pads: { type: 'InstrumentGroupDevice', preset: 'Pad' },
    strings: { type: 'InstrumentGroupDevice', preset: 'Strings' },
    drums: { type: 'InstrumentGroupDevice', preset: 'Drum Rack' },
    organ: { type: 'InstrumentGroupDevice', preset: 'Organ' },
    guitar: { type: 'InstrumentGroupDevice', preset: 'Guitar' },
    lead: { type: 'InstrumentGroupDevice', preset: 'Lead Synth' },
  };

  const normalized = instrumentName.toLowerCase().trim();
  const preset = presetMap[normalized] ?? { type: 'InstrumentGroupDevice', preset: instrumentName };

  return {
    [A + 'Id']: String(idGen.next()),
    LomId: val(0),
    LomIdView: val(0),
    IsExpanded: val('true'),
    On: buildAutomationParam(idGen, 'true'),
    ModulationSourceCount: val(0),
    ParametersListWrapper: { [A + 'LomId']: '0' },
    Pointee: { [A + 'Id']: String(idGen.next()) },
    LastSelectedTimeableIndex: val(0),
    LastSelectedClipEnvelopeIndex: val(0),
    LastPresetRef: {
      Value: {
        AbletonDefaultPresetRef: {
          [A + 'Id']: String(idGen.next()),
          FileRef: {
            RelativePathType: val(3),
            RelativePath: val(''),
            Path: val(''),
            Type: val(2),
            LivePackName: val('Core Library'),
            LivePackId: val('www.ableton.com/0'),
            OriginalFileSize: val(0),
            OriginalCrc: val(0),
          },
        },
      },
    },
    LockedScripts: '',
    IsFolded: val('false'),
    ShouldShowPresetName: val('true'),
    UserName: val(preset.preset),
    Annotation: val(''),
    SourceContext: { Value: '' },
    Branches: '',
  };
}

export function buildAudioTrack(
  config: TrackConfig,
  trackId: number,
  idGen: IdGenerator,
  sendCount = 0
): Record<string, unknown> {
  return {
    [A + 'Id']: String(trackId),
    LomId: val(0),
    LomIdView: val(0),
    IsContentSelectedInDocument: val('false'),
    PreferredContentViewMode: val(0),
    TrackDelay: {
      Value: val(0),
      IsValueSampleBased: val('false'),
    },
    Name: {
      EffectiveName: val(config.name),
      UserName: val(config.name),
      Annotation: val(''),
      MemorizedFirstClipName: val(''),
    },
    Color: val(config.color),
    AutomationEnvelopes: { Envelopes: '' },
    TrackGroupId: val(-1),
    TrackUnfolded: val('true'),
    DevicesListWrapper: { [A + 'LomId']: '0' },
    ClipSlotsListWrapper: { [A + 'LomId']: '0' },
    ViewData: val('{}'),
    TakeLanes: { TakeLanes: '' },
    LinkedTrackGroupId: val(-1),
    DeviceChain: {
      AutomationLanes: {
        AutomationLanes: '',
        AreAdditionalAutomationLanesFolded: val('true'),
      },
      ClipSlotList: buildClipSlotList(),
      MainSequencer: buildMainSequencer('audio', idGen, config.samples),
      FreezeSequencer: {
        LomId: val(0),
        LomIdView: val(0),
        IsExpanded: val('true'),
        On: buildAutomationParam(idGen, 'true'),
        ModulationSourceCount: val(0),
        ParametersListWrapper: { [A + 'LomId']: '0' },
        Pointee: { [A + 'Id']: String(idGen.next()) },
        LastSelectedTimeableIndex: val(0),
        LastSelectedClipEnvelopeIndex: val(0),
        LastPresetRef: { Value: '' },
        LockedScripts: '',
        IsFolded: val('false'),
        ShouldShowPresetName: val('false'),
        UserName: val(''),
        Annotation: val(''),
        SourceContext: { Value: '' },
        ClipSlotList: buildClipSlotList(),
      },
      DeviceChain: {
        Devices: '',
        SignalModulations: '',
      },
      Mixer: buildMixer(config, idGen, sendCount),
    },
  };
}

export function buildMidiTrack(
  config: TrackConfig,
  trackId: number,
  idGen: IdGenerator,
  sendCount = 0
): Record<string, unknown> {
  const devices: Record<string, unknown> = config.instrument
    ? { InstrumentGroupDevice: buildSimpleInstrument(config.instrument, idGen) }
    : {};

  return {
    [A + 'Id']: String(trackId),
    LomId: val(0),
    LomIdView: val(0),
    IsContentSelectedInDocument: val('false'),
    PreferredContentViewMode: val(0),
    TrackDelay: {
      Value: val(0),
      IsValueSampleBased: val('false'),
    },
    Name: {
      EffectiveName: val(config.name),
      UserName: val(config.name),
      Annotation: val(''),
      MemorizedFirstClipName: val(''),
    },
    Color: val(config.color),
    AutomationEnvelopes: { Envelopes: '' },
    TrackGroupId: val(-1),
    TrackUnfolded: val('true'),
    DevicesListWrapper: { [A + 'LomId']: '0' },
    ClipSlotsListWrapper: { [A + 'LomId']: '0' },
    ViewData: val('{}'),
    TakeLanes: { TakeLanes: '' },
    LinkedTrackGroupId: val(-1),
    SavedPlayingSlot: val(-1),
    SavedPlayingOffset: val(0),
    Freeze: val('false'),
    VelocityDetail: val(0),
    NeedArrangerRefreeze: val('true'),
    PostProcessFreezeClips: val(0),
    DeviceChain: {
      AutomationLanes: {
        AutomationLanes: '',
        AreAdditionalAutomationLanesFolded: val('true'),
      },
      ClipSlotList: buildClipSlotList(),
      MainSequencer: buildMainSequencer('midi', idGen),
      FreezeSequencer: {
        LomId: val(0),
        LomIdView: val(0),
        IsExpanded: val('true'),
        On: buildAutomationParam(idGen, 'true'),
        ModulationSourceCount: val(0),
        ParametersListWrapper: { [A + 'LomId']: '0' },
        Pointee: { [A + 'Id']: String(idGen.next()) },
        LastSelectedTimeableIndex: val(0),
        LastSelectedClipEnvelopeIndex: val(0),
        LastPresetRef: { Value: '' },
        LockedScripts: '',
        IsFolded: val('false'),
        ShouldShowPresetName: val('false'),
        UserName: val(''),
        Annotation: val(''),
        SourceContext: { Value: '' },
        ClipSlotList: buildClipSlotList(),
      },
      DeviceChain: {
        Devices: Object.keys(devices).length > 0 ? devices : '',
        SignalModulations: '',
      },
      Mixer: buildMixer(config, idGen, sendCount),
    },
  };
}

export function buildMasterTrack(
  bpm: number,
  idGen: IdGenerator
): Record<string, unknown> {
  return {
    LomId: val(0),
    LomIdView: val(0),
    IsContentSelectedInDocument: val('false'),
    PreferredContentViewMode: val(0),
    TrackDelay: {
      Value: val(0),
      IsValueSampleBased: val('false'),
    },
    Name: {
      EffectiveName: val('Master'),
      UserName: val(''),
      Annotation: val(''),
      MemorizedFirstClipName: val(''),
    },
    Color: val(-1),
    AutomationEnvelopes: { Envelopes: '' },
    TrackGroupId: val(-1),
    TrackUnfolded: val('false'),
    DevicesListWrapper: { [A + 'LomId']: '0' },
    ClipSlotsListWrapper: { [A + 'LomId']: '0' },
    ViewData: val('{}'),
    TakeLanes: { TakeLanes: '' },
    LinkedTrackGroupId: val(-1),
    DeviceChain: {
      AutomationLanes: {
        AutomationLanes: '',
        AreAdditionalAutomationLanesFolded: val('true'),
      },
      ClipSlotList: buildClipSlotList(),
      MainSequencer: {
        LomId: val(0),
        LomIdView: val(0),
        IsExpanded: val('true'),
        On: buildAutomationParam(idGen, 'true'),
        ModulationSourceCount: val(0),
        ParametersListWrapper: { [A + 'LomId']: '0' },
        Pointee: { [A + 'Id']: String(idGen.next()) },
        LastSelectedTimeableIndex: val(0),
        LastSelectedClipEnvelopeIndex: val(0),
        LastPresetRef: { Value: '' },
        LockedScripts: '',
        IsFolded: val('false'),
        ShouldShowPresetName: val('false'),
        UserName: val(''),
        Annotation: val(''),
        SourceContext: { Value: '' },
        ClipSlotList: buildClipSlotList(),
      },
      DeviceChain: {
        Devices: '',
        SignalModulations: '',
      },
      Mixer: {
        LomId: val(0),
        LomIdView: val(0),
        IsExpanded: val('true'),
        On: buildAutomationParam(idGen, 'true'),
        ParametersListWrapper: { [A + 'LomId']: '0' },
        LastSelectedTimeableIndex: val(0),
        LastSelectedClipEnvelopeIndex: val(0),
        LastPresetRef: { Value: '' },
        LockedScripts: '',
        IsFolded: val('false'),
        ShouldShowPresetName: val('false'),
        UserName: val(''),
        Annotation: val(''),
        SourceContext: { Value: '' },
        Sends: '',
        Speaker: buildSpeaker(idGen, true),
        SoloSink: val('false'),
        PanMode: val(0),
        Pan: buildAutomationParam(idGen, 0, { minRange: -1, maxRange: 1 }),
        SplitStereoPanL: buildAutomationParam(idGen, -1, { minRange: -1, maxRange: 1 }),
        SplitStereoPanR: buildAutomationParam(idGen, 1, { minRange: -1, maxRange: 1 }),
        Volume: buildAutomationParam(idGen, 1, { minRange: 0.0003, maxRange: 1.09 }),
        ViewStateSesstionTrackWidth: val(93),
        CrossFadeState: buildAutomationParam(idGen, 1, { minRange: 0, maxRange: 2 }),
        SendsListWrapper: { [A + 'LomId']: '0' },
        Tempo: buildAutomationParam(idGen, bpm, { minRange: 20, maxRange: 999 }),
        TimeSignature: {
          TimeSignatures: {
            RemoteableTimeSignature: {
              [A + 'Id']: '0',
              Numerator: val(4),
              Denominator: val(4),
              Time: val(0),
            },
          },
        },
        GlobalQuantisation: val(4),
        AutoQuantisation: val(0),
        Groove: buildAutomationParam(idGen, 0, { minRange: 0, maxRange: 131 }),
      },
    },
  };
}

export function buildPreHearTrack(idGen: IdGenerator): Record<string, unknown> {
  return {
    LomId: val(0),
    LomIdView: val(0),
    IsContentSelectedInDocument: val('false'),
    PreferredContentViewMode: val(0),
    TrackDelay: {
      Value: val(0),
      IsValueSampleBased: val('false'),
    },
    Name: {
      EffectiveName: val('Pre-Hear'),
      UserName: val(''),
      Annotation: val(''),
      MemorizedFirstClipName: val(''),
    },
    Color: val(-1),
    DeviceChain: {
      AutomationLanes: {
        AutomationLanes: '',
        AreAdditionalAutomationLanesFolded: val('true'),
      },
      Mixer: {
        LomId: val(0),
        LomIdView: val(0),
        IsExpanded: val('true'),
        On: buildAutomationParam(idGen, 'true'),
        ParametersListWrapper: { [A + 'LomId']: '0' },
        LastSelectedTimeableIndex: val(0),
        LastSelectedClipEnvelopeIndex: val(0),
        LastPresetRef: { Value: '' },
        LockedScripts: '',
        IsFolded: val('false'),
        ShouldShowPresetName: val('false'),
        UserName: val(''),
        Annotation: val(''),
        SourceContext: { Value: '' },
        Speaker: buildSpeaker(idGen, true),
        Volume: buildAutomationParam(idGen, 0.850000023841858, {
          minRange: 0.0003,
          maxRange: 1.09,
        }),
        Pan: buildAutomationParam(idGen, 0, { minRange: -1, maxRange: 1 }),
        SendsListWrapper: { [A + 'LomId']: '0' },
      },
    },
  };
}

export function buildTransport(
  bpm: number,
  timeSignature: [number, number]
): Record<string, unknown> {
  return {
    PhaseNudgeTempo: val(10),
    LoopOn: val('false'),
    LoopStart: val(0),
    LoopLength: val(16),
    LoopIsSongStart: val('false'),
    CurrentTime: val(0),
    PunchIn: val('false'),
    PunchOut: val('false'),
    MetronomeClickOn: val('false'),
    DrawMode: val('false'),
    PreRoll: val(0),
    CountInDuration: val(1),
    TimeSignature: {
      TimeSignatures: {
        RemoteableTimeSignature: {
          [A + 'Id']: '0',
          Numerator: val(timeSignature[0]),
          Denominator: val(timeSignature[1]),
          Time: val(0),
        },
      },
    },
  };
}

export function buildViewStates(): Record<string, unknown> {
  return {
    SessionIO: {
      SessionMasterWidth: val(93),
      SessionMasterHeight: val(120),
    },
    ArrangerIO: {
      FollowPlayCursor: val('true'),
    },
  };
}

export function buildLiveSet(
  tracks: Record<string, unknown>[],
  masterTrack: Record<string, unknown>,
  preHearTrack: Record<string, unknown>,
  transport: Record<string, unknown>,
  viewStates: Record<string, unknown>
): Record<string, unknown> {
  const audioTrackList: Record<string, unknown>[] = [];
  const midiTrackList: Record<string, unknown>[] = [];

  for (const track of tracks) {
    if ((track as { __trackType?: string }).__trackType === 'midi') {
      const cleaned = { ...track };
      delete (cleaned as Record<string, unknown>).__trackType;
      midiTrackList.push(cleaned);
    } else {
      const cleaned = { ...track };
      delete (cleaned as Record<string, unknown>).__trackType;
      audioTrackList.push(cleaned);
    }
  }

  const tracksObj: Record<string, unknown> = {};
  if (audioTrackList.length > 0) tracksObj.AudioTrack = audioTrackList.length === 1 ? audioTrackList[0] : audioTrackList;
  if (midiTrackList.length > 0) tracksObj.MidiTrack = midiTrackList.length === 1 ? midiTrackList[0] : midiTrackList;

  return {
    NextPointeeId: val(99999),
    OverwriteProtectionNumber: val(2817),
    LomId: val(0),
    LomIdView: val(0),
    Tracks: Object.keys(tracksObj).length > 0 ? tracksObj : '',
    MasterTrack: masterTrack,
    PreHearTrack: preHearTrack,
    SendsPre: {
      SendPreBool: [
        { [A + 'Id']: '0', ...val('true') },
        { [A + 'Id']: '1', ...val('true') },
        { [A + 'Id']: '2', ...val('true') },
        { [A + 'Id']: '3', ...val('true') },
        { [A + 'Id']: '4', ...val('true') },
        { [A + 'Id']: '5', ...val('true') },
        { [A + 'Id']: '6', ...val('true') },
        { [A + 'Id']: '7', ...val('true') },
        { [A + 'Id']: '8', ...val('true') },
        { [A + 'Id']: '9', ...val('true') },
        { [A + 'Id']: '10', ...val('true') },
        { [A + 'Id']: '11', ...val('true') },
      ],
    },
    Transport: transport,
    ViewStates: viewStates,
    SequencerNavigator: {
      BeatTimeHelper: {
        CurrentZoom: val(0.34493),
      },
      ScrollerPos: {
        X: val(0),
        Y: val(0),
      },
      ClientSize: {
        X: val(1030),
        Y: val(397),
      },
    },
    ScaleInformation: {
      RootNote: val(0),
      Name: val('Major'),
    },
    InKey: val('false'),
    SmpteFormat: val(0),
    TimeSelection: {
      From: val(0),
      To: val(0),
    },
    SequencerNavigatorPosition: {
      Left: val(0),
      Upper: val(0),
    },
    ViewStateSessionMixerHeight: val(120),
    IsContentSplitterOpen: val('true'),
    IsExpressionSplitterOpen: val('true'),
    ExpressionLanes: '',
    ContentLanes: '',
    SelectionState: {
      TrackIndex: val(0),
      SceneIndex: val(0),
    },
  };
}

export function buildAbletonDocument(liveSet: Record<string, unknown>): Record<string, unknown> {
  return {
    '?xml': {
      [A + 'version']: '1.0',
      [A + 'encoding']: 'UTF-8',
    },
    Ableton: {
      [A + 'MajorVersion']: '5',
      [A + 'MinorVersion']: '12.0.0',
      [A + 'SchemaChangeCount']: '3',
      [A + 'Creator']: 'Ma Studio',
      [A + 'Revision']: '',
      LiveSet: liveSet,
    },
  };
}

export function createXmlBuilder(): XMLBuilder {
  return new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    indentBy: '\t',
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
    processEntities: false,
  });
}
