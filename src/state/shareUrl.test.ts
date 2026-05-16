import { describe, expect, it } from 'vitest';
import { decodeShareParams, encodeShareParams } from './shareUrl';

describe('shareUrl', () => {
  it('round-trips location, view, time', () => {
    const params = encodeShareParams({
      location: { lat: 45.46, lon: 9.19, name: 'Milano, Italia', source: 'manual' },
      view: 'sky3d',
      t: '2026-08-12T20:00:00.000Z',
    });
    const decoded = decodeShareParams(params.toString());
    expect(decoded.view).toBe('sky3d');
    expect(decoded.t).toBe('2026-08-12T20:00:00.000Z');
    expect(decoded.location?.lat).toBeCloseTo(45.46, 3);
    expect(decoded.location?.lon).toBeCloseTo(9.19, 3);
    expect(decoded.location?.name).toBe('Milano, Italia');
  });

  it('ignores unknown view values', () => {
    const decoded = decodeShareParams('v=hacker');
    expect(decoded.view).toBeUndefined();
  });

  it('ignores invalid timestamps', () => {
    const decoded = decodeShareParams('t=not-a-date');
    expect(decoded.t).toBeUndefined();
  });

  it('returns empty payload for empty search', () => {
    expect(decodeShareParams('')).toEqual({});
  });

  it('handles place names containing commas', () => {
    const params = encodeShareParams({
      location: { lat: 40.7, lon: -74.0, name: 'New York, NY, USA', source: 'manual' },
    });
    const decoded = decodeShareParams(params.toString());
    expect(decoded.location?.name).toBe('New York, NY, USA');
  });
});
