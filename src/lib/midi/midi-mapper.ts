export type ParameterTarget =
  | 'volume'
  | 'pan'
  | 'filter_cutoff'
  | 'filter_resonance'
  | 'reverb_send'
  | 'delay_send'
  | 'attack'
  | 'release'
  | 'track_arm'
  | 'track_mute'
  | 'track_solo'
  | 'track_select'
  | 'transport_play'
  | 'transport_stop'
  | 'transport_record'
  | string;

export interface MidiMapping {
  id: string;
  sourceType: 'cc' | 'note';
  channel: number; // 0 = any
  controller?: number; // for CC
  note?: number; // for note triggers
  target: ParameterTarget;
  trackIndex?: number;
  min: number;
  max: number;
  label: string;
}

export interface ControllerPreset {
  name: string;
  matchPatterns: string[];
  mappings: MidiMapping[];
}

function ccMapping(
  controller: number,
  target: ParameterTarget,
  label: string,
  trackIndex?: number,
): MidiMapping {
  return {
    id: `cc-${controller}-${target}`,
    sourceType: 'cc',
    channel: 0,
    controller,
    target,
    trackIndex,
    min: 0,
    max: 127,
    label,
  };
}

function noteMapping(
  note: number,
  target: ParameterTarget,
  label: string,
  trackIndex?: number,
): MidiMapping {
  return {
    id: `note-${note}-${target}`,
    sourceType: 'note',
    channel: 0,
    note,
    target,
    trackIndex,
    min: 0,
    max: 127,
    label,
  };
}

const PRESET_AKAI_MPK_MINI: ControllerPreset = {
  name: 'Akai MPK Mini',
  matchPatterns: ['mpk mini', 'mpk mini mk'],
  mappings: [
    ccMapping(1, 'volume', 'Knob 1 - Volume', 0),
    ccMapping(2, 'pan', 'Knob 2 - Pan', 0),
    ccMapping(3, 'filter_cutoff', 'Knob 3 - Filter Cutoff'),
    ccMapping(4, 'filter_resonance', 'Knob 4 - Filter Resonance'),
    ccMapping(5, 'reverb_send', 'Knob 5 - Reverb Send'),
    ccMapping(6, 'delay_send', 'Knob 6 - Delay Send'),
    ccMapping(7, 'attack', 'Knob 7 - Attack'),
    ccMapping(8, 'release', 'Knob 8 - Release'),
    noteMapping(36, 'track_select', 'Pad 1 - Track 1', 0),
    noteMapping(37, 'track_select', 'Pad 2 - Track 2', 1),
    noteMapping(38, 'track_select', 'Pad 3 - Track 3', 2),
    noteMapping(39, 'track_select', 'Pad 4 - Track 4', 3),
    noteMapping(40, 'track_mute', 'Pad 5 - Mute 1', 0),
    noteMapping(41, 'track_mute', 'Pad 6 - Mute 2', 1),
    noteMapping(42, 'track_solo', 'Pad 7 - Solo 1', 0),
    noteMapping(43, 'transport_play', 'Pad 8 - Play'),
  ],
};

const PRESET_NOVATION_LAUNCHKEY: ControllerPreset = {
  name: 'Novation Launchkey',
  matchPatterns: ['launchkey'],
  mappings: [
    ccMapping(21, 'volume', 'Knob 1 - Volume', 0),
    ccMapping(22, 'pan', 'Knob 2 - Pan', 0),
    ccMapping(23, 'filter_cutoff', 'Knob 3 - Filter Cutoff'),
    ccMapping(24, 'filter_resonance', 'Knob 4 - Filter Resonance'),
    ccMapping(25, 'reverb_send', 'Knob 5 - Reverb Send'),
    ccMapping(26, 'delay_send', 'Knob 6 - Delay Send'),
    ccMapping(27, 'attack', 'Knob 7 - Attack'),
    ccMapping(28, 'release', 'Knob 8 - Release'),
    noteMapping(36, 'track_select', 'Pad 1 - Track 1', 0),
    noteMapping(37, 'track_select', 'Pad 2 - Track 2', 1),
    noteMapping(38, 'track_select', 'Pad 3 - Track 3', 2),
    noteMapping(39, 'track_select', 'Pad 4 - Track 4', 3),
    noteMapping(40, 'track_select', 'Pad 5 - Track 5', 4),
    noteMapping(41, 'track_select', 'Pad 6 - Track 6', 5),
    noteMapping(42, 'track_select', 'Pad 7 - Track 7', 6),
    noteMapping(43, 'track_select', 'Pad 8 - Track 8', 7),
  ],
};

const PRESET_ARTURIA_MINILAB: ControllerPreset = {
  name: 'Arturia MiniLab',
  matchPatterns: ['minilab', 'arturia minilab'],
  mappings: [
    ccMapping(7, 'volume', 'Encoder 1 - Volume'),
    ccMapping(74, 'filter_cutoff', 'Encoder 2 - Filter Cutoff'),
    ccMapping(71, 'filter_resonance', 'Encoder 3 - Filter Resonance'),
    ccMapping(76, 'pan', 'Encoder 4 - Pan'),
    ccMapping(77, 'reverb_send', 'Encoder 5 - Reverb Send'),
    ccMapping(93, 'delay_send', 'Encoder 6 - Delay Send'),
    ccMapping(73, 'attack', 'Encoder 7 - Attack'),
    ccMapping(75, 'release', 'Encoder 8 - Release'),
    noteMapping(36, 'track_select', 'Pad 1 - Track 1', 0),
    noteMapping(37, 'track_select', 'Pad 2 - Track 2', 1),
    noteMapping(38, 'track_select', 'Pad 3 - Track 3', 2),
    noteMapping(39, 'track_select', 'Pad 4 - Track 4', 3),
    noteMapping(40, 'track_mute', 'Pad 5 - Mute 1', 0),
    noteMapping(41, 'track_mute', 'Pad 6 - Mute 2', 1),
    noteMapping(42, 'track_solo', 'Pad 7 - Solo 1', 0),
    noteMapping(43, 'transport_play', 'Pad 8 - Play'),
  ],
};

const PRESET_GENERIC: ControllerPreset = {
  name: 'Generic MIDI Controller',
  matchPatterns: [],
  mappings: [
    ccMapping(1, 'volume', 'CC1 - Volume'),
    ccMapping(2, 'pan', 'CC2 - Pan'),
    ccMapping(3, 'filter_cutoff', 'CC3 - Filter Cutoff'),
    ccMapping(4, 'filter_resonance', 'CC4 - Filter Resonance'),
    ccMapping(5, 'reverb_send', 'CC5 - Reverb Send'),
    ccMapping(6, 'delay_send', 'CC6 - Delay Send'),
    ccMapping(7, 'attack', 'CC7 - Attack'),
    ccMapping(8, 'release', 'CC8 - Release'),
    ...Array.from({ length: 16 }, (_, i) =>
      noteMapping(36 + i, 'track_select', `Note ${36 + i} - Pad ${i + 1}`, i),
    ),
  ],
};

export const CONTROLLER_PRESETS: ControllerPreset[] = [
  PRESET_AKAI_MPK_MINI,
  PRESET_NOVATION_LAUNCHKEY,
  PRESET_ARTURIA_MINILAB,
  PRESET_GENERIC,
];

export function detectPreset(portName: string): ControllerPreset {
  const lower = portName.toLowerCase();
  for (const preset of CONTROLLER_PRESETS) {
    if (preset.matchPatterns.some((pattern) => lower.includes(pattern))) {
      return preset;
    }
  }
  return PRESET_GENERIC;
}

export class MidiMapper {
  private mappings: Map<string, MidiMapping> = new Map();
  private customMappings: Map<string, MidiMapping> = new Map();

  loadPreset(preset: ControllerPreset): void {
    this.mappings.clear();
    for (const mapping of preset.mappings) {
      this.mappings.set(mapping.id, mapping);
    }
  }

  autoDetectAndLoad(portName: string): ControllerPreset {
    const preset = detectPreset(portName);
    this.loadPreset(preset);
    return preset;
  }

  addMapping(mapping: MidiMapping): void {
    this.customMappings.set(mapping.id, mapping);
    this.mappings.set(mapping.id, mapping);
  }

  removeMapping(id: string): void {
    this.customMappings.delete(id);
    this.mappings.delete(id);
  }

  getMapping(id: string): MidiMapping | undefined {
    return this.mappings.get(id);
  }

  getAllMappings(): MidiMapping[] {
    return Array.from(this.mappings.values());
  }

  getCustomMappings(): MidiMapping[] {
    return Array.from(this.customMappings.values());
  }

  findMappingForCC(channel: number, controller: number): MidiMapping | undefined {
    for (const mapping of this.mappings.values()) {
      if (mapping.sourceType !== 'cc') continue;
      if (mapping.controller !== controller) continue;
      if (mapping.channel !== 0 && mapping.channel !== channel) continue;
      return mapping;
    }
    return undefined;
  }

  findMappingForNote(channel: number, note: number): MidiMapping | undefined {
    for (const mapping of this.mappings.values()) {
      if (mapping.sourceType !== 'note') continue;
      if (mapping.note !== note) continue;
      if (mapping.channel !== 0 && mapping.channel !== channel) continue;
      return mapping;
    }
    return undefined;
  }

  exportMappings(): MidiMapping[] {
    return this.getCustomMappings();
  }

  importMappings(mappings: MidiMapping[]): void {
    for (const mapping of mappings) {
      this.addMapping(mapping);
    }
  }

  clear(): void {
    this.mappings.clear();
    this.customMappings.clear();
  }
}

export const midiMapper = new MidiMapper();
