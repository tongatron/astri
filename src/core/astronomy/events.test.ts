import { describe, expect, it } from 'vitest';
import { upcomingEvents, upcomingPlanetEvents } from './events';
import { eventsToICS } from './ics';

describe('upcomingPlanetEvents', () => {
  it('returns events sorted by date and inside the horizon', () => {
    const from = new Date('2024-01-01T00:00:00Z');
    const events = upcomingPlanetEvents(from, 12);
    expect(events.length).toBeGreaterThan(0);
    const horizon = from.getTime() + 12 * 30 * 86_400_000;
    for (const e of events) {
      expect(e.at.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(e.at.getTime()).toBeLessThanOrEqual(horizon);
    }
    for (let i = 1; i < events.length; i++) {
      expect(events[i].at.getTime()).toBeGreaterThanOrEqual(
        events[i - 1].at.getTime(),
      );
    }
  });

  it('includes a Saturn opposition in late 2024', () => {
    const from = new Date('2024-01-01T00:00:00Z');
    const events = upcomingPlanetEvents(from, 12);
    const saturn = events.find(
      (e) => e.planetName === 'Saturno' && e.kind === 'opposition',
    );
    expect(saturn).toBeDefined();
    expect(saturn!.at.getUTCFullYear()).toBe(2024);
    expect(saturn!.at.getUTCMonth()).toBe(8); // September
  });

  it('finds inner-planet maximum elongations within an 18-month window', () => {
    // Venus' synodic cycle is ~584 days, so 12 months can contain zero events;
    // widen the window to guarantee at least one for each inner planet.
    const from = new Date('2024-01-01T00:00:00Z');
    const events = upcomingPlanetEvents(from, 18);
    const mercury = events.filter((e) => e.planetName === 'Mercurio');
    const venus = events.filter((e) => e.planetName === 'Venere');
    expect(mercury.length).toBeGreaterThanOrEqual(3);
    expect(venus.length).toBeGreaterThanOrEqual(1);
    for (const e of mercury) {
      expect(['max-elongation-morning', 'max-elongation-evening']).toContain(
        e.planetKind,
      );
    }
  });
});

describe('upcomingEvents', () => {
  it('includes seasons, eclipses and meteor showers alongside planet events', () => {
    const from = new Date('2024-01-01T00:00:00Z');
    const events = upcomingEvents(from, 12);
    const categories = new Set(events.map((e) => e.category));
    expect(categories.has('planet')).toBe(true);
    expect(categories.has('season')).toBe(true);
    expect(categories.has('lunar-eclipse')).toBe(true);
    expect(categories.has('solar-eclipse')).toBe(true);
    expect(categories.has('meteor-shower')).toBe(true);
  });

  it('returns the 2024 March equinox', () => {
    const from = new Date('2024-01-01T00:00:00Z');
    const events = upcomingEvents(from, 6, { categories: ['season'] });
    const eq = events.find((e) =>
      e.label.toLowerCase().includes('primavera'),
    );
    expect(eq).toBeDefined();
    expect(eq!.at.getUTCMonth()).toBe(2); // March
    expect(eq!.at.getUTCDate()).toBeGreaterThanOrEqual(19);
    expect(eq!.at.getUTCDate()).toBeLessThanOrEqual(21);
  });

  it('filters by latitude when requested', () => {
    const from = new Date('2024-01-01T00:00:00Z');
    const unfiltered = upcomingEvents(from, 12, {
      categories: ['meteor-shower'],
    });
    const filtered = upcomingEvents(from, 12, {
      categories: ['meteor-shower'],
      latitude: -45,
    });
    // Southern hemisphere should drop the most polar northern showers (e.g. Ursidi dec≈76).
    expect(filtered.length).toBeLessThanOrEqual(unfiltered.length);
    expect(filtered.some((e) => e.label.includes('Ursidi'))).toBe(false);
  });
});

describe('eventsToICS', () => {
  it('produces a well-formed VCALENDAR with one VEVENT per item', () => {
    const from = new Date('2024-01-01T00:00:00Z');
    const events = upcomingEvents(from, 3, { categories: ['season'] }).slice(0, 2);
    const ics = eventsToICS(events);
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics.includes('END:VCALENDAR')).toBe(true);
    const veventCount = ics.split('BEGIN:VEVENT').length - 1;
    expect(veventCount).toBe(events.length);
    expect(ics.includes('\r\n')).toBe(true);
  });
});
