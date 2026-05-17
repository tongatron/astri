import {
  twoline2satrec,
  propagate,
  gstime,
  eciToEcf,
  ecfToLookAngles,
  degreesLong,
  degreesLat,
  type EciVec3,
} from 'satellite.js';

export type TLE = { name: string; line1: string; line2: string };

export type ISSPosition = {
  /** Altitude above horizon in degrees. */
  altitude: number;
  /** Azimuth from North, clockwise, in degrees. */
  azimuth: number;
  /** Slant range observer→satellite in kilometers. */
  rangeKm: number;
  /** Sub-satellite point latitude in degrees. */
  subLat: number;
  /** Sub-satellite point longitude in degrees. */
  subLon: number;
  /** Satellite height above mean sea level in kilometers. */
  heightKm: number;
};

/** NORAD catalog id for the International Space Station. */
export const ISS_NORAD_ID = 25544;

const CELESTRAK_URL = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${ISS_NORAD_ID}&FORMAT=TLE`;

/**
 * Fetch the latest ISS TLE from Celestrak. CORS-friendly, no API key.
 *
 * Throws on HTTP/parse failures so the caller can degrade gracefully.
 */
export async function fetchISSTLE(signal?: AbortSignal): Promise<TLE> {
  const res = await fetch(CELESTRAK_URL, { signal });
  if (!res.ok) throw new Error(`Celestrak HTTP ${res.status}`);
  const text = await res.text();
  return parseTLE(text);
}

/** Parse a 3-line TLE block (name + line1 + line2). */
export function parseTLE(text: string): TLE {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 3) throw new Error('TLE incompleto (servono 3 righe)');
  const [name, line1, line2] = lines;
  if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
    throw new Error('TLE malformato (line1 / line2)');
  }
  return { name, line1, line2 };
}

/**
 * Propagate a TLE to the given Date and compute the observer-relative
 * topocentric position. Returns null if propagation fails (e.g. decayed
 * satellite or TLE too far from epoch).
 */
export function issPosition(
  tle: TLE,
  date: Date,
  observerLatDeg: number,
  observerLonDeg: number,
  observerHeightKm = 0,
): ISSPosition | null {
  const satrec = twoline2satrec(tle.line1, tle.line2);
  const posvel = propagate(satrec, date);
  if (
    !posvel ||
    typeof posvel.position !== 'object' ||
    posvel.position === null ||
    typeof posvel.position === 'boolean'
  ) {
    return null;
  }
  const positionEci = posvel.position as EciVec3<number>;
  const gmst = gstime(date);
  const positionEcf = eciToEcf(positionEci, gmst);
  const observerGd = {
    longitude: (observerLonDeg * Math.PI) / 180,
    latitude: (observerLatDeg * Math.PI) / 180,
    height: observerHeightKm,
  };
  const look = ecfToLookAngles(observerGd, positionEcf);
  const altitude = (look.elevation * 180) / Math.PI;
  let azimuth = (look.azimuth * 180) / Math.PI;
  if (azimuth < 0) azimuth += 360;

  // Sub-satellite point (geodetic) — derived from ECF via satellite.js.
  // For simplicity we compute from ECI using the same gmst.
  const geo = {
    longitude: degreesLong(
      Math.atan2(positionEcf.y, positionEcf.x),
    ),
    latitude: degreesLat(
      Math.atan2(
        positionEcf.z,
        Math.sqrt(positionEcf.x ** 2 + positionEcf.y ** 2),
      ),
    ),
  };
  const r = Math.sqrt(
    positionEcf.x ** 2 + positionEcf.y ** 2 + positionEcf.z ** 2,
  );
  const heightKm = r - 6378.137;

  return {
    altitude,
    azimuth,
    rangeKm: look.rangeSat,
    subLat: geo.latitude,
    subLon: geo.longitude,
    heightKm,
  };
}

export type ISSPass = {
  /** When the ISS rises above minElevationDeg. */
  riseTime: Date;
  /** When the ISS sets below minElevationDeg. */
  setTime: Date;
  /** Time of maximum elevation during this pass. */
  peakTime: Date;
  /** Maximum elevation in degrees. */
  peakAltitude: number;
  /** Azimuth at peak, degrees from North clockwise. */
  peakAzimuth: number;
  /** Pass duration in seconds. */
  durationSec: number;
};

/**
 * Scan [windowStart, windowEnd] at 1-minute intervals and return all ISS
 * passes where the satellite rises above `minElevationDeg`. Gaps shorter than
 * 1 minute between two above-horizon samples are bridged (i.e. treated as a
 * single pass).
 */
export function computeISSPasses(
  tle: TLE,
  observerLatDeg: number,
  observerLonDeg: number,
  windowStart: Date,
  windowEnd: Date,
  minElevationDeg = 10,
): ISSPass[] {
  const STEP_MS = 60_000;
  const passes: ISSPass[] = [];

  let inPass = false;
  let samples: { t: Date; alt: number; az: number }[] = [];

  const flush = () => {
    if (samples.length === 0) return;
    const best = samples.reduce((a, b) => (b.alt > a.alt ? b : a));
    passes.push({
      riseTime: samples[0].t,
      setTime: samples[samples.length - 1].t,
      peakTime: best.t,
      peakAltitude: best.alt,
      peakAzimuth: best.az,
      durationSec:
        (samples[samples.length - 1].t.getTime() - samples[0].t.getTime()) /
        1_000,
    });
    samples = [];
  };

  for (
    let ms = windowStart.getTime();
    ms <= windowEnd.getTime();
    ms += STEP_MS
  ) {
    const dt = new Date(ms);
    const pos = issPosition(tle, dt, observerLatDeg, observerLonDeg, 0);
    const alt = pos?.altitude ?? -90;
    const az = pos?.azimuth ?? 0;

    if (alt >= minElevationDeg) {
      inPass = true;
      samples.push({ t: dt, alt, az });
    } else if (inPass) {
      flush();
      inPass = false;
    }
  }
  if (inPass) flush();

  return passes;
}
