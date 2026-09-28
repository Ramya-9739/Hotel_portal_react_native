// =============================================================================
// src/services/activeHotelService.js
// Active Hotel Property State Manager
//
// Core Flow:
//   ADMIN LOGIN -> HOTEL SEARCH / SELECT -> SAVE -> ACTIVE HOTEL -> GUEST WEBSITE
//
// Rules:
//   1. ZERO hardcoded hotels, cities, or places.
//   2. ZERO fallback to any preset data.
//   3. Active hotel comes ONLY from Admin selection via real place search.
//   4. Hotel coordinates are the dynamic origin for all directions.
//   5. If no hotel configured: guest portal shows unconfigured state.
// =============================================================================

import { Platform } from 'react-native';
import { searchNearby } from './placeSearchService';

const ACTIVE_HOTEL_STORAGE_KEY = '@hotel_portal_active_hotel';
const CUSTOM_HOTELS_STORAGE_KEY = '@hotel_portal_custom_hotels';

class ActiveHotelService {
  constructor() {
    this.activeHotel = null;
    this.customHotels = [];
    this.listeners = new Set();
    this.initFromStorage();
  }

  initFromStorage() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedHotel = window.localStorage.getItem(ACTIVE_HOTEL_STORAGE_KEY);
        if (storedHotel) this.activeHotel = JSON.parse(storedHotel);
        const storedCustom = window.localStorage.getItem(CUSTOM_HOTELS_STORAGE_KEY);
        if (storedCustom) this.customHotels = JSON.parse(storedCustom);
      } catch (err) {
        console.warn('[ActiveHotelService] Storage read error:', err);
      }
    }
    // Also check backend MongoDB
    this.syncFromBackend();
  }

  async syncFromBackend() {
    try {
      const { apiService } = await import('./apiService.js');
      const res = await apiService.fetchHotels();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        if (!this.activeHotel) {
          this.setActiveHotel(res.data[0]);
        }
      }
    } catch (e) {
      // Backend offline or starting up
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn(this.activeHotel);
      } catch (e) {
        console.error('[ActiveHotelService] Listener error:', e);
      }
    });
  }

  getActiveHotel() {
    return this.activeHotel;
  }

  setActiveHotel(hotel) {
    if (!hotel) {
      this.activeHotel = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(ACTIVE_HOTEL_STORAGE_KEY);
      }
      this.notify();
      return null;
    }
    this.activeHotel = hotel;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(ACTIVE_HOTEL_STORAGE_KEY, JSON.stringify(hotel));
      } catch (e) {
        console.warn('[ActiveHotelService] Storage write error:', e);
      }
    }
    this.notify();
    return hotel;
  }

  /**
   * Saves and activates a hotel selected by the Admin.
   * The hotel data comes from real place search — no defaults, no presets.
   */
  saveAndActivateHotel(hotelData) {
    const id = hotelData.id || ('hotel-' + Date.now());
    const lat = parseFloat(hotelData.latitude != null ? hotelData.latitude : hotelData.lat);
    const lng = parseFloat(hotelData.longitude != null ? hotelData.longitude : hotelData.lng);

    // Images: use only what the admin uploaded or what came from the place search
    const imagesList = (Array.isArray(hotelData.images) && hotelData.images.length > 0)
      ? hotelData.images.map((img) => (typeof img === 'object' && img && img.url ? img.url : img)).filter(Boolean).slice(0, 8)
      : (hotelData.imageLink ? [hotelData.imageLink] : []);

    const newHotel = {
      ...hotelData,
      id: id,
      name: hotelData.name || hotelData.title || '',
      title: hotelData.name || hotelData.title || '',
      subtitle: hotelData.subtitle || hotelData.address || '',
      address: hotelData.address || '',
      city: hotelData.city || hotelData.location || '',
      location: hotelData.location || hotelData.city || '',
      latitude: !isNaN(lat) ? lat : null,
      longitude: !isNaN(lng) ? lng : null,
      lat: !isNaN(lat) ? lat : null,
      lng: !isNaN(lng) ? lng : null,
      rating: hotelData.rating ? parseFloat(hotelData.rating) : null,
      images: imagesList,
      imageObjects: Array.isArray(hotelData.imageObjects) ? hotelData.imageObjects.slice(0, 8) : [],
      imageLink: imagesList[0] || null,
      googleMapsUrl: (!isNaN(lat) && !isNaN(lng))
        ? ('https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng)
        : null,
      // nearby is loaded by real search — starts empty, populated by placeSearchService
      nearby: hotelData.nearby || {
        touristPlaces: [],
        shopping: [],
        transportation: [],
        hospitals: [],
        pharmacies: [],
        gyms: [],
        takeaways: [],
        restaurants: []
      },
      customCategories: Array.isArray(hotelData.customCategories) ? hotelData.customCategories : [],
    };

    // Persist to custom hotels list
    const existingIndex = this.customHotels.findIndex((h) => h.id === id);
    if (existingIndex >= 0) {
      this.customHotels[existingIndex] = newHotel;
    } else {
      this.customHotels.push(newHotel);
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(CUSTOM_HOTELS_STORAGE_KEY, JSON.stringify(this.customHotels));
      } catch (e) {}
    }

    // Persist to MongoDB backend asynchronously
    import('./apiService.js').then(({ apiService }) => {
      apiService.createHotel(newHotel).catch(() => {});
    }).catch(() => {});

    return this.setActiveHotel(newHotel);
  }

  /**
   * Automatically populates real nearby places for the active hotel across all categories.
   * Uses real GPS coordinates of the active hotel.
   * If a category has no places found, it remains an empty array [].
   */
  async populateAllNearby(hotel = null, radius = 5000, onProgress = null) {
    const targetHotel = hotel || this.activeHotel;
    if (!targetHotel) return null;
    const lat = targetHotel.latitude != null ? targetHotel.latitude : targetHotel.lat;
    const lng = targetHotel.longitude != null ? targetHotel.longitude : targetHotel.lng;
    if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return targetHotel;

    const categories = [
      { key: 'touristPlaces', searchCat: 'tourist', label: 'Tourist Landmarks' },
      { key: 'shopping', searchCat: 'shopping', label: 'Shopping Destinations' },
      { key: 'transportation', searchCat: 'transport', label: 'Transit Hubs' },
      { key: 'hospitals', searchCat: 'hospital', label: 'Hospitals' },
      { key: 'pharmacies', searchCat: 'pharmacy', label: 'Pharmacies' },
      { key: 'gyms', searchCat: 'gym', label: 'Gyms & Wellness' },
      { key: 'takeaways', searchCat: 'takeaway', label: 'Takeaways' },
      { key: 'restaurants', searchCat: 'restaurant', label: 'Bistros & Dining' },
    ];

    const updatedNearby = { ...(targetHotel.nearby || {}) };

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      if (onProgress) onProgress(cat.label, i + 1, categories.length);
      try {
        const res = await searchNearby(lat, lng, cat.searchCat, radius);
        if (res.success && Array.isArray(res.places)) {
          updatedNearby[cat.key] = res.places;
        } else {
          updatedNearby[cat.key] = [];
        }
      } catch (err) {
        console.warn(`[ActiveHotelService] Nearby search failed for ${cat.key}:`, err.message);
        updatedNearby[cat.key] = [];
      }
    }

    const updatedHotel = {
      ...targetHotel,
      nearby: updatedNearby,
    };

    return this.setActiveHotel(updatedHotel);
  }

  /**
   * Returns all hotels saved by the Admin (no preset/hardcoded hotels).
   */
  getAllHotels() {
    return [...this.customHotels];
  }

  /**
   * Updates a category of nearby places on the active hotel.
   * Used when real searchNearby results come back and need to be stored.
   */
  updateNearbyCategory(categoryKey, places) {
    if (!this.activeHotel) return null;
    const updatedHotel = {
      ...this.activeHotel,
      nearby: {
        ...(this.activeHotel.nearby || {}),
        [categoryKey]: places
      }
    };
    return this.setActiveHotel(updatedHotel);
  }

  addPlaceToActiveHotel(categoryKey, placeData) {
    if (!this.activeHotel) return null;
    const updatedHotel = { ...this.activeHotel };
    if (!updatedHotel.nearby) updatedHotel.nearby = {};
    if (!Array.isArray(updatedHotel.nearby[categoryKey])) updatedHotel.nearby[categoryKey] = [];
    const newPlace = {
      ...placeData,
      id: placeData.id || (categoryKey + '-' + Date.now()),
      latitude: parseFloat(placeData.latitude) || null,
      longitude: parseFloat(placeData.longitude) || null,
    };
    updatedHotel.nearby[categoryKey] = [newPlace, ...updatedHotel.nearby[categoryKey]];
    return this.setActiveHotel(updatedHotel);
  }

  deletePlaceFromActiveHotel(categoryKey, placeId) {
    if (!this.activeHotel || !this.activeHotel.nearby) return null;
    const updatedHotel = { ...this.activeHotel };
    if (Array.isArray(updatedHotel.nearby[categoryKey])) {
      updatedHotel.nearby[categoryKey] = updatedHotel.nearby[categoryKey].filter((p) => String(p.id) !== String(placeId));
    }
    return this.setActiveHotel(updatedHotel);
  }

  updatePlaceInActiveHotel(categoryKey, placeId, updatedPlaceData) {
    if (!this.activeHotel || !this.activeHotel.nearby) return null;
    const updatedHotel = { ...this.activeHotel };
    if (!Array.isArray(updatedHotel.nearby[categoryKey])) return null;
    const placeIndex = updatedHotel.nearby[categoryKey].findIndex((p) => String(p.id) === String(placeId));
    if (placeIndex >= 0) {
      const existing = updatedHotel.nearby[categoryKey][placeIndex];
      const latVal = parseFloat(updatedPlaceData.latitude != null ? updatedPlaceData.latitude : updatedPlaceData.lat);
      const lngVal = parseFloat(updatedPlaceData.longitude != null ? updatedPlaceData.longitude : updatedPlaceData.lng);
      updatedHotel.nearby[categoryKey][placeIndex] = {
        ...existing,
        ...updatedPlaceData,
        id: existing.id || placeId,
        latitude: !isNaN(latVal) ? latVal : existing.latitude,
        longitude: !isNaN(lngVal) ? lngVal : existing.longitude,
      };
      return this.setActiveHotel(updatedHotel);
    }
    return null;
  }

  addCustomCategory(categoryData) {
    if (!this.activeHotel) return null;
    const updatedHotel = { ...this.activeHotel };
    if (!Array.isArray(updatedHotel.customCategories)) updatedHotel.customCategories = [];
    const catId = (typeof categoryData === 'object' && categoryData.id) ? categoryData.id : ('custom-cat-' + Date.now());
    const label = (typeof categoryData === 'object' && categoryData.label) ? categoryData.label : (typeof categoryData === 'string' ? categoryData : 'Custom Category');
    const icon = (typeof categoryData === 'object' && categoryData.icon) ? categoryData.icon : 'star';
    updatedHotel.customCategories.push({ id: catId, label: label, icon: icon, items: [] });
    return this.setActiveHotel(updatedHotel);
  }

  clearAllNearbyPlaces() {
    if (!this.activeHotel) return null;
    const updatedHotel = {
      ...this.activeHotel,
      nearby: {
        touristPlaces: [],
        shopping: [],
        transportation: [],
        hospitals: [],
        pharmacies: [],
        gyms: [],
        takeaways: [],
        restaurants: []
      },
      customCategories: []
    };
    return this.setActiveHotel(updatedHotel);
  }
}

export const activeHotelService = new ActiveHotelService();

/**
 * Dynamic Turn-by-Turn Directions
 * ORIGIN: Active Hotel latitude and longitude (always — no exceptions)
 * DESTINATION: Place latitude and longitude
 * Returns null if coordinates are missing — never guesses
 */
export function calculateDynamicDirections(hotel, place) {
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

export const getDirections = calculateDynamicDirections;
export const getDirectionsUrl = calculateDynamicDirections;
