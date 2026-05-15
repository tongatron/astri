import { describe, expect, it } from 'vitest';
import { HELIO_BODIES, helioPosition, helioTrajectory } from './heliocentric';

describe('helioPosition', () => {
  it('places Earth at roughly 1 AU from the Sun', () => {
    const at = new Date('2024-06-21T00:00:00Z');
    const earth = HELIO_BODIES.find((b) => b.key === 'earth')!;
    const p = helioPosition(earth.body, at);
    expect(p.distanceAu).toBeGreaterThan(0.98);
    expect(p.distanceAu).toBeLessThan(1.02);
  });

  it('places Jupiter at ~5 AU from the Sun', () => {
    const at = new Date('2024-06-21T00:00:00Z');
    const jupiter = HELIO_BODIES.find((b) => b.key === 'jupiter')!;
    const p = helioPosition(jupiter.body, at);
    expect(p.distanceAu).toBeGreaterThan(4.9);
    expect(p.distanceAu).toBeLessThan(5.5);
  });
});

describe('helioTrajectory', () => {
  it('returns one closed orbit (start point ≈ end point) for Earth', () => {
    const earth = HELIO_BODIES.find((b) => b.key === 'earth')!;
    const orbit = helioTrajectory(earth, new Date('2024-06-21T00:00:00Z'), 64);
    expect(orbit).toHaveLength(65);
    const first = orbit[0];
    const last = orbit[orbit.length - 1];
    const drift = Math.sqrt(
      (last.x - first.x) ** 2 + (last.y - first.y) ** 2 + (last.z - first.z) ** 2,
    );
    // Earth's exact orbital period is slightly different from the constant we
    // use, so a small drift is expected but should stay small.
    expect(drift).toBeLessThan(0.1);
  });
});
