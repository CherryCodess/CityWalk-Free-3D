import type { BBox, GeocodeResult } from '../types/geo';

const PHOTON_URL = (import.meta.env.VITE_PHOTON_URL as string | undefined) || 'https://photon.komoot.io/api/';
const NOMINATIM_URL = (import.meta.env.VITE_NOMINATIM_URL as string | undefined) || 'https://nominatim.openstreetmap.org/search';

export const BUILT_IN_CITIES: GeocodeResult[] = [
  ['New York', 'New York, United States', 40.7128, -74.006],
  ['San Francisco', 'San Francisco, United States', 37.7749, -122.4194],
  ['Los Angeles', 'Los Angeles, United States', 34.0522, -118.2437],
  ['London', 'London, United Kingdom', 51.5072, -0.1276],
  ['Paris', 'Paris, France', 48.8566, 2.3522],
  ['Tokyo', 'Tokyo, Japan', 35.6762, 139.6503],
  ['Dubai', 'Dubai, United Arab Emirates', 25.2048, 55.2708],
  ['Singapore', 'Singapore', 1.3521, 103.8198],
  ['Seoul', 'Seoul, South Korea', 37.5665, 126.978],
  ['Hong Kong', 'Hong Kong', 22.3193, 114.1694],
  ['Toronto', 'Toronto, Canada', 43.6532, -79.3832],
  ['Mexico City', 'Mexico City, Mexico', 19.4326, -99.1332],
  ['Sao Paulo', 'Sao Paulo, Brazil', -23.5558, -46.6396],
  ['Sydney', 'Sydney, Australia', -33.8688, 151.2093],
  ['Cape Town', 'Cape Town, South Africa', -33.9249, 18.4241],
  ['Istanbul', 'Istanbul, Turkiye', 41.0082, 28.9784]
].map(([name, displayName, lat, lon], index) => ({
  id: `built-in-${index}`,
  name: String(name),
  displayName: String(displayName),
  lat: Number(lat),
  lon: Number(lon),
  source: 'built-in' as const
}));

let lastNominatimCall = 0;

function localMatches(query: string): GeocodeResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return BUILT_IN_CITIES.slice(0, 8);
  return BUILT_IN_CITIES.filter((city) => `${city.name} ${city.displayName}`.toLowerCase().includes(q)).slice(0, 8);
}

function bboxFromPhoton(bbox: unknown): BBox | undefined {
  if (!Array.isArray(bbox) || bbox.length !== 4) return undefined;
  const nums = bbox.map(Number);
  if (nums.some(Number.isNaN)) return undefined;
  return [nums[0], nums[1], nums[2], nums[3]];
}

async function photonSearch(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const url = new URL(PHOTON_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '7');
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Photon returned ${res.status}`);
  const data = await res.json();
  const features = Array.isArray(data.features) ? data.features : [];

  return features
    .map((feature: any, index: number): GeocodeResult | null => {
      const coords = feature.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return null;
      const props = feature.properties || {};
      const name = props.name || props.city || props.state || props.country || query;
      const display = [props.name, props.city, props.state, props.country].filter(Boolean).join(', ');
      return {
        id: `photon-${props.osm_type || 'x'}-${props.osm_id || index}`,
        name,
        displayName: display || name,
        lat: Number(coords[1]),
        lon: Number(coords[0]),
        bbox: bboxFromPhoton(props.extent),
        source: 'photon'
      };
    })
    .filter(Boolean);
}

async function nominatimSearch(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const elapsed = Date.now() - lastNominatimCall;
  if (elapsed < 1100) {
    await new Promise((resolve) => window.setTimeout(resolve, 1100 - elapsed));
  }
  lastNominatimCall = Date.now();

  // Public Nominatim servers have strict usage limits. This fallback is intentionally rate-limited;
  // production deployments with heavier traffic should self-host Nominatim or configure another free endpoint.
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '1');
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json'
    }
  });
  if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
  const data = await res.json();
  const rows = Array.isArray(data) ? data : [];

  return rows.map((row: any, index: number) => ({
    id: `nominatim-${row.osm_type || 'x'}-${row.osm_id || index}`,
    name: row.name || row.display_name?.split(',')[0] || query,
    displayName: row.display_name || row.name || query,
    lat: Number(row.lat),
    lon: Number(row.lon),
    bbox: Array.isArray(row.boundingbox)
      ? ([Number(row.boundingbox[2]), Number(row.boundingbox[0]), Number(row.boundingbox[3]), Number(row.boundingbox[1])] as BBox)
      : undefined,
    source: 'nominatim'
  }));
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return localMatches(trimmed);

  try {
    const photon = await photonSearch(trimmed, signal);
    if (photon.length > 0) return [...photon, ...localMatches(trimmed)].slice(0, 9);
  } catch {
    // Fall through to Nominatim and built-in cities.
  }

  try {
    const nominatim = await nominatimSearch(trimmed, signal);
    if (nominatim.length > 0) return [...nominatim, ...localMatches(trimmed)].slice(0, 9);
  } catch {
    // Offline or rate-limited geocoding still leaves demo cities available.
  }

  return localMatches(trimmed);
}
