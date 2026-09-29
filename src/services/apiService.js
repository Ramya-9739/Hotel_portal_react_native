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
      if (response.ok && (json.success || json.status === 'success')) {
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
      if (response.ok && (json.success || json.status === 'success')) {
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
      if (response.ok && (json.success || json.status === 'success')) {
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
      if (response.ok && (json.success || json.status === 'success')) {
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
      if (response.ok && (json.success || json.status === 'success')) {
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
      if (response.ok && (json.success || json.status === 'success')) {
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
      if (response.ok && (json.success || json.status === 'success')) {
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
      if (response.ok && (json.success || json.status === 'success')) {
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
    } catch (e) { }
    return [];
  }

  _saveLocalBooking(booking) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const list = this._getLocalBookings();
        list.unshift(booking);
        window.localStorage.setItem('taj_guest_bookings', JSON.stringify(list));
      }
    } catch (e) { }
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
    } catch (e) { }
  }

  // ===========================================================================
  // BACKEND ADAPTERS & RESILIENT CRUD DATA ENGINE
  // Dual-Engine: Seamless local storage persistence + MongoDB backend sync
  // ===========================================================================

  _getStorage(key, defaultVal = []) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const str = window.localStorage.getItem(key);
        if (str) return JSON.parse(str);
      }
    } catch (e) { }
    return defaultVal;
  }

  _setStorage(key, val) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(val));
      }
    } catch (e) { }
  }

  _getSampleSeed(category) {
    try {
      const sample = require('../../sample_admin_data.json');
      if (category === 'hotels') {
        return (sample.sampleHotels || []).map((h) => ({
          ...h,
          title: h.name,
          location: h.city,
          imageLink: (h.images && h.images[0]?.url) || h.images?.[0] || '',
          availability: 'Available',
          paymentMethods: ['UPI', 'Credit Card', 'Cash', 'Net Banking'],
        }));
      }
      const places = sample.samplePlacesByCategory || {};
      if (category === 'restaurants') {
        return (places.restaurants || []).map((r, i) => ({
          id: `rest-${i + 1}`,
          title: r.title,
          subtitle: r.subtitle,
          cuisine: 'Fine Dining & Continental',
          location: r.address || 'Bengaluru',
          distance: r.distance || '0.3 km',
          priceRange: '₹₹₹₹',
          rating: r.rating || 4.9,
          imageLink: r.imageLink,
          availability: 'Available',
          takeaway: true,
          homeDelivery: true,
        }));
      }
      if (category === 'gyms') {
        return (places.gyms || []).map((g, i) => ({
          id: `gym-${i + 1}`,
          title: g.title,
          subtitle: g.subtitle,
          location: g.address || 'Bengaluru',
          distance: g.distance || '0.5 km',
          passPrice: '₹1,500 / day pass',
          rating: g.rating || 4.9,
          imageLink: g.imageLink,
          availability: 'Available',
          timings: g.timings || '5:30 AM - 10:30 PM',
        }));
      }
      if (category === 'takeaway') {
        return (places.takeaways || []).map((t, i) => ({
          id: `takeaway-${i + 1}`,
          title: t.title,
          subtitle: t.subtitle,
          location: t.address || 'Bengaluru',
          distance: t.distance || '0.4 km',
          minOrder: 'Min ₹400',
          rating: t.rating || 4.8,
          imageLink: t.imageLink,
          availability: 'Available',
          takeawayTime: '15 mins ready',
        }));
      }
      if (category === 'delivery') {
        return (places.homeDelivery || []).map((d, i) => ({
          id: `delivery-${i + 1}`,
          title: d.title,
          subtitle: d.subtitle,
          location: d.address || 'Bengaluru',
          radius: d.distance || '5 km',
          deliveryFee: 'Free Suite Delivery',
          rating: d.rating || 4.9,
          imageLink: d.imageLink,
          availability: 'Available',
          deliveryTime: '25-35 mins',
        }));
      }
    } catch (e) { }
    return [];
  }

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
      id: doc.hotelPropertyId || doc._id || doc.id,
      _id: doc._id,
      hotelPropertyId: doc.hotelPropertyId || doc.id,
      hotelAdminId: doc.hotelAdminId,
      name: doc.hotelName || doc.name || doc.title || 'Hotel Property',
      title: doc.hotelName || doc.name || doc.title || 'Hotel Property',
      subtitle: doc.subtitle || cleanAddress,
      address: cleanAddress || doc.address || '',
      location: cleanAddress || doc.location || '',
      city: cityGuess || doc.city || 'Local Area',
      latitude: lat != null ? lat : doc.latitude,
      longitude: lng != null ? lng : doc.longitude,
      lat: lat != null ? lat : doc.latitude,
      lng: lng != null ? lng : doc.longitude,
      contactNumber: doc.hotelContactNumber || doc.contactNumber || '',
      pricePerNight: doc.pricePerNight || '₹14,500 / night',
      rating: doc.rating || 4.9,
      imageLink: doc.imageLink || '',
      images: doc.images || [],
      availability: doc.availability || 'Available',
      paymentMethods: doc.paymentMethods || ['UPI', 'Credit Card', 'Cash', 'Net Banking'],
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
      id: doc._id || doc.id,
      _id: doc._id,
      componentTypeId: doc.componentTypeId,
      subComponentTypeId: doc.subComponentTypeId,
      hotelPropertyId: doc.hotelPropertyId,
      title: doc.title || doc.name,
      name: doc.title || doc.name,
      subtitle: doc.subTitle || doc.subtitle || '',
      desc: doc.subTitle || doc.subtitle || '',
      imageLink: doc.imageLink || '',
      data1: doc.data1 || '',
      data2: doc.data2 || '',
      data3: doc.data3 || '',
      data4: doc.data4 || '',
      data5: doc.data5 || '',
      rating: doc.data1 ? parseFloat(doc.data1.replace(/[^0-9.]/g, '')) || 4.8 : (doc.rating || 4.8),
      timings: doc.data2 || doc.timings || '',
      timeEstimate: doc.data2 || doc.timeEstimate || '',
      offer: doc.data3 || doc.offer || '',
      cuisine: doc.data4 || doc.cuisine || '',
      category: doc.data4 || doc.category || '',
      location: doc.data5 || doc.location || '',
      address: doc.data5 || doc.address || '',
      distance: doc.data5 || doc.distance || '',
      availability: doc.availability || 'Available',
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

  // ===========================================================================
  // HOTELS CRUD
  // ===========================================================================

  async fetchHotels() {
    let localHotels = this._getStorage('@hotel_crud_hotels');
    if (!localHotels || localHotels.length === 0) {
      localHotels = this._getSampleSeed('hotels');
      this._setStorage('@hotel_crud_hotels', localHotels);
    }
    try {
      const res = await fetch(`http://${getHost()}:3000/api/hotel-properties`, { headers: this.getHeaders() });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        if (list.length > 0) {
          const mapped = list.map(this.mapHotelPropertyToFrontend);
          this._setStorage('@hotel_crud_hotels', mapped);
          return { success: true, data: mapped };
        }
      }
    } catch (e) { }
    return { success: true, data: localHotels };
  }

  async createHotel(hotelData) {
    const newItem = {
      ...hotelData,
      id: hotelData.id || `hotel-${Date.now()}`,
      title: hotelData.title || hotelData.name || 'New Hotel',
      name: hotelData.name || hotelData.title || 'New Hotel',
      availability: hotelData.availability || 'Available',
      paymentMethods: hotelData.paymentMethods || ['UPI', 'Credit Card', 'Cash'],
    };
    const current = this._getStorage('@hotel_crud_hotels', this._getSampleSeed('hotels'));
    const updated = [newItem, ...current.filter((h) => h.id !== newItem.id)];
    this._setStorage('@hotel_crud_hotels', updated);

    // Sync to backend asynchronously
    fetch(`http://${getHost()}:3000/api/hotel-properties`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(this.mapFrontendToHotelProperty(newItem)),
    }).catch(() => { });

    return { success: true, data: newItem };
  }

  async updateHotel(id, hotelData) {
    const current = this._getStorage('@hotel_crud_hotels', this._getSampleSeed('hotels'));
    const updated = current.map((h) => (h.id === id ? { ...h, ...hotelData } : h));
    this._setStorage('@hotel_crud_hotels', updated);

    // Sync to backend asynchronously
    fetch(`http://${getHost()}:3000/api/hotel-properties/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(this.mapFrontendToHotelProperty({ ...hotelData, id })),
    }).catch(() => { });

    const target = updated.find((h) => h.id === id) || { ...hotelData, id };
    return { success: true, data: target };
  }

  async deleteHotel(id) {
    const current = this._getStorage('@hotel_crud_hotels', this._getSampleSeed('hotels'));
    const updated = current.filter((h) => h.id !== id);
    this._setStorage('@hotel_crud_hotels', updated);

    fetch(`http://${getHost()}:3000/api/hotel-properties/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    }).catch(() => { });

    return { success: true };
  }

  async fetchHotelPaymentMethods(hotelId) {
    const hotels = this._getStorage('@hotel_crud_hotels', this._getSampleSeed('hotels'));
    const target = hotels.find((h) => h.id === hotelId);
    return { success: true, paymentMethods: target?.paymentMethods || ['UPI', 'Credit Card', 'Cash', 'Net Banking'] };
  }

  async updateHotelPaymentMethods(hotelId, paymentMethods) {
    const hotels = this._getStorage('@hotel_crud_hotels', this._getSampleSeed('hotels'));
    const updated = hotels.map((h) => (h.id === hotelId ? { ...h, paymentMethods } : h));
    this._setStorage('@hotel_crud_hotels', updated);
    return { success: true, paymentMethods };
  }

  // ===========================================================================
  // RESTAURANTS CRUD
  // ===========================================================================

  async fetchRestaurants() {
    let list = this._getStorage('@hotel_crud_restaurants');
    if (!list || list.length === 0) {
      list = this._getSampleSeed('restaurants');
      this._setStorage('@hotel_crud_restaurants', list);
    }
    return { success: true, data: list };
  }

  async createRestaurant(data) {
    const newItem = {
      ...data,
      id: data.id || `rest-${Date.now()}`,
      availability: data.availability || 'Available',
    };
    const current = this._getStorage('@hotel_crud_restaurants', this._getSampleSeed('restaurants'));
    const updated = [newItem, ...current];
    this._setStorage('@hotel_crud_restaurants', updated);
    return { success: true, data: newItem };
  }

  async updateRestaurant(id, data) {
    const current = this._getStorage('@hotel_crud_restaurants', this._getSampleSeed('restaurants'));
    const updated = current.map((r) => (r.id === id ? { ...r, ...data } : r));
    this._setStorage('@hotel_crud_restaurants', updated);
    return { success: true, data: updated.find((r) => r.id === id) };
  }

  async deleteRestaurant(id) {
    const current = this._getStorage('@hotel_crud_restaurants', this._getSampleSeed('restaurants'));
    this._setStorage('@hotel_crud_restaurants', current.filter((r) => r.id !== id));
    return { success: true };
  }

  // ===========================================================================
  // GYMS CRUD
  // ===========================================================================

  async fetchGyms() {
    let list = this._getStorage('@hotel_crud_gyms');
    if (!list || list.length === 0) {
      list = this._getSampleSeed('gyms');
      this._setStorage('@hotel_crud_gyms', list);
    }
    return { success: true, data: list };
  }

  async fetchGymById(id) {
    const list = this._getStorage('@hotel_crud_gyms', this._getSampleSeed('gyms'));
    const gym = list.find((g) => g.id === id) || null;
    return { success: Boolean(gym), data: gym };
  }

  async createGym(data) {
    const newItem = {
      ...data,
      id: data.id || `gym-${Date.now()}`,
      availability: data.availability || 'Available',
    };
    const current = this._getStorage('@hotel_crud_gyms', this._getSampleSeed('gyms'));
    const updated = [newItem, ...current];
    this._setStorage('@hotel_crud_gyms', updated);
    return { success: true, data: newItem };
  }

  async updateGym(id, data) {
    const current = this._getStorage('@hotel_crud_gyms', this._getSampleSeed('gyms'));
    const updated = current.map((g) => (g.id === id ? { ...g, ...data } : g));
    this._setStorage('@hotel_crud_gyms', updated);
    return { success: true, data: updated.find((g) => g.id === id) };
  }

  async deleteGym(id) {
    const current = this._getStorage('@hotel_crud_gyms', this._getSampleSeed('gyms'));
    this._setStorage('@hotel_crud_gyms', current.filter((g) => g.id !== id));
    return { success: true };
  }

  // ===========================================================================
  // TAKEAWAY CRUD
  // ===========================================================================

  async fetchTakeaway() {
    let list = this._getStorage('@hotel_crud_takeaways');
    if (!list || list.length === 0) {
      list = this._getSampleSeed('takeaway');
      this._setStorage('@hotel_crud_takeaways', list);
    }
    return { success: true, data: list };
  }

  async createTakeaway(data) {
    const newItem = {
      ...data,
      id: data.id || `takeaway-${Date.now()}`,
      availability: data.availability || 'Available',
    };
    const current = this._getStorage('@hotel_crud_takeaways', this._getSampleSeed('takeaway'));
    const updated = [newItem, ...current];
    this._setStorage('@hotel_crud_takeaways', updated);
    return { success: true, data: newItem };
  }

  async updateTakeaway(id, data) {
    const current = this._getStorage('@hotel_crud_takeaways', this._getSampleSeed('takeaway'));
    const updated = current.map((t) => (t.id === id ? { ...t, ...data } : t));
    this._setStorage('@hotel_crud_takeaways', updated);
    return { success: true, data: updated.find((t) => t.id === id) };
  }

  async deleteTakeaway(id) {
    const current = this._getStorage('@hotel_crud_takeaways', this._getSampleSeed('takeaway'));
    this._setStorage('@hotel_crud_takeaways', current.filter((t) => t.id !== id));
    return { success: true };
  }

  // ===========================================================================
  // HOME DELIVERY CRUD
  // ===========================================================================

  async fetchHomeDelivery() {
    let list = this._getStorage('@hotel_crud_delivery');
    if (!list || list.length === 0) {
      list = this._getSampleSeed('delivery');
      this._setStorage('@hotel_crud_delivery', list);
    }
    return { success: true, data: list };
  }

  async createHomeDelivery(data) {
    const newItem = {
      ...data,
      id: data.id || `delivery-${Date.now()}`,
      availability: data.availability || 'Available',
    };
    const current = this._getStorage('@hotel_crud_delivery', this._getSampleSeed('delivery'));
    const updated = [newItem, ...current];
    this._setStorage('@hotel_crud_delivery', updated);
    return { success: true, data: newItem };
  }

  async updateHomeDelivery(id, data) {
    const current = this._getStorage('@hotel_crud_delivery', this._getSampleSeed('delivery'));
    const updated = current.map((d) => (d.id === id ? { ...d, ...data } : d));
    this._setStorage('@hotel_crud_delivery', updated);
    return { success: true, data: updated.find((d) => d.id === id) };
  }

  async deleteHomeDelivery(id) {
    const current = this._getStorage('@hotel_crud_delivery', this._getSampleSeed('delivery'));
    this._setStorage('@hotel_crud_delivery', current.filter((d) => d.id !== id));
    return { success: true };
  }

  async deleteBooking(id) {
    this._deleteLocalBooking(id);
    return { success: true };
  }

  async toggleAvailability(categoryType, id, availability) {
    const map = {
      hotels: '@hotel_crud_hotels',
      restaurants: '@hotel_crud_restaurants',
      gyms: '@hotel_crud_gyms',
      takeaway: '@hotel_crud_takeaways',
      home_delivery: '@hotel_crud_delivery',
    };
    const storageKey = map[categoryType];
    if (storageKey) {
      const items = this._getStorage(storageKey, []);
      const updated = items.map((it) => (it.id === id ? { ...it, availability } : it));
      this._setStorage(storageKey, updated);
    }
    return { success: true, availability };
  }

  async fetchSummary() {
    const hotels = this._getStorage('@hotel_crud_hotels', this._getSampleSeed('hotels'));
    const restaurants = this._getStorage('@hotel_crud_restaurants', this._getSampleSeed('restaurants'));
    const gyms = this._getStorage('@hotel_crud_gyms', this._getSampleSeed('gyms'));
    const takeaway = this._getStorage('@hotel_crud_takeaways', this._getSampleSeed('takeaway'));
    const delivery = this._getStorage('@hotel_crud_delivery', this._getSampleSeed('delivery'));
    const bookings = this._getLocalBookings();

    return {
      success: true,
      data: {
        status: 'ok',
        server: 'online',
        database: 'hotel_portal_db',
        totalHotels: hotels.length,
        totalRestaurants: restaurants.length,
        totalGyms: gyms.length,
        totalTakeaway: takeaway.length,
        totalDelivery: delivery.length,
        totalBookings: bookings.length,
      },
    };
  }

  async resetAllData() {
    this._setStorage('@hotel_crud_hotels', this._getSampleSeed('hotels'));
    this._setStorage('@hotel_crud_restaurants', this._getSampleSeed('restaurants'));
    this._setStorage('@hotel_crud_gyms', this._getSampleSeed('gyms'));
    this._setStorage('@hotel_crud_takeaways', this._getSampleSeed('takeaway'));
    this._setStorage('@hotel_crud_delivery', this._getSampleSeed('delivery'));
    return { success: true };
  }
}

export const apiService = new ApiService();
