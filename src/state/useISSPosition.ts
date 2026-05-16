import { useEffect, useState } from 'react';
import {
  fetchISSTLE,
  issPosition,
  parseTLE,
  type ISSPosition,
  type TLE,
} from '@/core/satellites/iss';
import type { Location } from './store';

type CachedTLE = { tle: TLE; fetchedAt: number };

const STORAGE_KEY = 'astri-iss-tle';
const TLE_TTL_MS = 12 * 3600_000;

function readCache(): CachedTLE | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as {
      tle: { name: string; line1: string; line2: string };
      fetchedAt: number;
    };
    return { tle: parseTLE(`${obj.tle.name}\n${obj.tle.line1}\n${obj.tle.line2}`), fetchedAt: obj.fetchedAt };
  } catch {
    return null;
  }
}

function writeCache(tle: TLE) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tle, fetchedAt: Date.now() }),
    );
  } catch {
    // localStorage may be unavailable (privacy mode); ignore
  }
}

let inFlight: Promise<TLE> | null = null;

/**
 * Computes the ISS topocentric position at `date` for the given location.
 * Fetches and caches the latest TLE from Celestrak (12-hour TTL). Returns
 * `null` while loading or on error.
 */
export function useISSPosition(
  location: Location | null,
  date: Date,
): ISSPosition | null {
  const [tle, setTle] = useState<TLE | null>(() => {
    const cached = readCache();
    return cached && Date.now() - cached.fetchedAt < TLE_TTL_MS ? cached.tle : null;
  });

  useEffect(() => {
    if (tle) return;
    if (!inFlight) {
      inFlight = fetchISSTLE()
        .then((fresh) => {
          writeCache(fresh);
          return fresh;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    let cancelled = false;
    inFlight
      .then((fresh) => {
        if (!cancelled) setTle(fresh);
      })
      .catch(() => {
        // Swallow — caller treats `null` as "ISS unavailable".
      });
    return () => {
      cancelled = true;
    };
  }, [tle]);

  if (!location || !tle) return null;
  return issPosition(tle, date, location.lat, location.lon, 0);
}
