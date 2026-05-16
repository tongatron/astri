import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchHourlyForecast,
  meanCloudCover,
  cloudLabel,
  type WeatherSample,
} from './openmeteo';

describe('meanCloudCover', () => {
  const samples: WeatherSample[] = [
    { t: new Date('2024-10-15T20:00:00Z'), cloudCover: 10, humidity: 50, visibility: 24000 },
    { t: new Date('2024-10-15T21:00:00Z'), cloudCover: 20, humidity: 50, visibility: 24000 },
    { t: new Date('2024-10-15T22:00:00Z'), cloudCover: 60, humidity: 50, visibility: 24000 },
    { t: new Date('2024-10-15T23:00:00Z'), cloudCover: 90, humidity: 50, visibility: 24000 },
  ];

  it('averages samples inside the window inclusively', () => {
    const mean = meanCloudCover(
      samples,
      new Date('2024-10-15T20:00:00Z'),
      new Date('2024-10-15T22:00:00Z'),
    );
    expect(mean).toBeCloseTo(30, 5);
  });

  it('returns null when no samples fall in the window', () => {
    const mean = meanCloudCover(
      samples,
      new Date('2024-10-16T03:00:00Z'),
      new Date('2024-10-16T04:00:00Z'),
    );
    expect(mean).toBeNull();
  });
});

describe('cloudLabel', () => {
  it('maps to qualitative buckets', () => {
    expect(cloudLabel(5)).toBe('Sereno');
    expect(cloudLabel(25)).toBe('Poco nuvoloso');
    expect(cloudLabel(55)).toBe('Nuvoloso');
    expect(cloudLabel(85)).toBe('Coperto');
  });
});

describe('fetchHourlyForecast', () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          hourly: {
            time: ['2024-10-15T20:00', '2024-10-15T21:00'],
            cloud_cover: [12, 80],
            relative_humidity_2m: [60, 70],
            visibility: [24000, 18000],
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('parses the Open-Meteo response into samples', async () => {
    const { samples, source } = await fetchHourlyForecast(41.9, 12.5);
    expect(source).toBe('Open-Meteo');
    expect(samples).toHaveLength(2);
    expect(samples[0].cloudCover).toBe(12);
    expect(samples[1].cloudCover).toBe(80);
    expect(samples[0].t.toISOString()).toBe('2024-10-15T20:00:00.000Z');
  });

  it('throws on non-OK responses', async () => {
    globalThis.fetch = vi.fn(
      async () => new Response('nope', { status: 503 }),
    ) as typeof fetch;
    await expect(fetchHourlyForecast(0, 0)).rejects.toThrow(/503/);
  });
});
