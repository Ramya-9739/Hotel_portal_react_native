// =============================================================================
// src/services/apiService.js
// REST API Service for Display Components & Hotel Operations
// Direct communication with Express + MongoDB (hotelApiDb) at http://localhost:3000
// =============================================================================

import { DisplayComponent } from '../models/DisplayComponent.js';
import { database } from './database.js';

export const MOCK_BACKEND_DATA = [];

const getHost = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return window.location.hostname;
  }
  return 'localhost';
};

const BASE_URL = 'http://' + getHost() + ':3000';
const DEFAULT_API_URL = `${BASE_URL}/api/display-components`;

class ApiService {
  constructor() {
    this.baseUrl = BASE_URL;
    this.apiUrl = DEFAULT_API_URL;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  getHeaders() {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    let token = this.authToken;
    if (!token && typeof window !== 'undefined' && window.localStorage) {
      token = window.localStorage.getItem('@hotel_portal_admin_token');
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  getComponentTypeId(category) {
    const cat = String(category || '').toLowerCase();
    if (cat.includes('dining') || cat.includes('restaurant') || cat.includes('cafe')) return 1;
    if (cat.includes('gym') || cat.includes('pool') || cat.includes('wellness') || cat.includes('fitness')) return 2;
    if (cat.includes('takeaway')) return 3;
    if (cat.includes('delivery') || cat.includes('homedelivery')) return 4;
    return 5;
  }

  // ===========================================================================
  // DISPLAY COMPONENTS CRUD (MongoDB: hotelApiDb.displaycomponents)
  // ===========================================================================

  async fetchDisplayComponents({ hotelPropertyId = null, category = null, componentTypeId = null, query = '' } = {}) {
    try {
      const params = [];
      if (hotelPropertyId) params.push(`hotelPropertyId=${encodeURIComponent(hotelPropertyId)}`);
      if (category) params.push(`category=${encodeURIComponent(category)}`);
      if (componentTypeId !== null && componentTypeId !== undefined) params.push(`componentTypeId=${encodeURIComponent(componentTypeId)}`);

      let targetUrl = this.apiUrl;
      if (params.length > 0) {
        targetUrl += `?${params.join('&')}`;
      }

      console.log(`[REST API] GET ${targetUrl}`);
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(`[HTTP ${response.status}] ${targetUrl} failed: ${json.error || json.message || response.statusText}`);
      }

      let rawList = Array.isArray(json) ? json : json.data || [];
      if (query && query.trim()) {
        const qLower = query.trim().toLowerCase();
        rawList = rawList.filter(
          (c) => (c.title || '').toLowerCase().includes(qLower) || (c.subTitle || c.subtitle || '').toLowerCase().includes(qLower)
        );
      }

      const mappedList = rawList.map((item) => DisplayComponent.fromJson(item));
      return {
        success: true,
        source: 'backend_server',
        data: mappedList,
      };
    } catch (err) {
      console.error(`[REST API Error] fetchDisplayComponents failed:`, err.message);
      return {
        success: false,
        error: err.message,
        data: [],
      };
    }
  }

  async createDisplayComponent(componentData) {
    try {
      const category = componentData.category || 'facilities';
      const compTypeId = componentData.componentTypeId || this.getComponentTypeId(category);
      const propId = componentData.hotelPropertyId || '1000000001';

      const payload = {
        componentTypeId: compTypeId,
        hotelPropertyId: String(propId),
        title: componentData.title || componentData.name || 'Untitled Component',
        subTitle: componentData.subTitle || componentData.subtitle || componentData.desc || '',
        description: componentData.description || componentData.subTitle || componentData.subtitle || '',
        category: category,
        location: componentData.location || componentData.address || '',
        rating: componentData.rating ? parseFloat(componentData.rating) : 4.8,
        timings: componentData.timings || componentData.hours || componentData.timing || '',
        price: componentData.price || componentData.passPrice || componentData.minOrder || '',
        link: componentData.link || componentData.websiteUrl || componentData.externalUrl || '',
        imageLink: componentData.imageLink || '',
        likes: componentData.likes || 0,
        availability: componentData.availability || 'Available',
        cuisine: componentData.cuisine || '',
        takeaway: Boolean(componentData.takeaway || componentData.takeawayEnabled),
        homeDelivery: Boolean(componentData.homeDelivery || componentData.homeDeliveryEnabled),
        distance: componentData.distance || componentData.hotelDistance || '',
        hotelDistance: componentData.hotelDistance || componentData.distance || '',
        address: componentData.address || componentData.location || '',
        latitude: componentData.latitude != null ? componentData.latitude : (componentData.lat != null ? componentData.lat : null),
        longitude: componentData.longitude != null ? componentData.longitude : (componentData.lng != null ? componentData.lng : null),
        priceRange: componentData.priceRange || componentData.price || '',
        passPrice: componentData.passPrice || componentData.price || '',
        minOrder: componentData.minOrder || componentData.price || '',
        deliveryFee: componentData.deliveryFee || componentData.price || '',
        deliveryTime: componentData.deliveryTime || componentData.timeEstimate || '',
        takeawayTime: componentData.takeawayTime || componentData.timeEstimate || '',
        data1: componentData.data1 || '',
        data2: componentData.data2 || '',
        data3: componentData.data3 || '',
        data4: componentData.data4 || '',
        data5: componentData.data5 || '',
      };

      console.log(`[REST API] POST ${this.apiUrl}`, payload.title);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(`[HTTP ${response.status}] POST ${this.apiUrl} failed: ${json.error || json.message || response.statusText}`);
      }

      const item = DisplayComponent.fromJson(json.data);
      return { success: true, data: item };
    } catch (err) {
      console.error(`[REST API Error] createDisplayComponent failed:`, err.message);
      throw err;
    }
  }

  async updateDisplayComponent(id, componentData) {
    try {
      const targetUrl = `${this.apiUrl}/${encodeURIComponent(id)}`;
      console.log(`[REST API] PUT ${targetUrl}`);

      const response = await fetch(targetUrl, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(componentData),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(`[HTTP ${response.status}] PUT ${targetUrl} failed: ${json.error || json.message || response.statusText}`);
      }

      const item = DisplayComponent.fromJson(json.data);
      return { success: true, data: item };
    } catch (err) {
      console.error(`[REST API Error] updateDisplayComponent failed:`, err.message);
      throw err;
    }
  }

  async deleteDisplayComponent(id) {
    try {
      const targetUrl = `${this.apiUrl}/${encodeURIComponent(id)}`;
      console.log(`[REST API] DELETE ${targetUrl}`);

      const response = await fetch(targetUrl, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(`[HTTP ${response.status}] DELETE ${targetUrl} failed: ${json.error || json.message || response.statusText}`);
      }

      return { success: true, id, message: json.data?.deleted ? 'Deleted successfully' : 'Success' };
    } catch (err) {
      console.error(`[REST API Error] deleteDisplayComponent failed:`, err.message);
      throw err;
    }
  }

  // Alias for backward-compatibility with older calls
  async createComponent(data) {
    return this.createDisplayComponent(data);
  }

  async updateComponent(id, data) {
    return this.updateDisplayComponent(id, data);
  }

  async deleteComponent(id) {
    return this.deleteDisplayComponent(id);
  }

  // ===========================================================================
  // SUB-COMPONENTS (backend /api/display-sub-components)
  // ===========================================================================

  async fetchDisplaySubComponents(hotelPropertyId = null) {
    try {
      let targetUrl = `${BASE_URL}/api/display-sub-components`;
      if (hotelPropertyId) targetUrl += `?hotelPropertyId=${encodeURIComponent(hotelPropertyId)}`;

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(`[HTTP ${response.status}] GET ${targetUrl} failed: ${json.error || response.statusText}`);
      }
      return { success: true, data: json.data || [] };
    } catch (err) {
      console.error(`[REST API Error] fetchDisplaySubComponents failed:`, err.message);
      return { success: false, error: err.message, data: [] };
    }
  }

  async createDisplaySubComponent(place, compTypeId = 2, subTypeId = 501, propId = '1000000001') {
    try {
      const payload = {
        componentTypeId: compTypeId,
        hotelPropertyId: String(propId),
        subComponentTypeId: subTypeId,
        title: place.title || place.name || 'Untitled Item',
        subTitle: place.subtitle || place.desc || '',
        imageLink: place.imageLink || '',
        data1: place.data1 || (place.rating ? `★ ${place.rating}` : '★ 4.8'),
        data2: place.data2 || place.timings || place.timeEstimate || 'Open Daily',
        data3: place.data3 || place.offer || place.distance || '',
        data4: place.data4 || place.cuisine || place.category || 'Specialty',
        data5: place.data5 || place.location || place.address || 'Local Area',
      };

      const response = await fetch(`${BASE_URL}/api/display-sub-components`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(`[HTTP ${response.status}] POST /api/display-sub-components failed: ${json.error || response.statusText}`);
      }
      return { success: true, data: json.data };
    } catch (err) {
      console.error(`[REST API Error] createDisplaySubComponent failed:`, err.message);
      throw err;
    }
  }

  async updateDisplaySubComponent(id, place) {
    try {
      const response = await fetch(`${BASE_URL}/api/display-sub-components/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(place),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(`[HTTP ${response.status}] PUT /api/display-sub-components/${id} failed: ${json.error || response.statusText}`);
      }
      return { success: true, data: json.data };
    } catch (err) {
      console.error(`[REST API Error] updateDisplaySubComponent failed:`, err.message);
      throw err;
    }
  }

  async deleteDisplaySubComponent(id) {
    try {
      const response = await fetch(`${BASE_URL}/api/display-sub-components/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(`[HTTP ${response.status}] DELETE /api/display-sub-components/${id} failed: ${json.error || response.statusText}`);
      }
      return { success: true, deleted: true };
    } catch (err) {
      console.error(`[REST API Error] deleteDisplaySubComponent failed:`, err.message);
      throw err;
    }
  }

  // ===========================================================================
  // CATEGORY-SPECIFIC CRUD (Unified through MongoDB /api/display-components)
  // ===========================================================================

  // 1. GYMS
  async fetchGyms(hotelPropertyId = null) {
    return this.fetchDisplayComponents({ hotelPropertyId, category: 'gyms' });
  }

  async fetchGymById(id) {
    try {
      const res = await fetch(`${this.apiUrl}/${encodeURIComponent(id)}`, { headers: this.getHeaders() });
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, data: DisplayComponent.fromJson(json.data) };
      }
      return { success: false, data: null };
    } catch (err) {
      return { success: false, error: err.message, data: null };
    }
  }

  async createGym(data) {
    return this.createDisplayComponent({ ...data, category: 'gyms', componentTypeId: 2 });
  }

  async updateGym(id, data) {
    return this.updateDisplayComponent(id, { ...data, category: 'gyms', componentTypeId: 2 });
  }

  async deleteGym(id) {
    return this.deleteDisplayComponent(id);
  }

  // 2. SWIMMING POOLS
  async fetchSwimmingPools(hotelPropertyId = null) {
    return this.fetchDisplayComponents({ hotelPropertyId, category: 'pools' });
  }

  async createSwimmingPool(data) {
    return this.createDisplayComponent({ ...data, category: 'pools', componentTypeId: 2 });
  }

  async updateSwimmingPool(id, data) {
    return this.updateDisplayComponent(id, { ...data, category: 'pools', componentTypeId: 2 });
  }

  async deleteSwimmingPool(id) {
    return this.deleteDisplayComponent(id);
  }

  // 3. RESTAURANTS / DINING
  async fetchRestaurants(hotelPropertyId = null) {
    return this.fetchDisplayComponents({ hotelPropertyId, category: 'dining' });
  }

  async createRestaurant(data) {
    return this.createDisplayComponent({ ...data, category: 'dining', componentTypeId: 1 });
  }

  async updateRestaurant(id, data) {
    return this.updateDisplayComponent(id, { ...data, category: 'dining', componentTypeId: 1 });
  }

  async deleteRestaurant(id) {
    return this.deleteDisplayComponent(id);
  }

  // 4. TAKEAWAYS
  async fetchTakeaway(hotelPropertyId = null) {
    return this.fetchDisplayComponents({ hotelPropertyId, category: 'takeaways' });
  }

  async createTakeaway(data) {
    return this.createDisplayComponent({ ...data, category: 'takeaways', componentTypeId: 3 });
  }

  async updateTakeaway(id, data) {
    return this.updateDisplayComponent(id, { ...data, category: 'takeaways', componentTypeId: 3 });
  }

  async deleteTakeaway(id) {
    return this.deleteDisplayComponent(id);
  }

  // 5. HOME DELIVERY
  async fetchHomeDelivery(hotelPropertyId = null) {
    return this.fetchDisplayComponents({ hotelPropertyId, category: 'homeDelivery' });
  }

  async createHomeDelivery(data) {
    return this.createDisplayComponent({ ...data, category: 'homeDelivery', componentTypeId: 4 });
  }

  async updateHomeDelivery(id, data) {
    return this.updateDisplayComponent(id, { ...data, category: 'homeDelivery', componentTypeId: 4 });
  }

  async deleteHomeDelivery(id) {
    return this.deleteDisplayComponent(id);
  }

  // 6. OTHER FACILITIES & CUSTOM AMENITIES
  async fetchFacilities(hotelPropertyId = null) {
    return this.fetchDisplayComponents({ hotelPropertyId, category: 'facilities' });
  }

  async createFacility(data) {
    return this.createDisplayComponent({ ...data, category: data.category || 'facilities', componentTypeId: 5 });
  }

  async updateFacility(id, data) {
    return this.updateDisplayComponent(id, data);
  }

  async deleteFacility(id) {
    return this.deleteDisplayComponent(id);
  }

  // ===========================================================================
  // HOTELS CRUD (MongoDB: hotelApiDb.hotelproperties)
  // ===========================================================================

  mapHotelPropertyToFrontend(doc) {
    if (!doc) return null;
    let lat = null;
    let lng = null;
    if (doc.hotelLatLong && typeof doc.hotelLatLong === 'string') {
      const parts = doc.hotelLatLong.split(',');
      if (parts.length >= 2) {
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
      }
    }
    const cleanAddress = doc.hotelAddress || '';
    const cityGuess = doc.city || cleanAddress.split(',').slice(-2, -1)[0]?.trim() || '';

    return {
      id: doc.hotelPropertyId || doc._id || doc.id,
      _id: doc._id,
      hotelPropertyId: doc.hotelPropertyId || doc.id,
      hotelAdminId: doc.hotelAdminId || 'admin',
      name: doc.hotelName || doc.name || doc.title || 'Hotel Property',
      title: doc.hotelName || doc.name || doc.title || 'Hotel Property',
      subtitle: doc.subtitle || cleanAddress,
      address: cleanAddress,
      location: cleanAddress,
      city: cityGuess || 'Local Area',
      latitude: lat != null ? lat : doc.latitude,
      longitude: lng != null ? lng : doc.longitude,
      lat: lat != null ? lat : doc.latitude,
      lng: lng != null ? lng : doc.longitude,
      contactNumber: doc.hotelContactNumber || doc.contactNumber || '',
      pricePerNight: doc.pricePerNight || '₹14,500 / night',
      rating: doc.rating || 4.9,
      imageLink: doc.imageLink || '',
      images: Array.isArray(doc.images) && doc.images.length > 0 ? doc.images : (doc.imageLink ? [doc.imageLink] : []),
      availability: doc.availability || 'Available',
      paymentMethods: doc.paymentMethods || ['UPI', 'Credit Card', 'Cash', 'Net Banking'],
      paidTill: doc.paidTill,
    };
  }

  mapFrontendToHotelProperty(data, adminId = 'admin') {
    const lat = data.latitude != null ? data.latitude : data.lat;
    const lng = data.longitude != null ? data.longitude : data.lng;
    const latLongStr = (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) ? `${lat},${lng}` : '';
    const propId = data.hotelPropertyId || data.id || `prop-${Date.now()}`;

    return {
      hotelPropertyId: String(propId),
      hotelAdminId: data.hotelAdminId || adminId,
      hotelName: data.hotelName || data.name || data.title || 'Hotel Property',
      hotelAddress: data.hotelAddress || data.address || data.location || '',
      hotelLatLong: latLongStr || data.hotelLatLong || '',
      hotelContactNumber: data.hotelContactNumber || data.contactNumber || data.phone || '+91 80 0000 0000',
      city: data.city || '',
      rating: data.rating ? parseFloat(data.rating) : 4.9,
      pricePerNight: data.pricePerNight || '₹14,500 / night',
      imageLink: data.imageLink || (Array.isArray(data.images) ? data.images[0] : ''),
      images: Array.isArray(data.images) ? data.images : (data.imageLink ? [data.imageLink] : []),
      paymentMethods: data.paymentMethods || ['UPI', 'Credit Card', 'Cash', 'Net Banking'],
      availability: data.availability || 'Available',
      paidTill: data.paidTill || (Date.now() + 365 * 86400000),
    };
  }

  async fetchHotels() {
    try {
      const url = `${BASE_URL}/api/hotel-properties`;
      console.log(`[REST API] GET ${url}`);
      const res = await fetch(url, { headers: this.getHeaders() });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(`[HTTP ${res.status}] GET ${url} failed: ${json.error || res.statusText}`);
      }
      const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
      const mapped = list.map((doc) => this.mapHotelPropertyToFrontend(doc));
      return { success: true, data: mapped };
    } catch (err) {
      console.error(`[REST API Error] fetchHotels failed:`, err.message);
      return { success: false, error: err.message, data: [] };
    }
  }

  async createHotel(hotelData) {
    try {
      const payload = this.mapFrontendToHotelProperty(hotelData);
      const url = `${BASE_URL}/api/hotel-properties`;
      console.log(`[REST API] POST ${url}`, payload.hotelName);

      const res = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(`[HTTP ${res.status}] POST ${url} failed: ${json.error || res.statusText}`);
      }

      const savedItem = this.mapHotelPropertyToFrontend(json.data);
      return { success: true, data: savedItem };
    } catch (err) {
      console.error(`[REST API Error] createHotel failed:`, err.message);
      throw err;
    }
  }

  async updateHotel(id, hotelData) {
    try {
      const payload = this.mapFrontendToHotelProperty({ ...hotelData, id });
      const url = `${BASE_URL}/api/hotel-properties/${encodeURIComponent(id)}`;
      console.log(`[REST API] PUT ${url}`, payload.hotelName);

      const res = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(`[HTTP ${res.status}] PUT ${url} failed: ${json.error || res.statusText}`);
      }

      const updatedItem = this.mapHotelPropertyToFrontend(json.data);
      return { success: true, data: updatedItem };
    } catch (err) {
      console.error(`[REST API Error] updateHotel failed:`, err.message);
      throw err;
    }
  }

  async deleteHotel(id) {
    try {
      const url = `${BASE_URL}/api/hotel-properties/${encodeURIComponent(id)}`;
      console.log(`[REST API] DELETE ${url}`);

      const res = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(`[HTTP ${res.status}] DELETE ${url} failed: ${json.error || res.statusText}`);
      }

      return { success: true, id };
    } catch (err) {
      console.error(`[REST API Error] deleteHotel failed:`, err.message);
      throw err;
    }
  }

  async fetchHotelPaymentMethods(hotelId) {
    try {
      const hotelsRes = await this.fetchHotels();
      if (hotelsRes.success && Array.isArray(hotelsRes.data)) {
        const found = hotelsRes.data.find((h) => h.id === hotelId || h.hotelPropertyId === hotelId || h._id === hotelId);
        if (found) {
          return { success: true, paymentMethods: found.paymentMethods || ['UPI', 'Credit Card', 'Cash', 'Net Banking'] };
        }
      }
      return { success: true, paymentMethods: ['UPI', 'Credit Card', 'Cash', 'Net Banking'] };
    } catch (err) {
      return { success: true, paymentMethods: ['UPI', 'Credit Card', 'Cash', 'Net Banking'] };
    }
  }

  async updateHotelPaymentMethods(hotelId, paymentMethods) {
    return this.updateHotel(hotelId, { paymentMethods });
  }

  async toggleAvailability(categoryType, id, availability) {
    try {
      if (categoryType === 'hotels') {
        return this.updateHotel(id, { availability });
      }
      return this.updateDisplayComponent(id, { availability });
    } catch (err) {
      console.error(`[REST API Error] toggleAvailability failed:`, err.message);
      throw err;
    }
  }

  async fetchSummary() {
    try {
      const [hotelsRes, compRes] = await Promise.all([
        this.fetchHotels(),
        this.fetchDisplayComponents(),
      ]);

      const hotels = hotelsRes.data || [];
      const comps = compRes.data || [];

      return {
        success: true,
        data: {
          status: 'ok',
          server: 'online',
          database: 'hotelApiDb (MongoDB)',
          totalHotels: hotels.length,
          totalRestaurants: comps.filter((c) => c.category === 'dining' || c.componentType === 1).length,
          totalGyms: comps.filter((c) => c.category === 'gyms' || c.category === 'pools' || c.componentType === 2).length,
          totalTakeaway: comps.filter((c) => c.category === 'takeaways' || c.componentType === 3).length,
          totalDelivery: comps.filter((c) => c.category === 'homeDelivery' || c.componentType === 4).length,
          totalComponents: comps.length,
          totalBookings: 0,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        data: null,
      };
    }
  }

  async resetAllData() {
    console.log('[REST API] Reset called');
    return { success: true };
  }
}

export const apiService = new ApiService();
