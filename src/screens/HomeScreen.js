// =============================================================================
// src/screens/HomeScreen.js
// 5-Quadrant Master Hotel Portal Layout:
// 1. TOP / ABOVE: Tourist Attractions & Excursions (Horizontal Track)
// 2. CENTER: Hotel Spotlight & Interactive Map (~44% centerpiece)
// 3. LEFT SIDE: Shopping Malls, Silk Ateliers & Wellness (~28% column)
// 4. RIGHT SIDE: Transportation Links & Emergency Hospitals (~28% column)
// 5. BOTTOM: Cafes, Gyms, Takeaways & Home Delivery (Horizontal Track with Category Filters)
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';

import CentralDisplay from '../components/CentralDisplay';
import HorizontalComponentList from '../components/HorizontalComponentList';
import SimpleShoppingList from '../components/SimpleShoppingList';
import RightTransitAndCarePanel from '../components/RightTransitAndCarePanel';
import DetailScreen from './DetailScreen';
import ScanToMobileModal from '../components/ScanToMobileModal';
import AttractionTransitModal from '../components/AttractionTransitModal';
import BookingModal from '../components/BookingModal';
import RouteDetailsModal from '../components/RouteDetailsModal';
import UniversalCategoryTableList from '../components/UniversalCategoryTableList';

import { syncService } from '../services/syncService';
import { apiService } from '../services/apiService';
import { activeHotelService } from '../services/activeHotelService';
import { safeVal, getDirectionsUrl } from '../data/hotelsData';
import { LANGUAGES, TRANSLATIONS } from '../data/translations';

export default function HomeScreen({
  hotel = null,
  onHotelChange,
  onOpenAdminUI,
  onNavigateToGyms,
  onSelectGym,
  onNavigateToHospitals,
  onNavigateToPharmacies,
}) {
  const activeHotel = hotel || activeHotelService.getActiveHotel();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // Hotel selector dropdown state
  const [isHotelSelectorOpen, setIsHotelSelectorOpen] = useState(false);

  // Active Screen: 'home' | 'detail'
  const [activeScreen, setActiveScreen] = useState('home');
  const [detailComponent, setDetailComponent] = useState(null);

  // Multi-Language state
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const t = (TRANSLATIONS && (TRANSLATIONS[currentLanguage] || TRANSLATIONS.en)) || {};
  const currentLangObj = (Array.isArray(LANGUAGES) && (LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0])) || { code: 'en', flag: '🇬🇧', label: 'English' };

  // Dynamic Time & Date
  const [currentDateTime, setCurrentDateTime] = useState(() => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setCurrentDateTime(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Modals state
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [scanModalItem, setScanModalItem] = useState(null);
  const [transitModalVisible, setTransitModalVisible] = useState(false);
  const [transitModalItem, setTransitModalItem] = useState(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingItem, setBookingItem] = useState(null);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [routeModalItem, setRouteModalItem] = useState(null);

  // Components state: uses active hotel data, not dummy arrays
  const [groupedComponents, setGroupedComponents] = useState(() => syncService.groupComponents([]));

  // Selected central hotel component
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [hotelsList, setHotelsList] = useState([]);

  // Bottom Section Category State: 'all' | 'cafes' | 'gyms' | 'takeaway' | 'delivery'
  const [bottomCategory, setBottomCategory] = useState('all');
  const [bottomViewMode, setBottomViewMode] = useState('table'); // 'table' (Faculty 5-Column Schema) | 'cards' (Carousel)

  // Mobile Tab State (Allows clean browsing on narrow screens)
  const [mobileActiveTab, setMobileActiveTab] = useState('left'); // 'left' | 'right'

  // Sync state tracking
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScanningNearby, setIsScanningNearby] = useState(false);
  const [scanProgressText, setScanProgressText] = useState('');
  const [syncStatus, setSyncStatus] = useState({
    source: 'Live MongoDB (hotel_portal)',
    timestamp: 'Just now',
    isDatabaseReady: true,
  });

  // Raw Live Display Components from MongoDB
  const [rawComponents, setRawComponents] = useState([]);

  // Automatically ensure nearby places are hydrated from activeHotelService
  useEffect(() => {
    if (!activeHotel) return;
    const nearby = activeHotel.nearby || {};
    const totalCount =
      (nearby.touristPlaces?.length || 0) +
      (nearby.shopping?.length || 0) +
      (nearby.transportation?.length || 0) +
      (nearby.hospitals?.length || 0) +
      (nearby.pharmacies?.length || 0) +
      (nearby.gyms?.length || 0) +
      (nearby.takeaways?.length || 0);

    if (totalCount === 0) {
      activeHotelService.syncComponentsFromBackend(activeHotel).then((updated) => {
        if (updated && onHotelChange) onHotelChange(updated);
      }).catch(console.warn);
    }
  }, [activeHotel?.id, activeHotel?.hotelPropertyId]);

  // Load components from Backend on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch live hotels from MongoDB
      const hRes = await apiService.fetchHotels();
      let currentActive = activeHotel;
      if (hRes && hRes.success && Array.isArray(hRes.data) && hRes.data.length > 0) {
        setHotelsList(hRes.data);
        const curId = activeHotel?.hotelPropertyId || activeHotel?.id || activeHotel?._id;
        const match = hRes.data.find(
          (h) => h.hotelPropertyId === curId || h.id === curId || h._id === curId
        );
        currentActive = match || hRes.data[0];
        if (onHotelChange && (!activeHotel || activeHotel.id !== currentActive.id)) {
          onHotelChange(currentActive);
        }
      }

      // 2. Sync all components from MongoDB for active hotel
      if (currentActive) {
        const syncedHotel = await activeHotelService.syncComponentsFromBackend(currentActive);
        if (syncedHotel && onHotelChange) {
          onHotelChange(syncedHotel);
        }
      }

      // 3. Fetch components for quadrant display
      const propId = currentActive?.hotelPropertyId || currentActive?.id || '1000000001';
      const compRes = await apiService.fetchDisplayComponents({ hotelPropertyId: propId });
      if (compRes && compRes.success && Array.isArray(compRes.data)) {
        setRawComponents(compRes.data);
        const grouped = syncService.groupComponents(compRes.data);
        setGroupedComponents(grouped);
        if (grouped.center) {
          setSelectedComponent(grouped.center);
        }
      }

      setSyncStatus({
        source: 'Live MongoDB (hotelApiDb)',
        timestamp: new Date().toLocaleTimeString(),
        isDatabaseReady: true,
      });
    } catch (err) {
      console.error('[HomeScreen] loadData error:', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const cycleLanguage = () => {
    const list = Array.isArray(LANGUAGES) ? LANGUAGES : [{ code: 'en' }];
    const codes = list.map((l) => l.code);
    const currentIndex = codes.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % codes.length;
    setCurrentLanguage(codes[nextIndex]);
  };

  const handleOpenScan = (item) => {
    setScanModalItem(item);
    setScanModalVisible(true);
  };

  const handleOpenDetail = (item) => {
    if (!item) return;
    if (item.category === 'Wellness & Gyms' || (item.id && String(item.id).startsWith('gym-'))) {
      if (onSelectGym) {
        onSelectGym(item);
        return;
      }
    }
    setSelectedComponent(item);
    setDetailComponent(item);
    setActiveScreen('detail');
  };

  const handleBottomTabChange = (tabId) => {
    setBottomCategory(tabId);
  };

  const handleSelectRouteItem = (item) => {
    if (!item) return;
    setSelectedComponent(item);
    setRouteModalItem(item);
    setRouteModalVisible(true);
  };

  const handleOpenBooking = (item) => {
    setBookingItem(item || selectedComponent);
    setBookingModalVisible(true);
  };

  // Helper to map a raw DisplayComponent from MongoDB to guest table schema
  const mapCompToGuestItem = (comp, defaultTag, defaultCat) => ({
    id: comp.id,
    _id: comp.id,
    title: comp.title,
    name: comp.title,
    subtitle: comp.subtitle || comp.shortDescription || '',
    desc: comp.subtitle || comp.shortDescription || '',
    componentType: 5,
    tag: comp.tag || defaultTag,
    category: defaultCat,
    location: comp.location || `${activeHotel?.city || 'Local Area'}`,
    address: comp.location || `${activeHotel?.city || 'Local Area'}`,
    distance: comp.hotelDistance || comp.distance || 'Near Hotel',
    hotelDistance: comp.hotelDistance || comp.distance || 'Near Hotel',
    rating: comp.customerRatings || comp.rating || 4.85,
    timing: comp.timing || comp.timings || 'Daily Hours',
    timings: comp.timing || comp.timings || 'Daily Hours',
    price: comp.price || '',
    offer: comp.offer || 'Resident Privilege Available',
    additionalInfo: comp.additionalInfo || comp.subtitle || comp.shortDescription || '',
    imageLink: comp.imageLink || '',
    data1: comp.data1 || '',
    data2: comp.data2 || '',
    data3: comp.data3 || '',
    data4: comp.data4 || '',
    data5: comp.data5 || '',
  });

  const hotelGyms = useMemo(() => {
    const rawList = rawComponents.filter((c) => c.category === 'gyms').map((c) => mapCompToGuestItem(c, 'GYM & WELLNESS', 'Wellness & Gyms'));
    const nearbyList = (activeHotel && activeHotel.nearby && activeHotel.nearby.gyms ? activeHotel.nearby.gyms : []).map((g) => ({
      ...g,
      componentType: 5,
      tag: g.tag || 'GYM & WELLNESS',
      category: 'Wellness & Gyms',
      latitude: g.latitude != null ? g.latitude : g.lat,
      longitude: g.longitude != null ? g.longitude : g.lng,
    }));
    // Merge without duplicates
    const seen = new Set();
    const merged = [];
    [...rawList, ...nearbyList].forEach((item) => {
      const key = (item.title || item.name || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });
    return merged;
  }, [activeHotel, rawComponents]);

  const hotelPools = useMemo(() => {
    const rawList = rawComponents.filter((c) => c.category === 'pools' || c.category === 'swimming_pools').map((c) => mapCompToGuestItem(c, 'SWIMMING POOL', 'Swimming Pools'));
    const nearbyList = (activeHotel && activeHotel.nearby && activeHotel.nearby.pools ? activeHotel.nearby.pools : []).map((p) => ({
      ...p,
      componentType: 5,
      tag: p.tag || 'SWIMMING POOL',
      category: 'Swimming Pools',
      latitude: p.latitude != null ? p.latitude : p.lat,
      longitude: p.longitude != null ? p.longitude : p.lng,
      location: p.distance || p.location || (activeHotel ? activeHotel.city || 'Local Area' : 'Local Area'),
      hotelDistance: p.distance || p.location || 'Near Hotel',
      timing: p.timing || p.timings || '6:00 AM - 9:00 PM',
      offer: p.offer || 'Resident Access Available',
      additionalInfo: p.additionalInfo || 'Swimming Pool',
    }));
    const seen = new Set();
    const merged = [];
    [...rawList, ...nearbyList].forEach((item) => {
      const key = (item.title || item.name || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });
    return merged;
  }, [activeHotel, rawComponents]);

  const hotelDining = useMemo(() => {
    const rawList = rawComponents.filter((c) => c.category === 'dining' || c.category === 'restaurants' || c.componentType === 1).map((c) => mapCompToGuestItem(c, 'BISTRO & DINING', 'Bistros & Dining'));
    const nearbyList = (activeHotel && activeHotel.nearby && (activeHotel.nearby.dining || activeHotel.nearby.restaurants) ? (activeHotel.nearby.dining || activeHotel.nearby.restaurants) : []).map((d) => ({
      ...d,
      componentType: 5,
      tag: d.tag || 'BISTRO & DINING',
      category: 'Bistros & Dining',
      latitude: d.latitude != null ? d.latitude : d.lat,
      longitude: d.longitude != null ? d.longitude : d.lng,
    }));
    const seen = new Set();
    const merged = [];
    [...rawList, ...nearbyList].forEach((item) => {
      const key = (item.title || item.name || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });
    return merged;
  }, [activeHotel, rawComponents]);

  const hotelTakeaway = useMemo(() => {
    const rawList = rawComponents.filter((c) => c.category === 'takeaways' || c.category === 'takeaway' || c.componentType === 3).map((c) => mapCompToGuestItem(c, 'EXPRESS TAKEAWAY', 'Express Takeaway'));
    const nearbyList = (activeHotel && activeHotel.nearby && activeHotel.nearby.takeaways ? activeHotel.nearby.takeaways : []).map((t) => ({
      ...t,
      componentType: 5,
      tag: t.tag || 'EXPRESS TAKEAWAY',
      category: 'Express Takeaway',
      latitude: t.latitude != null ? t.latitude : t.lat,
      longitude: t.longitude != null ? t.longitude : t.lng,
    }));
    const seen = new Set();
    const merged = [];
    [...rawList, ...nearbyList].forEach((item) => {
      const key = (item.title || item.name || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });
    return merged;
  }, [activeHotel, rawComponents]);

  const hotelDelivery = useMemo(() => {
    const rawList = rawComponents.filter((c) => c.category === 'homeDelivery' || c.category === 'delivery' || c.componentType === 4).map((c) => mapCompToGuestItem(c, 'SUITE DELIVERY', 'Home Delivery'));
    const nearbyList = (activeHotel && activeHotel.nearby && activeHotel.nearby.homeDelivery ? activeHotel.nearby.homeDelivery : []).map((t) => ({
      ...t,
      componentType: 5,
      tag: t.tag || 'SUITE DELIVERY',
      category: 'Home Delivery',
    }));
    const seen = new Set();
    const merged = [];
    [...rawList, ...nearbyList].forEach((item) => {
      const key = (item.title || item.name || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });
    return merged;
  }, [activeHotel, rawComponents]);

  const hotelFacilities = useMemo(() => {
    const rawList = rawComponents.filter((c) => c.category === 'facilities' || (!['gyms', 'pools', 'dining', 'restaurants', 'takeaways', 'homeDelivery'].includes(c.category) && c.componentType === 5)).map((c) => mapCompToGuestItem(c, 'FACILITY', 'Facilities'));
    const nearbyList = (activeHotel && activeHotel.nearby && activeHotel.nearby.facilities ? activeHotel.nearby.facilities : []).map((f) => ({
      ...f,
      componentType: 5,
      tag: f.tag || 'FACILITY',
      category: 'Facilities',
    }));
    const seen = new Set();
    const merged = [];
    [...rawList, ...nearbyList].forEach((item) => {
      const key = (item.title || item.name || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });
    return merged;
  }, [activeHotel, rawComponents]);

  const hotelHospitals = useMemo(() => {
    return (activeHotel?.nearby?.hospitals || []).map((h) => ({
      ...h,
      componentType: 4,
      tag: h.isEmergency24x7 ? '24/7 EMERGENCY' : (h.tag || 'HOSPITAL & ICU'),
      category: 'Hospitals & Emergency',
      latitude: h.latitude ?? h.lat,
      longitude: h.longitude ?? h.lng,
      location: h.distance || h.place || h.address || `${activeHotel?.city || 'Local Area'}`,
      hotelDistance: h.distance || h.place || 'Near Hotel',
      likes: h.likes || 4200,
      rating: h.rating || 4.9,
      timing: h.hours || '24/7 Emergency Care',
      offer: h.emergencyAmbulance || '24/7 Priority Emergency Liaison',
      additionalInfo: typeof h.facilities === 'string' ? h.facilities : (Array.isArray(h.facilities) ? h.facilities.join(' • ') : 'Emergency Care & ICU'),
    }));
  }, [activeHotel]);

  const hotelPharmacies = useMemo(() => {
    return (activeHotel?.nearby?.pharmacies || []).map((p) => ({
      ...p,
      componentType: 4,
      tag: p.isOpen24x7 || p.is24x7 ? '24/7 CHEMIST' : (p.tag || 'PHARMACY'),
      category: 'Pharmacies & Dispensary',
      latitude: p.latitude ?? p.lat,
      longitude: p.longitude ?? p.lng,
      location: p.distance || p.place || p.address || `${activeHotel?.city || 'Local Area'}`,
      hotelDistance: p.distance || p.place || 'Near Hotel',
      likes: p.likes || 3100,
      rating: p.rating || 4.85,
      timing: p.hours || '24 Hours Open',
      offer: p.deliveryService || 'Doorstep Suite Delivery Available',
      additionalInfo: p.shortDescription || p.subtitle || '24/7 Licensed Medical Dispensary',
    }));
  }, [activeHotel]);

  const allBottomItems = useMemo(() => {
    return [
      ...hotelHospitals,
      ...hotelPharmacies,
      ...hotelGyms,
      ...hotelPools,
      ...hotelDining,
      ...hotelTakeaway,
      ...hotelDelivery,
      ...hotelFacilities,
    ];
  }, [hotelHospitals, hotelPharmacies, hotelGyms, hotelPools, hotelDining, hotelTakeaway, hotelDelivery, hotelFacilities]);

  const currentBottomItems = useMemo(() => {
    if (bottomCategory === 'hospitals') return hotelHospitals;
    if (bottomCategory === 'pharmacies') return hotelPharmacies;
    if (bottomCategory === 'gyms') return hotelGyms;
    if (bottomCategory === 'pools') return hotelPools;
    if (bottomCategory === 'cafes' || bottomCategory === 'dining') return hotelDining;
    if (bottomCategory === 'takeaway') return hotelTakeaway;
    if (bottomCategory === 'delivery') return hotelDelivery;
    if (bottomCategory === 'facilities') return hotelFacilities;
    return allBottomItems;
  }, [bottomCategory, hotelHospitals, hotelPharmacies, hotelGyms, hotelPools, hotelDining, hotelTakeaway, hotelDelivery, hotelFacilities, allBottomItems]);

  const bottomFilterTabs = useMemo(() => {
    const tabs = [
      { id: 'all', label: 'All Curations', icon: 'star', count: allBottomItems.length },
      { id: 'hospitals', label: 'Hospitals (24/7)', icon: 'hospital', count: hotelHospitals.length },
      { id: 'pharmacies', label: 'Pharmacies', icon: 'pharmacy', count: hotelPharmacies.length },
      { id: 'gyms', label: 'Wellness & Gyms', icon: 'gym', count: hotelGyms.length },
      { id: 'pools', label: 'Swimming Pools', icon: 'pool', count: hotelPools.length },
      { id: 'cafes', label: 'Bistros & Dining', icon: 'cafe', count: hotelDining.length },
      { id: 'takeaway', label: 'Express Takeaway', icon: 'takeaway', count: hotelTakeaway.length },
      { id: 'delivery', label: 'Suite Delivery', icon: 'delivery', count: hotelDelivery.length },
      { id: 'facilities', label: 'Hotel Facilities', icon: 'facilities', count: hotelFacilities.length },
    ];
    return tabs;
  }, [allBottomItems.length, hotelHospitals.length, hotelPharmacies.length, hotelGyms.length, hotelPools.length, hotelDining.length, hotelTakeaway.length, hotelDelivery.length, hotelFacilities.length]);

  // Unconfigured Hotel Fallback Screen
  const activeHotelName = activeHotel?.name || activeHotel?.title || activeHotel?.hotelName;
  if (!activeHotel || !activeHotelName) {
    return (
      <View style={styles.unconfiguredContainer}>
        <View style={styles.unconfiguredCard}>
          <Text style={styles.unconfiguredIcon}>🏨</Text>
          <Text style={styles.unconfiguredTitle}>Hotel Not Configured</Text>
          <Text style={styles.unconfiguredSubtitle}>
            Please configure your hotel from the Admin Dashboard.
          </Text>
          <Text style={styles.unconfiguredDetail}>
            The guest website dynamically binds all services, dining, wellness, and turn-by-turn driving directions to the active hotel's specific GPS coordinates.
          </Text>
          <TouchableOpacity
            style={styles.unconfiguredAdminBtn}
            onPress={onOpenAdminUI}
            activeOpacity={0.85}
          >
            <Text style={styles.unconfiguredAdminBtnText}>
              ⚙️ Go to Admin Dashboard to Configure Hotel →
            </Text>
          </TouchableOpacity>

          <View style={styles.quickHotelRow}>
            <Text style={styles.quickHotelLabel}>OR TEST GUEST PORTAL NOW WITH A VERIFIED HOTEL:</Text>
            <View style={styles.quickHotelBtns}>
              <TouchableOpacity
                style={styles.quickHotelBtn}
                onPress={() => {
                  const demoHotel = {
                    id: 'hotel-demo-01',
                    name: 'The Taj Mahal Palace',
                    title: 'The Taj Mahal Palace',
                    city: 'Mumbai',
                    location: 'Colaba, Mumbai',
                    address: 'Apollo Bandar, Colaba, Mumbai, Maharashtra 400001',
                    latitude: 18.9217,
                    longitude: 72.8332,
                    pricePerNight: '₹34,000 / night',
                    rating: 4.9,
                    images: [
                      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85',
                      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=85',
                    ],
                  };
                  activeHotelService.saveAndActivateHotel(demoHotel);
                  if (onHotelChange) onHotelChange(demoHotel);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.quickHotelBtnText}>⚡ Mumbai: The Taj Mahal Palace</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickHotelBtn}
                onPress={() => {
                  const demoHotel = {
                    id: 'hotel-demo-02',
                    name: 'The Leela Palace',
                    title: 'The Leela Palace',
                    city: 'Bengaluru',
                    location: 'HAL Old Airport Rd, Bengaluru',
                    address: '23, HAL Old Airport Rd, HAL 2nd Stage, Kodihalli, Bengaluru, Karnataka 560008',
                    latitude: 12.9606,
                    longitude: 77.6484,
                    pricePerNight: '₹22,000 / night',
                    rating: 4.9,
                    images: [
                      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85',
                      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=85',
                    ],
                  };
                  activeHotelService.saveAndActivateHotel(demoHotel);
                  if (onHotelChange) onHotelChange(demoHotel);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.quickHotelBtnText}>⚡ Bengaluru: The Leela Palace</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // If in Detail Mode
  if (activeScreen === 'detail' && detailComponent) {
    return (
      <DetailScreen
        component={detailComponent}
        hotel={activeHotel}
        onBack={() => setActiveScreen('home')}
      />
    );
  }

  return (
    <View style={styles.screenContainer}>
      {/* =================================================================== */}
      {/* 1. SINGLE UNIFIED LUXURY TOP BAR WITH HOTEL SWITCHER                */}
      {/* =================================================================== */}
      <View style={styles.appHeader}>
        {/* Left: Dynamic Hotel Switcher */}
        <View style={styles.hotelSwitcherContainer}>
          <TouchableOpacity
            style={styles.hotelSwitcherPill}
            onPress={() => setIsHotelSelectorOpen(!isHotelSelectorOpen)}
            activeOpacity={0.8}
          >
            <Text style={styles.hotelSwitcherIcon}>🏨</Text>
            <Text style={styles.hotelSwitcherLabel}>HOTEL:</Text>
            <Text style={styles.hotelSwitcherName} numberOfLines={1}>
              {activeHotel.name} ({activeHotel.city})
            </Text>
            <Text style={styles.hotelSwitcherCaret}>▾</Text>
          </TouchableOpacity>

          {isHotelSelectorOpen && (
            <View style={styles.hotelDropdownMenu}>
              <View style={styles.hotelDropdownHeaderBox}>
                <Text style={styles.hotelDropdownHeader}>SELECT ACTIVE HOTEL PROPERTY</Text>
                <Text style={styles.hotelDropdownSub}>Dynamic Multi-Hotel Engine</Text>
              </View>
              {activeHotelService.getAllHotels().map((h) => {
                const isSelected = h.id === activeHotel.id;
                return (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.hotelDropdownItem, isSelected && styles.hotelDropdownItemActive]}
                    onPress={() => {
                      if (onHotelChange) onHotelChange(h);
                      setIsHotelSelectorOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.hotelDropdownItemInfo}>
                      <Text style={[styles.hotelDropdownItemTitle, isSelected && styles.hotelDropdownItemTitleActive]}>
                        {h.name || h.title}
                      </Text>
                      <Text style={styles.hotelDropdownItemCity}>
                        📍 {h.city || h.location} · ★ {h.rating || 4.9} · {h.pricePerNight}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.hotelDropdownCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Center: Atmospheric status indicator */}
        <View style={styles.headerAtmosphereWrapper}>
          <View style={[styles.headerAtmosphere, isScanningNearby && { borderColor: '#E2C082', backgroundColor: '#1A1810' }]}>
            {isScanningNearby ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ActivityIndicator size="small" color="#E2C082" />
                <Text style={[styles.headerAtmosphereText, { color: '#E2C082', fontWeight: '600' }]}>
                  {scanProgressText || `Scanning real places around ${activeHotel.name}...`}
                </Text>
              </View>
            ) : (
              <Text style={styles.headerAtmosphereText}>
                {isDesktop
                  ? `📍 ${activeHotel.address || activeHotel.name} • ${currentDateTime}`
                  : `📍 ${activeHotel.city || activeHotel.name} • ${currentDateTime}`}
              </Text>
            )}
          </View>
        </View>

        {/* Right: Language Pill, Refresh, and Admin Dashboard Switch */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.adminNavBtn}
            onPress={onOpenAdminUI}
            activeOpacity={0.8}
          >
            <Text style={styles.adminNavBtnText}>⚙️ Admin Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestPortalPill}
            onPress={cycleLanguage}
            activeOpacity={0.8}
          >
            <Text style={styles.guestPortalIcon}>🌐</Text>
            <Text style={styles.guestPortalText}>
              {currentLangObj.flag} {currentLanguage.toUpperCase()}
            </Text>
            <Text style={styles.dropdownCaret}>▾</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.syncButton}
            onPress={loadData}
            disabled={isSyncing}
            activeOpacity={0.8}
            title={`Database: ${syncStatus.source}`}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#E2C082" />
            ) : (
              <Text style={styles.syncIcon}>🔄</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* =================================================================== */}
      {/* 2. EXACT 5-QUADRANT MASTER LAYOUT                                   */}
      {/* =================================================================== */}
      {isDesktop ? (
        <View style={styles.desktopContainer}>
          {/* 1. ABOVE / TOP: Attractions & Landmarks with Sleek Scroll Icons */}
          <HorizontalComponentList
            title={`🏛️ ${t.quadrantTop || 'HISTORIC LANDMARKS & EXCURSIONS'} (${(activeHotel.city || 'NEARBY').toUpperCase()})`}
            subtitle={`Real heritage, palaces, gardens and private guided excursions near ${activeHotel.name}`}
            actionLabel="Explore Curations →"
            items={activeHotel?.nearby?.touristPlaces || []}
            emptyMessage="No tourist places found near this hotel."
            selectedId={selectedComponent?.id}
            onSelectComponent={handleSelectRouteItem}
            onScanPress={handleOpenScan}
          />

          {/* 2. MIDDLE ROW: Left (Shopping) | Center 44% (Hotel & Map) | Right (Transit & Care) */}
          <View style={styles.middleRow}>
            {/* LEFT PANEL (~28%): Simple Shopping List WITHOUT large images */}
            <View style={styles.sideColumn}>
              <SimpleShoppingList
                title={`🛍️ ${t.quadrantLeft || 'SHOPPING & MALLS'}`}
                subtitle={`Premier retail destinations near ${activeHotel.city}`}
                items={activeHotel?.nearby?.shopping || []}
                hotel={activeHotel}
                onSelectItem={handleSelectRouteItem}
              />
            </View>

            {/* CENTER PANEL (~44%): Hotel Showcase & Interactive Map centered on Hotel coordinates */}
            <View style={styles.centerColumn40}>
              <CentralDisplay
                hotel={activeHotel}
                component={selectedComponent || groupedComponents.center}
                onViewDetails={handleOpenDetail}
                onBookStay={handleOpenBooking}
              />
            </View>

            {/* RIGHT PANEL (~28%): Dedicated Transportation & Mobility Links */}
            <View style={styles.sideColumn}>
              <RightTransitAndCarePanel
                hotel={activeHotel}
                onSelectTransitItem={handleSelectRouteItem}
              />
            </View>
          </View>

          {/* 3. BOTTOM CURATIONS: Dining, 24/7 Hospitals, Pharmacies, Gyms & Delivery */}
          <View style={styles.bottomSectionWrapper}>
            {/* Header with Title and View Switcher */}
            <View style={styles.bottomSectionHeaderRow}>
              <View style={styles.bottomHeaderLeft}>
                <Text style={styles.bottomSectionTitle}>
                  🌟 DINING, 24/7 HOSPITALS, PHARMACIES & WELLNESS
                </Text>
                <Text style={styles.bottomSectionSub}>
                  Bistros, 24/7 emergency care, pharmacies, gyms, swimming pools & delivery near {activeHotel.city}
                </Text>
              </View>

              <View style={styles.viewModeToggleRow}>
                <TouchableOpacity
                  style={[styles.viewModePill, bottomViewMode === 'table' && styles.viewModePillActive]}
                  onPress={() => setBottomViewMode('table')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.viewModePillText, bottomViewMode === 'table' && styles.viewModePillTextActive]}>
                    📋 Faculty 5-Column Schema Table
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.viewModePill, bottomViewMode === 'cards' && styles.viewModePillActive]}
                  onPress={() => setBottomViewMode('cards')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.viewModePillText, bottomViewMode === 'cards' && styles.viewModePillTextActive]}>
                    🗂️ Card Carousel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter Tabs Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bottomFilterTabsRow}
            >
              {bottomFilterTabs.map((tab) => {
                const isActive = bottomCategory === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.bottomTabChip, isActive && styles.bottomTabChipActive]}
                    onPress={() => handleBottomTabChange(tab.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bottomTabIcon}>{tab.icon}</Text>
                    <Text style={[styles.bottomTabText, isActive && styles.bottomTabTextActive]}>
                      {tab.label}
                    </Text>
                    <View style={[styles.bottomTabCountBadge, isActive && styles.bottomTabCountBadgeActive]}>
                      <Text style={[styles.bottomTabCountText, isActive && styles.bottomTabCountTextActive]}>
                        {tab.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Content Display: 5-Column Table or Carousel */}
            {bottomViewMode === 'table' ? (
              <UniversalCategoryTableList
                items={currentBottomItems}
                category={bottomCategory}
                hotel={activeHotel}
                onSelectItem={handleSelectRouteItem}
                onDataChanged={loadData}
              />
            ) : (
              <HorizontalComponentList
                title=""
                subtitle=""
                items={currentBottomItems}
                selectedId={selectedComponent?.id}
                onViewDetails={handleOpenDetail}
                onSelectComponent={handleSelectRouteItem}
                onScanPress={handleOpenScan}
                showSortControls={true}
                defaultSort={bottomCategory === 'gyms' ? 'likes' : 'default'}
              />
            )}
          </View>
        </View>
      ) : (
        /* Mobile / Tablet View: Responsive Stacking */
        <ScrollView
          style={styles.mobileContainer}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.mobileContentContainer}
        >
          {/* 1. TOP ATTRACTIONS */}
          <HorizontalComponentList
            title={`🏛️ ${t.quadrantTop || 'HISTORIC LANDMARKS & EXCURSIONS'} (${(activeHotel.city || 'NEARBY').toUpperCase()})`}
            subtitle={`Real heritage & attractions near ${activeHotel.name}`}
            items={activeHotel?.nearby?.touristPlaces || []}
            emptyMessage="No tourist places found near this hotel."
            selectedId={selectedComponent?.id}
            onSelectComponent={handleSelectRouteItem}
            onScanPress={handleOpenScan}
          />

          {/* 2. CENTER: HOTEL SPOTLIGHT */}
          <View style={styles.mobileCenterWrapper}>
            <CentralDisplay
              hotel={activeHotel}
              component={selectedComponent || groupedComponents.center}
              onViewDetails={handleOpenDetail}
              onBookStay={handleOpenBooking}
            />
          </View>

          {/* Mobile Tab Switcher */}
          <View style={styles.mobileTabsContainer}>
            <TouchableOpacity
              style={[
                styles.mobileTabButton,
                mobileActiveTab === 'left' && styles.mobileTabButtonActive,
              ]}
              onPress={() => setMobileActiveTab('left')}
            >
              <Text
                style={[
                  styles.mobileTabText,
                  mobileActiveTab === 'left' && styles.mobileTabTextActive,
                ]}
              >
                🛍️ Shopping Malls
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mobileTabButton,
                mobileActiveTab === 'right' && styles.mobileTabButtonActive,
              ]}
              onPress={() => setMobileActiveTab('right')}
            >
              <Text
                style={[
                  styles.mobileTabText,
                  mobileActiveTab === 'right' && styles.mobileTabTextActive,
                ]}
              >
                🚆 Transportation
              </Text>
            </TouchableOpacity>
          </View>

          {/* Render Active Mobile Panel */}
          <View style={styles.mobileVerticalWrapper}>
            {mobileActiveTab === 'left' ? (
              <SimpleShoppingList
                title={`🛍️ Shopping Malls`}
                subtitle={`Premier retail destinations near ${activeHotel.city}`}
                items={activeHotel?.nearby?.shopping || []}
                hotel={activeHotel}
                onSelectItem={handleSelectRouteItem}
              />
            ) : (
              <RightTransitAndCarePanel
                hotel={activeHotel}
                onSelectTransitItem={handleSelectRouteItem}
              />
            )}
          </View>

          {/* 3. BOTTOM TRACK: Dining, 24/7 Hospitals, Pharmacies, Gyms & Delivery */}
          <View style={styles.bottomSectionWrapper}>
            {/* Header with Title and View Switcher */}
            <View style={styles.bottomSectionHeaderRow}>
              <View style={styles.bottomHeaderLeft}>
                <Text style={styles.bottomSectionTitle}>
                  🌟 DINING, 24/7 HOSPITALS, PHARMACIES & WELLNESS
                </Text>
                <Text style={styles.bottomSectionSub}>
                  Bistros, 24/7 emergency care, pharmacies, gyms, pools & delivery near {activeHotel.city}
                </Text>
              </View>

              <View style={styles.viewModeToggleRow}>
                <TouchableOpacity
                  style={[styles.viewModePill, bottomViewMode === 'table' && styles.viewModePillActive]}
                  onPress={() => setBottomViewMode('table')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.viewModePillText, bottomViewMode === 'table' && styles.viewModePillTextActive]}>
                    📋 Faculty 5-Column Table
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.viewModePill, bottomViewMode === 'cards' && styles.viewModePillActive]}
                  onPress={() => setBottomViewMode('cards')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.viewModePillText, bottomViewMode === 'cards' && styles.viewModePillTextActive]}>
                    🗂️ Card Carousel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter Tabs Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bottomFilterTabsRow}
            >
              {bottomFilterTabs.map((tab) => {
                const isActive = bottomCategory === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.bottomTabChip, isActive && styles.bottomTabChipActive]}
                    onPress={() => handleBottomTabChange(tab.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bottomTabIcon}>{tab.icon}</Text>
                    <Text style={[styles.bottomTabText, isActive && styles.bottomTabTextActive]}>
                      {tab.label}
                    </Text>
                    <View style={[styles.bottomTabCountBadge, isActive && styles.bottomTabCountBadgeActive]}>
                      <Text style={[styles.bottomTabCountText, isActive && styles.bottomTabCountTextActive]}>
                        {tab.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Content Display: 5-Column Table or Carousel */}
            {bottomViewMode === 'table' ? (
              <UniversalCategoryTableList
                items={currentBottomItems}
                category={bottomCategory}
                hotel={activeHotel}
                onSelectItem={handleSelectRouteItem}
                onDataChanged={loadData}
              />
            ) : (
              <HorizontalComponentList
                title=""
                subtitle=""
                items={currentBottomItems}
                selectedId={selectedComponent?.id}
                onViewDetails={handleOpenDetail}
                onSelectComponent={handleSelectRouteItem}
                onScanPress={handleOpenScan}
                showSortControls={true}
                defaultSort={bottomCategory === 'gyms' ? 'likes' : 'default'}
              />
            )}
          </View>
        </ScrollView>
      )}

      {/* =================================================================== */}
      {/* 3. CLEAN FOOTER BAR                                                 */}
      {/* =================================================================== */}
      <View style={styles.footerBar}>
        <Text style={styles.footerText}>
          {activeHotel.name.toUpperCase()} · {activeHotel.city.toUpperCase()} • CONCIERGE & RESIDENCES • 24/7 GUEST SERVICES
        </Text>
      </View>

      {/* =================================================================== */}
      {/* 4. INTERACTIVE MODALS                                              */}
      {/* =================================================================== */}
      <ScanToMobileModal
        visible={scanModalVisible}
        component={scanModalItem}
        hotel={activeHotel}
        onClose={() => setScanModalVisible(false)}
      />

      <AttractionTransitModal
        visible={transitModalVisible}
        attraction={transitModalItem}
        hotel={activeHotel}
        onClose={() => setTransitModalVisible(false)}
      />

      <BookingModal
        visible={bookingModalVisible}
        component={bookingItem || selectedComponent}
        onClose={() => setBookingModalVisible(false)}
        onBookingSuccess={() => {
          setBookingModalVisible(false);
          loadData();
        }}
      />

      <RouteDetailsModal
        visible={routeModalVisible}
        item={routeModalItem}
        hotel={activeHotel}
        onClose={() => setRouteModalVisible(false)}
        onViewDetails={(item) => {
          setRouteModalVisible(false);
          handleOpenDetail(item);
        }}
        onBook={(item) => {
          setRouteModalVisible(false);
          handleOpenBooking(item);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#070A12',
    flexDirection: 'column',
    minHeight: 0,
    ...Platform.select({
      web: {
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
      },
    }),
  },

  // 1. Top Bar (Thin, Elegant, and Centered)
  appHeader: {
    height: 38,
    flexShrink: 0,
    backgroundColor: '#090C15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    zIndex: 100,
  },
  hotelSwitcherContainer: {
    position: 'relative',
    zIndex: 110,
  },
  hotelSwitcherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  hotelSwitcherIcon: {
    fontSize: 12,
  },
  hotelSwitcherLabel: {
    color: '#E2C082',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hotelSwitcherName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 180,
  },
  hotelSwitcherCaret: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '700',
  },
  hotelDropdownMenu: {
    position: 'absolute',
    top: 36,
    left: 0,
    width: 320,
    backgroundColor: '#13151D',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    borderRadius: 8,
    padding: 8,
    zIndex: 9999,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 32px rgba(0,0,0,0.6)',
      },
    }),
  },
  hotelDropdownHeaderBox: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 6,
  },
  hotelDropdownHeader: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  hotelDropdownSub: {
    color: '#64748B',
    fontSize: 8.5,
  },
  hotelDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  hotelDropdownItemActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
  },
  hotelDropdownItemInfo: {
    flex: 1,
    gap: 1,
  },
  hotelDropdownItemTitle: {
    color: '#F8F6F0',
    fontSize: 11.5,
    fontWeight: '700',
  },
  hotelDropdownItemTitleActive: {
    color: '#E2C082',
  },
  hotelDropdownItemCity: {
    color: '#94A3B8',
    fontSize: 9.5,
  },
  hotelDropdownCheck: {
    color: '#E2C082',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  headerAtmosphereWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        pointerEvents: 'none',
      },
    }),
  },
  headerAtmosphere: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerAtmosphereText: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
    zIndex: 2,
  },
  guestPortalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  guestPortalIcon: {
    fontSize: 10,
  },
  guestPortalText: {
    color: '#F8FAFC',
    fontSize: 9.5,
    fontWeight: '700',
  },
  dropdownCaret: {
    color: '#94A3B8',
    fontSize: 8.5,
  },
  syncButton: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncIcon: {
    fontSize: 11,
  },

  // 2. Desktop 5-Quadrant Master Container
  desktopContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 2,
    paddingBottom: 4,
    justifyContent: 'space-between',
    display: 'flex',
    flexDirection: 'column',
    ...Platform.select({
      web: {
        minHeight: 'calc(100vh - 50px)',
        overflowY: 'auto',
      },
      default: {
        flex: 1,
      },
    }),
  },
  middleRow: {
    flex: 1,
    minHeight: 310,
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
    alignItems: 'stretch',
  },
  sideColumn: {
    flex: 24,
    height: '100%',
    minHeight: 310,
  },
  centerColumn40: {
    flex: 52,
    height: '100%',
    minHeight: 310,
  },

  // 3. Mobile Layout
  mobileContainer: {
    flex: 1,
  },
  mobileContentContainer: {
    paddingHorizontal: 8,
    paddingBottom: 24,
    gap: 10,
  },
  mobileCenterWrapper: {
    minHeight: 320,
    marginTop: 6,
  },
  mobileTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  mobileTabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mobileTabButtonActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.18)',
    borderColor: '#E2C082',
  },
  mobileTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  mobileTabTextActive: {
    color: '#F8FAFC',
    fontWeight: '900',
  },
  mobileVerticalWrapper: {
    height: 280,
  },

  // 4. Footer Bar
  footerBar: {
    height: 24,
    backgroundColor: '#05070D',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    flexShrink: 0,
  },
  footerText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  adminNavBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2C082',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  adminNavBtnText: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '800',
  },
  unconfiguredContainer: {
    flex: 1,
    backgroundColor: '#070A12',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unconfiguredCard: {
    maxWidth: 520,
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    padding: 36,
    alignItems: 'center',
    textAlign: 'center',
  },
  unconfiguredIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  unconfiguredTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  unconfiguredSubtitle: {
    color: '#E2C082',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  unconfiguredDetail: {
    color: '#94A3B8',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  unconfiguredAdminBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#E2C082',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3DCA8',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  unconfiguredAdminBtnText: {
    color: '#070A12',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // 4. Bottom Section Wrapper & Schema Table Styles
  bottomSectionWrapper: {
    width: '100%',
    flexDirection: 'column',
    marginTop: 6,
    gap: 8,
  },
  bottomSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
  },
  bottomHeaderLeft: {
    flex: 1,
    minWidth: 260,
  },
  bottomSectionTitle: {
    color: '#E2C082',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bottomSectionSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  viewModeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0E15',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    borderRadius: 7,
    padding: 2,
    gap: 4,
  },
  viewModePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  viewModePillActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.4)',
  },
  viewModePillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  viewModePillTextActive: {
    color: '#E2C082',
    fontWeight: '800',
  },
  bottomFilterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  bottomTabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#12141A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  bottomTabChipActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.16)',
    borderColor: 'rgba(226, 192, 130, 0.45)',
  },
  bottomTabIcon: {
    fontSize: 11,
  },
  bottomTabText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  bottomTabTextActive: {
    color: '#E2C082',
    fontWeight: '800',
  },
  bottomTabCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  bottomTabCountBadgeActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.25)',
  },
  bottomTabCountText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
  },
  bottomTabCountTextActive: {
    color: '#E2C082',
  },
  unconfiguredContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: '100vh',
    backgroundColor: '#0F1014',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    ...Platform.select({
      web: {
        display: 'flex',
        boxSizing: 'border-box',
      },
    }),
  },
  unconfiguredCard: {
    backgroundColor: '#161822',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    borderRadius: 16,
    padding: 36,
    maxWidth: 580,
    width: '100%',
    alignItems: 'center',
    textAlign: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
      },
    }),
  },
  unconfiguredIcon: {
    fontSize: 54,
    marginBottom: 16,
  },
  unconfiguredTitle: {
    color: '#E2C082',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  unconfiguredSubtitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  unconfiguredDetail: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 26,
  },
  unconfiguredAdminBtn: {
    backgroundColor: '#E2C082',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  unconfiguredAdminBtnText: {
    color: '#0F1014',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickHotelRow: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    alignItems: 'center',
  },
  quickHotelLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  quickHotelBtns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  quickHotelBtn: {
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  quickHotelBtnText: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '700',
  },
});
