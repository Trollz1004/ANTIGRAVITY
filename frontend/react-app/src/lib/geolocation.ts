/**
 * Privacy-first geolocation for YouAndINotAI.
 * GPS is OFF by default. User opts in per session — never stored, never background-tracked.
 * Coordinates are used only to compute radius bounding boxes for meetup filtering.
 * Nothing is sent to the server without explicit user action.
 */

export interface Coords {
  lat: number;
  lng: number;
}

export type RadiusMiles = 5 | 10 | 25;

// ── One-shot, opt-in geolocation ─────────────────────────────────────────────

let _cachedCoords: Coords | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — never persisted across sessions

/**
 * Request the user's location. Shows the browser permission prompt.
 * Returns null if denied or unavailable. Never throws.
 */
export async function requestLocation(): Promise<Coords | null> {
  if (Date.now() < _cacheExpiry && _cachedCoords) return _cachedCoords;

  if (!navigator.geolocation) return null;

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        _cachedCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        _cacheExpiry = Date.now() + CACHE_TTL_MS;
        resolve(_cachedCoords);
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: CACHE_TTL_MS }
    );
  });
}

/** Clear the in-memory location cache (e.g. on session end). */
export function clearLocationCache(): void {
  _cachedCoords = null;
  _cacheExpiry = 0;
}

/** Returns true only if the browser supports geolocation. */
export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

// ── Bounding box helpers ──────────────────────────────────────────────────────

const EARTH_RADIUS_MILES = 3958.8;
const DEG_TO_RAD = Math.PI / 180;

/**
 * Compute a rough bounding box for a given center + radius.
 * Used to pass lat/lng bounds to the backend for meetup filtering.
 */
export interface BoundingBox {
  lat_min: number;
  lat_max: number;
  lng_min: number;
  lng_max: number;
}

export function boundingBox(
  center: Coords,
  radiusMiles: RadiusMiles
): BoundingBox {
  const latDelta = radiusMiles / EARTH_RADIUS_MILES / DEG_TO_RAD;
  const lngDelta = latDelta / Math.cos(center.lat * DEG_TO_RAD);
  return {
    lat_min: center.lat - latDelta,
    lat_max: center.lat + latDelta,
    lng_min: center.lng - lngDelta,
    lng_max: center.lng + lngDelta,
  };
}

/**
 * Haversine distance between two coordinate pairs, in miles.
 * Used for client-side sorting after results are returned.
 */
export function distanceMiles(a: Coords, b: Coords): number {
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLng = (b.lng - a.lng) * DEG_TO_RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * DEG_TO_RAD) *
      Math.cos(b.lat * DEG_TO_RAD) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}
