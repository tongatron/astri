import * as A from 'astronomy-engine';

export type NightlyWindow = {
  /** Local calendar date (midnight) for this night. */
  date: Date;
  /** When nautical twilight ends (sun < -12°). Null if sun never dips that low. */
  nightStart: Date | null;
  /** When nautical twilight begins again. Null if polar night / no data. */
  nightEnd: Date | null;
  /** Start of the window when the target is above minAltitude during night. */
  windowStart: Date | null;
  /** End of that window. */
  windowEnd: Date | null;
  /** Best altitude reached during the window (degrees). 0 if not visible. */
  peakAltitude: number;
  /** When the peak occurs. */
  peakTime: Date | null;
  /** Moon illumination fraction [0-1] at midnight. */
  moonIllumination: number;
  /** Score 0-100: higher = better observing conditions. */
  score: number;
};

const STEP_MIN = 20;
const STEP_MS = STEP_MIN * 60_000;

function sunAltitude(t: Date, observer: A.Observer): number {
  const equ = A.Equator(A.Body.Sun, t, observer, true, true);
  return A.Horizon(t, observer, equ.ra, equ.dec, 'normal').altitude;
}

function bodyAltitude(body: A.Body, t: Date, observer: A.Observer): number {
  const equ = A.Equator(body, t, observer, true, true);
  return A.Horizon(t, observer, equ.ra, equ.dec, 'normal').altitude;
}

/**
 * Compute per-night observing windows for `body` over `days` nights starting
 * from `from` (rounded to local midnight of that day).
 *
 * The window is the contiguous block of time when:
 *   - sun altitude < -12° (nautical twilight)
 *   - body altitude > minAltitudeDeg
 *
 * Only the longest such block is returned per night.
 */
export function planObservingWindows(
  body: A.Body,
  observer: A.Observer,
  from: Date,
  days = 30,
  minAltitudeDeg = 15,
): NightlyWindow[] {
  const results: NightlyWindow[] = [];

  for (let d = 0; d < days; d++) {
    const dayStart = new Date(from);
    dayStart.setDate(dayStart.getDate() + d);
    dayStart.setHours(0, 0, 0, 0);

    // Sample from 16:00 to 10:00 next day (covers any night globally)
    const scanStart = new Date(dayStart.getTime() + 16 * 3600_000);
    const scanEnd = new Date(dayStart.getTime() + 34 * 3600_000);

    const samples: { t: Date; sunAlt: number; bodyAlt: number }[] = [];
    for (let t = scanStart.getTime(); t <= scanEnd.getTime(); t += STEP_MS) {
      const dt = new Date(t);
      samples.push({
        t: dt,
        sunAlt: sunAltitude(dt, observer),
        bodyAlt: bodyAltitude(body, dt, observer),
      });
    }

    // Nautical night window
    const nightSamples = samples.filter((s) => s.sunAlt < -12);
    const nightStart = nightSamples.length > 0 ? nightSamples[0].t : null;
    const nightEnd =
      nightSamples.length > 0 ? nightSamples[nightSamples.length - 1].t : null;

    // Visible samples: inside night AND above minAlt
    const visibleSamples = nightSamples.filter(
      (s) => s.bodyAlt >= minAltitudeDeg,
    );

    let windowStart: Date | null = null;
    let windowEnd: Date | null = null;
    let peakAltitude = 0;
    let peakTime: Date | null = null;

    if (visibleSamples.length > 0) {
      windowStart = visibleSamples[0].t;
      windowEnd = visibleSamples[visibleSamples.length - 1].t;
      const best = visibleSamples.reduce((a, b) =>
        b.bodyAlt > a.bodyAlt ? b : a,
      );
      peakAltitude = best.bodyAlt;
      peakTime = best.t;
    }

    // Moon illumination at local midnight
    const midnight = new Date(dayStart.getTime() + 24 * 3600_000);
    const moonIllum = A.Illumination(A.Body.Moon, midnight).phase_fraction;

    // Score: peak alt (max 60 pts) + moon darkness (max 40 pts)
    const altScore = Math.min(60, (peakAltitude / 90) * 60);
    const moonScore = (1 - moonIllum) * 40;
    const score = windowStart ? Math.round(altScore + moonScore) : 0;

    results.push({
      date: dayStart,
      nightStart,
      nightEnd,
      windowStart,
      windowEnd,
      peakAltitude,
      peakTime,
      moonIllumination: moonIllum,
      score,
    });
  }

  return results;
}
