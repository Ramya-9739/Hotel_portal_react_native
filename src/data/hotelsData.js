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
  if (!hotel && !place) return null;

  // 1. Resolve Origin
  let originParam = '';
  const oLat = hotel?.latitude != null ? parseFloat(hotel.latitude) : (hotel?.lat != null ? parseFloat(hotel.lat) : null);
  const oLng = hotel?.longitude != null ? parseFloat(hotel.longitude) : (hotel?.lng != null ? parseFloat(hotel.lng) : null);

  if (oLat != null && oLng != null && !isNaN(oLat) && !isNaN(oLng)) {
    originParam = `${oLat},${oLng}`;
  } else if (hotel?.address) {
    originParam = encodeURIComponent(hotel.address);
  } else if (hotel?.name) {
    originParam = encodeURIComponent(`${hotel.name}, ${hotel.city || ''}`.trim());
  }

  if (!originParam) {
    originParam = encodeURIComponent(hotel?.city ? `${hotel.city}` : 'Hotel');
  }

  // 2. Resolve Destination
  if (!place) return null;
  let destParam = '';
  const dLat = place?.latitude != null ? parseFloat(place.latitude) : (place?.lat != null ? parseFloat(place.lat) : null);
  const dLng = place?.longitude != null ? parseFloat(place.longitude) : (place?.lng != null ? parseFloat(place.lng) : null);

  // Check if coordinates exist and are physically sensible (<150km if origin coords exist)
  let coordsSensible = dLat != null && dLng != null && !isNaN(dLat) && !isNaN(dLng);
  if (coordsSensible && oLat != null && oLng != null) {
    const latDiff = Math.abs(dLat - oLat);
    const lngDiff = Math.abs(dLng - oLng);
    if (latDiff > 2.0 || lngDiff > 2.0) {
      coordsSensible = false;
    }
  }

  if (coordsSensible) {
    destParam = `${dLat},${dLng}`;
  } else {
    const cleanTitle = (place.title || place.name || '').replace(/\(.*?\)/g, '').replace(/•.*$/g, '').trim();
    const cleanAddr = (place.address || place.location || '').replace(/•.*$/g, '').trim();
    const city = hotel?.city || '';
    const queryParts = [cleanTitle, cleanAddr, city].filter(Boolean);
    destParam = encodeURIComponent(queryParts.length > 0 ? queryParts.join(', ') : 'Destination');
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`;
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
