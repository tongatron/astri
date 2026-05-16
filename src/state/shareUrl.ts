import { useEffect, useRef } from 'react';
import { useStore, type Location, type View } from './store';

const VIEWS: View[] = ['dashboard', 'sky3d', 'solar3d'];

type SharePayload = {
  location?: Location;
  view?: View;
  /** ISO date string when time is simulated. */
  t?: string;
};

/**
 * Encode current observation state into URL search params.
 * Compact format: lat,lon,name | view | ISO time.
 */
export function encodeShareParams(payload: SharePayload): URLSearchParams {
  const params = new URLSearchParams();
  if (payload.location) {
    const { lat, lon, name } = payload.location;
    params.set('l', `${lat.toFixed(4)},${lon.toFixed(4)},${encodeURIComponent(name)}`);
  }
  if (payload.view) params.set('v', payload.view);
  if (payload.t) params.set('t', payload.t);
  return params;
}

export function decodeShareParams(search: string): SharePayload {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const out: SharePayload = {};

  const l = params.get('l');
  if (l) {
    const [latStr, lonStr, ...rest] = l.split(',');
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    const name = rest.length > 0 ? decodeURIComponent(rest.join(',')) : '';
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      out.location = {
        lat,
        lon,
        name: name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
        source: 'manual',
      };
    }
  }

  const v = params.get('v');
  if (v && (VIEWS as string[]).includes(v)) {
    out.view = v as View;
  }

  const t = params.get('t');
  if (t && !Number.isNaN(Date.parse(t))) out.t = t;

  return out;
}

/**
 * Build a shareable URL for the current observation state.
 */
export function buildShareUrl(includeTime: boolean): string {
  const { location, view, timeMode, simulatedTime } = useStore.getState();
  const params = encodeShareParams({
    location: location ?? undefined,
    view,
    t:
      includeTime && timeMode === 'simulated'
        ? new Date(simulatedTime).toISOString()
        : undefined,
  });
  const base = `${window.location.origin}${window.location.pathname}`;
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * On first mount, read URL params and apply them to the store, overriding
 * persisted state for fields explicitly present in the URL.
 */
export function useApplyShareUrlOnMount(): void {
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const payload = decodeShareParams(window.location.search);
    const store = useStore.getState();
    if (payload.location) store.setLocation(payload.location);
    if (payload.view) store.setView(payload.view);
    if (payload.t) store.setSimulatedTime(new Date(payload.t).getTime());
  }, []);
}
