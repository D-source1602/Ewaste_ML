/**
 * maps.ts — real, keyless nearby-recycler data.
 *
 * Three real pieces, all loaded at runtime (npm is blocked here):
 *   1. Leaflet + OpenStreetMap tiles — a real slippy map, injected from CDN.
 *   2. The browser Geolocation API — the user's real location, with permission.
 *   3. The Overpass API over live OpenStreetMap — real recycling points tagged
 *      for electrical/electronic waste, queried around the user's coordinates.
 *
 * No key, no billing, no signup. Only the slice of Leaflet this app calls is
 * typed below — enough for tsc without pulling in @types/leaflet.
 */

/* ── Minimal Leaflet surface (only what we call) ─────────────────────────── */

export interface LMap {
  setView(center: [number, number], zoom: number): LMap;
  fitBounds(bounds: [number, number][], opts?: Record<string, unknown>): LMap;
  removeLayer(layer: unknown): void;
  invalidateSize(): void;
  remove(): void;
}

export interface LLayer {
  addTo(map: LMap): LLayer;
}

export interface LMarker {
  addTo(map: LMap): LMarker;
  bindPopup(html: string): LMarker;
  openPopup(): LMarker;
  on(event: string, handler: () => void): LMarker;
}

interface LeafletApi {
  map(el: HTMLElement, opts?: Record<string, unknown>): LMap;
  tileLayer(url: string, opts?: Record<string, unknown>): LLayer;
  marker(latlng: [number, number], opts?: Record<string, unknown>): LMarker;
  circleMarker(latlng: [number, number], opts?: Record<string, unknown>): LMarker;
}

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

/* ── Leaflet loader (CDN, injected once) ─────────────────────────────────── */

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

let leafletPromise: Promise<LeafletApi> | null = null;

/** Injects Leaflet's CSS + JS once and resolves with the global `L`. */
export function loadLeaflet(): Promise<LeafletApi> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no-window'));
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise<LeafletApi>((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => {
      if (window.L) resolve(window.L);
      else reject(new Error('leaflet-load-failed'));
    };
    script.onerror = () => {
      leafletPromise = null;
      reject(new Error('leaflet-script-error'));
    };
    document.head.appendChild(script);
  });
  return leafletPromise;
}

/* ── Geolocation ─────────────────────────────────────────────────────────── */

export interface Coords {
  lat: number;
  lng: number;
}

/** Real browser location, with permission. Rejects on denial/unsupported. */
export function getUserLocation(timeoutMs = 9000): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    );
  });
}

/* ── Distance ────────────────────────────────────────────────────────────── */

/** Great-circle distance in kilometres between two points. */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/* ── Geocoding (Nominatim / OpenStreetMap) ───────────────────────────────── */

export interface Place {
  label: string;
  lat: number;
  lng: number;
}

/**
 * Turns a typed place — any Indian state, district, city or locality — into
 * real coordinates via OpenStreetMap's Nominatim geocoder. Keyless; results
 * are restricted to India and capped so the picker stays snappy.
 */
export async function geocodePlace(query: string): Promise<Place[]> {
  const q = query.trim();
  if (!q) return [];
  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?format=jsonv2&limit=6&countrycodes=in&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;
    return rows.map((r) => ({
      label: r.display_name,
      lat: Number.parseFloat(r.lat),
      lng: Number.parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}

/* ── Overpass (live OpenStreetMap) ───────────────────────────────────────── */

export interface Recycler {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  accepts: string[];
  distanceKm: number;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

/** Builds an Overpass QL query for e-waste-capable collection points nearby. */
function overpassQuery(c: Coords, radiusM: number): string {
  const near = `(around:${radiusM},${c.lat},${c.lng})`;
  return (
    '[out:json][timeout:25];(' +
    `node["amenity"="recycling"]["recycling:electrical_appliances"="yes"]${near};` +
    `node["amenity"="recycling"]["recycling:electronics"="yes"]${near};` +
    `node["amenity"="recycling"]["recycling:e-waste"="yes"]${near};` +
    `way["amenity"="recycling"]["recycling:electrical_appliances"="yes"]${near};` +
    `node["shop"="electronics"]["recycling"~"yes|electronics"]${near};` +
    `node["craft"="electronics_repair"]${near};` +
    ');out center 40;'
  );
}

/** Human-readable accepted-materials list from OSM recycling tags. */
function acceptsFrom(tags: Record<string, string>): string[] {
  const map: Record<string, string> = {
    'recycling:electrical_appliances': 'Appliances',
    'recycling:electronics': 'Electronics',
    'recycling:e-waste': 'E-waste',
    'recycling:computers': 'Computers',
    'recycling:batteries': 'Batteries',
    'recycling:mobile_phones': 'Phones',
    'recycling:small_appliances': 'Small appliances',
  };
  const out: string[] = [];
  for (const [key, label] of Object.entries(map)) {
    if (tags[key] === 'yes') out.push(label);
  }
  return out.length ? out : ['Electronics'];
}

/** Composes a street address from OSM addr:* tags, best-effort. */
function addressFrom(tags: Record<string, string>): string {
  const parts = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:suburb'],
    tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village'],
    tags['addr:postcode'],
  ].filter((p) => p && p.length);
  return parts.join(', ') || 'Address not listed on OpenStreetMap';
}

/**
 * Real nearby recyclers from live OpenStreetMap via Overpass, sorted by real
 * distance. Falls back across mirrors; returns [] rather than inventing data.
 */
export async function searchRecyclers(center: Coords, radiusM = 20000): Promise<Recycler[]> {
  const body = 'data=' + encodeURIComponent(overpassQuery(center, radiusM));

  let elements: OverpassElement[] = [];
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: OverpassElement[] };
      elements = json.elements ?? [];
      break;
    } catch {
      /* try the next mirror */
    }
  }

  const seen = new Set<string>();
  const recyclers: Recycler[] = [];
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    const tags = el.tags ?? {};
    const name = tags.name ?? tags.operator ?? tags.brand;
    if (lat == null || lng == null || !name) continue;
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    recyclers.push({
      id,
      name,
      lat,
      lng,
      address: addressFrom(tags),
      accepts: acceptsFrom(tags),
      distanceKm: haversineKm(center, { lat, lng }),
    });
  }

  return recyclers.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 12);
}
