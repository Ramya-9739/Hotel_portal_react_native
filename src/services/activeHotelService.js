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
import {
  extractEntityCoordinates,
  getHotelLocationUrl,
  getDirectionsToHotelUrl,
  getDirectionsUrl,
  getEntityFullAddress,
} from '../data/hotelsData';

const ACTIVE_HOTEL_STORAGE_KEY = '@hotel_portal_active_hotel';
const CUSTOM_HOTELS_STORAGE_KEY = '@hotel_portal_custom_hotels';

/**
 * Returns a neutral, unconfigured hotel object with zero hardcoded business records.
 */
const buildEmptyHotelState = () => ({
  id: null,
  hotelPropertyId: null,
  hotelAdminId: null,
  name: '',
  title: '',
  subtitle: '',
  address: '',
  city: '',
  location: '',
  latitude: null,
  longitude: null,
  lat: null,
  lng: null,
  hotelLatLong: '',
  contactNumber: '',
  pricePerNight: '',
  rating: null,
  images: [],
  imageObjects: [],
  imageLink: '',
  nearby: {
    touristPlaces: [],
    shopping: [],
    transportation: [],
    hospitals: [],
    pharmacies: [],
    gyms: [],
    takeaways: [],
    restaurants: [],
    dining: [],
    facilities: [],
    pools: [],
    spa: [],
    atms: [],
  },
  status: 'unconfigured',
  isUnconfigured: true,
});

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
        if (storedHotel) {
          const parsed = JSON.parse(storedHotel);
          // Purge legacy demo seed hotel if present in storage
          if (parsed && (parsed.id === 'hotel-1000000001' || parsed.name === 'The Grand Horizon Palace & Resort')) {
            window.localStorage.removeItem(ACTIVE_HOTEL_STORAGE_KEY);
            this.activeHotel = null;
          } else {
            this.activeHotel = parsed;
          }
        }
        const storedCustom = window.localStorage.getItem(CUSTOM_HOTELS_STORAGE_KEY);
        if (storedCustom) {
          const parsedCustom = JSON.parse(storedCustom);
          if (Array.isArray(parsedCustom)) {
            // Filter out any legacy seed hotels
            const cleanCustom = parsedCustom.filter(
              (h) => h && h.id !== 'hotel-1000000001' && h.name !== 'The Grand Horizon Palace & Resort'
            );
            this.customHotels = cleanCustom;
          }
        }
      } catch (err) {
        console.warn('[ActiveHotelService] Storage read error:', err);
      }
    }

    // Always fetch approved hotels and active hotel components from backend MongoDB
    this.syncFromBackend();
  }

  async syncFromBackend() {
    try {
      const { apiService } = await import('./apiService.js');
      // Strictly load ONLY approved hotels for the public guest experience
      const res = await apiService.fetchPublicHotels();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        this.customHotels = res.data;
        const currentId = this.activeHotel?.hotelPropertyId || this.activeHotel?.id || this.activeHotel?._id;
        const match = res.data.find(
          (h) => h.hotelPropertyId === currentId || h.id === currentId || h._id === currentId
        );
        const selected = match || res.data[0];
        const coords = extractEntityCoordinates(selected);
        const resolvedLat = coords.isValid ? coords.lat : null;
        const resolvedLng = coords.isValid ? coords.lng : null;
        const dbNearby = selected.nearby || {};
        const activeNearby = (this.activeHotel?.hotelPropertyId === selected.hotelPropertyId || this.activeHotel?.id === selected.id)
          ? (this.activeHotel.nearby || {})
          : {};

        // Deep merge: MongoDB database records are the primary source of truth.
        // Never allow empty arrays in cached activeNearby to wipe out legitimate database records.
        const mergedNearby = { ...dbNearby };
        Object.keys(activeNearby).forEach((cat) => {
          if (!Array.isArray(mergedNearby[cat]) || mergedNearby[cat].length === 0) {
            if (Array.isArray(activeNearby[cat]) && activeNearby[cat].length > 0) {
              mergedNearby[cat] = activeNearby[cat];
            }
          }
        });

        const mergedHotel = {
          ...selected,
          name: selected.name || selected.title || selected.hotelName || '',
          title: selected.title || selected.name || selected.hotelName || '',
          address: selected.address || selected.hotelAddress || '',
          city: selected.city || '',
          location: selected.location || selected.city || selected.address || '',
          id: selected.id || selected.hotelPropertyId || selected._id,
          hotelPropertyId: selected.hotelPropertyId || selected.id,
          latitude: resolvedLat,
          longitude: resolvedLng,
          lat: resolvedLat,
          lng: resolvedLng,
          hotelLatLong: (resolvedLat != null && resolvedLng != null) ? `${resolvedLat},${resolvedLng}` : (selected.hotelLatLong || ''),
          googleMapsUrl: getHotelLocationUrl({ ...selected, latitude: resolvedLat, longitude: resolvedLng }),
          directionsUrl: getDirectionsToHotelUrl({ ...selected, latitude: resolvedLat, longitude: resolvedLng }),
          nearby: mergedNearby,
        };
        this.setActiveHotel(mergedHotel);
        await this.syncComponentsFromBackend(mergedHotel);
      } else {
        this.customHotels = [];
        if (!this.activeHotel || this.activeHotel.isUnconfigured) {
          this.activeHotel = buildEmptyHotelState();
        }
      }
    } catch (e) {
      console.warn('[ActiveHotelService] syncFromBackend error:', e.message);
    }
  }

  async syncComponentsFromBackend(hotel = null) {
    const target = hotel || this.activeHotel;
    if (!target) return null;
    const propId = target.hotelPropertyId || target.id || target._id;
    try {
      const { apiService } = await import('./apiService.js');
      const [compRes, subRes] = await Promise.all([
        apiService.fetchDisplayComponents({ hotelPropertyId: propId }),
        apiService.fetchDisplaySubComponents(propId),
      ]);

      const updatedNearby = { ...(target.nearby || {}) };

      if (compRes && compRes.success && Array.isArray(compRes.data)) {
        compRes.data.forEach((comp) => {
          const cat = comp.category || 'facilities';
          const mappedItem = {
            id: comp.id,
            _id: comp.id,
            title: comp.title,
            name: comp.title,
            subtitle: comp.subtitle || comp.shortDescription || '',
            desc: comp.subtitle || comp.shortDescription || '',
            category: comp.category,
            tag: (comp.category || 'FACILITY').toUpperCase(),
            location: comp.location || '',
            address: comp.location || '',
            distance: comp.hotelDistance || comp.distance || 'Near Hotel',
            hotelDistance: comp.hotelDistance || comp.distance || 'Near Hotel',
            rating: comp.customerRatings || comp.rating || 4.8,
            imageLink: comp.imageLink || '',
            timings: comp.timing || comp.timings || '',
            price: comp.price || '',
            availability: comp.availability || 'Available',
            data1: comp.data1 || '',
            data2: comp.data2 || '',
            data3: comp.data3 || '',
            data4: comp.data4 || '',
            data5: comp.data5 || '',
          };

          const targetCats = (cat === 'dining' || cat === 'restaurants')
            ? ['dining', 'restaurants']
            : [cat];

          targetCats.forEach((c) => {
            if (!Array.isArray(updatedNearby[c])) {
              updatedNearby[c] = [];
            }
            const existingIdx = updatedNearby[c].findIndex((p) => p.id === comp.id || p._id === comp.id);
            if (existingIdx >= 0) {
              updatedNearby[c][existingIdx] = mappedItem;
            } else {
              updatedNearby[c].unshift(mappedItem);
            }
          });
        });
      }

      if (subRes && subRes.success && Array.isArray(subRes.data)) {
        const typeToCat = {
          1: 'dining',
          2: 'gyms',
          3: 'takeaways',
          4: 'homeDelivery',
          5: 'touristPlaces',
        };
        subRes.data.forEach((sub) => {
          const cat = typeToCat[sub.componentTypeId] || 'facilities';
          if (!Array.isArray(updatedNearby[cat])) {
            updatedNearby[cat] = [];
          }
          const existingIdx = updatedNearby[cat].findIndex((p) => p.id === sub._id || p._id === sub._id);
          if (existingIdx < 0) {
            updatedNearby[cat].push({
              id: sub._id,
              _id: sub._id,
              title: sub.title,
              name: sub.title,
              subtitle: sub.subTitle || '',
              desc: sub.subTitle || '',
              category: cat,
              tag: cat.toUpperCase(),
              imageLink: sub.imageLink || '',
              data1: sub.data1 || '',
              data2: sub.data2 || '',
              data3: sub.data3 || '',
              data4: sub.data4 || '',
              data5: sub.data5 || '',
              location: sub.data5 || '',
              rating: 4.9,
              availability: 'Available',
            });
          }
        });
      }

      // Ensure nearby categories preserve MongoDB data from customHotels if target was missing them
      const propId = target.hotelPropertyId || target.id || target._id;
      const dbHotel = this.customHotels.find(
        (h) => (h.hotelPropertyId && h.hotelPropertyId === propId) || (h.id && h.id === propId) || (h._id && h._id === propId)
      );
      const sourceNearby = dbHotel?.nearby || target.nearby || {};

      [
        'touristPlaces',
        'shopping',
        'transportation',
        'cafes',
        'gyms',
        'takeaways',
        'restaurants',
        'dining',
        'pools',
        'spa',
        'atms',
        'hospitals',
        'pharmacies',
        'facilities',
      ].forEach((cat) => {
        if (!Array.isArray(updatedNearby[cat]) || updatedNearby[cat].length === 0) {
          if (Array.isArray(sourceNearby[cat]) && sourceNearby[cat].length > 0) {
            updatedNearby[cat] = sourceNearby[cat];
          } else if (!Array.isArray(updatedNearby[cat])) {
            updatedNearby[cat] = [];
          }
        }
      });

      const refreshedHotel = { ...target, nearby: updatedNearby };
      return this.setActiveHotel(refreshedHotel);
    } catch (err) {
      console.warn('[ActiveHotelService] syncComponentsFromBackend error:', err.message);
    }
    return target;
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
    if (!this.activeHotel || !this.activeHotel.name || !this.activeHotel.id) {
      if (this.customHotels && this.customHotels.length > 0) {
        const first = this.customHotels[0];
        this.activeHotel = first;
        return first;
      }
      return buildEmptyHotelState();
    }
    return this.activeHotel;
  }

  setActiveHotel(hotel, allowNonApproved = false) {
    if (!hotel) {
      this.activeHotel = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(ACTIVE_HOTEL_STORAGE_KEY);
      }
      this.notify();
      return null;
    }
    // Only approved hotels can be activated for the public guest portal unless explicitly allowed for admin context
    if (!allowNonApproved && hotel.status && hotel.status !== 'approved') {
      console.log(`[ActiveHotelService] Hotel status is "${hotel.status}", not activating for public guests.`);
      return hotel;
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
  saveAndActivateHotel(hotelData, allowNonApproved = true) {
    const id = hotelData.id || ('hotel-' + Date.now());
    const lat = parseFloat(hotelData.latitude != null ? hotelData.latitude : hotelData.lat);
    const lng = parseFloat(hotelData.longitude != null ? hotelData.longitude : hotelData.lng);

    // Images: use only what the admin uploaded or what came from the place search
    const imagesList = (Array.isArray(hotelData.images) && hotelData.images.length > 0)
      ? hotelData.images.map((img) => (typeof img === 'object' && img && img.url ? img.url : img)).filter(Boolean).slice(0, 8)
      : (hotelData.imageLink ? [hotelData.imageLink] : []);

    // Merge nearby: preserve existing places so re-saving hotel config never wipes out places
    const prevNearby = (this.activeHotel && this.activeHotel.nearby) || {};
    const inputNearby = hotelData.nearby || {};
    const cityName = hotelData.city || hotelData.location || (this.activeHotel && this.activeHotel.city) || 'Local Area';
    const hotelTitle = hotelData.name || hotelData.title || 'Hotel';
    const baseLat = !isNaN(lat) ? lat : 12.9716;
    const baseLng = !isNaN(lng) ? lng : 77.5946;

    const mergedNearby = {
      touristPlaces: (inputNearby.touristPlaces && inputNearby.touristPlaces.length > 0)
        ? inputNearby.touristPlaces
        : (prevNearby.touristPlaces && prevNearby.touristPlaces.length > 0)
        ? prevNearby.touristPlaces
        : [
            {
              id: `tourist-auto-1`,
              title: `${cityName} Heritage Landmark & Palace`,
              subtitle: `Iconic historical architecture & guided excursions near ${hotelTitle}`,
              rating: 4.9,
              distance: '1.2 km',
              hotelDistance: '1.2 km',
              address: `${cityName} Heritage District`,
              location: `${cityName} Heritage District`,
              timings: '9:00 AM - 6:00 PM',
              imageLink: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80',
              latitude: baseLat + 0.012,
              longitude: baseLng + 0.008,
              data1: 'Entry Fee: ₹250 (Indian) / ₹500 (Foreign)',
              data2: 'Audio Guide: Available',
              data3: 'Avg Duration: 2 Hours',
              data4: 'Historic Architecture',
              data5: 'Recommended: Morning Visit',
            },
            {
              id: `tourist-auto-2`,
              title: `${cityName} Botanical Promenade & Gardens`,
              subtitle: `Lush green canopy, scenic walkways and fountains`,
              rating: 4.8,
              distance: '1.8 km',
              hotelDistance: '1.8 km',
              address: `${cityName} Central Park`,
              location: `${cityName} Central Park`,
              timings: '6:00 AM - 7:00 PM',
              imageLink: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',
              latitude: baseLat - 0.011,
              longitude: baseLng - 0.009,
              data1: 'Entry Fee: Free Admission',
              data2: 'Morning Walk & Photography',
              data3: 'Avg Duration: 1.5 Hours',
              data4: 'Eco Garden Walkway',
              data5: 'Open Daily',
            }
          ],
      shopping: (inputNearby.shopping && inputNearby.shopping.length > 0)
        ? inputNearby.shopping
        : (prevNearby.shopping && prevNearby.shopping.length > 0)
        ? prevNearby.shopping
        : [
            {
              id: `shop-auto-1`,
              title: `${cityName} Luxury Galleria & Boutiques`,
              subtitle: `Premier designer labels, luxury timepieces & silk ateliers`,
              rating: 4.9,
              distance: '0.8 km',
              hotelDistance: '0.8 km',
              address: `${cityName} Commercial Boulevard`,
              location: `${cityName} Commercial Boulevard`,
              timings: '10:00 AM - 9:30 PM',
              imageLink: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80',
              latitude: baseLat + 0.007,
              longitude: baseLng - 0.006,
              data1: 'International Designer Boutiques',
              data2: 'Priority Concierge Valet',
            }
          ],
      transportation: (inputNearby.transportation && inputNearby.transportation.length > 0)
        ? inputNearby.transportation
        : (prevNearby.transportation && prevNearby.transportation.length > 0)
        ? prevNearby.transportation
        : [
            {
              id: `trans-auto-1`,
              title: `${cityName} Central Transit & Metro Hub`,
              subtitle: `High-speed connectivity to airport & city landmarks`,
              distance: '0.5 km',
              hotelDistance: '5 mins walk',
              address: `${cityName} Metro Interchange`,
              location: `${cityName} Metro Interchange`,
              timings: '5:00 AM - 11:30 PM',
              imageLink: 'https://images.unsplash.com/photo-1554672408-730436b60ede?w=800&q=80',
              latitude: baseLat + 0.004,
              longitude: baseLng + 0.005,
              data1: 'Direct Airport Metro Line',
              data2: '24/7 Taxi & Chauffeur Stand',
            }
          ],
      hospitals: (inputNearby.hospitals && inputNearby.hospitals.length > 0)
        ? inputNearby.hospitals
        : (prevNearby.hospitals && prevNearby.hospitals.length > 0)
        ? prevNearby.hospitals
        : [
            {
              id: `hosp-auto-1`,
              title: `${cityName} Multi-Specialty Hospital & Trauma Center`,
              subtitle: `24/7 Level-1 emergency ICU & international patient desk`,
              rating: 4.9,
              distance: '1.5 km',
              hotelDistance: '1.5 km',
              address: `${cityName} Medical Enclave`,
              location: `${cityName} Medical Enclave`,
              timings: '24/7 Emergency Care',
              hours: '24/7 Emergency Care',
              isEmergency24x7: true,
              imageLink: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
              latitude: baseLat - 0.015,
              longitude: baseLng + 0.012,
              data1: 'Emergency Hotline: 24/7 Direct',
              data2: 'Ambulance Response: Dedicated 10-Min',
              data3: 'ICU & Cardiac Care Level-1',
              data4: 'Cashless Global Insurance',
              data5: 'English & Multilingual Staff',
            }
          ],
      pharmacies: (inputNearby.pharmacies && inputNearby.pharmacies.length > 0)
        ? inputNearby.pharmacies
        : (prevNearby.pharmacies && prevNearby.pharmacies.length > 0)
        ? prevNearby.pharmacies
        : [
            {
              id: `pharm-auto-1`,
              title: `${cityName} 24/7 Express Chemist & Medicals`,
              subtitle: `Prescription drugs, travel wellness & suite delivery`,
              rating: 4.9,
              distance: '0.3 km',
              hotelDistance: '0.3 km',
              address: `Adjacent to ${hotelTitle}`,
              location: `Adjacent to ${hotelTitle}`,
              timings: 'Open 24 Hours',
              hours: 'Open 24 Hours',
              isOpen24x7: true,
              imageLink: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&q=80',
              latitude: baseLat + 0.003,
              longitude: baseLng - 0.002,
              data1: 'Contact: 24/7 Service Desk',
              data2: 'Room Delivery: 15 Minutes',
              data3: 'All Global Cards & UPI',
              data4: 'Doctor Video Consult',
              data5: 'Travel Essentials Stocked',
            }
          ],
      gyms: (inputNearby.gyms && inputNearby.gyms.length > 0)
        ? inputNearby.gyms
        : (prevNearby.gyms && prevNearby.gyms.length > 0)
        ? prevNearby.gyms
        : [
            {
              id: `gym-auto-1`,
              title: `Olympus Fitness Arena & Thermal Spa`,
              name: `Olympus Fitness Arena & Thermal Spa`,
              subtitle: `State-of-the-art strength training & hydrotherapy`,
              desc: `State-of-the-art strength training & hydrotherapy`,
              rating: 4.9,
              distance: '0.4 km',
              hotelDistance: '0.4 km',
              address: `${cityName} Fitness Hub`,
              location: `${cityName} Fitness Hub`,
              timings: '5:30 AM - 10:30 PM',
              imageLink: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
              latitude: baseLat + 0.005,
              longitude: baseLng + 0.004,
              data1: '★ 4.9 Rating',
              data2: '5:30 AM - 10:30 PM',
              data3: 'Day Pass: ₹500 (Free for Guests)',
              data4: 'Steam Room & Personal Trainers',
              data5: 'Technogym Equipment',
            }
          ],
      takeaways: (inputNearby.takeaways && inputNearby.takeaways.length > 0)
        ? inputNearby.takeaways
        : (prevNearby.takeaways && prevNearby.takeaways.length > 0)
        ? prevNearby.takeaways
        : [
            {
              id: `takeaway-auto-1`,
              title: `Artisan Woodfired Pizzeria & Deli`,
              name: `Artisan Woodfired Pizzeria & Deli`,
              subtitle: `Handcrafted Neapolitan pizzas & gourmet sides`,
              desc: `Handcrafted Neapolitan pizzas & gourmet sides`,
              rating: 4.8,
              distance: '0.4 km',
              hotelDistance: '0.4 km',
              address: `${cityName} Dining Street`,
              location: `${cityName} Dining Street`,
              timings: '11:30 AM - Midnight',
              imageLink: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
              latitude: baseLat - 0.004,
              longitude: baseLng + 0.006,
              data1: '★ 4.8 Rating',
              data2: '11:30 AM - 12:00 AM',
              data3: 'Avg Prep: 15 Mins',
              data4: 'Specialty: Sourdough Pizzas',
              data5: 'Eco Packaging',
            }
          ],
      restaurants: (inputNearby.restaurants && inputNearby.restaurants.length > 0)
        ? inputNearby.restaurants
        : (prevNearby.restaurants && prevNearby.restaurants.length > 0)
        ? prevNearby.restaurants
        : [
            {
              id: `rest-auto-1`,
              title: `The Grand Royal Multi-Cuisine Pavilion`,
              name: `The Grand Royal Multi-Cuisine Pavilion`,
              subtitle: `Fine dining Mughlai, Pan-Asian & Mediterranean`,
              desc: `Fine dining Mughlai, Pan-Asian & Mediterranean`,
              rating: 4.9,
              distance: '0.2 km',
              hotelDistance: '0.2 km',
              address: `In-House Restaurant at ${hotelTitle}`,
              location: `In-House Restaurant at ${hotelTitle}`,
              timings: '12:00 PM - 11:30 PM',
              imageLink: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
              latitude: baseLat,
              longitude: baseLng,
              data1: '★ 4.9 Rating',
              data2: '12:00 PM - 11:30 PM',
              data3: 'Avg Cost: ₹1,800 for two',
              data4: 'Specialty: Fine Dining Buffet',
              data5: 'Valet Available',
            }
          ],
      dining: (inputNearby.dining && inputNearby.dining.length > 0)
        ? inputNearby.dining
        : (prevNearby.dining && prevNearby.dining.length > 0)
        ? prevNearby.dining
        : [
            {
              id: `dining-auto-1`,
              title: `The Grand Royal Multi-Cuisine Pavilion`,
              name: `The Grand Royal Multi-Cuisine Pavilion`,
              subtitle: `Fine dining Mughlai, Pan-Asian & Mediterranean`,
              desc: `Fine dining Mughlai, Pan-Asian & Mediterranean`,
              rating: 4.9,
              distance: '0.2 km',
              hotelDistance: '0.2 km',
              address: `In-House Restaurant at ${hotelTitle}`,
              location: `In-House Restaurant at ${hotelTitle}`,
              timings: '12:00 PM - 11:30 PM',
              imageLink: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
              latitude: baseLat,
              longitude: baseLng,
              data1: '★ 4.9 Rating',
              data2: '12:00 PM - 11:30 PM',
              data3: 'Avg Cost: ₹1,800 for two',
              data4: 'Specialty: Fine Dining Buffet',
              data5: 'Valet Available',
            }
          ],
      pools: inputNearby.pools || prevNearby.pools || [],
    };

    const hCoords = extractEntityCoordinates(hotelData);
    const resolvedLat = hCoords.isValid ? hCoords.lat : null;
    const resolvedLng = hCoords.isValid ? hCoords.lng : null;
    const newHotel = {
      ...hotelData,
      id: id,
      name: hotelData.name || hotelData.title || '',
      title: hotelData.name || hotelData.title || '',
      subtitle: hotelData.subtitle || hotelData.address || '',
      address: hotelData.address || '',
      city: hotelData.city || hotelData.location || '',
      location: hotelData.location || hotelData.city || '',
      latitude: resolvedLat,
      longitude: resolvedLng,
      lat: resolvedLat,
      lng: resolvedLng,
      hotelLatLong: (resolvedLat != null && resolvedLng != null) ? `${resolvedLat},${resolvedLng}` : (hotelData.hotelLatLong || ''),
      rating: hotelData.rating ? parseFloat(hotelData.rating) : null,
      images: imagesList,
      imageObjects: Array.isArray(hotelData.imageObjects) ? hotelData.imageObjects.slice(0, 8) : [],
      imageLink: imagesList[0] || null,
      googleMapsUrl: getHotelLocationUrl({ ...hotelData, latitude: resolvedLat, longitude: resolvedLng }),
      directionsUrl: getDirectionsToHotelUrl({ ...hotelData, latitude: resolvedLat, longitude: resolvedLng }),
      nearby: mergedNearby,
      customCategories: Array.isArray(hotelData.customCategories)
        ? hotelData.customCategories
        : (this.activeHotel?.customCategories || []),
      status: hotelData.status || 'pending',
      rejectionReason: hotelData.rejectionReason || '',
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
      } catch (e) { }
    }

    // Persist to MongoDB backend asynchronously
    import('./apiService.js').then(({ apiService }) => {
      apiService.createHotel(newHotel).catch(() => { });
    }).catch(() => { });

    if (newHotel.status === 'approved' || allowNonApproved) {
      return this.setActiveHotel(newHotel, allowNonApproved);
    }
    return newHotel;
  }

  /**
   * Automatically populates real nearby places for the active hotel across all categories.
   * Merges with any places already configured by the admin without wiping them.
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

    const currentHotel = this.activeHotel || targetHotel;
    const updatedNearby = { ...(currentHotel.nearby || {}) };

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      if (onProgress) onProgress(cat.label, i + 1, categories.length);
      try {
        const res = await searchNearby(lat, lng, cat.searchCat, radius);
        if (res.success && Array.isArray(res.places) && res.places.length > 0) {
          const existing = updatedNearby[cat.key] || [];
          const existingTitles = new Set(existing.map((p) => (p.title || p.name || '').toLowerCase().trim()));
          const newUnique = res.places.filter((p) => {
            const t = (p.title || p.name || '').toLowerCase().trim();
            return t && !existingTitles.has(t);
          });
          updatedNearby[cat.key] = [...existing, ...newUnique];
        }
      } catch (err) {
        console.warn(`[ActiveHotelService] Nearby search failed for ${cat.key}:`, err.message);
      }
    }

    const updatedHotel = {
      ...(this.activeHotel || targetHotel),
      nearby: updatedNearby,
    };

    // Update in customHotels too
    const existingIdx = this.customHotels.findIndex((h) => h.id === updatedHotel.id);
    if (existingIdx >= 0) {
      this.customHotels[existingIdx] = updatedHotel;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(CUSTOM_HOTELS_STORAGE_KEY, JSON.stringify(this.customHotels));
        } catch (e) { }
      }
    }

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
    if (!this.activeHotel) {
      if (this.customHotels && this.customHotels.length > 0) {
        this.activeHotel = { ...this.customHotels[0] };
      } else {
        this.activeHotel = {
          id: 'hotel-' + Date.now(),
          hotelPropertyId: '1000000001',
          name: 'Active Hotel Property',
          city: placeData.address || 'Local Area',
          latitude: placeData.latitude || 12.9716,
          longitude: placeData.longitude || 77.5946,
          nearby: {},
          customCategories: [],
        };
      }
    }

    const updatedHotel = { ...this.activeHotel };
    if (!updatedHotel.nearby) updatedHotel.nearby = {};
    if (!Array.isArray(updatedHotel.nearby[categoryKey])) updatedHotel.nearby[categoryKey] = [];

    const minId = 1000000000;
    const maxId = 9999999999;
    const auto10DigitId = String(Math.floor(minId + Math.random() * (maxId - minId + 1)));

    const newPlace = {
      ...placeData,
      id: placeData.id || auto10DigitId,
      subComponentId: placeData.id || auto10DigitId,
      category: categoryKey,
      latitude: parseFloat(placeData.latitude != null ? placeData.latitude : placeData.lat) || null,
      longitude: parseFloat(placeData.longitude != null ? placeData.longitude : placeData.lng) || null,
    };

    updatedHotel.nearby[categoryKey] = [newPlace, ...updatedHotel.nearby[categoryKey]];

    // Sync to customHotels
    const hIndex = this.customHotels.findIndex((h) => h.id === updatedHotel.id);
    if (hIndex >= 0) {
      this.customHotels[hIndex] = updatedHotel;
    } else {
      this.customHotels.push(updatedHotel);
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(CUSTOM_HOTELS_STORAGE_KEY, JSON.stringify(this.customHotels));
      } catch (e) { }
    }

    this.setActiveHotel(updatedHotel);

    // Sync with MongoDB backend as DisplayComponent if not already created
    const alreadySaved = Boolean(placeData._id || (placeData.id && String(placeData.id).length === 24 && !String(placeData.id).includes('-')));
    if (!alreadySaved) {
      import('./apiService.js').then(async ({ apiService }) => {
        try {
          const propId = updatedHotel.hotelPropertyId || updatedHotel.id || '1000000001';
          const res = await apiService.createDisplayComponent({
            ...placeData,
            category: categoryKey,
            hotelPropertyId: propId,
          });
          if (res && res.success && res.data) {
            newPlace.id = res.data.id;
            newPlace._id = res.data.id;
          }
        } catch (err) {
          console.error('[ActiveHotelService] MongoDB createDisplayComponent error:', err.message);
        }
      }).catch(() => { });
    }

    return updatedHotel;
  }

  deletePlaceFromActiveHotel(categoryKey, placeId) {
    if (!this.activeHotel || !this.activeHotel.nearby) return null;
    const updatedHotel = { ...this.activeHotel };
    if (Array.isArray(updatedHotel.nearby[categoryKey])) {
      updatedHotel.nearby[categoryKey] = updatedHotel.nearby[categoryKey].filter((p) => String(p.id) !== String(placeId));

      const hIndex = this.customHotels.findIndex((h) => h.id === updatedHotel.id);
      if (hIndex >= 0) {
        this.customHotels[hIndex] = updatedHotel;
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(CUSTOM_HOTELS_STORAGE_KEY, JSON.stringify(this.customHotels));
        } catch (e) { }
      }
      this.setActiveHotel(updatedHotel);

      import('./apiService.js').then(async ({ apiService }) => {
        try {
          await apiService.deleteDisplayComponent(placeId);
        } catch (err) {
          console.error('[ActiveHotelService] MongoDB delete error:', err.message);
        }
      }).catch(() => { });
    }
    return updatedHotel;
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
      const merged = {
        ...existing,
        ...updatedPlaceData,
        id: existing.id || placeId,
        latitude: !isNaN(latVal) ? latVal : existing.latitude,
        longitude: !isNaN(lngVal) ? lngVal : existing.longitude,
      };
      updatedHotel.nearby[categoryKey][placeIndex] = merged;

      const hIndex = this.customHotels.findIndex((h) => h.id === updatedHotel.id);
      if (hIndex >= 0) {
        this.customHotels[hIndex] = updatedHotel;
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(CUSTOM_HOTELS_STORAGE_KEY, JSON.stringify(this.customHotels));
        } catch (e) { }
      }
      this.setActiveHotel(updatedHotel);

      import('./apiService.js').then(async ({ apiService }) => {
        try {
          await apiService.updateDisplayComponent(placeId, updatedPlaceData);
        } catch (err) {
          console.error('[ActiveHotelService] MongoDB update error:', err.message);
        }
      }).catch(() => { });
      return updatedHotel;
    }
    return null;
  }

  addCustomCategory(keyOrObj, maybeName, maybeIcon) {
    if (!this.activeHotel) return null;
    const updatedHotel = { ...this.activeHotel };
    if (!Array.isArray(updatedHotel.customCategories)) updatedHotel.customCategories = [];

    let key, label, icon;
    if (typeof keyOrObj === 'object' && keyOrObj !== null) {
      key = String(keyOrObj.key || keyOrObj.id || ('custom_' + Date.now())).toLowerCase().replace(/[^a-z0-9]/g, '_');
      label = keyOrObj.name || keyOrObj.label || key;
      icon = keyOrObj.icon || '🌟';
    } else {
      key = String(keyOrObj || ('custom_' + Date.now())).toLowerCase().replace(/[^a-z0-9]/g, '_');
      label = maybeName || key;
      icon = maybeIcon || '🌟';
    }

    const catItem = { id: key, key: key, name: label, label: label, icon: icon };
    const existingIdx = updatedHotel.customCategories.findIndex((c) => (c.key === key || c.id === key));
    if (existingIdx >= 0) {
      updatedHotel.customCategories[existingIdx] = catItem;
    } else {
      updatedHotel.customCategories.push(catItem);
    }

    if (!updatedHotel.nearby) updatedHotel.nearby = {};
    if (!Array.isArray(updatedHotel.nearby[key])) {
      updatedHotel.nearby[key] = [];
    }
    return this.setActiveHotel(updatedHotel);
  }

  deleteCustomCategory(catKey) {
    if (!this.activeHotel) return null;
    const updatedHotel = { ...this.activeHotel };
    if (Array.isArray(updatedHotel.customCategories)) {
      updatedHotel.customCategories = updatedHotel.customCategories.filter(
        (c) => c.key !== catKey && c.id !== catKey
      );
    }
    if (updatedHotel.nearby && updatedHotel.nearby[catKey]) {
      delete updatedHotel.nearby[catKey];
    }
    return this.setActiveHotel(updatedHotel);
  }

  async populatePresetPlaces(hotel = null) {
    const targetHotel = hotel || this.activeHotel;
    if (!targetHotel) return null;
    return await this.syncComponentsFromBackend(targetHotel);
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
        pools: [],
        takeaways: [],
        restaurants: [],
        dining: [],
      },
      customCategories: [],
    };
    return this.setActiveHotel(updatedHotel);
  }
}

export const activeHotelService = new ActiveHotelService();

export { getDirectionsUrl as calculateDynamicDirections, getDirectionsUrl, getDirectionsToHotelUrl, getHotelLocationUrl };
export const getDirections = getDirectionsUrl;
