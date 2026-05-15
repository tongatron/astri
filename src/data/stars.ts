export type Star = {
  id: string;
  name: string;
  bayer?: string;
  constellation: string;
  raHours: number;
  decDeg: number;
  magnitude: number;
};

/**
 * Bright stars (mag ≲ 3) covering the most recognizable constellations of
 * the northern and equatorial sky. J2000 coordinates. Used both for the
 * point cloud and as anchors for constellation line segments.
 */
export const STARS: Star[] = [
  // Orione
  { id: 'betelgeuse', name: 'Betelgeuse', bayer: 'α Ori', constellation: 'Orione', raHours: 5.9195, decDeg: 7.4071, magnitude: 0.42 },
  { id: 'rigel', name: 'Rigel', bayer: 'β Ori', constellation: 'Orione', raHours: 5.2423, decDeg: -8.2017, magnitude: 0.13 },
  { id: 'bellatrix', name: 'Bellatrix', bayer: 'γ Ori', constellation: 'Orione', raHours: 5.4188, decDeg: 6.3497, magnitude: 1.64 },
  { id: 'mintaka', name: 'Mintaka', bayer: 'δ Ori', constellation: 'Orione', raHours: 5.5334, decDeg: -0.2991, magnitude: 2.23 },
  { id: 'alnilam', name: 'Alnilam', bayer: 'ε Ori', constellation: 'Orione', raHours: 5.6036, decDeg: -1.2019, magnitude: 1.69 },
  { id: 'alnitak', name: 'Alnitak', bayer: 'ζ Ori', constellation: 'Orione', raHours: 5.6793, decDeg: -1.9426, magnitude: 1.74 },
  { id: 'saiph', name: 'Saiph', bayer: 'κ Ori', constellation: 'Orione', raHours: 5.7959, decDeg: -9.6696, magnitude: 2.07 },

  // Cane Maggiore / Minore
  { id: 'sirius', name: 'Sirio', bayer: 'α CMa', constellation: 'Cane Maggiore', raHours: 6.7525, decDeg: -16.7161, magnitude: -1.46 },
  { id: 'mirzam', name: 'Mirzam', bayer: 'β CMa', constellation: 'Cane Maggiore', raHours: 6.3783, decDeg: -17.9559, magnitude: 1.98 },
  { id: 'adhara', name: 'Adhara', bayer: 'ε CMa', constellation: 'Cane Maggiore', raHours: 6.9770, decDeg: -28.9722, magnitude: 1.50 },
  { id: 'wezen', name: 'Wezen', bayer: 'δ CMa', constellation: 'Cane Maggiore', raHours: 7.1399, decDeg: -26.3933, magnitude: 1.83 },
  { id: 'procyon', name: 'Procione', bayer: 'α CMi', constellation: 'Cane Minore', raHours: 7.6550, decDeg: 5.2250, magnitude: 0.34 },

  // Gemelli
  { id: 'castor', name: 'Castore', bayer: 'α Gem', constellation: 'Gemelli', raHours: 7.5766, decDeg: 31.8889, magnitude: 1.58 },
  { id: 'pollux', name: 'Polluce', bayer: 'β Gem', constellation: 'Gemelli', raHours: 7.7553, decDeg: 28.0262, magnitude: 1.14 },
  { id: 'alhena', name: 'Alhena', bayer: 'γ Gem', constellation: 'Gemelli', raHours: 6.6285, decDeg: 16.3993, magnitude: 1.91 },

  // Auriga / Toro
  { id: 'capella', name: 'Capella', bayer: 'α Aur', constellation: 'Auriga', raHours: 5.2782, decDeg: 45.9980, magnitude: 0.08 },
  { id: 'aldebaran', name: 'Aldebaran', bayer: 'α Tau', constellation: 'Toro', raHours: 4.5987, decDeg: 16.5093, magnitude: 0.85 },
  { id: 'elnath', name: 'Elnath', bayer: 'β Tau', constellation: 'Toro', raHours: 5.4382, decDeg: 28.6075, magnitude: 1.65 },

  // Ariete / Pesci / Pegaso / Andromeda
  { id: 'hamal', name: 'Hamal', bayer: 'α Ari', constellation: 'Ariete', raHours: 2.1191, decDeg: 23.4624, magnitude: 2.01 },
  { id: 'alpheratz', name: 'Alpheratz', bayer: 'α And', constellation: 'Andromeda', raHours: 0.1398, decDeg: 29.0904, magnitude: 2.06 },
  { id: 'mirach', name: 'Mirach', bayer: 'β And', constellation: 'Andromeda', raHours: 1.1622, decDeg: 35.6206, magnitude: 2.06 },
  { id: 'almach', name: 'Almach', bayer: 'γ And', constellation: 'Andromeda', raHours: 2.0649, decDeg: 42.3297, magnitude: 2.17 },
  { id: 'markab', name: 'Markab', bayer: 'α Peg', constellation: 'Pegaso', raHours: 23.0793, decDeg: 15.2052, magnitude: 2.49 },
  { id: 'scheat', name: 'Scheat', bayer: 'β Peg', constellation: 'Pegaso', raHours: 23.0628, decDeg: 28.0828, magnitude: 2.42 },
  { id: 'algenib', name: 'Algenib', bayer: 'γ Peg', constellation: 'Pegaso', raHours: 0.2206, decDeg: 15.1836, magnitude: 2.83 },
  { id: 'enif', name: 'Enif', bayer: 'ε Peg', constellation: 'Pegaso', raHours: 21.7364, decDeg: 9.8750, magnitude: 2.40 },

  // Cassiopea / Perseo
  { id: 'caph', name: 'Caph', bayer: 'β Cas', constellation: 'Cassiopea', raHours: 0.1530, decDeg: 59.1498, magnitude: 2.27 },
  { id: 'schedar', name: 'Schedar', bayer: 'α Cas', constellation: 'Cassiopea', raHours: 0.6751, decDeg: 56.5374, magnitude: 2.23 },
  { id: 'gamma-cas', name: 'Tsih', bayer: 'γ Cas', constellation: 'Cassiopea', raHours: 0.9456, decDeg: 60.7165, magnitude: 2.39 },
  { id: 'ruchbah', name: 'Ruchbah', bayer: 'δ Cas', constellation: 'Cassiopea', raHours: 1.4302, decDeg: 60.2353, magnitude: 2.66 },
  { id: 'segin', name: 'Segin', bayer: 'ε Cas', constellation: 'Cassiopea', raHours: 1.9067, decDeg: 63.6701, magnitude: 3.35 },
  { id: 'mirfak', name: 'Mirfak', bayer: 'α Per', constellation: 'Perseo', raHours: 3.4054, decDeg: 49.8612, magnitude: 1.79 },
  { id: 'algol', name: 'Algol', bayer: 'β Per', constellation: 'Perseo', raHours: 3.1361, decDeg: 40.9557, magnitude: 2.12 },

  // Orsa Maggiore / Polare
  { id: 'dubhe', name: 'Dubhe', bayer: 'α UMa', constellation: 'Orsa Maggiore', raHours: 11.0623, decDeg: 61.7510, magnitude: 1.79 },
  { id: 'merak', name: 'Merak', bayer: 'β UMa', constellation: 'Orsa Maggiore', raHours: 11.0307, decDeg: 56.3825, magnitude: 2.34 },
  { id: 'phecda', name: 'Phecda', bayer: 'γ UMa', constellation: 'Orsa Maggiore', raHours: 11.8972, decDeg: 53.6948, magnitude: 2.41 },
  { id: 'megrez', name: 'Megrez', bayer: 'δ UMa', constellation: 'Orsa Maggiore', raHours: 12.2570, decDeg: 57.0326, magnitude: 3.31 },
  { id: 'alioth', name: 'Alioth', bayer: 'ε UMa', constellation: 'Orsa Maggiore', raHours: 12.9005, decDeg: 55.9598, magnitude: 1.76 },
  { id: 'mizar', name: 'Mizar', bayer: 'ζ UMa', constellation: 'Orsa Maggiore', raHours: 13.4199, decDeg: 54.9255, magnitude: 2.23 },
  { id: 'alkaid', name: 'Alkaid', bayer: 'η UMa', constellation: 'Orsa Maggiore', raHours: 13.7923, decDeg: 49.3133, magnitude: 1.85 },
  { id: 'polaris', name: 'Polare', bayer: 'α UMi', constellation: 'Orsa Minore', raHours: 2.5303, decDeg: 89.2641, magnitude: 1.97 },

  // Bootes / Vergine
  { id: 'arcturus', name: 'Arturo', bayer: 'α Boo', constellation: 'Boote', raHours: 14.2611, decDeg: 19.1825, magnitude: -0.05 },
  { id: 'spica', name: 'Spica', bayer: 'α Vir', constellation: 'Vergine', raHours: 13.4198, decDeg: -11.1614, magnitude: 1.04 },

  // Leone
  { id: 'regulus', name: 'Regolo', bayer: 'α Leo', constellation: 'Leone', raHours: 10.1395, decDeg: 11.9672, magnitude: 1.36 },
  { id: 'algieba', name: 'Algieba', bayer: 'γ Leo', constellation: 'Leone', raHours: 10.3328, decDeg: 19.8415, magnitude: 2.28 },
  { id: 'zosma', name: 'Zosma', bayer: 'δ Leo', constellation: 'Leone', raHours: 11.2351, decDeg: 20.5237, magnitude: 2.56 },
  { id: 'denebola', name: 'Denebola', bayer: 'β Leo', constellation: 'Leone', raHours: 11.8177, decDeg: 14.5719, magnitude: 2.14 },

  // Lira / Cigno / Aquila
  { id: 'vega', name: 'Vega', bayer: 'α Lyr', constellation: 'Lira', raHours: 18.6156, decDeg: 38.7837, magnitude: 0.03 },
  { id: 'sheliak', name: 'Sheliak', bayer: 'β Lyr', constellation: 'Lira', raHours: 18.8350, decDeg: 33.3627, magnitude: 3.52 },
  { id: 'sulafat', name: 'Sulafat', bayer: 'γ Lyr', constellation: 'Lira', raHours: 18.9826, decDeg: 32.6896, magnitude: 3.25 },
  { id: 'deneb', name: 'Deneb', bayer: 'α Cyg', constellation: 'Cigno', raHours: 20.6905, decDeg: 45.2803, magnitude: 1.25 },
  { id: 'sadr', name: 'Sadr', bayer: 'γ Cyg', constellation: 'Cigno', raHours: 20.3704, decDeg: 40.2567, magnitude: 2.23 },
  { id: 'albireo', name: 'Albireo', bayer: 'β Cyg', constellation: 'Cigno', raHours: 19.5121, decDeg: 27.9597, magnitude: 3.05 },
  { id: 'gienah-cyg', name: 'Gienah', bayer: 'ε Cyg', constellation: 'Cigno', raHours: 20.7702, decDeg: 33.9706, magnitude: 2.48 },
  { id: 'delta-cyg', name: 'Fawaris', bayer: 'δ Cyg', constellation: 'Cigno', raHours: 19.7493, decDeg: 45.1308, magnitude: 2.87 },
  { id: 'altair', name: 'Altair', bayer: 'α Aql', constellation: 'Aquila', raHours: 19.8463, decDeg: 8.8683, magnitude: 0.77 },

  // Scorpione / Sagittario / Pesce Australe
  { id: 'antares', name: 'Antares', bayer: 'α Sco', constellation: 'Scorpione', raHours: 16.4901, decDeg: -26.4320, magnitude: 1.09 },
  { id: 'shaula', name: 'Shaula', bayer: 'λ Sco', constellation: 'Scorpione', raHours: 17.5601, decDeg: -37.1038, magnitude: 1.62 },
  { id: 'fomalhaut', name: 'Fomalhaut', bayer: 'α PsA', constellation: 'Pesce Australe', raHours: 22.9609, decDeg: -29.6222, magnitude: 1.16 },
  { id: 'diphda', name: 'Diphda', bayer: 'β Cet', constellation: 'Balena', raHours: 0.7264, decDeg: -17.9866, magnitude: 2.04 },
];

export const STARS_BY_ID: Record<string, Star> = Object.fromEntries(
  STARS.map((s) => [s.id, s]),
);
