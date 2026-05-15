import { describe, expect, it } from 'vitest';
import { upcomingPlanetEvents } from './events';

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
      expect(['max-elongation-morning', 'max-elongation-evening']).toContain(e.kind);
    }
  });
});
