export type WeatherSample = {
  t: Date;
  /** Cloud cover percentage 0–100 (lower = clearer sky). */
  cloudCover: number;
  /** Relative humidity 0–100. */
  humidity: number;
  /** Horizontal visibility in meters. */
  visibility: number;
};

export type WeatherForecast = {
  samples: WeatherSample[];
  /** Provider attribution string. */
  source: string;
};

type OpenMeteoResponse = {
  hourly: {
    time: string[];
    cloud_cover: number[];
    relative_humidity_2m: number[];
    visibility: number[];
  };
};

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetch hourly cloud cover, humidity and visibility from Open-Meteo for the
 * next `days` days at the given location. No API key required, CORS-friendly.
 *
 * Returns samples spaced one hour apart in chronological order. Throws on
 * network/parse failures so the caller can show a fallback UI.
 */
export async function fetchHourlyForecast(
  lat: number,
  lon: number,
  days = 2,
  signal?: AbortSignal,
): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    hourly: 'cloud_cover,relative_humidity_2m,visibility',
    forecast_days: String(days),
    timezone: 'UTC',
  });

  const res = await fetch(`${ENDPOINT}?${params.toString()}`, { signal });
  if (!res.ok) {
    throw new Error(`Open-Meteo HTTP ${res.status}`);
  }
  const data = (await res.json()) as OpenMeteoResponse;

  const { time, cloud_cover, relative_humidity_2m, visibility } = data.hourly;
  const samples: WeatherSample[] = time.map((iso, i) => ({
    // Open-Meteo returns "YYYY-MM-DDTHH:mm" in the requested timezone (UTC).
    t: new Date(iso + 'Z'),
    cloudCover: cloud_cover[i] ?? 0,
    humidity: relative_humidity_2m[i] ?? 0,
    visibility: visibility[i] ?? 0,
  }));

  return { samples, source: 'Open-Meteo' };
}

/**
 * Mean cloud cover (%) across samples whose timestamp falls within
 * [from, to]. Returns null if no samples fall in that window.
 */
export function meanCloudCover(
  samples: WeatherSample[],
  from: Date,
  to: Date,
): number | null {
  const a = from.getTime();
  const b = to.getTime();
  const inside = samples.filter((s) => {
    const t = s.t.getTime();
    return t >= a && t <= b;
  });
  if (inside.length === 0) return null;
  const sum = inside.reduce((acc, s) => acc + s.cloudCover, 0);
  return sum / inside.length;
}

/** Qualitative label for a cloud cover percentage. */
export function cloudLabel(pct: number): string {
  if (pct < 15) return 'Sereno';
  if (pct < 40) return 'Poco nuvoloso';
  if (pct < 70) return 'Nuvoloso';
  return 'Coperto';
}
