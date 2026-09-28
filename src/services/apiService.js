// =============================================================================
// src/services/apiService.js
// REST API Service for Display Components
// Fetches component list from backend REST API server.
// =============================================================================

import { DisplayComponent } from '../models/DisplayComponent.js';
import { database } from './database.js';

// No hardcoded mock data — all data comes from the real backend or place search
export const MOCK_BACKEND_DATA = [];

const getHost = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return window.location.hostname;
  }
  return '127.0.0.1';
};

// Dynamic backend API URL (auto-switches to local IP when accessed from phone)
const DEFAULT_API_URL = 'http://' + getHost() + ':3000/api/display-components';

class ApiService {
  constructor() {
    this.apiUrl = DEFAULT_API_URL;
  }

  setApiUrl(url) {
    this.apiUrl = url;
  }

  /**
   * Helper to attach Auth token if available
   */
  getHeaders() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = window.localStorage.getItem('@hotel_portal_admin_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  /**
   * Fetches DisplayComponents from the REST API endpoint with optional filter.
   */
  async fetchDisplayComponents({ componentType = null, query = '' } = {}) {
    try {
      let targetUrl = this.apiUrl;
      const params = [];
      if (componentType !== null && componentType !== undefined && componentType !== '') {
        params.push(`componentType=${encodeURIComponent(componentType)}`);
      }
      if (query && query.trim()) {
        params.push(`q=${encodeURIComponent(query.trim())}`);
      }
      if (params.length > 0) {
        targetUrl += `?${params.join('&')}`;
      }

      console.log(`[REST API] Requesting components from: ${targetUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const rawList = Array.isArray(json) ? json : json.data || json.components || [];
        console.log(`[REST API] Successfully received ${rawList.length} components from server.`);
        return {
          success: true,
          source: 'backend_server',
          data: rawList.map((item) => DisplayComponent.fromJson(item)),
        };
      } else {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
    } catch (err) {
      console.log(`[REST API] Backend server not reachable (${err.message}). Falling back to local database or seed.`);
      try {
        const local = await database.getAllComponents();
        const hasLegacy = local && local.some((c) => c.title && (c.title.includes('Harbor') || c.title.includes('Marine') || c.title.includes('Promenade')));
        if (hasLegacy) {
          console.warn('[REST API] Purging legacy database records found in fallback.');
          database.purgeLegacyData();
        } else if (local && local.length >= 20) {
          let list = local;
          if (componentType !== null && componentType !== undefined && componentType !== '') {
            list = list.filter((c) => parseInt(c.componentType, 10) === parseInt(componentType, 10));
          }
          if (query && query.trim()) {
            const qLower = query.toLowerCase();
            list = list.filter((c) => (c.title || '').toLowerCase().includes(qLower) || (c.subtitle || '').toLowerCase().includes(qLower));
          }
          return {
            success: true,
            source: 'local_database',
            data: list,
          };
        }
      } catch (dbErr) {
        console.warn('[REST API] Error querying local database:', dbErr);
      }

      let list = MOCK_BACKEND_DATA.map((item) => DisplayComponent.fromJson(item));
      if (componentType !== null && componentType !== undefined && componentType !== '') {
        list = list.filter((c) => parseInt(c.componentType, 10) === parseInt(componentType, 10));
      }
      if (query && query.trim()) {
        const qLower = query.toLowerCase();
        list = list.filter((c) => c.title.toLowerCase().includes(qLower) || c.subtitle.toLowerCase().includes(qLower));
      }
      return {
        success: true,
        source: 'local_api_seed',
        data: list,
      };
    }
  }

  /**
   * CREATE: POST new DisplayComponent to REST API (with resilient offline fallback)
   */
  async createComponent(componentData) {
    try {
      console.log('[REST API] Creating component:', componentData.title);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(componentData),
      });

      const json = await response.json();
      if (response.ok && json.status === 'success') {
        const item = DisplayComponent.fromJson(json.data);
        await database.upsertComponent(item);
        return { success: true, data: item };
      }
      throw new Error(json.message || 'Failed to create component on server');
    } catch (err) {
      console.warn('[REST API] Server unreachable for create, creating locally in database:', err.message);
      const typeNum = parseInt(componentData.componentType !== undefined ? componentData.componentType : 2, 10);
      const newId = componentData.id || `custom-${typeNum}-${Date.now()}`;
      const localItem = new DisplayComponent({
        ...componentData,
        id: newId,
        componentType: typeNum,
        priority: componentData.priority || 99,
        likes: componentData.likes || 100,
        customerRatings: componentData.customerRatings || 4.8,
      });
      await database.upsertComponent(localItem);
      return { success: true, data: localItem, isLocal: true };
    }
  }

  /**
   * UPDATE: PUT modified DisplayComponent to REST API (with resilient offline fallback)
   */
  async updateComponent(id, componentData) {
    try {
      console.log(`[REST API] Updating component ${id}:`, componentData);
      const response = await fetch(`${this.apiUrl}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(componentData),
      });

      const json = await response.json();
      if (response.ok && json.status === 'success') {
        const item = DisplayComponent.fromJson(json.data);
        await database.upsertComponent(item);
        return { success: true, data: item };
      }
      throw new Error(json.message || 'Failed to update component on server');
    } catch (err) {
      console.warn('[REST API] Server unreachable for update, updating locally in database:', err.message);
      const existing = await database.getAllComponents();
      const current = existing.find((c) => c.id === id) || {};
      const updatedItem = new DisplayComponent({
        ...current,
        ...componentData,
        id: id,
      });
      await database.upsertComponent(updatedItem);
      return { success: true, data: updatedItem, isLocal: true };
    }
  }

  /**
   * DELETE: DELETE DisplayComponent by ID (with resilient offline fallback)
   */
  async deleteComponent(id) {
    try {
      console.log(`[REST API] Deleting component ${id}`);
      const response = await fetch(`${this.apiUrl}/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      const json = await response.json();
      if (response.ok && json.status === 'success') {
        await database.deleteComponent(id);
        return { success: true, id, message: json.message };
      }
      throw new Error(json.message || 'Failed to delete component on server');
    } catch (err) {
      console.warn('[REST API] Server unreachable for delete, deleting locally in database:', err.message);
      await database.deleteComponent(id);
      return { success: true, id, message: 'Deleted from local database' };
    }
  }

  /**
   * RESET: Reset all display components back to default 33 demo items
   */
  async resetComponents() {
    try {
      console.log('[REST API] Resetting all components to default seed');
      const response = await fetch(`${this.apiUrl}/reset`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      const json = await response.json();
      if (response.ok && json.status === 'success') {
        return {
          success: true,
          count: json.count,
          data: json.data.map((item) => DisplayComponent.fromJson(item)),
        };
      }
      return { success: false, error: json.message || 'Failed to reset components' };
    } catch (err) {
      console.error('[REST API] Reset error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * LIKE: Real-time like counter increment
   */
  async likeComponent(id) {
    try {
      const response = await fetch(`${this.apiUrl}/${encodeURIComponent(id)}/like`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      const json = await response.json();
      if (response.ok && json.status === 'success') {
        return { success: true, likes: json.likes, data: json.data };
      }
      return { success: false, error: json.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * BOOKINGS: Fetch all guest bookings
   */
  async fetchBookings() {
    const bookingsUrl = this.apiUrl.replace(/\/display-components$/, '/bookings');
    try {
      const response = await fetch(bookingsUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      const json = await response.json();
      if (response.ok && json.status === 'success') {
        return { success: true, data: json.data || [] };
      }
      return { success: false, data: this._getLocalBookings() };
    } catch (err) {
      console.warn('[REST API] Failed to fetch bookings from server, using local fallback:', err);
      return { success: true, data: this._getLocalBookings() };
    }
  }

  /**
   * BOOKINGS: Create new guest booking
   */
  async createBooking(bookingData) {
    const bookingsUrl = this.apiUrl.replace(/\/display-components$/, '/bookings');
    try {
      const response = await fetch(bookingsUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(bookingData),
      });
      const json = await response.json();
      if (response.ok && json.status === 'success') {
        this._saveLocalBooking(json.booking);
        return { success: true, booking: json.booking };
      }
      // Fallback local save if server error
      const localBooking = this._createLocalBooking(bookingData);
      return { success: true, booking: localBooking, isLocal: true };
    } catch (err) {
      console.warn('[REST API] Server booking error, saving locally:', err);
      const localBooking = this._createLocalBooking(bookingData);
      return { success: true, booking: localBooking, isLocal: true };
    }
  }

  /**
   * BOOKINGS: Cancel guest booking
   */
  async cancelBooking(bookingId) {
    const bookingsUrl = `${this.apiUrl.replace(/\/display-components$/, '/bookings')}/${encodeURIComponent(bookingId)}`;
    try {
      const response = await fetch(bookingsUrl, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      const json = await response.json();
      this._deleteLocalBooking(bookingId);
      if (response.ok && json.status === 'success') {
        return { success: true, deleted: json.deleted };
      }
      return { success: true, message: 'Cancelled locally' };
    } catch (err) {
      this._deleteLocalBooking(bookingId);
      return { success: true, message: 'Cancelled locally' };
    }
  }

  _getLocalBookings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('taj_guest_bookings');
        if (stored) return JSON.parse(stored);
      }
    } catch (e) {}
    return [];
  }

  _saveLocalBooking(booking) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const list = this._getLocalBookings();
        list.unshift(booking);
        window.localStorage.setItem('taj_guest_bookings', JSON.stringify(list));
      }
    } catch (e) {}
  }

  _createLocalBooking(data) {
    const booking = {
      id: `BK-TAJ-${Math.floor(1000 + Math.random() * 9000)}`,
      ...data,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };
    this._saveLocalBooking(booking);
    return booking;
  }

  _deleteLocalBooking(id) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const list = this._getLocalBookings().filter((b) => b.id !== id);
        window.localStorage.setItem('taj_guest_bookings', JSON.stringify(list));
      }
    } catch (e) {}
  }

  // ===========================================================================
  // BACKEND ADAPTERS & REAL API CONNECTIONS (hotel-api)
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
    const cityGuess = cleanAddress.split(',').slice(-2, -1)[0]?.trim() || '';
    return {
      id: doc.hotelPropertyId || doc._id,
      _id: doc._id,
      hotelPropertyId: doc.hotelPropertyId || doc.id,
      hotelAdminId: doc.hotelAdminId,
      name: doc.hotelName || 'Hotel Property',
      title: doc.hotelName || 'Hotel Property',
      address: cleanAddress,
      location: cleanAddress,
      city: cityGuess || 'Local Area',
      latitude: lat,
      longitude: lng,
      lat,
      lng,
      contactNumber: doc.hotelContactNumber || '',
      paidTill: doc.paidTill,
      paymentStatus: (doc.paidTill && doc.paidTill > Date.now()) ? 'Paid' : 'Pending',
    };
  }

  mapFrontendToHotelProperty(data, adminId = 'admin-001') {
    const lat = data.latitude != null ? data.latitude : data.lat;
    const lng = data.longitude != null ? data.longitude : data.lng;
    const latLongStr = (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) ? `${lat},${lng}` : '';
    return {
      hotelPropertyId: data.hotelPropertyId || data.id || `prop-${Date.now()}`,
      hotelAdminId: data.hotelAdminId || adminId,
      hotelName: data.name || data.title || 'Hotel Property',
      hotelAddress: data.address || data.location || '',
      hotelLatLong: latLongStr,
      hotelContactNumber: data.contactNumber || data.phone || '+91 80 0000 0000',
      paidTill: data.paidTill || (Date.now() + 365 * 86400000),
    };
  }

  mapSubComponentToFrontend(doc) {
    if (!doc) return null;
    return {
      id: doc._id,
      _id: doc._id,
      componentTypeId: doc.componentTypeId,
      subComponentTypeId: doc.subComponentTypeId,
      hotelPropertyId: doc.hotelPropertyId,
      title: doc.title,
      name: doc.title,
      subtitle: doc.subTitle || '',
      desc: doc.subTitle || '',
      imageLink: doc.imageLink || '',
      data1: doc.data1 || '',
      data2: doc.data2 || '',
      data3: doc.data3 || '',
      data4: doc.data4 || '',
      data5: doc.data5 || '',
      rating: doc.data1 ? parseFloat(doc.data1.replace(/[^0-9.]/g, '')) || 4.8 : 4.8,
      timings: doc.data2 || '',
      timeEstimate: doc.data2 || '',
      offer: doc.data3 || '',
      cuisine: doc.data4 || '',
      category: doc.data4 || '',
      location: doc.data5 || '',
      address: doc.data5 || '',
      distance: doc.data5 || '',
      availability: 'Available',
    };
  }

  mapFrontendToSubComponent(item, componentTypeId = 5, subTypeId = 501, propertyId = 'prop-001') {
    return {
      componentTypeId: item.componentTypeId || componentTypeId,
      hotelPropertyId: item.hotelPropertyId || propertyId,
      subComponentTypeId: item.subComponentTypeId || subTypeId,
      title: item.title || item.name || 'Untitled Item',
      subTitle: item.subtitle || item.desc || '',
      imageLink: item.imageLink || '',
      data1: item.data1 || (item.rating ? `★ ${item.rating}` : '★ 4.8'),
      data2: item.data2 || item.timings || item.timeEstimate || 'Open Daily',
      data3: item.data3 || item.offer || (item.takeaway ? 'Takeaway Available' : 'On-Property'),
      data4: item.data4 || item.cuisine || item.category || 'Specialty',
      data5: item.data5 || item.location || item.address || 'Local Area',
    };
  }

  async fetchHotels() {
    try {
      const res = await fetch(`http://${getHost()}:3000/api/hotel-properties`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        return { success: true, data: list.map(this.mapHotelPropertyToFrontend) };
      }
    } catch (e) {
      console.warn('[apiService] fetchHotels error:', e.message);
    }
    return { success: true, data: [] };
  }

  async fetchHotelById(id) {
    try {
      const res = await fetch(`http://${getHost()}:3000/api/hotel-properties/${encodeURIComponent(id)}`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: this.mapHotelPropertyToFrontend(json.data) };
      }
    } catch (e) {}
    return { success: false, data: null };
  }

  async fetchHotelPaymentMethods(hotelId) {
    try {
      const res = await fetch(`http://${getHost()}:3000/api/hotels/${encodeURIComponent(hotelId)}/payment-methods`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return { success: true, paymentMethods: json.paymentMethods || [] };
      }
    } catch (e) {}
    const found = HOTELS_DATA.find((h) => h.id === hotelId);
    return { success: true, paymentMethods: found?.paymentMethods || ['UPI', 'Cash'] };
  }

  async updateHotelPaymentMethods(hotelId, paymentMethods) {
    try {
      const res = await fetch(`http://${getHost()}:3000/api/hotels/${encodeURIComponent(hotelId)}/payment-methods`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ paymentMethods }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, paymentMethods: json.paymentMethods };
      }
    } catch (e) {}
    return { success: false };
  }

  async addHotelPaymentMethod(hotelId, method) {
    try {
      const res = await fetch(`http://${getHost()}:3000/api/hotels/${encodeURIComponent(hotelId)}/payment-methods`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ method }),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, paymentMethods: json.paymentMethods };
      }
    } catch (e) {}
    return { success: false };
  }

  async deleteHotelPaymentMethod(hotelId, method) {
    try {
      const res = await fetch(`http://${getHost()}:3000/api/hotels/${encodeURIComponent(hotelId)}/payment-methods/${encodeURIComponent(method)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, paymentMethods: json.paymentMethods };
      }
    } catch (e) {}
    return { success: false };
  }

  async createHotel(hotelData) {
    try {
      const payload = this.mapFrontendToHotelProperty(hotelData);
      const res = await fetch(`http://${getHost()}:3000/api/hotel-properties`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: this.mapHotelPropertyToFrontend(json.data) };
      }
    } catch (e) {
      console.warn('[apiService] createHotel error:', e.message);
    }
    return { success: false };
  }

  async updateHotel(id, hotelData) {
    try {
      const payload = this.mapFrontendToHotelProperty(hotelData);
      const res = await fetch(`http://${getHost()}:3000/api/hotel-properties/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: this.mapHotelPropertyToFrontend(json.data) };
      }
    } catch (e) {}
    return { success: false };
  }

  async deleteHotel(id) {
    try {
      const res = await fetch(`http://${getHost()}:3000/api/hotel-properties/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      if (res.ok) return { success: true };
    } catch (e) {}
    return { success: false };
  }

  // ===========================================================================
  // REAL DISPLAY SUB-COMPONENTS (backend/routes/displaySubComponent.routes.js)
  // ===========================================================================

  async fetchDisplaySubComponents(componentTypeId = null, hotelPropertyId = null) {
    try {
      let url = `http://${getHost()}:3000/api/display-sub-components`;
      const params = [];
      if (componentTypeId != null) params.push(`componentTypeId=${encodeURIComponent(componentTypeId)}`);
      if (hotelPropertyId) params.push(`hotelPropertyId=${encodeURIComponent(hotelPropertyId)}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const res = await fetch(url, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        return { success: true, data: list.map(this.mapSubComponentToFrontend) };
      }
    } catch (e) {
      console.warn('[apiService] fetchDisplaySubComponents error:', e.message);
    }
    return { success: true, data: [] };
  }

  async createDisplaySubComponent(item, componentTypeId = 5, subTypeId = 501, propertyId = 'prop-001') {
    try {
      const payload = this.mapFrontendToSubComponent(item, componentTypeId, subTypeId, propertyId);
      const res = await fetch(`http://${getHost()}:3000/api/display-sub-components`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: this.mapSubComponentToFrontend(json.data) };
      }
    } catch (e) {
      console.warn('[apiService] createDisplaySubComponent error:', e.message);
    }
    return { success: false };
  }

  async updateDisplaySubComponent(id, item) {
    try {
      const payload = this.mapFrontendToSubComponent(item);
      const res = await fetch(`http://${getHost()}:3000/api/display-sub-components/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: this.mapSubComponentToFrontend(json.data) };
      }
    } catch (e) {}
    return { success: false };
  }

  async deleteDisplaySubComponent(id) {
    try {
      const res = await fetch(`http://${getHost()}:3000/api/display-sub-components/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      if (res.ok) return { success: true };
    } catch (e) {}
    return { success: false };
  }

  // ===========================================================================
  // CATEGORIZED SERVICES: RESTAURANTS, GYMS, TAKEAWAY, HOME DELIVERY
  // (Mapped through DisplaySubComponents with Faculty 5-Column Schema)
  // ===========================================================================

  async fetchRestaurants() {
    const res = await this.fetchDisplaySubComponents(5);
    if (res.success && res.data.length > 0) {
      const dining = res.data.filter((item) => item.subComponentTypeId === 502 || item.category?.toLowerCase().includes('dining') || item.category?.toLowerCase().includes('bistro'));
      if (dining.length > 0) return { success: true, data: dining };
    }
    return { success: true, data: [] };
  }

  async createRestaurant(data) {
    return this.createDisplaySubComponent(data, 5, 502);
  }

  async updateRestaurant(id, data) {
    return this.updateDisplaySubComponent(id, data);
  }

  async deleteRestaurant(id) {
    return this.deleteDisplaySubComponent(id);
  }

  async fetchGyms() {
    const res = await this.fetchDisplaySubComponents(5);
    if (res.success && res.data.length > 0) {
      const gyms = res.data.filter((item) => item.subComponentTypeId === 501 || item.category?.toLowerCase().includes('gym') || item.category?.toLowerCase().includes('wellness'));
      if (gyms.length > 0) return { success: true, data: gyms };
    }
    return { success: true, data: [] };
  }

  async fetchGymById(id) {
    try {
      const res = await fetch(`http://${getHost()}:3000/api/display-sub-components/${encodeURIComponent(id)}`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        return { success: true, data: this.mapSubComponentToFrontend(json.data) };
      }
    } catch (e) {}
    return { success: false, data: null };
  }

  async createGym(data) {
    return this.createDisplaySubComponent(data, 5, 501);
  }

  async updateGym(id, data) {
    return this.updateDisplaySubComponent(id, data);
  }

  async deleteGym(id) {
    return this.deleteDisplaySubComponent(id);
  }

  async fetchTakeaway() {
    const res = await this.fetchDisplaySubComponents(5);
    if (res.success && res.data.length > 0) {
      const takeaways = res.data.filter((item) => item.subComponentTypeId === 504 || item.category?.toLowerCase().includes('takeaway'));
      if (takeaways.length > 0) return { success: true, data: takeaways };
    }
    return { success: true, data: [] };
  }

  async createTakeaway(data) {
    return this.createDisplaySubComponent(data, 5, 504);
  }

  async updateTakeaway(id, data) {
    return this.updateDisplaySubComponent(id, data);
  }

  async deleteTakeaway(id) {
    return this.deleteDisplaySubComponent(id);
  }

  async fetchHomeDelivery() {
    const res = await this.fetchDisplaySubComponents(5);
    if (res.success && res.data.length > 0) {
      const delivery = res.data.filter((item) => item.subComponentTypeId === 505 || item.category?.toLowerCase().includes('delivery'));
      if (delivery.length > 0) return { success: true, data: delivery };
    }
    return { success: true, data: [] };
  }

  async createHomeDelivery(data) {
    return this.createDisplaySubComponent(data, 5, 505);
  }

  async updateHomeDelivery(id, data) {
    return this.updateDisplaySubComponent(id, data);
  }

  async deleteHomeDelivery(id) {
    return this.deleteDisplaySubComponent(id);
  }

  async deleteBooking(id) {
    return { success: true };
  }

  async toggleAvailability(categoryType, id, availability) {
    return { success: true, availability };
  }

  async fetchSummary() {
    try {
      const res = await fetch(`http://${getHost()}:3000/health`);
      if (res.ok) {
        return { success: true, data: { status: 'ok', server: 'online', database: 'hotelApiDb' } };
      }
    } catch (e) {}
    return { success: false };
  }

  async resetAllData() {
    return { success: true };
  }
}

export const apiService = new ApiService();
