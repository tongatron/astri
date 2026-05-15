export type ConstellationSegment = [string, string]; // pair of star IDs

export type Constellation = {
  id: string;
  name: string;
  segments: ConstellationSegment[];
};

export const CONSTELLATIONS: Constellation[] = [
  {
    id: 'orion',
    name: 'Orione',
    segments: [
      ['betelgeuse', 'bellatrix'],
      ['bellatrix', 'mintaka'],
      ['mintaka', 'alnilam'],
      ['alnilam', 'alnitak'],
      ['alnitak', 'saiph'],
      ['saiph', 'rigel'],
      ['rigel', 'mintaka'],
      ['alnitak', 'betelgeuse'],
    ],
  },
  {
    id: 'big-dipper',
    name: 'Grande Carro',
    segments: [
      ['dubhe', 'merak'],
      ['merak', 'phecda'],
      ['phecda', 'megrez'],
      ['megrez', 'dubhe'],
      ['megrez', 'alioth'],
      ['alioth', 'mizar'],
      ['mizar', 'alkaid'],
    ],
  },
  {
    id: 'cassiopeia',
    name: 'Cassiopea',
    segments: [
      ['caph', 'schedar'],
      ['schedar', 'gamma-cas'],
      ['gamma-cas', 'ruchbah'],
      ['ruchbah', 'segin'],
    ],
  },
  {
    id: 'lyra',
    name: 'Lira',
    segments: [
      ['vega', 'sheliak'],
      ['sheliak', 'sulafat'],
      ['sulafat', 'vega'],
    ],
  },
  {
    id: 'cygnus',
    name: 'Cigno (Croce del Nord)',
    segments: [
      ['deneb', 'sadr'],
      ['sadr', 'albireo'],
      ['gienah-cyg', 'sadr'],
      ['sadr', 'delta-cyg'],
    ],
  },
  {
    id: 'leo',
    name: 'Leone',
    segments: [
      ['regulus', 'algieba'],
      ['algieba', 'zosma'],
      ['zosma', 'denebola'],
      ['denebola', 'regulus'],
    ],
  },
  {
    id: 'gemini',
    name: 'Gemelli',
    segments: [
      ['castor', 'pollux'],
      ['pollux', 'alhena'],
    ],
  },
  {
    id: 'canis-major',
    name: 'Cane Maggiore',
    segments: [
      ['sirius', 'mirzam'],
      ['sirius', 'adhara'],
      ['adhara', 'wezen'],
    ],
  },
  {
    id: 'andromeda-pegasus',
    name: 'Quadrato di Pegaso',
    segments: [
      ['alpheratz', 'scheat'],
      ['scheat', 'markab'],
      ['markab', 'algenib'],
      ['algenib', 'alpheratz'],
      ['alpheratz', 'mirach'],
      ['mirach', 'almach'],
      ['markab', 'enif'],
    ],
  },
  {
    id: 'perseus',
    name: 'Perseo',
    segments: [['mirfak', 'algol']],
  },
  {
    id: 'ursa-minor-pointer',
    name: 'Verso la Polare',
    segments: [['dubhe', 'polaris']],
  },
];
