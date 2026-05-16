import * as A from 'astronomy-engine';

export type SunState = {
  altitude: number; // degrees above horizon (negative = below)
  azimuth: number; // degrees, 0 = N, clockwise
  rightAscension: number; // hours
  declination: number; // degrees
  distance: number; // AU
  rise: Date | null;
  set: Date | null;
  transit: Date | null;
  dayLengthMs: number | null;
};

/**
 * Compute Sun position and the rise/set/transit pair most relevant to `at`.
 * Strategy: search starting 12h before `at` for the next rise, then the
 * first set after that rise. Returns nulls in polar day/night.
 */
export function sunState(at: Date, observer: A.Observer): SunState {
  const equ = A.Equator(A.Body.Sun, at, observer, true, true);
  const hor = A.Horizon(at, observer, equ.ra, equ.dec, 'normal');

  const start = new Date(at.getTime() - 12 * 3600_000);
  const rise = A.SearchRiseSet(A.Body.Sun, observer, +1, start, 2);
  const set = rise
    ? A.SearchRiseSet(A.Body.Sun, observer, -1, rise.date, 2)
    : A.SearchRiseSet(A.Body.Sun, observer, -1, start, 2);
  const transit = A.SearchHourAngle(A.Body.Sun, observer, 0, start);

  const dayLengthMs =
    rise && set ? set.date.getTime() - rise.date.getTime() : null;

  return {
    altitude: hor.altitude,
    azimuth: hor.azimuth,
    rightAscension: equ.ra,
    declination: equ.dec,
    distance: equ.dist,
    rise: rise?.date ?? null,
    set: set?.date ?? null,
    transit: transit?.time.date ?? null,
    dayLengthMs,
  };
}

/** Sample sun altitude every `stepMin` minutes over `hours` starting at `from`. */
export function sunTrajectory(
  from: Date,
  observer: A.Observer,
  stepMin = 10,
  hours = 24,
): { t: Date; altitude: number; azimuth: number }[] {
  const out: { t: Date; altitude: number; azimuth: number }[] = [];
  const stepMs = stepMin * 60_000;
  for (let i = 0; i <= (hours * 60) / stepMin; i++) {
    const t = new Date(from.getTime() + i * stepMs);
    const equ = A.Equator(A.Body.Sun, t, observer, true, true);
    const hor = A.Horizon(t, observer, equ.ra, equ.dec, 'normal');
    out.push({ t, altitude: hor.altitude, azimuth: hor.azimuth });
  }
  return out;
}
