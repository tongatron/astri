import { useEffect, useRef, useState } from 'react';
import {
  fetchHourlyForecast,
  type WeatherForecast,
} from '@/core/weather/openmeteo';
import type { Location } from './store';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; forecast: WeatherForecast; fetchedAt: number }
  | { status: 'error'; message: string };

const CACHE_TTL_MS = 30 * 60_000;
const cache = new Map<string, { forecast: WeatherForecast; fetchedAt: number }>();

function keyFor(loc: Location): string {
  return `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}`;
}

/**
 * Fetches a 2-day hourly cloud/humidity/visibility forecast for the given
 * location, with a 30-minute in-memory cache keyed by rounded coordinates.
 *
 * Returns null in `forecast` while idle or loading; consumers should degrade
 * gracefully (astronomy-only scoring) when there is no weather data.
 */
export function useWeatherForecast(location: Location | null): State {
  const [state, setState] = useState<State>({ status: 'idle' });
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!location) {
      setState({ status: 'idle' });
      lastKey.current = null;
      return;
    }
    const key = keyFor(location);
    if (lastKey.current === key && state.status === 'ready') return;

    const cached = cache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      lastKey.current = key;
      setState({ status: 'ready', forecast: cached.forecast, fetchedAt: cached.fetchedAt });
      return;
    }

    const controller = new AbortController();
    lastKey.current = key;
    setState({ status: 'loading' });

    fetchHourlyForecast(location.lat, location.lon, 2, controller.signal)
      .then((forecast) => {
        const entry = { forecast, fetchedAt: Date.now() };
        cache.set(key, entry);
        setState({ status: 'ready', forecast, fetchedAt: entry.fetchedAt });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', message });
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lon]);

  return state;
}
