import { describe, expect, it } from 'vitest';
import { MESSIER } from './messier';

describe('MESSIER catalog', () => {
  it('contains all 110 objects', () => {
    expect(MESSIER).toHaveLength(110);
  });

  it('has unique sequential numbers 1..110', () => {
    const nums = MESSIER.map((m) => m.number).sort((a, b) => a - b);
    expect(nums).toEqual(Array.from({ length: 110 }, (_, i) => i + 1));
  });

  it('has unique ids matching the M<number> pattern', () => {
    const ids = new Set(MESSIER.map((m) => m.id));
    expect(ids.size).toBe(110);
    for (const m of MESSIER) expect(m.id).toBe(`M${m.number}`);
  });

  it('has coordinates within valid astronomical ranges', () => {
    for (const m of MESSIER) {
      expect(m.raHours).toBeGreaterThanOrEqual(0);
      expect(m.raHours).toBeLessThan(24);
      expect(m.decDeg).toBeGreaterThanOrEqual(-90);
      expect(m.decDeg).toBeLessThanOrEqual(90);
      expect(Number.isFinite(m.magnitude)).toBe(true);
    }
  });

  it('locates well-known objects correctly', () => {
    const m31 = MESSIER.find((m) => m.id === 'M31')!;
    expect(m31.name).toBe('Andromeda');
    expect(m31.raHours).toBeCloseTo(0.71, 1);
    expect(m31.decDeg).toBeCloseTo(41.27, 1);

    const m42 = MESSIER.find((m) => m.id === 'M42')!;
    expect(m42.type).toBe('NEB');
    expect(m42.constellation).toBe('Orione');

    const m45 = MESSIER.find((m) => m.id === 'M45')!;
    expect(m45.name).toBe('Pleiadi');
    expect(m45.magnitude).toBeLessThan(2);
  });
});
