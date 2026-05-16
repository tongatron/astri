/**
 * Charles Messier's catalogue of 110 deep-sky objects (M1–M110), with
 * J2000 equatorial coordinates and apparent magnitudes. Coordinates and
 * magnitudes from SIMBAD / NASA HEASARC.
 *
 * Type codes:
 *   OC  = open cluster
 *   GC  = globular cluster
 *   NEB = diffuse / emission / reflection nebula
 *   PN  = planetary nebula
 *   SNR = supernova remnant
 *   GAL = galaxy
 *   AST = asterism (M40, M73)
 *   STR = galactic asterism / star cloud (M24)
 */

export type MessierType = 'OC' | 'GC' | 'NEB' | 'PN' | 'SNR' | 'GAL' | 'AST' | 'STR';

export type MessierObject = {
  id: string;          // "M1", "M31", ...
  number: number;      // 1..110
  name?: string;       // common name, when widely used
  type: MessierType;
  constellation: string;
  raHours: number;     // J2000 right ascension, hours
  decDeg: number;      // J2000 declination, degrees
  magnitude: number;   // apparent V magnitude
};

export const MESSIER: MessierObject[] = [
  { id: 'M1',   number: 1,   name: 'Granchio',          type: 'SNR', constellation: 'Toro',          raHours: 5.5755,  decDeg:  22.0145, magnitude:  8.4 },
  { id: 'M2',   number: 2,   type: 'GC',  constellation: 'Acquario',          raHours: 21.5575, decDeg:  -0.8233, magnitude:  6.5 },
  { id: 'M3',   number: 3,   type: 'GC',  constellation: 'Cani da Caccia',    raHours: 13.7032, decDeg:  28.3773, magnitude:  6.2 },
  { id: 'M4',   number: 4,   type: 'GC',  constellation: 'Scorpione',          raHours: 16.3933, decDeg: -26.5258, magnitude:  5.6 },
  { id: 'M5',   number: 5,   type: 'GC',  constellation: 'Serpente',           raHours: 15.3092, decDeg:   2.0810, magnitude:  5.7 },
  { id: 'M6',   number: 6,   name: 'Farfalla',           type: 'OC',  constellation: 'Scorpione',          raHours: 17.6700, decDeg: -32.2167, magnitude:  4.2 },
  { id: 'M7',   number: 7,   name: 'Tolomeo',            type: 'OC',  constellation: 'Scorpione',          raHours: 17.8967, decDeg: -34.7933, magnitude:  3.3 },
  { id: 'M8',   number: 8,   name: 'Laguna',             type: 'NEB', constellation: 'Sagittario',         raHours: 18.0608, decDeg: -24.3867, magnitude:  6.0 },
  { id: 'M9',   number: 9,   type: 'GC',  constellation: 'Ofiuco',             raHours: 17.3192, decDeg: -18.5158, magnitude:  7.7 },
  { id: 'M10',  number: 10,  type: 'GC',  constellation: 'Ofiuco',             raHours: 16.9520, decDeg:  -4.1003, magnitude:  6.6 },
  { id: 'M11',  number: 11,  name: 'Anatra Selvatica',   type: 'OC',  constellation: 'Scudo',              raHours: 18.8513, decDeg:  -6.2700, magnitude:  6.3 },
  { id: 'M12',  number: 12,  type: 'GC',  constellation: 'Ofiuco',             raHours: 16.7872, decDeg:  -1.9483, magnitude:  6.7 },
  { id: 'M13',  number: 13,  name: 'Ercole',             type: 'GC',  constellation: 'Ercole',             raHours: 16.6949, decDeg:  36.4613, magnitude:  5.8 },
  { id: 'M14',  number: 14,  type: 'GC',  constellation: 'Ofiuco',             raHours: 17.6262, decDeg:  -3.2459, magnitude:  7.6 },
  { id: 'M15',  number: 15,  type: 'GC',  constellation: 'Pegaso',             raHours: 21.4995, decDeg:  12.1670, magnitude:  6.2 },
  { id: 'M16',  number: 16,  name: 'Aquila',             type: 'NEB', constellation: 'Serpente',           raHours: 18.3133, decDeg: -13.7833, magnitude:  6.0 },
  { id: 'M17',  number: 17,  name: 'Omega',              type: 'NEB', constellation: 'Sagittario',         raHours: 18.3458, decDeg: -16.1722, magnitude:  6.0 },
  { id: 'M18',  number: 18,  type: 'OC',  constellation: 'Sagittario',         raHours: 18.3325, decDeg: -17.1000, magnitude:  7.5 },
  { id: 'M19',  number: 19,  type: 'GC',  constellation: 'Ofiuco',             raHours: 17.0411, decDeg: -26.2679, magnitude:  6.8 },
  { id: 'M20',  number: 20,  name: 'Trifida',            type: 'NEB', constellation: 'Sagittario',         raHours: 18.0367, decDeg: -23.0300, magnitude:  6.3 },
  { id: 'M21',  number: 21,  type: 'OC',  constellation: 'Sagittario',         raHours: 18.0717, decDeg: -22.5000, magnitude:  6.5 },
  { id: 'M22',  number: 22,  name: 'Sagittario',         type: 'GC',  constellation: 'Sagittario',         raHours: 18.6066, decDeg: -23.9047, magnitude:  5.1 },
  { id: 'M23',  number: 23,  type: 'OC',  constellation: 'Sagittario',         raHours: 17.9467, decDeg: -19.0167, magnitude:  6.9 },
  { id: 'M24',  number: 24,  name: 'Nube Sagittario',    type: 'STR', constellation: 'Sagittario',         raHours: 18.2833, decDeg: -18.5500, magnitude:  4.6 },
  { id: 'M25',  number: 25,  type: 'OC',  constellation: 'Sagittario',         raHours: 18.5300, decDeg: -19.2500, magnitude:  6.5 },
  { id: 'M26',  number: 26,  type: 'OC',  constellation: 'Scudo',              raHours: 18.7558, decDeg:  -9.3833, magnitude:  8.0 },
  { id: 'M27',  number: 27,  name: 'Manubrio',           type: 'PN',  constellation: 'Volpetta',           raHours: 19.9933, decDeg:  22.7211, magnitude:  7.5 },
  { id: 'M28',  number: 28,  type: 'GC',  constellation: 'Sagittario',         raHours: 18.4092, decDeg: -24.8697, magnitude:  6.8 },
  { id: 'M29',  number: 29,  type: 'OC',  constellation: 'Cigno',              raHours: 20.3958, decDeg:  38.5233, magnitude:  6.6 },
  { id: 'M30',  number: 30,  type: 'GC',  constellation: 'Capricorno',         raHours: 21.6727, decDeg: -23.1797, magnitude:  7.7 },
  { id: 'M31',  number: 31,  name: 'Andromeda',          type: 'GAL', constellation: 'Andromeda',          raHours:  0.7123, decDeg:  41.2692, magnitude:  3.4 },
  { id: 'M32',  number: 32,  type: 'GAL', constellation: 'Andromeda',          raHours:  0.7115, decDeg:  40.8653, magnitude:  8.1 },
  { id: 'M33',  number: 33,  name: 'Triangolo',          type: 'GAL', constellation: 'Triangolo',          raHours:  1.5642, decDeg:  30.6602, magnitude:  5.7 },
  { id: 'M34',  number: 34,  type: 'OC',  constellation: 'Perseo',             raHours:  2.7000, decDeg:  42.7833, magnitude:  5.5 },
  { id: 'M35',  number: 35,  type: 'OC',  constellation: 'Gemelli',            raHours:  6.1483, decDeg:  24.3333, magnitude:  5.3 },
  { id: 'M36',  number: 36,  type: 'OC',  constellation: 'Auriga',             raHours:  5.6058, decDeg:  34.1333, magnitude:  6.3 },
  { id: 'M37',  number: 37,  type: 'OC',  constellation: 'Auriga',             raHours:  5.8717, decDeg:  32.5500, magnitude:  6.2 },
  { id: 'M38',  number: 38,  type: 'OC',  constellation: 'Auriga',             raHours:  5.4783, decDeg:  35.8333, magnitude:  7.4 },
  { id: 'M39',  number: 39,  type: 'OC',  constellation: 'Cigno',              raHours: 21.5258, decDeg:  48.4333, magnitude:  4.6 },
  { id: 'M40',  number: 40,  name: 'Winnecke 4',         type: 'AST', constellation: 'Orsa Maggiore',      raHours: 12.3700, decDeg:  58.0833, magnitude:  8.4 },
  { id: 'M41',  number: 41,  type: 'OC',  constellation: 'Cane Maggiore',      raHours:  6.7667, decDeg: -20.7167, magnitude:  4.5 },
  { id: 'M42',  number: 42,  name: 'Orione',             type: 'NEB', constellation: 'Orione',             raHours:  5.5883, decDeg:  -5.3911, magnitude:  4.0 },
  { id: 'M43',  number: 43,  type: 'NEB', constellation: 'Orione',             raHours:  5.5917, decDeg:  -5.2700, magnitude:  9.0 },
  { id: 'M44',  number: 44,  name: 'Presepe',            type: 'OC',  constellation: 'Cancro',             raHours:  8.6700, decDeg:  19.6667, magnitude:  3.7 },
  { id: 'M45',  number: 45,  name: 'Pleiadi',            type: 'OC',  constellation: 'Toro',               raHours:  3.7900, decDeg:  24.1167, magnitude:  1.6 },
  { id: 'M46',  number: 46,  type: 'OC',  constellation: 'Poppa',              raHours:  7.6967, decDeg: -14.8167, magnitude:  6.1 },
  { id: 'M47',  number: 47,  type: 'OC',  constellation: 'Poppa',              raHours:  7.6100, decDeg: -14.4833, magnitude:  4.4 },
  { id: 'M48',  number: 48,  type: 'OC',  constellation: 'Idra',               raHours:  8.2283, decDeg:  -5.7500, magnitude:  5.8 },
  { id: 'M49',  number: 49,  type: 'GAL', constellation: 'Vergine',            raHours: 12.4961, decDeg:   8.0006, magnitude:  8.4 },
  { id: 'M50',  number: 50,  type: 'OC',  constellation: 'Unicorno',           raHours:  7.0467, decDeg:  -8.3333, magnitude:  5.9 },
  { id: 'M51',  number: 51,  name: 'Vortice',            type: 'GAL', constellation: 'Cani da Caccia',    raHours: 13.4979, decDeg:  47.1953, magnitude:  8.4 },
  { id: 'M52',  number: 52,  type: 'OC',  constellation: 'Cassiopea',          raHours: 23.4067, decDeg:  61.5833, magnitude:  6.9 },
  { id: 'M53',  number: 53,  type: 'GC',  constellation: 'Chioma di Berenice', raHours: 13.2153, decDeg:  18.1681, magnitude:  7.7 },
  { id: 'M54',  number: 54,  type: 'GC',  constellation: 'Sagittario',         raHours: 18.9172, decDeg: -30.4797, magnitude:  7.6 },
  { id: 'M55',  number: 55,  type: 'GC',  constellation: 'Sagittario',         raHours: 19.6664, decDeg: -30.9628, magnitude:  6.3 },
  { id: 'M56',  number: 56,  type: 'GC',  constellation: 'Lira',               raHours: 19.2767, decDeg:  30.1833, magnitude:  8.3 },
  { id: 'M57',  number: 57,  name: 'Anello',             type: 'PN',  constellation: 'Lira',               raHours: 18.8917, decDeg:  33.0286, magnitude:  8.8 },
  { id: 'M58',  number: 58,  type: 'GAL', constellation: 'Vergine',            raHours: 12.6286, decDeg:  11.8181, magnitude:  9.7 },
  { id: 'M59',  number: 59,  type: 'GAL', constellation: 'Vergine',            raHours: 12.7000, decDeg:  11.6469, magnitude:  9.6 },
  { id: 'M60',  number: 60,  type: 'GAL', constellation: 'Vergine',            raHours: 12.7278, decDeg:  11.5525, magnitude:  8.8 },
  { id: 'M61',  number: 61,  type: 'GAL', constellation: 'Vergine',            raHours: 12.3653, decDeg:   4.4736, magnitude:  9.7 },
  { id: 'M62',  number: 62,  type: 'GC',  constellation: 'Ofiuco',             raHours: 17.0203, decDeg: -30.1108, magnitude:  6.5 },
  { id: 'M63',  number: 63,  name: 'Girasole',           type: 'GAL', constellation: 'Cani da Caccia',    raHours: 13.2636, decDeg:  42.0292, magnitude:  8.6 },
  { id: 'M64',  number: 64,  name: 'Occhio Nero',        type: 'GAL', constellation: 'Chioma di Berenice', raHours: 12.9456, decDeg:  21.6828, magnitude:  8.5 },
  { id: 'M65',  number: 65,  type: 'GAL', constellation: 'Leone',              raHours: 11.3153, decDeg:  13.0925, magnitude:  9.3 },
  { id: 'M66',  number: 66,  type: 'GAL', constellation: 'Leone',              raHours: 11.3375, decDeg:  12.9914, magnitude:  8.9 },
  { id: 'M67',  number: 67,  type: 'OC',  constellation: 'Cancro',             raHours:  8.8400, decDeg:  11.8167, magnitude:  6.1 },
  { id: 'M68',  number: 68,  type: 'GC',  constellation: 'Idra',               raHours: 12.6575, decDeg: -26.7444, magnitude:  7.8 },
  { id: 'M69',  number: 69,  type: 'GC',  constellation: 'Sagittario',         raHours: 18.5231, decDeg: -32.3481, magnitude:  7.6 },
  { id: 'M70',  number: 70,  type: 'GC',  constellation: 'Sagittario',         raHours: 18.7203, decDeg: -32.2922, magnitude:  7.9 },
  { id: 'M71',  number: 71,  type: 'GC',  constellation: 'Freccia',            raHours: 19.8961, decDeg:  18.7792, magnitude:  8.2 },
  { id: 'M72',  number: 72,  type: 'GC',  constellation: 'Acquario',          raHours: 20.8911, decDeg: -12.5372, magnitude:  9.4 },
  { id: 'M73',  number: 73,  type: 'AST', constellation: 'Acquario',          raHours: 20.9817, decDeg: -12.6333, magnitude:  9.0 },
  { id: 'M74',  number: 74,  type: 'GAL', constellation: 'Pesci',              raHours:  1.6111, decDeg:  15.7833, magnitude:  9.4 },
  { id: 'M75',  number: 75,  type: 'GC',  constellation: 'Sagittario',         raHours: 20.1011, decDeg: -21.9225, magnitude:  8.5 },
  { id: 'M76',  number: 76,  name: 'Piccolo Manubrio',   type: 'PN',  constellation: 'Perseo',             raHours:  1.7053, decDeg:  51.5750, magnitude: 10.1 },
  { id: 'M77',  number: 77,  type: 'GAL', constellation: 'Balena',             raHours:  2.7114, decDeg:   0.0019, magnitude:  8.9 },
  { id: 'M78',  number: 78,  type: 'NEB', constellation: 'Orione',             raHours:  5.7783, decDeg:   0.0500, magnitude:  8.3 },
  { id: 'M79',  number: 79,  type: 'GC',  constellation: 'Lepre',              raHours:  5.4042, decDeg: -24.5242, magnitude:  7.7 },
  { id: 'M80',  number: 80,  type: 'GC',  constellation: 'Scorpione',          raHours: 16.2839, decDeg: -22.9764, magnitude:  7.3 },
  { id: 'M81',  number: 81,  name: 'Bode',               type: 'GAL', constellation: 'Orsa Maggiore',      raHours:  9.9256, decDeg:  69.0653, magnitude:  6.9 },
  { id: 'M82',  number: 82,  name: 'Sigaro',             type: 'GAL', constellation: 'Orsa Maggiore',      raHours:  9.9311, decDeg:  69.6797, magnitude:  8.4 },
  { id: 'M83',  number: 83,  name: 'Girandola Sud',      type: 'GAL', constellation: 'Idra',               raHours: 13.6167, decDeg: -29.8658, magnitude:  7.5 },
  { id: 'M84',  number: 84,  type: 'GAL', constellation: 'Vergine',            raHours: 12.4181, decDeg:  12.8870, magnitude:  9.1 },
  { id: 'M85',  number: 85,  type: 'GAL', constellation: 'Chioma di Berenice', raHours: 12.4231, decDeg:  18.1914, magnitude:  9.1 },
  { id: 'M86',  number: 86,  type: 'GAL', constellation: 'Vergine',            raHours: 12.4364, decDeg:  12.9464, magnitude:  8.9 },
  { id: 'M87',  number: 87,  name: 'Virgo A',            type: 'GAL', constellation: 'Vergine',            raHours: 12.5137, decDeg:  12.3911, magnitude:  8.6 },
  { id: 'M88',  number: 88,  type: 'GAL', constellation: 'Chioma di Berenice', raHours: 12.5331, decDeg:  14.4203, magnitude:  9.6 },
  { id: 'M89',  number: 89,  type: 'GAL', constellation: 'Vergine',            raHours: 12.5947, decDeg:  12.5564, magnitude:  9.8 },
  { id: 'M90',  number: 90,  type: 'GAL', constellation: 'Vergine',            raHours: 12.6136, decDeg:  13.1628, magnitude:  9.5 },
  { id: 'M91',  number: 91,  type: 'GAL', constellation: 'Chioma di Berenice', raHours: 12.5908, decDeg:  14.4961, magnitude: 10.2 },
  { id: 'M92',  number: 92,  type: 'GC',  constellation: 'Ercole',             raHours: 17.2853, decDeg:  43.1359, magnitude:  6.4 },
  { id: 'M93',  number: 93,  type: 'OC',  constellation: 'Poppa',              raHours:  7.7433, decDeg: -23.8500, magnitude:  6.2 },
  { id: 'M94',  number: 94,  type: 'GAL', constellation: 'Cani da Caccia',    raHours: 12.8481, decDeg:  41.1203, magnitude:  8.2 },
  { id: 'M95',  number: 95,  type: 'GAL', constellation: 'Leone',              raHours: 10.7325, decDeg:  11.7036, magnitude:  9.7 },
  { id: 'M96',  number: 96,  type: 'GAL', constellation: 'Leone',              raHours: 10.7794, decDeg:  11.8200, magnitude:  9.2 },
  { id: 'M97',  number: 97,  name: 'Gufo',               type: 'PN',  constellation: 'Orsa Maggiore',      raHours: 11.2467, decDeg:  55.0192, magnitude:  9.9 },
  { id: 'M98',  number: 98,  type: 'GAL', constellation: 'Chioma di Berenice', raHours: 12.2306, decDeg:  14.9006, magnitude: 10.1 },
  { id: 'M99',  number: 99,  type: 'GAL', constellation: 'Chioma di Berenice', raHours: 12.3128, decDeg:  14.4161, magnitude:  9.9 },
  { id: 'M100', number: 100, type: 'GAL', constellation: 'Chioma di Berenice', raHours: 12.3819, decDeg:  15.8228, magnitude:  9.3 },
  { id: 'M101', number: 101, name: 'Girandola',          type: 'GAL', constellation: 'Orsa Maggiore',      raHours: 14.0537, decDeg:  54.3489, magnitude:  7.9 },
  { id: 'M102', number: 102, type: 'GAL', constellation: 'Dragone',            raHours: 15.1083, decDeg:  55.7633, magnitude: 10.0 },
  { id: 'M103', number: 103, type: 'OC',  constellation: 'Cassiopea',          raHours:  1.5550, decDeg:  60.6583, magnitude:  7.4 },
  { id: 'M104', number: 104, name: 'Sombrero',           type: 'GAL', constellation: 'Vergine',            raHours: 12.6664, decDeg: -11.6231, magnitude:  8.0 },
  { id: 'M105', number: 105, type: 'GAL', constellation: 'Leone',              raHours: 10.7975, decDeg:  12.5817, magnitude:  9.3 },
  { id: 'M106', number: 106, type: 'GAL', constellation: 'Cani da Caccia',    raHours: 12.3161, decDeg:  47.3036, magnitude:  8.4 },
  { id: 'M107', number: 107, type: 'GC',  constellation: 'Ofiuco',             raHours: 16.5425, decDeg: -13.0539, magnitude:  7.9 },
  { id: 'M108', number: 108, type: 'GAL', constellation: 'Orsa Maggiore',      raHours: 11.1919, decDeg:  55.6742, magnitude: 10.0 },
  { id: 'M109', number: 109, type: 'GAL', constellation: 'Orsa Maggiore',      raHours: 11.9600, decDeg:  53.3742, magnitude:  9.8 },
  { id: 'M110', number: 110, type: 'GAL', constellation: 'Andromeda',          raHours:  0.6731, decDeg:  41.6856, magnitude:  8.1 },
];

export const MESSIER_TYPE_LABEL: Record<MessierType, string> = {
  OC:  'Ammasso aperto',
  GC:  'Ammasso globulare',
  NEB: 'Nebulosa',
  PN:  'Nebulosa planetaria',
  SNR: 'Resto di supernova',
  GAL: 'Galassia',
  AST: 'Asterismo',
  STR: 'Nube stellare',
};

/** Color used to render each type on charts. */
export const MESSIER_TYPE_COLOR: Record<MessierType, string> = {
  OC:  '#fcd34d',
  GC:  '#fbbf24',
  NEB: '#f472b6',
  PN:  '#a78bfa',
  SNR: '#fb7185',
  GAL: '#67e8f9',
  AST: '#94a3b8',
  STR: '#cbd5e1',
};
