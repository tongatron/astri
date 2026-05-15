export type NominatimResult = {
  lat: number;
  lon: number;
  displayName: string;
  shortName: string;
};

const BASE = 'https://nominatim.openstreetmap.org';

type SearchRow = {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
};

type ReverseRow = {
  display_name: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

function shortName(row: SearchRow): string {
  if (row.name) return row.name;
  return row.display_name.split(',').slice(0, 2).join(',').trim();
}

function reverseShortName(row: ReverseRow): string {
  const a = row.address ?? {};
  const locality =
    a.city ?? a.town ?? a.village ?? a.hamlet ?? a.municipality ?? a.county;
  if (locality && a.country) return `${locality}, ${a.country}`;
  if (locality) return locality;
  if (row.name) return row.name;
  return row.display_name.split(',').slice(0, 2).join(',').trim();
}

export async function search(
  query: string,
  signal?: AbortSignal,
): Promise<NominatimResult[]> {
  const url = new URL(`${BASE}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '6');
  url.searchParams.set('addressdetails', '0');
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const rows = (await res.json()) as SearchRow[];
  return rows.map((r) => ({
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    displayName: r.display_name,
    shortName: shortName(r),
  }));
}

export async function reverse(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<NominatimResult | null> {
  const url = new URL(`${BASE}/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('format', 'json');
  url.searchParams.set('zoom', '10');
  url.searchParams.set('addressdetails', '1');
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const row = (await res.json()) as ReverseRow;
  return {
    lat,
    lon,
    displayName: row.display_name,
    shortName: reverseShortName(row),
  };
}
