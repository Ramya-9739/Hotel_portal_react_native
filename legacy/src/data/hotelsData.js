// =============================================================================
// src/data/hotelsData.js
// Utility helpers only - ZERO hardcoded hotels, cities, or places data.
// All hotel data comes from Admin-configured active hotel stored in localStorage.
// =============================================================================

/**
 * Safe missing-data fallback helper.
 * Never returns undefined, null, or [object Object]
 */
export function safeVal(value, fallback) {
  if (fallback === undefined) fallback = 'Not available';
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  if (typeof value === 'number' && isNaN(value)) return fallback;
  return value;
}

/**
 * Generates a Google Maps driving directions URL.
 * ORIGIN: Active Hotel exact latitude and longitude (NEVER browser location, NEVER hardcoded).
 * DESTINATION: Target Place exact latitude and longitude.
 * Returns null if either coordinate pair is missing.
 */
export function getDirectionsUrl(hotel, place) {
  if (!hotel) return null;
  const originLat = hotel.latitude != null ? hotel.latitude : hotel.lat;
  const originLng = hotel.longitude != null ? hotel.longitude : hotel.lng;
  if (!originLat || !originLng || isNaN(originLat) || isNaN(originLng)) return null;

  if (!place) return null;
  const destLat = place.latitude != null ? place.latitude : place.lat;
  const destLng = place.longitude != null ? place.longitude : place.lng;

  if (!destLat || !destLng || isNaN(destLat) || isNaN(destLng)) {
    const destQuery = place.address
      ? ((place.title || place.name || '') + ', ' + place.address)
      : ((place.title || place.name || '') + ', ' + (hotel.city || ''));
    return 'https://www.google.com/maps/dir/?api=1&origin=' + originLat + ',' + originLng + '&destination=' + encodeURIComponent(destQuery) + '&travelmode=driving';
  }

  return 'https://www.google.com/maps/dir/?api=1&origin=' + originLat + ',' + originLng + '&destination=' + destLat + ',' + destLng + '&travelmode=driving';
}

// Universal alias
export const calculateDynamicDirections = getDirectionsUrl;

/**
 * HOTELS_DATABASE — intentionally empty.
 * No hotels are preloaded into the application.
 * Hotels are selected by the Admin using real place search.
 */
export const HOTELS_DATABASE = [];

// Image fallbacks (neutral placeholders only — not hotel-specific)
export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85';
export const HOSPITAL_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&q=80';
export const PHARMACY_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1586015555751-63c2999908cf?w=800&q=80';
export const GYM_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80';
export const TOURIST_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80';
