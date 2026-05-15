import { describe, expect, it } from 'vitest';
import * as A from 'astronomy-engine';
import { sunState, sunTrajectory } from './sun';

const greenwich = new A.Observer(51.4779, -0.0015, 0);
const equator = new A.Observer(0, 0, 0);

describe('sunState', () => {
  it('reports ~12h day length at the March equinox', () => {
    const at = new Date('2024-03-20T12:00:00Z');
    const sun = sunState(at, greenwich);

    expect(sun.rise).not.toBeNull();
    expect(sun.set).not.toBeNull();
    expect(sun.dayLengthMs).not.toBeNull();

    const hours = (sun.dayLengthMs ?? 0) / 3_600_000;
    // Atmospheric refraction and finite Sun disc push equinox day length
    // above exactly 12h, but it stays well within 12h ± 15min.
    expect(hours).toBeGreaterThan(11.75);
    expect(hours).toBeLessThan(12.35);
  });

  it('puts the Sun near the celestial equator at the March equinox', () => {
    const at = new Date('2024-03-20T03:06:00Z');
    const sun = sunState(at, greenwich);
    expect(Math.abs(sun.declination)).toBeLessThan(0.5);
  });

  it('puts the Sun overhead at the equator at local solar noon on the equinox', () => {
    // At lon 0 solar noon is ~12:00 UTC on the equinox.
    const at = new Date('2024-03-20T12:07:00Z');
    const sun = sunState(at, equator);
    expect(sun.altitude).toBeGreaterThan(88);
  });

  it('reaches its highest declination near the June solstice', () => {
    const at = new Date('2024-06-20T20:51:00Z');
    const sun = sunState(at, greenwich);
    // Obliquity ~23.44°
    expect(sun.declination).toBeGreaterThan(23.0);
    expect(sun.declination).toBeLessThan(23.6);
  });
});

describe('sunTrajectory', () => {
  it('samples a full 24h window with the requested step', () => {
    const from = new Date('2024-06-21T00:00:00Z');
    const track = sunTrajectory(from, greenwich, 60);
    expect(track).toHaveLength(25);
    expect(track[0].t.getTime()).toBe(from.getTime());
    expect(track[track.length - 1].t.getTime()).toBe(
      from.getTime() + 24 * 3600_000,
    );
  });

  it('crosses the horizon twice on a temperate-latitude summer day', () => {
    const from = new Date('2024-06-21T00:00:00Z');
    const track = sunTrajectory(from, greenwich, 10);
    let crossings = 0;
    for (let i = 1; i < track.length; i++) {
      if (Math.sign(track[i].altitude) !== Math.sign(track[i - 1].altitude)) {
        crossings++;
      }
    }
    expect(crossings).toBe(2);
  });
});
