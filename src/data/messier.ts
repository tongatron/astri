export type DeepSkyType =
  | 'galaxy'
  | 'globular-cluster'
  | 'open-cluster'
  | 'nebula'
  | 'planetary-nebula'
  | 'supernova-remnant'
  | 'asterism'
  | 'cluster-with-nebula'
  | 'double-star';

export type DeepSkyObject = {
  id: string;
  /** Display name (Italian or international). */
  name: string;
  /** Optional common name (Andromeda, Orion Nebula, ...). */
  commonName?: string;
  type: DeepSkyType;
  constellation: string;
  raHours: number;
  decDeg: number;
  magnitude: number;
};

/**
 * Messier catalog (110 objects), J2000 coordinates. Magnitudes are visual
 * (V). Names follow common Italian/English usage. Source values rounded
 * from the standard SEDS/NGC2000 compilation.
 */
export const MESSIER: DeepSkyObject[] = [
  { id: 'M1', name: 'M1', commonName: 'Nebulosa del Granchio', type: 'supernova-remnant', constellation: 'Toro', raHours: 5.5755, decDeg: 22.0145, magnitude: 8.4 },
  { id: 'M2', name: 'M2', type: 'globular-cluster', constellation: 'Acquario', raHours: 21.5577, decDeg: -0.8233, magnitude: 6.5 },
  { id: 'M3', name: 'M3', type: 'globular-cluster', constellation: 'Cani da Caccia', raHours: 13.7032, decDeg: 28.3773, magnitude: 6.2 },
  { id: 'M4', name: 'M4', type: 'globular-cluster', constellation: 'Scorpione', raHours: 16.3933, decDeg: -26.5258, magnitude: 5.6 },
  { id: 'M5', name: 'M5', type: 'globular-cluster', constellation: 'Serpente', raHours: 15.3092, decDeg: 2.0810, magnitude: 5.6 },
  { id: 'M6', name: 'M6', commonName: 'Ammasso della Farfalla', type: 'open-cluster', constellation: 'Scorpione', raHours: 17.6700, decDeg: -32.2533, magnitude: 4.2 },
  { id: 'M7', name: 'M7', commonName: 'Ammasso di Tolomeo', type: 'open-cluster', constellation: 'Scorpione', raHours: 17.8967, decDeg: -34.7933, magnitude: 3.3 },
  { id: 'M8', name: 'M8', commonName: 'Nebulosa Laguna', type: 'cluster-with-nebula', constellation: 'Sagittario', raHours: 18.0608, decDeg: -24.3867, magnitude: 6.0 },
  { id: 'M9', name: 'M9', type: 'globular-cluster', constellation: 'Ofiuco', raHours: 17.3197, decDeg: -18.5167, magnitude: 7.7 },
  { id: 'M10', name: 'M10', type: 'globular-cluster', constellation: 'Ofiuco', raHours: 16.9521, decDeg: -4.1003, magnitude: 6.6 },
  { id: 'M11', name: 'M11', commonName: 'Ammasso dell\'Anatra Selvatica', type: 'open-cluster', constellation: 'Scudo', raHours: 18.8517, decDeg: -6.2667, magnitude: 5.8 },
  { id: 'M12', name: 'M12', type: 'globular-cluster', constellation: 'Ofiuco', raHours: 16.7872, decDeg: -1.9483, magnitude: 6.7 },
  { id: 'M13', name: 'M13', commonName: 'Ammasso di Ercole', type: 'globular-cluster', constellation: 'Ercole', raHours: 16.6949, decDeg: 36.4613, magnitude: 5.8 },
  { id: 'M14', name: 'M14', type: 'globular-cluster', constellation: 'Ofiuco', raHours: 17.6263, decDeg: -3.2459, magnitude: 7.6 },
  { id: 'M15', name: 'M15', type: 'globular-cluster', constellation: 'Pegaso', raHours: 21.4995, decDeg: 12.1670, magnitude: 6.2 },
  { id: 'M16', name: 'M16', commonName: 'Nebulosa Aquila', type: 'cluster-with-nebula', constellation: 'Serpente', raHours: 18.3133, decDeg: -13.7833, magnitude: 6.0 },
  { id: 'M17', name: 'M17', commonName: 'Nebulosa Omega', type: 'cluster-with-nebula', constellation: 'Sagittario', raHours: 18.3467, decDeg: -16.1717, magnitude: 6.0 },
  { id: 'M18', name: 'M18', type: 'open-cluster', constellation: 'Sagittario', raHours: 18.3322, decDeg: -17.1000, magnitude: 7.5 },
  { id: 'M19', name: 'M19', type: 'globular-cluster', constellation: 'Ofiuco', raHours: 17.0411, decDeg: -26.2679, magnitude: 6.8 },
  { id: 'M20', name: 'M20', commonName: 'Nebulosa Trifida', type: 'cluster-with-nebula', constellation: 'Sagittario', raHours: 18.0367, decDeg: -23.0300, magnitude: 6.3 },
  { id: 'M21', name: 'M21', type: 'open-cluster', constellation: 'Sagittario', raHours: 18.0717, decDeg: -22.5000, magnitude: 5.9 },
  { id: 'M22', name: 'M22', type: 'globular-cluster', constellation: 'Sagittario', raHours: 18.6065, decDeg: -23.9046, magnitude: 5.1 },
  { id: 'M23', name: 'M23', type: 'open-cluster', constellation: 'Sagittario', raHours: 17.9483, decDeg: -19.0167, magnitude: 5.5 },
  { id: 'M24', name: 'M24', commonName: 'Nube Stellare del Sagittario', type: 'asterism', constellation: 'Sagittario', raHours: 18.2783, decDeg: -18.5500, magnitude: 4.6 },
  { id: 'M25', name: 'M25', type: 'open-cluster', constellation: 'Sagittario', raHours: 18.5283, decDeg: -19.1167, magnitude: 4.6 },
  { id: 'M26', name: 'M26', type: 'open-cluster', constellation: 'Scudo', raHours: 18.7517, decDeg: -9.3833, magnitude: 8.0 },
  { id: 'M27', name: 'M27', commonName: 'Nebulosa Manubrio', type: 'planetary-nebula', constellation: 'Volpetta', raHours: 19.9933, decDeg: 22.7211, magnitude: 7.5 },
  { id: 'M28', name: 'M28', type: 'globular-cluster', constellation: 'Sagittario', raHours: 18.4092, decDeg: -24.8697, magnitude: 6.8 },
  { id: 'M29', name: 'M29', type: 'open-cluster', constellation: 'Cigno', raHours: 20.4000, decDeg: 38.5333, magnitude: 7.1 },
  { id: 'M30', name: 'M30', type: 'globular-cluster', constellation: 'Capricorno', raHours: 21.6727, decDeg: -23.1797, magnitude: 7.7 },
  { id: 'M31', name: 'M31', commonName: 'Galassia di Andromeda', type: 'galaxy', constellation: 'Andromeda', raHours: 0.7123, decDeg: 41.2692, magnitude: 3.4 },
  { id: 'M32', name: 'M32', type: 'galaxy', constellation: 'Andromeda', raHours: 0.7117, decDeg: 40.8650, magnitude: 8.1 },
  { id: 'M33', name: 'M33', commonName: 'Galassia del Triangolo', type: 'galaxy', constellation: 'Triangolo', raHours: 1.5642, decDeg: 30.6602, magnitude: 5.7 },
  { id: 'M34', name: 'M34', type: 'open-cluster', constellation: 'Perseo', raHours: 2.7000, decDeg: 42.7833, magnitude: 5.5 },
  { id: 'M35', name: 'M35', type: 'open-cluster', constellation: 'Gemelli', raHours: 6.1483, decDeg: 24.3333, magnitude: 5.3 },
  { id: 'M36', name: 'M36', type: 'open-cluster', constellation: 'Auriga', raHours: 5.6050, decDeg: 34.1333, magnitude: 6.3 },
  { id: 'M37', name: 'M37', type: 'open-cluster', constellation: 'Auriga', raHours: 5.8717, decDeg: 32.5500, magnitude: 6.2 },
  { id: 'M38', name: 'M38', type: 'open-cluster', constellation: 'Auriga', raHours: 5.4783, decDeg: 35.8500, magnitude: 7.4 },
  { id: 'M39', name: 'M39', type: 'open-cluster', constellation: 'Cigno', raHours: 21.5300, decDeg: 48.4333, magnitude: 4.6 },
  { id: 'M40', name: 'M40', type: 'double-star', constellation: 'Orsa Maggiore', raHours: 12.3700, decDeg: 58.0833, magnitude: 8.4 },
  { id: 'M41', name: 'M41', type: 'open-cluster', constellation: 'Cane Maggiore', raHours: 6.7667, decDeg: -20.7167, magnitude: 4.5 },
  { id: 'M42', name: 'M42', commonName: 'Nebulosa di Orione', type: 'nebula', constellation: 'Orione', raHours: 5.5883, decDeg: -5.3911, magnitude: 4.0 },
  { id: 'M43', name: 'M43', commonName: 'De Mairan', type: 'nebula', constellation: 'Orione', raHours: 5.5917, decDeg: -5.2667, magnitude: 9.0 },
  { id: 'M44', name: 'M44', commonName: 'Presepe', type: 'open-cluster', constellation: 'Cancro', raHours: 8.6700, decDeg: 19.6700, magnitude: 3.7 },
  { id: 'M45', name: 'M45', commonName: 'Pleiadi', type: 'open-cluster', constellation: 'Toro', raHours: 3.7900, decDeg: 24.1167, magnitude: 1.6 },
  { id: 'M46', name: 'M46', type: 'open-cluster', constellation: 'Poppa', raHours: 7.6967, decDeg: -14.8167, magnitude: 6.1 },
  { id: 'M47', name: 'M47', type: 'open-cluster', constellation: 'Poppa', raHours: 7.6100, decDeg: -14.5000, magnitude: 4.4 },
  { id: 'M48', name: 'M48', type: 'open-cluster', constellation: 'Idra', raHours: 8.2300, decDeg: -5.7500, magnitude: 5.8 },
  { id: 'M49', name: 'M49', type: 'galaxy', constellation: 'Vergine', raHours: 12.4961, decDeg: 8.0004, magnitude: 8.4 },
  { id: 'M50', name: 'M50', type: 'open-cluster', constellation: 'Unicorno', raHours: 7.0500, decDeg: -8.3333, magnitude: 5.9 },
  { id: 'M51', name: 'M51', commonName: 'Galassia Vortice', type: 'galaxy', constellation: 'Cani da Caccia', raHours: 13.4979, decDeg: 47.1953, magnitude: 8.4 },
  { id: 'M52', name: 'M52', type: 'open-cluster', constellation: 'Cassiopea', raHours: 23.4133, decDeg: 61.5917, magnitude: 6.9 },
  { id: 'M53', name: 'M53', type: 'globular-cluster', constellation: 'Chioma di Berenice', raHours: 13.2151, decDeg: 18.1681, magnitude: 7.7 },
  { id: 'M54', name: 'M54', type: 'globular-cluster', constellation: 'Sagittario', raHours: 18.9173, decDeg: -30.4798, magnitude: 7.7 },
  { id: 'M55', name: 'M55', type: 'globular-cluster', constellation: 'Sagittario', raHours: 19.6669, decDeg: -30.9628, magnitude: 6.3 },
  { id: 'M56', name: 'M56', type: 'globular-cluster', constellation: 'Lira', raHours: 19.2767, decDeg: 30.1833, magnitude: 8.3 },
  { id: 'M57', name: 'M57', commonName: 'Nebulosa Anello', type: 'planetary-nebula', constellation: 'Lira', raHours: 18.8933, decDeg: 33.0292, magnitude: 8.8 },
  { id: 'M58', name: 'M58', type: 'galaxy', constellation: 'Vergine', raHours: 12.6294, decDeg: 11.8181, magnitude: 9.7 },
  { id: 'M59', name: 'M59', type: 'galaxy', constellation: 'Vergine', raHours: 12.7000, decDeg: 11.6469, magnitude: 9.6 },
  { id: 'M60', name: 'M60', type: 'galaxy', constellation: 'Vergine', raHours: 12.7274, decDeg: 11.5527, magnitude: 8.8 },
  { id: 'M61', name: 'M61', type: 'galaxy', constellation: 'Vergine', raHours: 12.3654, decDeg: 4.4736, magnitude: 9.7 },
  { id: 'M62', name: 'M62', type: 'globular-cluster', constellation: 'Ofiuco', raHours: 17.0202, decDeg: -30.1124, magnitude: 6.5 },
  { id: 'M63', name: 'M63', commonName: 'Galassia Girasole', type: 'galaxy', constellation: 'Cani da Caccia', raHours: 13.2636, decDeg: 42.0293, magnitude: 8.6 },
  { id: 'M64', name: 'M64', commonName: 'Galassia Occhio Nero', type: 'galaxy', constellation: 'Chioma di Berenice', raHours: 12.9456, decDeg: 21.6831, magnitude: 8.5 },
  { id: 'M65', name: 'M65', type: 'galaxy', constellation: 'Leone', raHours: 11.3155, decDeg: 13.0924, magnitude: 9.3 },
  { id: 'M66', name: 'M66', type: 'galaxy', constellation: 'Leone', raHours: 11.3375, decDeg: 12.9914, magnitude: 8.9 },
  { id: 'M67', name: 'M67', type: 'open-cluster', constellation: 'Cancro', raHours: 8.8550, decDeg: 11.8167, magnitude: 6.1 },
  { id: 'M68', name: 'M68', type: 'globular-cluster', constellation: 'Idra', raHours: 12.6573, decDeg: -26.7444, magnitude: 7.8 },
  { id: 'M69', name: 'M69', type: 'globular-cluster', constellation: 'Sagittario', raHours: 18.5231, decDeg: -32.3481, magnitude: 7.6 },
  { id: 'M70', name: 'M70', type: 'globular-cluster', constellation: 'Sagittario', raHours: 18.7204, decDeg: -32.2922, magnitude: 7.9 },
  { id: 'M71', name: 'M71', type: 'globular-cluster', constellation: 'Freccia', raHours: 19.8964, decDeg: 18.7792, magnitude: 8.2 },
  { id: 'M72', name: 'M72', type: 'globular-cluster', constellation: 'Acquario', raHours: 20.8911, decDeg: -12.5373, magnitude: 9.4 },
  { id: 'M73', name: 'M73', type: 'asterism', constellation: 'Acquario', raHours: 20.9817, decDeg: -12.6333, magnitude: 9.0 },
  { id: 'M74', name: 'M74', type: 'galaxy', constellation: 'Pesci', raHours: 1.6112, decDeg: 15.7836, magnitude: 9.4 },
  { id: 'M75', name: 'M75', type: 'globular-cluster', constellation: 'Sagittario', raHours: 20.1015, decDeg: -21.9226, magnitude: 8.6 },
  { id: 'M76', name: 'M76', commonName: 'Piccolo Manubrio', type: 'planetary-nebula', constellation: 'Perseo', raHours: 1.7050, decDeg: 51.5754, magnitude: 10.1 },
  { id: 'M77', name: 'M77', type: 'galaxy', constellation: 'Balena', raHours: 2.7113, decDeg: -0.0133, magnitude: 8.9 },
  { id: 'M78', name: 'M78', type: 'nebula', constellation: 'Orione', raHours: 5.7800, decDeg: 0.0500, magnitude: 8.3 },
  { id: 'M79', name: 'M79', type: 'globular-cluster', constellation: 'Lepre', raHours: 5.4042, decDeg: -24.5247, magnitude: 7.7 },
  { id: 'M80', name: 'M80', type: 'globular-cluster', constellation: 'Scorpione', raHours: 16.2839, decDeg: -22.9764, magnitude: 7.3 },
  { id: 'M81', name: 'M81', commonName: 'Galassia di Bode', type: 'galaxy', constellation: 'Orsa Maggiore', raHours: 9.9256, decDeg: 69.0653, magnitude: 6.9 },
  { id: 'M82', name: 'M82', commonName: 'Galassia Sigaro', type: 'galaxy', constellation: 'Orsa Maggiore', raHours: 9.9314, decDeg: 69.6797, magnitude: 8.4 },
  { id: 'M83', name: 'M83', commonName: 'Mulinello Australe', type: 'galaxy', constellation: 'Idra', raHours: 13.6167, decDeg: -29.8667, magnitude: 7.5 },
  { id: 'M84', name: 'M84', type: 'galaxy', constellation: 'Vergine', raHours: 12.4179, decDeg: 12.8870, magnitude: 9.1 },
  { id: 'M85', name: 'M85', type: 'galaxy', constellation: 'Chioma di Berenice', raHours: 12.4231, decDeg: 18.1911, magnitude: 9.1 },
  { id: 'M86', name: 'M86', type: 'galaxy', constellation: 'Vergine', raHours: 12.4366, decDeg: 12.9466, magnitude: 8.9 },
  { id: 'M87', name: 'M87', commonName: 'Virgo A', type: 'galaxy', constellation: 'Vergine', raHours: 12.5137, decDeg: 12.3911, magnitude: 8.6 },
  { id: 'M88', name: 'M88', type: 'galaxy', constellation: 'Chioma di Berenice', raHours: 12.5318, decDeg: 14.4203, magnitude: 9.6 },
  { id: 'M89', name: 'M89', type: 'galaxy', constellation: 'Vergine', raHours: 12.5947, decDeg: 12.5563, magnitude: 9.8 },
  { id: 'M90', name: 'M90', type: 'galaxy', constellation: 'Vergine', raHours: 12.6137, decDeg: 13.1629, magnitude: 9.5 },
  { id: 'M91', name: 'M91', type: 'galaxy', constellation: 'Chioma di Berenice', raHours: 12.5894, decDeg: 14.4964, magnitude: 10.2 },
  { id: 'M92', name: 'M92', type: 'globular-cluster', constellation: 'Ercole', raHours: 17.2854, decDeg: 43.1361, magnitude: 6.4 },
  { id: 'M93', name: 'M93', type: 'open-cluster', constellation: 'Poppa', raHours: 7.7433, decDeg: -23.8500, magnitude: 6.2 },
  { id: 'M94', name: 'M94', type: 'galaxy', constellation: 'Cani da Caccia', raHours: 12.8481, decDeg: 41.1203, magnitude: 8.2 },
  { id: 'M95', name: 'M95', type: 'galaxy', constellation: 'Leone', raHours: 10.7327, decDeg: 11.7037, magnitude: 9.7 },
  { id: 'M96', name: 'M96', type: 'galaxy', constellation: 'Leone', raHours: 10.7794, decDeg: 11.8200, magnitude: 9.2 },
  { id: 'M97', name: 'M97', commonName: 'Nebulosa Gufo', type: 'planetary-nebula', constellation: 'Orsa Maggiore', raHours: 11.2469, decDeg: 55.0190, magnitude: 9.9 },
  { id: 'M98', name: 'M98', type: 'galaxy', constellation: 'Chioma di Berenice', raHours: 12.2305, decDeg: 14.9006, magnitude: 10.1 },
  { id: 'M99', name: 'M99', type: 'galaxy', constellation: 'Chioma di Berenice', raHours: 12.3128, decDeg: 14.4163, magnitude: 9.9 },
  { id: 'M100', name: 'M100', type: 'galaxy', constellation: 'Chioma di Berenice', raHours: 12.3819, decDeg: 15.8222, magnitude: 9.3 },
  { id: 'M101', name: 'M101', commonName: 'Galassia Girandola', type: 'galaxy', constellation: 'Orsa Maggiore', raHours: 14.0535, decDeg: 54.3489, magnitude: 7.9 },
  { id: 'M102', name: 'M102', type: 'galaxy', constellation: 'Dragone', raHours: 15.1083, decDeg: 55.7633, magnitude: 9.9 },
  { id: 'M103', name: 'M103', type: 'open-cluster', constellation: 'Cassiopea', raHours: 1.5550, decDeg: 60.6583, magnitude: 7.4 },
  { id: 'M104', name: 'M104', commonName: 'Galassia Sombrero', type: 'galaxy', constellation: 'Vergine', raHours: 12.6663, decDeg: -11.6231, magnitude: 8.0 },
  { id: 'M105', name: 'M105', type: 'galaxy', constellation: 'Leone', raHours: 10.7972, decDeg: 12.5817, magnitude: 9.3 },
  { id: 'M106', name: 'M106', type: 'galaxy', constellation: 'Cani da Caccia', raHours: 12.3160, decDeg: 47.3037, magnitude: 8.4 },
  { id: 'M107', name: 'M107', type: 'globular-cluster', constellation: 'Ofiuco', raHours: 16.5424, decDeg: -13.0537, magnitude: 8.9 },
  { id: 'M108', name: 'M108', type: 'galaxy', constellation: 'Orsa Maggiore', raHours: 11.1914, decDeg: 55.6741, magnitude: 10.0 },
  { id: 'M109', name: 'M109', type: 'galaxy', constellation: 'Orsa Maggiore', raHours: 11.9601, decDeg: 53.3745, magnitude: 9.8 },
  { id: 'M110', name: 'M110', type: 'galaxy', constellation: 'Andromeda', raHours: 0.6726, decDeg: 41.6854, magnitude: 8.5 },
];

export function deepSkyTypeLabel(t: DeepSkyType): string {
  switch (t) {
    case 'galaxy': return 'Galassia';
    case 'globular-cluster': return 'Ammasso globulare';
    case 'open-cluster': return 'Ammasso aperto';
    case 'nebula': return 'Nebulosa';
    case 'planetary-nebula': return 'Nebulosa planetaria';
    case 'supernova-remnant': return 'Resto di supernova';
    case 'asterism': return 'Asterismo';
    case 'cluster-with-nebula': return 'Ammasso + nebulosa';
    case 'double-star': return 'Stella doppia';
  }
}

export function deepSkyTypeColor(t: DeepSkyType): string {
  switch (t) {
    case 'galaxy': return '#c084fc';
    case 'globular-cluster': return '#fbbf24';
    case 'open-cluster': return '#60a5fa';
    case 'nebula': return '#f472b6';
    case 'planetary-nebula': return '#34d399';
    case 'supernova-remnant': return '#fb7185';
    case 'asterism': return '#94a3b8';
    case 'cluster-with-nebula': return '#22d3ee';
    case 'double-star': return '#cbd5e1';
  }
}
