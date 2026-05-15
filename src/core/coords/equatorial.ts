import * as A from 'astronomy-engine';

const OBLIQUITY_DEG = 23.4392911; // J2000 mean obliquity of the ecliptic

/**
 * Convert J2000 equatorial coordinates (RA in hours, Dec in degrees) to
 * local horizontal coordinates at the given date and observer.
 * Precession between J2000 and the displayed date is ignored — error is
 * sub-arcminute over decades, irrelevant for the 3D visualisation.
 */
export function equatorialToHorizontal(
  raHours: number,
  decDeg: number,
  date: Date,
  observer: A.Observer,
): { altitude: number; azimuth: number } {
  const hor = A.Horizon(date, observer, raHours, decDeg, 'normal');
  return { altitude: hor.altitude, azimuth: hor.azimuth };
}

/**
 * Convert ecliptic longitude (degrees, latitude = 0) to J2000 equatorial
 * coordinates. Used for drawing the ecliptic great circle.
 */
export function eclipticLongitudeToEquatorial(longitudeDeg: number): {
  raHours: number;
  decDeg: number;
} {
  const eps = (OBLIQUITY_DEG * Math.PI) / 180;
  const lon = (longitudeDeg * Math.PI) / 180;
  const ra = Math.atan2(Math.sin(lon) * Math.cos(eps), Math.cos(lon));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lon));
  let raHours = (ra * 12) / Math.PI;
  if (raHours < 0) raHours += 24;
  return { raHours, decDeg: (dec * 180) / Math.PI };
}
