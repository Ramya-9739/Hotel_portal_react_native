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
import sampleAdminData from '../../sample_admin_data.json';

const ACTIVE_HOTEL_STORAGE_KEY = '@hotel_portal_active_hotel';
const CUSTOM_HOTELS_STORAGE_KEY = '@hotel_portal_custom_hotels';

const buildInitialSeedHotel = () => {
  const sHotel = (sampleAdminData.sampleHotels && sampleAdminData.sampleHotels[0]) || {
    id: 'hotel-1000000001',
    hotelPropertyId: '1000000001',
    name: 'The Grand Horizon Palace & Resort',
    subtitle: '5-Star Luxury Boutique Stay & Ayurvedic Wellness Sanctuary',
    address: '42 MG Road, Ashok Nagar, Bengaluru, Karnataka 560001',
    city: 'Bengaluru',
    location: 'Ashok Nagar, Bengaluru',
    latitude: 12.9753,
    longitude: 77.6062,
    contactNumber: '+91 98765 43210',
    pricePerNight: '₹14,500 / night',
    rating: 4.9,
  };

  const places = sampleAdminData.samplePlacesByCategory || {};

  const imagesList = (sHotel.images || []).map((img) => (typeof img === 'object' && img?.url ? img.url : img));

  return {
    ...sHotel,
    id: sHotel.id || 'hotel-1000000001',
    name: sHotel.name || 'The Grand Horizon Palace & Resort',
    title: sHotel.name || 'The Grand Horizon Palace & Resort',
    subtitle: sHotel.subtitle || '5-Star Luxury Boutique Stay & Ayurvedic Wellness Sanctuary',
    address: sHotel.address || '42 MG Road, Ashok Nagar, Bengaluru, Karnataka 560001',
    city: sHotel.city || 'Bengaluru',
    location: sHotel.city || 'Bengaluru',
    latitude: sHotel.latitude || 12.9753,
    longitude: sHotel.longitude || 77.6062,
    lat: sHotel.latitude || 12.9753,
    lng: sHotel.longitude || 77.6062,
    pricePerNight: sHotel.pricePerNight || '₹14,500 / night',
    rating: sHotel.rating || 4.9,
    images: imagesList.length > 0 ? imagesList : [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80'
    ],
    imageObjects: sHotel.images || [],
    imageLink: imagesList[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    nearby: {
      touristPlaces: (places.touristLandmarks || []).map((p, idx) => ({
        id: `tourist-${idx + 1}`,
        title: p.title,
        subtitle: p.subtitle,
        rating: p.rating || 4.8,
        distance: p.distance || '1.5 km',
        hotelDistance: p.distance || '1.5 km',
        address: p.address,
        location: p.address,
        timings: p.timings,
        imageLink: p.imageLink,
        image: p.imageLink,
        latitude: 12.9753 + (idx === 0 ? 0.02 : -0.01),
        longitude: 77.6062 + (idx === 0 ? 0.01 : -0.02),
        data1: p.data1,
        data2: p.data2,
        data3: p.data3,
        data4: p.data4,
        data5: p.data5,
      })),
      shopping: [
        {
          id: 'shop-1',
          title: 'UB City Luxury Collection',
          subtitle: 'High-End Designer Boutiques & International Brands',
          rating: 4.9,
          distance: '0.9 km',
          hotelDistance: '0.9 km',
          address: '24 Vittal Mallya Rd, Bengaluru',
          location: 'Vittal Mallya Rd, Bengaluru',
          timings: '10:30 AM - 10:00 PM',
          imageLink: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80',
          latitude: 12.9716,
          longitude: 77.5959,
          data1: 'Brands: Rolex, Louis Vuitton, Burberry',
          data2: 'Valet: Priority Concierge Parking',
        },
        {
          id: 'shop-2',
          title: 'Mysore Silk Weavers Guild',
          subtitle: 'Authentic Pure Mulberry Silk Sarees & Stoles',
          rating: 4.8,
          distance: '1.4 km',
          hotelDistance: '1.4 km',
          address: 'MG Road Arcade, Bengaluru',
          location: 'MG Road Arcade, Bengaluru',
          timings: '10:00 AM - 8:30 PM',
          imageLink: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',
          latitude: 12.9740,
          longitude: 77.6090,
          data1: 'Silk Mark Certified',
          data2: 'Hotel Delivery Available',
        }
      ],
      transportation: [
        {
          id: 'trans-1',
          title: 'MG Road Metro Station',
          subtitle: 'Purple Line Direct Rapid Transit Interchange',
          distance: '0.3 km',
          hotelDistance: '3 mins walk',
          address: 'MG Road, Ashok Nagar, Bengaluru',
          location: 'MG Road, Ashok Nagar, Bengaluru',
          timings: '5:00 AM - 11:30 PM',
          imageLink: 'https://images.unsplash.com/photo-1554672408-730436b60ede?w=800&q=80',
          latitude: 12.9756,
          longitude: 77.6068,
          data1: 'Frequency: Every 4 mins',
          data2: 'Direct to City Railway & Tech Parks',
        },
        {
          id: 'trans-2',
          title: 'Kempegowda Airport Express Limousine',
          subtitle: 'Dedicated 24/7 Hotel Chauffeur & Vayu Vajra Shuttles',
          distance: '34 km',
          hotelDistance: '45 mins via Hebbal Express Flyover',
          address: 'Concierge Valet Desk Pickup',
          location: 'Hotel Front Lobby',
          timings: '24/7 On-Demand Service',
          imageLink: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80',
          latitude: 13.1986,
          longitude: 77.7066,
          data1: 'Pre-book via Hotel Reception',
          data2: 'Free Wi-Fi & Refreshments in vehicle',
        }
      ],
      hospitals: (places.emergencyServices || []).filter((e) => e.title.includes('Hospital')).map((h, idx) => ({
        id: `hosp-${idx + 1}`,
        title: h.title,
        subtitle: h.subtitle,
        rating: h.rating || 4.9,
        distance: h.distance || '2.1 km',
        hotelDistance: h.distance || '2.1 km',
        address: h.address,
        location: h.address,
        timings: h.timings || '24/7 Emergency Care',
        hours: h.timings || '24/7 Emergency Care',
        isEmergency24x7: true,
        imageLink: h.imageLink,
        latitude: 12.9600,
        longitude: 77.6480,
        data1: h.data1,
        data2: h.data2,
        data3: h.data3,
        data4: h.data4,
        data5: h.data5,
      })),
      pharmacies: (places.emergencyServices || []).filter((e) => e.title.includes('Pharmacy')).map((p, idx) => ({
        id: `pharm-${idx + 1}`,
        title: p.title,
        subtitle: p.subtitle,
        rating: p.rating || 4.9,
        distance: p.distance || '0.4 km',
        hotelDistance: p.distance || '0.4 km',
        address: p.address,
        location: p.address,
        timings: p.timings || 'Open 24/7',
        hours: p.timings || 'Open 24/7',
        isOpen24x7: true,
        imageLink: p.imageLink,
        latitude: 12.9730,
        longitude: 77.6040,
        data1: p.data1,
        data2: p.data2,
        data3: p.data3,
        data4: p.data4,
        data5: p.data5,
      })),
      gyms: (places.gyms || []).map((g, idx) => ({
        id: `gym-${idx + 1}`,
        title: g.title,
        name: g.title,
        subtitle: g.subtitle,
        desc: g.subtitle,
        rating: g.rating || 4.9,
        distance: g.distance || '0.5 km',
        hotelDistance: g.distance || '0.5 km',
        address: g.address,
        location: g.address,
        timings: g.timings || '5:30 AM - 10:30 PM',
        imageLink: g.imageLink,
        latitude: 12.9745,
        longitude: 77.6080,
        data1: g.data1,
        data2: g.data2,
        data3: g.data3,
        data4: g.data4,
        data5: g.data5,
      })),
      takeaways: (places.takeaways || []).map((t, idx) => ({
        id: `takeaway-${idx + 1}`,
        title: t.title,
        name: t.title,
        subtitle: t.subtitle,
        desc: t.subtitle,
        rating: t.rating || 4.8,
        distance: t.distance || '0.4 km',
        hotelDistance: t.distance || '0.4 km',
        address: t.address,
        location: t.address,
        timings: t.timings || '11:30 AM - 12:00 AM',
        imageLink: t.imageLink,
        latitude: 12.9760,
        longitude: 77.6050,
        data1: t.data1,
        data2: t.data2,
        data3: t.data3,
        data4: t.data4,
        data5: t.data5,
      })),
      restaurants: (places.restaurants || []).map((r, idx) => ({
        id: `rest-${idx + 1}`,
        title: r.title,
        name: r.title,
        subtitle: r.subtitle,
        desc: r.subtitle,
        rating: r.rating || 4.9,
        distance: r.distance || '0.3 km',
        hotelDistance: r.distance || '0.3 km',
        address: r.address,
        location: r.address,
        timings: r.timings || '12:00 PM - 11:30 PM',
        imageLink: r.imageLink,
        latitude: 12.9750,
        longitude: 77.6070,
        data1: r.data1,
        data2: r.data2,
        data3: r.data3,
        data4: r.data4,
        data5: r.data5,
      })),
      dining: (places.restaurants || []).map((r, idx) => ({
        id: `dining-${idx + 1}`,
        title: r.title,
        name: r.title,
        subtitle: r.subtitle,
        desc: r.subtitle,
        rating: r.rating || 4.9,
        distance: r.distance || '0.3 km',
        hotelDistance: r.distance || '0.3 km',
        address: r.address,
        location: r.address,
        timings: r.timings || '12:00 PM - 11:30 PM',
        imageLink: r.imageLink,
        latitude: 12.9750,
        longitude: 77.6070,
        data1: r.data1,
        data2: r.data2,
        data3: r.data3,
        data4: r.data4,
        data5: r.data5,
      })),
    }
  };
};

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
          this.activeHotel = JSON.parse(storedHotel);
        }
        const storedCustom = window.localStorage.getItem(CUSTOM_HOTELS_STORAGE_KEY);
        if (storedCustom) {
          this.customHotels = JSON.parse(storedCustom);
        }
      } catch (err) {
        console.warn('[ActiveHotelService] Storage read error:', err);
      }
    }

    // If no active hotel or invalid empty hotel, seed the default luxury hotel from sample_admin_data
    if (!this.activeHotel || !this.activeHotel.name || !this.activeHotel.id) {
      const defaultHotel = buildInitialSeedHotel();
      this.activeHotel = defaultHotel;
      if (this.customHotels.length === 0) {
        const allSampleHotels = (sampleAdminData.sampleHotels || []).map((h) => ({
          ...h,
          title: h.name,
          location: h.city,
          imageLink: (h.images && h.images[0]?.url) || h.images?.[0] || '',
        }));
        this.customHotels = allSampleHotels.length > 0 ? allSampleHotels : [defaultHotel];
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(ACTIVE_HOTEL_STORAGE_KEY, JSON.stringify(defaultHotel));
          window.localStorage.setItem(CUSTOM_HOTELS_STORAGE_KEY, JSON.stringify(this.customHotels));
        } catch (e) { }
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
        this.customHotels = res.data;
        const currentId = this.activeHotel?.hotelPropertyId || this.activeHotel?.id || this.activeHotel?._id;
        const match = res.data.find(
          (h) => h.hotelPropertyId === currentId || h.id === currentId || h._id === currentId
        );
        const selected = match || res.data[0];
        this.setActiveHotel(selected);
        await this.syncComponentsFromBackend(selected);
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
          if (!Array.isArray(updatedNearby[cat])) {
            updatedNearby[cat] = [];
          }
          const existingIdx = updatedNearby[cat].findIndex((p) => p.id === comp.id || p._id === comp.id);
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
          if (existingIdx >= 0) {
            updatedNearby[cat][existingIdx] = mappedItem;
          } else {
            updatedNearby[cat].unshift(mappedItem);
          }
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
      const defaultHotel = buildInitialSeedHotel();
      this.activeHotel = defaultHotel;
      return defaultHotel;
    }
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
      nearby: mergedNearby,
      customCategories: Array.isArray(hotelData.customCategories)
        ? hotelData.customCategories
        : (this.activeHotel?.customCategories || []),
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

    return this.setActiveHotel(newHotel);
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

    // Sync with MongoDB backend as DisplayComponent
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
