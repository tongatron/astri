import { describe, expect, it, vi, afterEach } from 'vitest';
import { fetchISSTLE, issPosition, parseTLE } from './iss';

// Historical ISS TLE (epoch around 2024-10-01). Used as a stable fixture
// so that propagation results are deterministic. Source: Celestrak.
const TLE = {
  name: 'ISS (ZARYA)',
  line1: '1 25544U 98067A   24275.50000000  .00020000  00000-0  35000-3 0  9990',
  line2: '2 25544  51.6400 100.0000 0005000  90.0000 270.0000 15.50000000470000',
};

describe('parseTLE', () => {
  it('parses a 3-line TLE block', () => {
    const text = `${TLE.name}\n${TLE.line1}\n${TLE.line2}\n`;
    const tle = parseTLE(text);
    expect(tle.name).toBe(TLE.name);
    expect(tle.line1).toBe(TLE.line1);
    expect(tle.line2).toBe(TLE.line2);
  });

  it('rejects malformed input', () => {
    expect(() => parseTLE('just one line')).toThrow();
    expect(() => parseTLE('A\nbroken\nbroken')).toThrow();
  });
});

describe('issPosition', () => {
  it('returns finite altitude/azimuth/range for a valid TLE', () => {
    const date = new Date('2024-10-01T20:00:00Z');
    const pos = issPosition(TLE, date, 41.9, 12.5, 0);
    expect(pos).not.toBeNull();
    expect(Number.isFinite(pos!.altitude)).toBe(true);
    expect(Number.isFinite(pos!.azimuth)).toBe(true);
    expect(pos!.azimuth).toBeGreaterThanOrEqual(0);
    expect(pos!.azimuth).toBeLessThan(360);
    expect(pos!.altitude).toBeGreaterThanOrEqual(-90);
    expect(pos!.altitude).toBeLessThanOrEqual(90);
    expect(pos!.rangeKm).toBeGreaterThan(0);
  });

  it('reports ISS altitude near ~400 km above Earth', () => {
    const date = new Date('2024-10-01T20:00:00Z');
    const pos = issPosition(TLE, date, 41.9, 12.5, 0);
    expect(pos).not.toBeNull();
    // ISS orbits at ~400-420 km. Allow generous range for TLE drift.
    expect(pos!.heightKm).toBeGreaterThan(350);
    expect(pos!.heightKm).toBeLessThan(500);
  });
});

describe('fetchISSTLE', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('fetches and parses', async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(`${TLE.name}\n${TLE.line1}\n${TLE.line2}\n`, {
          status: 200,
        }),
    ) as typeof fetch;
    const tle = await fetchISSTLE();
    expect(tle.line1).toBe(TLE.line1);
  });

  it('throws on HTTP error', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('nope', { status: 500 }),
    ) as typeof fetch;
    await expect(fetchISSTLE()).rejects.toThrow(/500/);
  });
});
