import { describe, expect, it } from 'vitest';
import * as A from 'astronomy-engine';
import { moonState, moonTrajectory } from './moon';

const greenwich = new A.Observer(51.4779, -0.0015, 0);

describe('moonState', () => {
  it('reports near-zero illumination at a known new moon', () => {
    // New moon: 2024-08-04 11:13 UTC
    const at = new Date('2024-08-04T11:13:00Z');
    const moon = moonState(at, greenwich);
    expect(moon.illumination).toBeLessThan(0.02);
    expect(moon.phaseName).toBe('Luna nuova');
  });

  it('reports near-full illumination at a known full moon', () => {
    // Full moon: 2024-08-19 18:26 UTC
    const at = new Date('2024-08-19T18:26:00Z');
    const moon = moonState(at, greenwich);
    expect(moon.illumination).toBeGreaterThan(0.98);
    expect(moon.phaseName).toBe('Luna piena');
  });

  it('reports ~50% illumination at first quarter', () => {
    // First quarter: 2024-08-12 15:18 UTC
    const at = new Date('2024-08-12T15:18:00Z');
    const moon = moonState(at, greenwich);
    expect(moon.illumination).toBeGreaterThan(0.45);
    expect(moon.illumination).toBeLessThan(0.55);
    expect(moon.phaseName).toBe('Primo quarto');
  });

  it('keeps the moon within plausible Earth-Moon distance bounds', () => {
    const at = new Date('2024-08-19T18:26:00Z');
    const moon = moonState(at, greenwich);
    expect(moon.distanceKm).toBeGreaterThan(356_000);
    expect(moon.distanceKm).toBeLessThan(407_000);
  });
});

describe('moonTrajectory', () => {
  it('samples a full 24h window with the requested step', () => {
    const from = new Date('2024-08-19T00:00:00Z');
    const track = moonTrajectory(from, greenwich, 30);
    expect(track).toHaveLength(49);
    expect(track[0].t.getTime()).toBe(from.getTime());
    expect(track[track.length - 1].t.getTime()).toBe(
      from.getTime() + 24 * 3600_000,
    );
  });
});
