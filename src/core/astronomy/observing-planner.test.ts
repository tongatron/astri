import { describe, expect, it } from 'vitest';
import * as A from 'astronomy-engine';
import { planObservingWindows } from './observing-planner';

const rome = new A.Observer(41.9, 12.5, 0);
const tromso = new A.Observer(69.65, 18.96, 0);

describe('planObservingWindows', () => {
  it('returns one entry per requested night', () => {
    const from = new Date('2024-09-01T00:00:00Z');
    const rows = planObservingWindows(A.Body.Jupiter, rome, from, 14);
    expect(rows).toHaveLength(14);
  });

  it('produces a nautical night window in mid-latitude autumn', () => {
    const from = new Date('2024-10-15T00:00:00Z');
    const [row] = planObservingWindows(A.Body.Jupiter, rome, from, 1);
    expect(row.nightStart).not.toBeNull();
    expect(row.nightEnd).not.toBeNull();
    expect(row.nightEnd!.getTime()).toBeGreaterThan(row.nightStart!.getTime());
  });

  it('reports no nautical night during Tromsø summer (midnight sun)', () => {
    const from = new Date('2024-06-20T00:00:00Z');
    const [row] = planObservingWindows(A.Body.Jupiter, tromso, from, 1);
    expect(row.nightStart).toBeNull();
    expect(row.nightEnd).toBeNull();
    expect(row.score).toBe(0);
  });

  it('keeps body window contained within the nautical night window', () => {
    const from = new Date('2024-10-15T00:00:00Z');
    const rows = planObservingWindows(A.Body.Saturn, rome, from, 7);
    for (const row of rows) {
      if (row.windowStart && row.nightStart) {
        expect(row.windowStart.getTime()).toBeGreaterThanOrEqual(
          row.nightStart.getTime(),
        );
      }
      if (row.windowEnd && row.nightEnd) {
        expect(row.windowEnd.getTime()).toBeLessThanOrEqual(
          row.nightEnd.getTime(),
        );
      }
    }
  });

  it('respects the minAltitude threshold', () => {
    const from = new Date('2024-10-15T00:00:00Z');
    const rows = planObservingWindows(A.Body.Mars, rome, from, 10, 30);
    for (const row of rows) {
      if (row.windowStart) {
        expect(row.peakAltitude).toBeGreaterThanOrEqual(30);
      }
    }
  });

  it('scores zero when there is no visible window', () => {
    const from = new Date('2024-10-15T00:00:00Z');
    const rows = planObservingWindows(A.Body.Jupiter, rome, from, 30);
    for (const row of rows) {
      if (!row.windowStart) {
        expect(row.score).toBe(0);
      } else {
        expect(row.score).toBeGreaterThan(0);
        expect(row.score).toBeLessThanOrEqual(100);
      }
    }
  });

  it('moon illumination is in [0,1]', () => {
    const from = new Date('2024-10-01T00:00:00Z');
    const rows = planObservingWindows(A.Body.Jupiter, rome, from, 30);
    for (const row of rows) {
      expect(row.moonIllumination).toBeGreaterThanOrEqual(0);
      expect(row.moonIllumination).toBeLessThanOrEqual(1);
    }
    // Over a full lunar month we expect to see both ~new and ~full.
    const minIllum = Math.min(...rows.map((r) => r.moonIllumination));
    const maxIllum = Math.max(...rows.map((r) => r.moonIllumination));
    expect(minIllum).toBeLessThan(0.15);
    expect(maxIllum).toBeGreaterThan(0.85);
  });

  it('peakTime falls inside [windowStart, windowEnd] when visible', () => {
    const from = new Date('2024-10-15T00:00:00Z');
    const rows = planObservingWindows(A.Body.Saturn, rome, from, 14);
    for (const row of rows) {
      if (row.windowStart && row.windowEnd && row.peakTime) {
        expect(row.peakTime.getTime()).toBeGreaterThanOrEqual(
          row.windowStart.getTime(),
        );
        expect(row.peakTime.getTime()).toBeLessThanOrEqual(
          row.windowEnd.getTime(),
        );
      }
    }
  });
});
