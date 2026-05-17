import { LIGHT_SOURCES } from '@/data/light-pollution-cities';

const EARTH_R_KM = 6371;

/** Great-circle distance, km. */
function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R_KM * Math.asin(Math.sqrt(a));
}

export type BortleEstimate = {
  /** Bortle class 1-9 (1 = pristine, 9 = inner city). */
  class: number;
  /** Italian label. */
  label: string;
  /** Short description. */
  description: string;
  /** Nearest dominant light source (for explanation). */
  nearest: { name: string; km: number } | null;
  /** Sky-glow index (raw weighted sum, log scale). */
  index: number;
};

/**
 * Walker-law inspired estimate: skyglow contribution from each city falls as
 * population × distance^(-2.5). Sum across sources, then map to Bortle.
 *
 * Calibrated so that:
 *  - Centre of Rome/Milan → class 8-9
 *  - Hinterland 30km → class 5-6
 *  - Rural 80km from nearest >100k → class 3-4
 *  - 200km+ from any major source → class 1-2
 *
 * Not a substitute for VIIRS/Falchi atlas; useful as a planning hint.
 */
export function estimateBortle(lat: number, lon: number): BortleEstimate {
  let sum = 0;
  let nearest: { name: string; km: number; weight: number } | null = null;

  for (const c of LIGHT_SOURCES) {
    const d = Math.max(0.5, haversineKm(lat, lon, c.lat, c.lon));
    const contribution = c.pop / Math.pow(d, 2.15);
    sum += contribution;
    if (!nearest || contribution > nearest.weight) {
      nearest = { name: c.name, km: d, weight: contribution };
    }
  }

  // Map log10(sum+1) to a Bortle class. Empirically:
  //   sum≈3000  (Rome centre)  → log≈3.5  → class 9
  //   sum≈100                  → log≈2    → class 7
  //   sum≈10                   → log≈1    → class 5
  //   sum≈1                    → log≈0.3  → class 3
  //   sum<0.2                  → log≈0.08 → class 1-2
  const logS = Math.log10(sum + 1);
  // Linear interpolation pieces
  let cls: number;
  if (logS >= 3.4) cls = 9;
  else if (logS >= 2.8) cls = 8;
  else if (logS >= 2.2) cls = 7;
  else if (logS >= 1.6) cls = 6;
  else if (logS >= 1.0) cls = 5;
  else if (logS >= 0.55) cls = 4;
  else if (logS >= 0.25) cls = 3;
  else if (logS >= 0.1) cls = 2;
  else cls = 1;

  return {
    class: cls,
    label: BORTLE_LABELS[cls - 1],
    description: BORTLE_DESC[cls - 1],
    nearest: nearest
      ? { name: nearest.name, km: Math.round(nearest.km) }
      : null,
    index: Math.round(sum * 10) / 10,
  };
}

const BORTLE_LABELS = [
  'Cielo eccellente',
  'Cielo tipico rurale',
  'Cielo rurale',
  'Transizione rurale-suburbano',
  'Cielo suburbano',
  'Suburbano luminoso',
  'Transizione suburbano-urbano',
  'Cielo urbano',
  'Centro città',
] as const;

const BORTLE_DESC = [
  'Via Lattea ricca di dettagli, luminescenza zodiacale visibile.',
  'Via Lattea molto strutturata, M31 nettamente visibile.',
  'Via Lattea ben visibile, alone galattico evidente.',
  'Via Lattea ancora visibile, struttura ridotta verso l\'orizzonte.',
  'Via Lattea debole allo zenit, perde dettaglio sotto i 30°.',
  'Via Lattea appena percettibile, colore del cielo grigio chiaro.',
  'Cielo perennemente illuminato, Via Lattea non visibile.',
  'Solo pianeti e stelle più brillanti.',
  'Cielo arancione, poche stelle visibili anche allo zenit.',
] as const;

/**
 * Quality penalty (0-30) applied to observation score based on Bortle class.
 * Mirrors cloud-cover penalty in TonightReport.
 */
export function bortlePenalty(cls: number): number {
  // class 1 → 0 penalty, class 9 → 30 penalty
  return Math.round(((cls - 1) / 8) * 30);
}
