/**
 * NearbyRecyclers — real map, real recyclers, pick anywhere or use your location.
 *
 * Two real ways to choose a place, both keyless and live:
 *   • the browser Geolocation API (with permission), and
 *   • a search box that geocodes any Indian state / district / city / locality
 *     through OpenStreetMap's Nominatim.
 * Around whatever centre is chosen, it queries live OpenStreetMap (Overpass)
 * for recycling points that accept electrical/electronic waste, draws them on a
 * Leaflet map, and lists them by real distance. Every state is honest — it
 * never invents a recycler to fill the gap.
 */

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Icon from './Icon';
import {
  geocodePlace,
  getUserLocation,
  loadLeaflet,
  searchRecyclers,
} from '../lib/maps';
import type { Coords, LMap, LMarker, Place, Recycler } from '../lib/maps';

/** Delhi city centre — the only fallback, used when location is denied and no
   place has been picked yet, and always disclosed as approximate. */
const FALLBACK: Coords = { lat: 28.6139, lng: 77.209 };

type Phase = 'locating' | 'searching' | 'ready' | 'error';

export interface NearbyRecyclersProps {
  /** Bubbles the chosen recycler's name up so the confirm card can name it. */
  onSelect?: (name: string) => void;
}

export default function NearbyRecyclers({ onSelect }: NearbyRecyclersProps) {
  const [phase, setPhase] = useState<Phase>('locating');
  const [recyclers, setRecyclers] = useState<Recycler[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [placeLabel, setPlaceLabel] = useState<string>('');
  const [notice, setNotice] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [geocoding, setGeocoding] = useState(false);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LMap | null>(null);
  const markersRef = useRef<LMarker[]>([]);

  /** Draws the user pin + one marker per recycler, replacing any previous set. */
  function draw(
    L: Awaited<ReturnType<typeof loadLeaflet>>,
    center: Coords,
    found: Recycler[],
    approx: boolean,
  ): void {
    const el = boxRef.current;
    if (!el) return;

    if (!mapRef.current) {
      const map = L.map(el, { scrollWheelZoom: false }).setView(
        [center.lat, center.lng],
        12,
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    }
    const map = mapRef.current;

    for (const m of markersRef.current) map.removeLayer(m);
    markersRef.current = [];

    const here = L.circleMarker([center.lat, center.lng], {
      radius: 8,
      color: '#38e08a',
      fillColor: '#38e08a',
      fillOpacity: 0.9,
      weight: 2,
    })
      .addTo(map)
      .bindPopup(approx ? 'Approximate centre' : 'Selected location');
    markersRef.current.push(here);

    const bounds: [number, number][] = [[center.lat, center.lng]];
    for (const r of found) {
      bounds.push([r.lat, r.lng]);
      const marker = L.marker([r.lat, r.lng])
        .addTo(map)
        .bindPopup(`<strong>${r.name}</strong><br/>${r.address}`)
        .on('click', () => selectRecycler(r));
      markersRef.current.push(marker);
    }
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });
    else map.setView([center.lat, center.lng], 12);
  }

  /** Loads the map + live recyclers around a centre and renders both. */
  async function doSearch(center: Coords, label: string, approx = false): Promise<void> {
    setPhase('searching');
    setPlaceLabel(label);
    setSuggestions([]);
    try {
      const [L, found] = await Promise.all([loadLeaflet(), searchRecyclers(center)]);
      draw(L, center, found, approx);
      setRecyclers(found);
      setPhase('ready');
    } catch {
      setPhase('error');
    }
  }

  // First load: try the real device location, fall back to Delhi if denied.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const coords = await getUserLocation();
        if (!cancelled) {
          setNotice('');
          await doSearch(coords, 'Your current location');
        }
      } catch {
        if (!cancelled) {
          setNotice(
            'Location permission was denied, so this starts around Delhi. Search any place below, or allow location and press “Use my location”.',
          );
          await doSearch(FALLBACK, 'Delhi (approximate)', true);
        }
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Geocodes the typed place and recentres on the best match. */
  async function onSearchSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!query.trim()) return;
    setGeocoding(true);
    setNotice('');
    const places = await geocodePlace(query);
    setGeocoding(false);
    if (places.length === 0) {
      setNotice(`No place called “${query}” was found on OpenStreetMap. Try a district or city name.`);
      return;
    }
    if (places.length > 1) setSuggestions(places.slice(1));
    await doSearch(places[0], places[0].label);
  }

  /** Switches back to the real device location. */
  async function useMyLocation(): Promise<void> {
    setPhase('locating');
    setNotice('');
    try {
      const coords = await getUserLocation();
      await doSearch(coords, 'Your current location');
    } catch {
      setNotice('Could not read your location — check the browser location permission and try again.');
      setPhase('ready');
    }
  }

  function selectRecycler(r: Recycler): void {
    setSelected(r.id);
    onSelect?.(r.name);
    mapRef.current?.setView([r.lat, r.lng], 15);
  }

  return (
    <div className="col" style={{ gap: '1rem' }}>
      {/* ── Place picker ── */}
      <form className="place-bar" onSubmit={onSearchSubmit}>
        <span className="place-bar-icon" aria-hidden="true">
          <Icon name="map" size={16} />
        </span>
        <input
          className="place-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any state, district or city — e.g. Bhubaneswar, Odisha"
          aria-label="Search a place"
        />
        <button type="submit" className="place-go" disabled={geocoding}>
          {geocoding ? 'Finding…' : 'Search'}
        </button>
        <button type="button" className="place-loc" onClick={useMyLocation}>
          <Icon name="world" size={14} />
          Use my location
        </button>
      </form>

      {placeLabel ? (
        <p className="mono faint" style={{ fontSize: '0.66rem' }}>
          Showing recyclers around: <span style={{ color: 'var(--leaf-hi)' }}>{placeLabel}</span>
        </p>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="row row-wrap" style={{ gap: '0.4rem' }}>
          <span className="mono faint" style={{ fontSize: '0.62rem' }}>Other matches:</span>
          {suggestions.map((p) => (
            <button
              key={`${p.lat},${p.lng}`}
              type="button"
              className="badge badge-quiet"
              style={{ cursor: 'pointer' }}
              onClick={() => doSearch(p, p.label)}
            >
              {p.label.split(',').slice(0, 2).join(', ')}
            </button>
          ))}
        </div>
      ) : null}

      <div className="recycler-map" ref={boxRef} aria-label="Map of nearby recyclers" />

      {notice ? (
        <div className="note note-amber">
          <Icon name="info" size={16} />
          {notice}
        </div>
      ) : null}

      {phase === 'locating' ? (
        <div className="note note-blue">
          <Icon name="map" size={16} />
          Asking your browser for your location — allow it, or search a place above.
        </div>
      ) : null}

      {phase === 'searching' ? (
        <div className="note note-blue">
          <Icon name="world" size={16} />
          Querying live OpenStreetMap for collection points nearby…
        </div>
      ) : null}

      {phase === 'error' ? (
        <div className="note note-amber">
          <Icon name="info" size={16} />
          Could not reach the map or the OpenStreetMap data service. Check your
          connection and try again — no placeholder results are shown on purpose.
        </div>
      ) : null}

      {phase === 'ready' && recyclers.length === 0 ? (
        <div className="note note-amber">
          <Icon name="info" size={16} />
          OpenStreetMap has no e-waste collection points mapped around here yet.
          That is the honest state — try a nearby city, nothing is invented.
        </div>
      ) : null}

      {phase === 'ready' && recyclers.length > 0 ? (
        <div className="recycler-grid">
          {recyclers.map((r) => {
            const isSel = selected === r.id;
            return (
              <button
                key={r.id}
                type="button"
                className={`recycler-card${isSel ? ' is-selected' : ''}`}
                onClick={() => selectRecycler(r)}
              >
                <div className="spread" style={{ alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span className="recycler-icon" aria-hidden="true">
                    <Icon name="recycle" size={18} />
                  </span>
                  <span className="badge badge-teal" style={{ flexShrink: 0 }}>
                    {r.distanceKm.toFixed(1)} km
                  </span>
                </div>

                <strong style={{ fontWeight: 600 }}>{r.name}</strong>
                <p className="card-body" style={{ fontSize: '0.72rem' }}>{r.address}</p>

                <div className="row row-wrap" style={{ gap: '0.3rem' }}>
                  {r.accepts.map((a) => (
                    <span key={a} className="badge badge-quiet" style={{ fontSize: '0.58rem' }}>
                      {a}
                    </span>
                  ))}
                </div>

                <div className="spread" style={{ marginTop: '0.15rem' }}>
                  <a
                    href={`https://www.openstreetmap.org/${r.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mono faint"
                    style={{ fontSize: '0.6rem' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View on OpenStreetMap ↗
                  </a>
                  {isSel ? (
                    <span className="badge badge-teal" style={{ fontSize: '0.58rem' }}>
                      <Icon name="check" size={11} />
                      Selected
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {phase === 'ready' && recyclers.length > 0 ? (
        <p className="mono faint" style={{ fontSize: '0.58rem' }}>
          Live data from OpenStreetMap contributors via the Overpass API · map tiles © OpenStreetMap.
          Distances are straight-line from the chosen centre.
        </p>
      ) : null}
    </div>
  );
}



