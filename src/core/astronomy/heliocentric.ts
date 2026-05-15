import * as A from 'astronomy-engine';

export type HelioBodyKey =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

export type HelioBodyMeta = {
  key: HelioBodyKey;
  name: string;
  body: A.Body;
  orbitalPeriodDays: number;
  color: string;
  visualRadius: number;
};

export const HELIO_BODIES: HelioBodyMeta[] = [
  { key: 'mercury', name: 'Mercurio', body: A.Body.Mercury, orbitalPeriodDays: 87.97, color: '#c0a779', visualRadius: 0.05 },
  { key: 'venus', name: 'Venere', body: A.Body.Venus, orbitalPeriodDays: 224.7, color: '#f3d8a7', visualRadius: 0.07 },
  { key: 'earth', name: 'Terra', body: A.Body.Earth, orbitalPeriodDays: 365.25, color: '#6f9bd8', visualRadius: 0.07 },
  { key: 'mars', name: 'Marte', body: A.Body.Mars, orbitalPeriodDays: 686.97, color: '#d96b4a', visualRadius: 0.06 },
  { key: 'jupiter', name: 'Giove', body: A.Body.Jupiter, orbitalPeriodDays: 4332.59, color: '#d6c5a4', visualRadius: 0.16 },
  { key: 'saturn', name: 'Saturno', body: A.Body.Saturn, orbitalPeriodDays: 10759.22, color: '#e9d99c', visualRadius: 0.14 },
  { key: 'uranus', name: 'Urano', body: A.Body.Uranus, orbitalPeriodDays: 30688.5, color: '#9ed7d4', visualRadius: 0.1 },
  { key: 'neptune', name: 'Nettuno', body: A.Body.Neptune, orbitalPeriodDays: 60182.0, color: '#6f8ed8', visualRadius: 0.1 },
];

export type HelioPosition = {
  x: number;
  y: number;
  z: number;
  distanceAu: number;
};

/**
 * Heliocentric ecliptic position (J2000) of a body at the given date, in AU.
 * Returned tuple is ready to drop into a three.js scene where the ecliptic
 * plane lies in xz (x→x, y→z), with y as the small out-of-plane component.
 */
export function helioPosition(body: A.Body, date: Date): HelioPosition {
  const v = A.HelioVector(body, date);
  return {
    x: v.x,
    y: v.z,
    z: v.y,
    distanceAu: Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),
  };
}

/**
 * Sample a body's orbit by walking one full orbital period backward from
 * `endDate` in `samples` evenly-spaced steps.
 */
export function helioTrajectory(
  meta: HelioBodyMeta,
  endDate: Date,
  samples = 96,
): HelioPosition[] {
  const stepMs = (meta.orbitalPeriodDays * 86_400_000) / samples;
  const out: HelioPosition[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = new Date(endDate.getTime() - (samples - i) * stepMs);
    out.push(helioPosition(meta.body, t));
  }
  return out;
}
