import * as A from 'astronomy-engine';

export type PlanetState = {
  key: string;
  name: string;
  body: A.Body;
  altitude: number;
  azimuth: number;
  rightAscension: number;
  declination: number;
  magnitude: number;
  distanceKm: number;
  elongation: number;
  rise: Date | null;
  set: Date | null;
  transit: Date | null;
  instrument: 'occhio nudo' | 'binocolo/telescopio';
};

const PLANETS: {
  key: string;
  name: string;
  body: A.Body;
  instrument: PlanetState['instrument'];
}[] = [
  { key: 'mercury', name: 'Mercurio', body: A.Body.Mercury, instrument: 'occhio nudo' },
  { key: 'venus', name: 'Venere', body: A.Body.Venus, instrument: 'occhio nudo' },
  { key: 'mars', name: 'Marte', body: A.Body.Mars, instrument: 'occhio nudo' },
  { key: 'jupiter', name: 'Giove', body: A.Body.Jupiter, instrument: 'occhio nudo' },
  { key: 'saturn', name: 'Saturno', body: A.Body.Saturn, instrument: 'occhio nudo' },
  { key: 'uranus', name: 'Urano', body: A.Body.Uranus, instrument: 'binocolo/telescopio' },
  { key: 'neptune', name: 'Nettuno', body: A.Body.Neptune, instrument: 'binocolo/telescopio' },
];

export function planetState(
  planet: (typeof PLANETS)[number],
  at: Date,
  observer: A.Observer,
): PlanetState {
  const equ = A.Equator(planet.body, at, observer, true, true);
  const hor = A.Horizon(at, observer, equ.ra, equ.dec, 'normal');
  const illumination = A.Illumination(planet.body, at);
  const start = new Date(at.getTime() - 12 * 3600_000);
  const rise = A.SearchRiseSet(planet.body, observer, +1, start, 2);
  const set = rise
    ? A.SearchRiseSet(planet.body, observer, -1, rise.date, 2)
    : A.SearchRiseSet(planet.body, observer, -1, start, 2);
  const transit = A.SearchHourAngle(planet.body, observer, 0, start);

  return {
    key: planet.key,
    name: planet.name,
    body: planet.body,
    altitude: hor.altitude,
    azimuth: hor.azimuth,
    rightAscension: equ.ra,
    declination: equ.dec,
    magnitude: illumination.mag,
    distanceKm: illumination.geo_dist * A.KM_PER_AU,
    elongation: A.AngleFromSun(planet.body, at),
    rise: rise?.date ?? null,
    set: set?.date ?? null,
    transit: transit?.time.date ?? null,
    instrument: planet.instrument,
  };
}

export function planetStates(at: Date, observer: A.Observer): PlanetState[] {
  return PLANETS.map((planet) => planetState(planet, at, observer)).sort(
    (a, b) => {
      if (a.altitude >= 0 && b.altitude < 0) return -1;
      if (a.altitude < 0 && b.altitude >= 0) return 1;
      return b.altitude - a.altitude;
    },
  );
}
