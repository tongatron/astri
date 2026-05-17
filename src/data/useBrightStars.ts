import { useEffect, useState } from 'react';

/**
 * Each entry is [raHours, decDeg, magnitude, colorIndex|null].
 * Loaded lazily from /stars-bright.json (HYG Database, CC BY-SA 4.0).
 */
export type BrightStarRow = [number, number, number, number | null];

export type BrightStarsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; stars: BrightStarRow[] }
  | { status: 'error'; message: string };

let cache: BrightStarRow[] | null = null;
let inflight: Promise<BrightStarRow[]> | null = null;

async function fetchCatalog(): Promise<BrightStarRow[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  const url = `${import.meta.env.BASE_URL}stars-bright.json`;
  inflight = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<BrightStarRow[]>;
    })
    .then((data) => {
      cache = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useBrightStars(enabled: boolean): BrightStarsState {
  const [state, setState] = useState<BrightStarsState>(
    cache ? { status: 'ready', stars: cache } : { status: 'idle' },
  );

  useEffect(() => {
    if (!enabled) return;
    if (state.status === 'ready' || state.status === 'loading') return;
    setState({ status: 'loading' });
    let cancelled = false;
    fetchCatalog()
      .then((stars) => {
        if (!cancelled) setState({ status: 'ready', stars });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: 'error', message: String(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, state.status]);

  return state;
}
