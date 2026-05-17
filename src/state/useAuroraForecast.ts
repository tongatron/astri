import { useEffect, useState } from 'react';
import {
  fetchAuroraForecast,
  type AuroraForecast,
} from '@/core/aurora/swpc';

const CACHE_TTL_MS = 30 * 60_000; // 30 min
let cached: { at: number; data: AuroraForecast } | null = null;

export type AuroraStatus =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; data: AuroraForecast }
  | { status: 'error'; error: string };

/**
 * Fetch the NOAA Kp / aurora forecast, with a 30-minute in-memory cache shared
 * across mounts. The forecast doesn't change faster than that anyway.
 */
export function useAuroraForecast(): AuroraStatus {
  const [state, setState] = useState<AuroraStatus>(() =>
    cached && Date.now() - cached.at < CACHE_TTL_MS
      ? { status: 'ready', data: cached.data }
      : { status: 'idle' },
  );

  useEffect(() => {
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setState({ status: 'ready', data: cached.data });
      return;
    }
    const ctrl = new AbortController();
    setState({ status: 'loading' });
    fetchAuroraForecast(ctrl.signal)
      .then((data) => {
        cached = { at: Date.now(), data };
        setState({ status: 'ready', data });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'errore sconosciuto',
        });
      });
    return () => ctrl.abort();
  }, []);

  return state;
}
