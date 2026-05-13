export type AbilityType =
  | 'blackhole'
  | 'fire'
  | 'lightning-storm'
  | 'tornado'
  | 'salmon'
  | 'infection'
  | 'missile'
  | 'tsunami'
  | 'sonic-wave';

export const SOLO_COLOR_ABILITY: Record<number, AbilityType> = {
  0xff0055: 'fire',
  0x00ff88: 'sonic-wave',   // mint
  0xffdd00: 'lightning-storm',
  0x00aaff: 'tornado',
  0xbb00ff: 'blackhole',    // violet
  0xff6666: 'salmon',
  0x55ff00: 'infection',
  0x00ffdd: 'tsunami',
};

export const ABILITY_LABEL: Record<AbilityType, string> = {
  'blackhole':       'BLACK HOLE',
  'fire':            'METEOR',
  'lightning-storm': 'STORM',
  'tornado':         'TORNADO',
  'salmon':          'SALMON',
  'infection':       'INFECT',
  'missile':         'MISSILE',
  'tsunami':         'TSUNAMI',
  'sonic-wave':      'SONIC WAVE',
};

/** How many charges are awarded when a player earns their special (every 4 waves). */
export const ABILITY_CHARGES: Partial<Record<AbilityType, number>> = {
  'fire':       3,
  'sonic-wave': 1,
  'infection':  3,
  'salmon':     3,
};
