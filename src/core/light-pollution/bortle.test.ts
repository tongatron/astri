import { describe, expect, it } from 'vitest';
import { estimateBortle, bortlePenalty } from './bortle';

describe('estimateBortle', () => {
  it('centro Roma → cielo urbano (8-9)', () => {
    const b = estimateBortle(41.9028, 12.4964);
    expect(b.class).toBeGreaterThanOrEqual(8);
  });

  it('centro Milano → cielo urbano (8-9)', () => {
    const b = estimateBortle(45.4642, 9.19);
    expect(b.class).toBeGreaterThanOrEqual(8);
  });

  it('hinterland milanese (30km) → suburbano (5-7)', () => {
    // Lecco area
    const b = estimateBortle(45.8566, 9.3974);
    expect(b.class).toBeGreaterThanOrEqual(5);
    expect(b.class).toBeLessThanOrEqual(7);
  });

  it('Dolomiti (Cortina d\'Ampezzo) → rurale o eccellente (1-4)', () => {
    const b = estimateBortle(46.5405, 12.1357);
    expect(b.class).toBeLessThanOrEqual(4);
  });

  it('periferia ovest Milano (~10km) → suburbano (5-8)', () => {
    const b = estimateBortle(45.46, 9.05);
    expect(b.class).toBeGreaterThanOrEqual(5);
    expect(b.class).toBeLessThanOrEqual(8);
  });

  it('Asinara, Sardegna NW → cielo eccellente (1-2)', () => {
    const b = estimateBortle(41.0667, 8.2833);
    expect(b.class).toBeLessThanOrEqual(2);
  });

  it('Atlantico al largo → class 1', () => {
    const b = estimateBortle(45, -30);
    expect(b.class).toBe(1);
  });

  it('include città di riferimento più vicina', () => {
    const b = estimateBortle(45.4642, 9.19);
    expect(b.nearest?.name).toBe('Milano');
    expect(b.nearest?.km).toBeLessThan(2);
  });
});

describe('bortlePenalty', () => {
  it('class 1 → 0', () => {
    expect(bortlePenalty(1)).toBe(0);
  });
  it('class 9 → 30', () => {
    expect(bortlePenalty(9)).toBe(30);
  });
  it('class 5 → ~15', () => {
    expect(bortlePenalty(5)).toBe(15);
  });
});
