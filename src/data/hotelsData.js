// =============================================================================
// src/data/hotelsData.js
// Utility helpers only - ZERO hardcoded hotels, cities, or places data.
// All hotel data comes from Admin-configured active hotel stored in database & localStorage.
// =============================================================================

import { Platform, Linking } from 'react-native';

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
 * Robust coordinates extractor.
 * Handles:
 * - entity.latitude / entity.longitude (number or string)
 * - entity.lat / entity.lng (number or string)
 * - entity.hotelLatLong (e.g. "12.9753,77.6062")
 * - coordinate string in entity.location
 * Validates range: lat [-90, 90], lng [-180, 180], non-zero.
 */
export function extractEntityCoordinates(entity) {
  if (!entity) return { lat: null, lng: null, isValid: false };

  let lat = null;
  let lng = null;

  // 1. Direct latitude / lat
  if (entity.latitude != null && entity.latitude !== '') {
    const parsed = parseFloat(entity.latitude);
    if (!isNaN(parsed)) lat = parsed;
  } else if (entity.lat != null && entity.lat !== '') {
    const parsed = parseFloat(entity.lat);
    if (!isNaN(parsed)) lat = parsed;
  }

  // 2. Direct longitude / lng
  if (entity.longitude != null && entity.longitude !== '') {
    const parsed = parseFloat(entity.longitude);
    if (!isNaN(parsed)) lng = parsed;
  } else if (entity.lng != null && entity.lng !== '') {
    const parsed = parseFloat(entity.lng);
    if (!isNaN(parsed)) lng = parsed;
  }

  // 3. hotelLatLong string (e.g. "12.9753,77.6062")
  if ((lat == null || lng == null) && typeof entity.hotelLatLong === 'string') {
    const parts = entity.hotelLatLong.split(',');
    if (parts.length >= 2) {
      const pLat = parseFloat(parts[0].trim());
      const pLng = parseFloat(parts[1].trim());
      if (!isNaN(pLat) && !isNaN(pLng)) {
        lat = pLat;
        lng = pLng;
      }
    }
  }

  // 4. Coordinates embedded in location or address string
  if ((lat == null || lng == null) && typeof entity.location === 'string') {
    const match = entity.location.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
    if (match) {
      const pLat = parseFloat(match[1]);
      const pLng = parseFloat(match[3]);
      if (!isNaN(pLat) && !isNaN(pLng)) {
        lat = pLat;
        lng = pLng;
      }
    }
  }

  const isValid =
    lat != null &&
    lng != null &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0);

  return {
    lat: isValid ? lat : null,
    lng: isValid ? lng : null,
    isValid,
  };
}

/**
 * Returns formatted complete address for fallback search & directions
 */
export function getEntityFullAddress(entity, fallbackCity = '') {
  if (!entity) return fallbackCity || '';
  const title = (entity.name || entity.hotelName || entity.title || '').replace(/\(.*?\)/g, '').replace(/•.*$/g, '').trim();
  const address = (entity.address || entity.hotelAddress || entity.location || '').replace(/•.*$/g, '').trim();
  const city = entity.city || fallbackCity || '';

  const parts = [title, address, city].filter(Boolean);
  const uniqueParts = [];
  for (const part of parts) {
    if (!uniqueParts.some((p) => p.toLowerCase().includes(part.toLowerCase()) || part.toLowerCase().includes(p.toLowerCase()))) {
      uniqueParts.push(part);
    }
  }
  return uniqueParts.length > 0 ? uniqueParts.join(', ') : (city || 'Location');
}

/**
 * Generates Google Maps View URL for a hotel or place.
 * Format: https://www.google.com/maps/search/?api=1&query=LATITUDE,LONGITUDE
 * Fallback: https://www.google.com/maps/search/?api=1&query=ENCODED_ADDRESS
 */
export function getHotelLocationUrl(hotel) {
  if (!hotel) return 'https://www.google.com/maps/search/?api=1&query=Hotel';
  const coords = extractEntityCoordinates(hotel);
  if (coords.isValid) {
    return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
  }
  const addr = getEntityFullAddress(hotel);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr || hotel.name || 'Hotel')}`;
}

/**
 * Generates Google Maps Driving Directions URL TO a hotel (hotel as destination).
 * Format: https://www.google.com/maps/dir/?api=1&destination=LATITUDE,LONGITUDE
 * Fallback: https://www.google.com/maps/dir/?api=1&destination=ENCODED_ADDRESS
 */
export function getDirectionsToHotelUrl(hotel) {
  if (!hotel) return 'https://www.google.com/maps';
  const coords = extractEntityCoordinates(hotel);
  if (coords.isValid) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  }
  const addr = getEntityFullAddress(hotel);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr || hotel.name || 'Hotel')}`;
}

/**
 * Generates Google Maps driving directions URL from active hotel to a destination venue.
 * ORIGIN: Active Hotel latitude,longitude OR stored address.
 * DESTINATION: Venue latitude,longitude OR stored address.
 * NEVER hardcodes coordinates. Validates coordinate sensible distance.
 */
export function getDirectionsUrl(hotel, place) {
  if (!hotel && !place) return null;

  // 1. Resolve Origin
  let originParam = '';
  if (hotel) {
    const oCoords = extractEntityCoordinates(hotel);
    if (oCoords.isValid) {
      originParam = `${oCoords.lat},${oCoords.lng}`;
    } else {
      const oAddr = getEntityFullAddress(hotel);
      originParam = encodeURIComponent(oAddr || hotel.name || 'Hotel');
    }
  }

  // 2. Resolve Destination
  if (!place) {
    return originParam
      ? `https://www.google.com/maps/search/?api=1&query=${originParam}`
      : 'https://www.google.com/maps';
  }

  let destParam = '';
  const dCoords = extractEntityCoordinates(place);
  const oCoords = hotel ? extractEntityCoordinates(hotel) : { isValid: false };

  // Sanity check: If both coordinates exist and are physically separated by > 3 degrees (~330km),
  // they may belong to mismatched test presets. If so, fall back to place title + address + city
  let coordsSensible = dCoords.isValid;
  if (coordsSensible && oCoords.isValid) {
    const latDiff = Math.abs(dCoords.lat - oCoords.lat);
    const lngDiff = Math.abs(dCoords.lng - oCoords.lng);
    if (latDiff > 3.0 || lngDiff > 3.0) {
      coordsSensible = false;
    }
  }

  if (coordsSensible) {
    destParam = `${dCoords.lat},${dCoords.lng}`;
  } else {
    const dAddr = getEntityFullAddress(place, hotel?.city);
    destParam = encodeURIComponent(dAddr || place.title || place.name || 'Destination');
  }

  if (originParam && destParam) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destParam}`;
}

// Universal alias
export const calculateDynamicDirections = getDirectionsUrl;

/**
 * Universal cross-platform Google Maps launcher.
 * Opens in new tab on Web with security flags, or via native Linking on iOS/Android.
 */
export function openMapLink(url) {
  if (!url) return;
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } else {
    Linking.openURL(url).catch((err) => console.error('[MapLauncher] Error opening maps:', err));
  }
}

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
