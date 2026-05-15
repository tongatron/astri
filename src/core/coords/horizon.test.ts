import { describe, expect, it } from 'vitest';
import { horizontalToCartesian } from './horizon';

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) < tol;

describe('horizontalToCartesian', () => {
  it('places the zenith on the +y axis', () => {
    const p = horizontalToCartesian(90, 0);
    expect(close(p.x, 0)).toBe(true);
    expect(close(p.y, 1)).toBe(true);
    expect(close(p.z, 0)).toBe(true);
  });

  it('places north (az=0, alt=0) on the +z axis', () => {
    const p = horizontalToCartesian(0, 0);
    expect(close(p.x, 0)).toBe(true);
    expect(close(p.y, 0)).toBe(true);
    expect(close(p.z, 1)).toBe(true);
  });

  it('places east (az=90, alt=0) on the +x axis', () => {
    const p = horizontalToCartesian(0, 90);
    expect(close(p.x, 1)).toBe(true);
    expect(close(p.y, 0)).toBe(true);
    expect(close(p.z, 0)).toBe(true);
  });

  it('places south (az=180, alt=0) on the -z axis', () => {
    const p = horizontalToCartesian(0, 180);
    expect(close(p.x, 0)).toBe(true);
    expect(close(p.y, 0)).toBe(true);
    expect(close(p.z, -1)).toBe(true);
  });

  it('places west (az=270, alt=0) on the -x axis', () => {
    const p = horizontalToCartesian(0, 270);
    expect(close(p.x, -1)).toBe(true);
    expect(close(p.y, 0)).toBe(true);
    expect(close(p.z, 0)).toBe(true);
  });

  it('scales by the requested radius', () => {
    const p = horizontalToCartesian(0, 0, 5);
    expect(close(p.z, 5)).toBe(true);
  });

  it('keeps points on the unit sphere for radius=1', () => {
    for (const alt of [-30, 0, 15, 45, 75]) {
      for (const az of [0, 45, 130, 270, 359]) {
        const p = horizontalToCartesian(alt, az);
        const r = Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2);
        expect(close(r, 1, 1e-9)).toBe(true);
      }
    }
  });
});
