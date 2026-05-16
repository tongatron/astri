import * as A from 'astronomy-engine';

export type PlanetEventKind =
  | 'opposition'
  | 'max-elongation-morning'
  | 'max-elongation-evening';

export type EventCategory =
  | 'planet'
  | 'season'
  | 'lunar-eclipse'
  | 'solar-eclipse'
  | 'meteor-shower';

export type AstroEvent = {
  key: string;
  category: EventCategory;
  label: string;
  at: Date;
  detail: string;
  /** Optional planet/body name for category 'planet'. */
  body?: A.Body;
  planetName?: string;
  planetKind?: PlanetEventKind;
  /** Eclipse kind, when applicable. */
  eclipseKind?: A.EclipseKind;
  /** Whether the event is generally visible at the given latitude (rough filter). */
  visibleAt?: (latitudeDeg: number) => boolean;
};

/** Backwards-compatible alias for the existing planets-only API. */
export type PlanetEvent = AstroEvent & {
  category: 'planet';
  planetName: string;
  planetKind: PlanetEventKind;
  /** @deprecated use planetKind */
  kind?: PlanetEventKind;
};

const INNER = [
  { body: A.Body.Mercury, name: 'Mercurio' },
  { body: A.Body.Venus, name: 'Venere' },
];

const OUTER = [
  { body: A.Body.Mars, name: 'Marte' },
  { body: A.Body.Jupiter, name: 'Giove' },
  { body: A.Body.Saturn, name: 'Saturno' },
  { body: A.Body.Uranus, name: 'Urano' },
  { body: A.Body.Neptune, name: 'Nettuno' },
];

function planetEvents(from: Date, horizon: Date): AstroEvent[] {
  const out: AstroEvent[] = [];

  for (const planet of INNER) {
    let cursor = from;
    for (let i = 0; i < 8; i++) {
      const ev = A.SearchMaxElongation(planet.body, cursor);
      const at = ev.time.date;
      if (at >= horizon) break;
      const evening = ev.visibility === 'evening';
      const kind: PlanetEventKind = evening
        ? 'max-elongation-evening'
        : 'max-elongation-morning';
      out.push({
        key: `${planet.name}-elong-${at.toISOString()}`,
        category: 'planet',
        body: planet.body,
        planetName: planet.name,
        planetKind: kind,
        label: `Massima elongazione di ${planet.name}`,
        at,
        detail: `${ev.elongation.toFixed(1)}° dal Sole, visibile ${evening ? 'di sera' : 'di mattina'}`,
      });
      cursor = new Date(at.getTime() + 5 * 86_400_000);
    }
  }

  for (const planet of OUTER) {
    let cursor = from;
    for (let i = 0; i < 4; i++) {
      const time = A.SearchRelativeLongitude(planet.body, 0, cursor);
      const at = time.date;
      if (at >= horizon) break;
      out.push({
        key: `${planet.name}-opp-${at.toISOString()}`,
        category: 'planet',
        body: planet.body,
        planetName: planet.name,
        planetKind: 'opposition',
        label: `Opposizione di ${planet.name}`,
        at,
        detail: 'Pianeta visibile tutta la notte, vicino alla massima luminosità',
      });
      cursor = new Date(at.getTime() + 30 * 86_400_000);
    }
  }

  return out;
}

function seasonEvents(from: Date, horizon: Date): AstroEvent[] {
  const out: AstroEvent[] = [];
  const startYear = from.getUTCFullYear();
  const endYear = horizon.getUTCFullYear();
  for (let y = startYear; y <= endYear; y++) {
    const s = A.Seasons(y);
    const items: Array<{ at: Date; label: string; detail: string; key: string }> = [
      {
        at: s.mar_equinox.date,
        label: 'Equinozio di primavera',
        detail: 'Giorno e notte di uguale durata; Sole attraversa l\'equatore celeste verso nord',
        key: `equinox-mar-${y}`,
      },
      {
        at: s.jun_solstice.date,
        label: 'Solstizio d\'estate',
        detail: 'Giorno più lungo dell\'anno nell\'emisfero nord; Sole alla massima declinazione',
        key: `solstice-jun-${y}`,
      },
      {
        at: s.sep_equinox.date,
        label: 'Equinozio d\'autunno',
        detail: 'Giorno e notte di uguale durata; Sole attraversa l\'equatore celeste verso sud',
        key: `equinox-sep-${y}`,
      },
      {
        at: s.dec_solstice.date,
        label: 'Solstizio d\'inverno',
        detail: 'Giorno più corto dell\'anno nell\'emisfero nord; Sole alla minima declinazione',
        key: `solstice-dec-${y}`,
      },
    ];
    for (const it of items) {
      out.push({ ...it, category: 'season' });
    }
  }
  return out;
}

function eclipseKindLabel(kind: A.EclipseKind): string {
  switch (kind) {
    case 'penumbral':
      return 'penombrale';
    case 'partial':
      return 'parziale';
    case 'total':
      return 'totale';
    case 'annular':
      return 'anulare';
    default:
      return String(kind);
  }
}

function lunarEclipses(from: Date, horizon: Date): AstroEvent[] {
  const out: AstroEvent[] = [];
  let ev: A.LunarEclipseInfo | null = A.SearchLunarEclipse(from);
  for (let i = 0; i < 12 && ev; i++) {
    const at = ev.peak.date;
    if (at >= horizon) break;
    if (at >= from) {
      const kindLabel = eclipseKindLabel(ev.kind);
      out.push({
        key: `lunar-eclipse-${at.toISOString()}`,
        category: 'lunar-eclipse',
        eclipseKind: ev.kind,
        label: `Eclissi lunare ${kindLabel}`,
        at,
        detail: `Oscuramento ${(ev.obscuration * 100).toFixed(0)}%, durata penombra ${(ev.sd_penum * 2).toFixed(0)} min`,
        // Lunar eclipses are visible wherever the Moon is above the horizon at peak — keep simple.
      });
    }
    ev = A.NextLunarEclipse(ev.peak);
  }
  return out;
}

function solarEclipses(from: Date, horizon: Date): AstroEvent[] {
  const out: AstroEvent[] = [];
  let ev: A.GlobalSolarEclipseInfo | null = A.SearchGlobalSolarEclipse(from);
  for (let i = 0; i < 12 && ev; i++) {
    const at = ev.peak.date;
    if (at >= horizon) break;
    if (at >= from) {
      const kindLabel = eclipseKindLabel(ev.kind);
      const where =
        ev.latitude !== undefined && ev.longitude !== undefined
          ? `picco a ${ev.latitude.toFixed(1)}°, ${ev.longitude.toFixed(1)}°`
          : 'visibile come parziale da ampie regioni';
      out.push({
        key: `solar-eclipse-${at.toISOString()}`,
        category: 'solar-eclipse',
        eclipseKind: ev.kind,
        label: `Eclissi solare ${kindLabel}`,
        at,
        detail: where,
        visibleAt: (lat) => {
          // Very rough: a solar eclipse is potentially visible (as partial) within ~50° of the peak latitude.
          if (ev!.latitude === undefined) return true;
          return Math.abs(lat - ev!.latitude) < 60;
        },
      });
    }
    ev = A.NextGlobalSolarEclipse(ev.peak);
  }
  return out;
}

type MeteorShower = {
  id: string;
  name: string;
  peakMonth: number; // 1-12
  peakDay: number;
  radiantDec: number; // approx, degrees
  detail: string;
};

const SHOWERS: MeteorShower[] = [
  { id: 'qua', name: 'Quadrantidi', peakMonth: 1, peakDay: 4, radiantDec: 49, detail: 'Picco breve e intenso (~120 meteore/h), radiante in Boote' },
  { id: 'lyr', name: 'Liridi', peakMonth: 4, peakDay: 22, radiantDec: 34, detail: 'Tasso moderato (~18 meteore/h), radiante in Lira' },
  { id: 'eta', name: 'Eta Aquaridi', peakMonth: 5, peakDay: 6, radiantDec: -1, detail: 'Frammenti della cometa di Halley (~50 meteore/h)' },
  { id: 'per', name: 'Perseidi', peakMonth: 8, peakDay: 12, radiantDec: 58, detail: 'Sciame più popolare dell\'emisfero nord (~100 meteore/h)' },
  { id: 'ori', name: 'Orionidi', peakMonth: 10, peakDay: 21, radiantDec: 16, detail: 'Frammenti della cometa di Halley (~20 meteore/h)' },
  { id: 'leo', name: 'Leonidi', peakMonth: 11, peakDay: 17, radiantDec: 22, detail: 'Tasso variabile, occasionali storm in anni speciali' },
  { id: 'gem', name: 'Geminidi', peakMonth: 12, peakDay: 14, radiantDec: 32, detail: 'Sciame più intenso dell\'anno (~120 meteore/h), origine asteroidale' },
  { id: 'urs', name: 'Ursidi', peakMonth: 12, peakDay: 22, radiantDec: 76, detail: 'Sciame minore (~10 meteore/h), circumpolare boreale' },
];

function meteorShowerEvents(from: Date, horizon: Date): AstroEvent[] {
  const out: AstroEvent[] = [];
  const startYear = from.getUTCFullYear();
  const endYear = horizon.getUTCFullYear();
  for (let y = startYear; y <= endYear; y++) {
    for (const s of SHOWERS) {
      // Peak time conventionally around local midnight UTC — close enough for a calendar.
      const at = new Date(Date.UTC(y, s.peakMonth - 1, s.peakDay, 0, 0, 0));
      out.push({
        key: `shower-${s.id}-${y}`,
        category: 'meteor-shower',
        label: `Sciame meteorico: ${s.name}`,
        at,
        detail: s.detail,
        visibleAt: (lat) => {
          // A meteor shower is visible from latitudes where the radiant rises:
          // |lat - dec| < 90 (with margin so very low radiants near horizon still count).
          return Math.abs(lat - s.radiantDec) < 90;
        },
      });
    }
  }
  return out;
}

/**
 * Backwards-compatible: returns only the planet events that the older UI consumed.
 * New code should use `upcomingEvents` instead.
 */
export function upcomingPlanetEvents(from: Date, monthsAhead = 12): PlanetEvent[] {
  const horizon = new Date(from.getTime() + monthsAhead * 30 * 86_400_000);
  return planetEvents(from, horizon)
    .filter((e): e is PlanetEvent => e.category === 'planet')
    .map((e) => ({ ...e, kind: e.planetKind }))
    .filter((e) => e.at >= from && e.at <= horizon)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

export type EventFilter = {
  /** Latitude in degrees; when provided, filters by rough visibility. */
  latitude?: number;
  /** Categories to include. Default: all. */
  categories?: EventCategory[];
};

/**
 * Returns all astronomical events between `from` and `from + monthsAhead`,
 * sorted by date. Optionally filters by visibility for a given latitude.
 */
export function upcomingEvents(
  from: Date,
  monthsAhead = 12,
  filter: EventFilter = {},
): AstroEvent[] {
  const horizon = new Date(from.getTime() + monthsAhead * 30 * 86_400_000);
  const cats = new Set<EventCategory>(
    filter.categories ?? ['planet', 'season', 'lunar-eclipse', 'solar-eclipse', 'meteor-shower'],
  );

  const all: AstroEvent[] = [];
  if (cats.has('planet')) all.push(...planetEvents(from, horizon));
  if (cats.has('season')) all.push(...seasonEvents(from, horizon));
  if (cats.has('lunar-eclipse')) all.push(...lunarEclipses(from, horizon));
  if (cats.has('solar-eclipse')) all.push(...solarEclipses(from, horizon));
  if (cats.has('meteor-shower')) all.push(...meteorShowerEvents(from, horizon));

  return all
    .filter((e) => e.at >= from && e.at <= horizon)
    .filter((e) =>
      filter.latitude === undefined || !e.visibleAt
        ? true
        : e.visibleAt(filter.latitude),
    )
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}
