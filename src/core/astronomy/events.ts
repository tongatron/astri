import * as A from 'astronomy-engine';

export type PlanetEventKind =
  | 'opposition'
  | 'max-elongation-morning'
  | 'max-elongation-evening';

export type PlanetEvent = {
  key: string;
  body: A.Body;
  planetName: string;
  kind: PlanetEventKind;
  label: string;
  at: Date;
  detail: string;
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

/**
 * Returns planet events (oppositions for outer planets, maximum elongations
 * for Mercury and Venus) occurring between `from` and `from + monthsAhead`.
 */
export function upcomingPlanetEvents(from: Date, monthsAhead = 12): PlanetEvent[] {
  const horizon = new Date(from.getTime() + monthsAhead * 30 * 86_400_000);
  const out: PlanetEvent[] = [];

  for (const planet of INNER) {
    let cursor = from;
    for (let i = 0; i < 8; i++) {
      const ev = A.SearchMaxElongation(planet.body, cursor);
      const at = ev.time.date;
      if (at >= horizon) break;
      const evening = ev.visibility === 'evening';
      out.push({
        key: `${planet.name}-elong-${at.toISOString()}`,
        body: planet.body,
        planetName: planet.name,
        kind: evening ? 'max-elongation-evening' : 'max-elongation-morning',
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
        body: planet.body,
        planetName: planet.name,
        kind: 'opposition',
        label: `Opposizione di ${planet.name}`,
        at,
        detail: 'Pianeta visibile tutta la notte, vicino alla massima luminosità',
      });
      cursor = new Date(at.getTime() + 30 * 86_400_000);
    }
  }

  return out
    .filter((e) => e.at >= from && e.at <= horizon)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}
