import type { Location, View } from './store';

const VALID_VIEWS: View[] = ['dashboard', 'sky3d', 'solar3d', 'chart2d'];

export type UrlState = {
  location?: Location;
  view?: View;
  /** Simulated epoch ms (sets timeMode='simulated'). */
  simulatedTime?: number;
};

/** Parse the query string into a structured snapshot of shareable app state. */
export function parseUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  const out: UrlState = {};

  const lat = parseFloat(params.get('lat') ?? '');
  const lon = parseFloat(params.get('lon') ?? '');
  if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
    out.location = {
      lat,
      lon,
      name: params.get('name')?.slice(0, 80) ?? `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
      source: 'manual',
    };
  }

  const v = params.get('v');
  if (v && (VALID_VIEWS as string[]).includes(v)) {
    out.view = v as View;
  }

  const t = parseInt(params.get('t') ?? '', 10);
  if (Number.isFinite(t) && t > 0) {
    out.simulatedTime = t;
  }

  return out;
}

/** Build a shareable URL embedding the current location/view/time. */
export function buildShareUrl(
  baseUrl: string,
  state: { location: Location | null; view: View; simulatedTime?: number },
): string {
  const url = new URL(baseUrl);
  // Drop any existing query and rebuild from scratch.
  url.search = '';
  if (state.location) {
    url.searchParams.set('lat', state.location.lat.toFixed(4));
    url.searchParams.set('lon', state.location.lon.toFixed(4));
    url.searchParams.set('name', state.location.name);
  }
  url.searchParams.set('v', state.view);
  if (state.simulatedTime) {
    url.searchParams.set('t', String(state.simulatedTime));
  }
  return url.toString();
}
