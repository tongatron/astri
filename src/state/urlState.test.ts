import { describe, expect, it } from 'vitest';
import { buildShareUrl, parseUrlState } from './urlState';

describe('parseUrlState', () => {
  it('parses valid lat/lon/name', () => {
    const s = parseUrlState('?lat=41.9&lon=12.5&name=Roma');
    expect(s.location).toEqual({ lat: 41.9, lon: 12.5, name: 'Roma', source: 'manual' });
  });

  it('ignores invalid lat/lon', () => {
    expect(parseUrlState('?lat=200&lon=12').location).toBeUndefined();
    expect(parseUrlState('?lat=foo&lon=bar').location).toBeUndefined();
  });

  it('parses valid views, rejects others', () => {
    expect(parseUrlState('?v=sky3d').view).toBe('sky3d');
    expect(parseUrlState('?v=hacked').view).toBeUndefined();
  });

  it('parses positive integer t', () => {
    expect(parseUrlState('?t=1700000000000').simulatedTime).toBe(1700000000000);
    expect(parseUrlState('?t=abc').simulatedTime).toBeUndefined();
    expect(parseUrlState('?t=-1').simulatedTime).toBeUndefined();
  });

  it('caps long name to 80 chars', () => {
    const long = 'A'.repeat(200);
    const s = parseUrlState(`?lat=0&lon=0&name=${long}`);
    expect(s.location!.name.length).toBeLessThanOrEqual(80);
  });
});

describe('buildShareUrl', () => {
  it('round-trips through parseUrlState', () => {
    const url = buildShareUrl('https://example.com/astri/', {
      location: { lat: 41.9028, lon: 12.4964, name: 'Roma', source: 'manual' },
      view: 'chart2d',
      simulatedTime: 1_700_000_000_000,
    });
    const u = new URL(url);
    const back = parseUrlState(u.search);
    expect(back.location?.name).toBe('Roma');
    expect(back.location?.lat).toBeCloseTo(41.9028, 3);
    expect(back.view).toBe('chart2d');
    expect(back.simulatedTime).toBe(1_700_000_000_000);
  });

  it('omits time when not provided', () => {
    const url = buildShareUrl('https://example.com/', {
      location: { lat: 0, lon: 0, name: 'X', source: 'manual' },
      view: 'dashboard',
    });
    expect(new URL(url).searchParams.has('t')).toBe(false);
  });
});
