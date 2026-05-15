import { describe, expect, it } from 'vitest';
import { principalPhasesInMonth } from './phases';

describe('principalPhasesInMonth', () => {
  it('returns the four principal phases of August 2024 in order', () => {
    const phases = principalPhasesInMonth(new Date('2024-08-15T12:00:00Z'));
    expect(phases).toHaveLength(4);
    expect(phases.map((p) => p.key)).toEqual(['new', 'first', 'full', 'last']);

    // Spot-check known dates (UTC day-of-month).
    const byKey = Object.fromEntries(phases.map((p) => [p.key, p.at]));
    expect(byKey.new.getUTCDate()).toBe(4);
    expect(byKey.full.getUTCDate()).toBe(19);
  });

  it('only returns phases inside the calendar month', () => {
    const phases = principalPhasesInMonth(new Date('2024-02-10T00:00:00Z'));
    for (const p of phases) {
      expect(p.at.getMonth()).toBe(1); // February
      expect(p.at.getFullYear()).toBe(2024);
    }
  });
});
