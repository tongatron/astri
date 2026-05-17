/**
 * NOAA Space Weather Prediction Center (SWPC) — aurora data.
 *
 * Endpoints used:
 *  - Current Kp (1-minute estimated): /products/noaa-planetary-k-index.json
 *    Returns 7 days of 3-hourly Kp values, last row = most recent.
 *  - 3-day Kp forecast: /products/noaa-planetary-k-index-forecast.json
 *    3-hourly forecast Kp for the next 3 days.
 *
 * All endpoints are CORS-friendly and don't require auth.
 */

/**
 * Combined endpoint: contains both recently observed Kp (last ~7 days) and
 * predicted Kp (next ~3 days), every 3 hours. Each row tags itself as
 * "observed" or "predicted".
 */
const KP_FORECAST_URL =
  'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json';

type SwpcRow = {
  time_tag: string;
  kp: number;
  observed: 'observed' | 'predicted';
};

export type KpSample = {
  /** Timestamp (UTC) of the 3-hour Kp interval start. */
  t: Date;
  /** Kp index 0-9 (continuous, may be fractional in forecast). */
  kp: number;
  /** Whether this sample is observed (true) or predicted (false). */
  observed: boolean;
};

export type AuroraForecast = {
  /** Most recent observed Kp. */
  currentKp: number;
  currentAt: Date;
  /** Predicted Kp series for next ~3 days, 3-hourly. */
  forecast: KpSample[];
  /** Maximum Kp expected in the next 24 hours. */
  peak24h: { kp: number; at: Date } | null;
  /** Maximum Kp expected in the next 72 hours. */
  peak72h: { kp: number; at: Date } | null;
};

function parseRow(row: SwpcRow): KpSample | null {
  if (!row || typeof row.kp !== 'number' || !Number.isFinite(row.kp)) return null;
  // Format: "2026-05-17T18:00:00" — implicit UTC
  const t = new Date(row.time_tag.includes('Z') ? row.time_tag : row.time_tag + 'Z');
  if (Number.isNaN(t.getTime())) return null;
  return { t, kp: row.kp, observed: row.observed === 'observed' };
}

export async function fetchAuroraForecast(signal?: AbortSignal): Promise<AuroraForecast> {
  const resp = await fetch(KP_FORECAST_URL, { signal });
  if (!resp.ok) throw new Error(`SWPC ${resp.status}`);
  const raw = (await resp.json()) as SwpcRow[];
  const samples = raw.map(parseRow).filter((s): s is KpSample => s !== null);
  if (samples.length === 0) throw new Error('SWPC dati vuoti');

  // Most recent observed sample = "current Kp"
  const observed = samples.filter((s) => s.observed);
  const latest = observed[observed.length - 1] ?? samples[samples.length - 1];

  const now = Date.now();
  const in24h = now + 24 * 3600_000;
  const in72h = now + 72 * 3600_000;

  const peakIn = (until: number) => {
    let best: KpSample | null = null;
    for (const s of samples) {
      const t = s.t.getTime();
      if (t < now || t > until) continue;
      if (!best || s.kp > best.kp) best = s;
    }
    return best ? { kp: best.kp, at: best.t } : null;
  };

  return {
    currentKp: latest.kp,
    currentAt: latest.t,
    forecast: samples.filter((s) => !s.observed),
    peak24h: peakIn(in24h),
    peak72h: peakIn(in72h),
  };
}

/**
 * Geomagnetic-latitude approximation for European longitudes.
 * The geomagnetic North pole sits at ~80.7°N, 72°W. For Europe (lon ~0-30°E),
 * geomagnetic latitude is roughly geographic latitude minus 3-6°. We use a
 * simple linear correction; for North America it would be the opposite.
 *
 * For our purposes (visibility threshold ± a few degrees) this is adequate.
 */
function approxGeomagLatitude(lat: number, lon: number): number {
  // Geomagnetic north pole (IGRF 2020 approximation): 80.7°N, 72.7°W.
  const poleLat = 80.7;
  const poleLon = -72.7;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const cosColat =
    Math.sin(toRad(lat)) * Math.sin(toRad(poleLat)) +
    Math.cos(toRad(lat)) * Math.cos(toRad(poleLat)) * Math.cos(toRad(lon - poleLon));
  const colat = toDeg(Math.acos(Math.max(-1, Math.min(1, cosColat))));
  return 90 - colat;
}

export type AuroraVisibility = {
  /** Equatorward boundary of the auroral oval, in geomagnetic degrees. */
  ovalBoundary: number;
  /** Observer geomagnetic latitude. */
  observerGeomag: number;
  /** Verdict label. */
  label:
    | 'overhead'
    | 'low-north'
    | 'horizon-glow'
    | 'unlikely';
  /** Italian human-readable description. */
  description: string;
};

/**
 * Auroral oval southern boundary (geomagnetic latitude, degrees north) as a
 * function of Kp. Empirical formula from Akasofu / NOAA SWPC guidance:
 *   boundary ≈ 67° - 2° × Kp
 * (Kp=0 → 67°N, Kp=9 → 49°N geomagnetic.)
 *
 * Visibility verdicts:
 *  - observerGeomag ≥ boundary       → "overhead" (likely directly overhead)
 *  - boundary - 4 ≤ obs < boundary    → "low-north" (visible low on N horizon)
 *  - boundary - 8 ≤ obs < boundary-4 → "horizon-glow" (faint glow near N horizon)
 *  - otherwise                        → "unlikely"
 */
export function auroraVisibility(
  kp: number,
  lat: number,
  lon: number,
): AuroraVisibility {
  const boundary = 67 - 2 * Math.max(0, kp);
  const geomag = approxGeomagLatitude(lat, lon);
  const delta = geomag - boundary;

  let label: AuroraVisibility['label'];
  let description: string;
  if (delta >= 0) {
    label = 'overhead';
    description = 'Aurora probabilmente visibile direttamente sopra la testa.';
  } else if (delta >= -4) {
    label = 'low-north';
    description = 'Aurora visibile bassa sull\'orizzonte nord.';
  } else if (delta >= -8) {
    label = 'horizon-glow';
    description = 'Possibile bagliore tenue sull\'orizzonte nord (cielo molto buio richiesto).';
  } else {
    label = 'unlikely';
    description = 'Aurora improbabile da questa latitudine con il Kp attuale.';
  }

  return {
    ovalBoundary: boundary,
    observerGeomag: geomag,
    label,
    description,
  };
}

/** Italian short label for a Kp value, à la SWPC G-scale. */
export function kpLabel(kp: number): string {
  if (kp < 4) return 'Calmo';
  if (kp < 5) return 'Attivo';
  if (kp < 6) return 'Tempesta lieve (G1)';
  if (kp < 7) return 'Tempesta moderata (G2)';
  if (kp < 8) return 'Tempesta forte (G3)';
  if (kp < 9) return 'Tempesta severa (G4)';
  return 'Tempesta estrema (G5)';
}
