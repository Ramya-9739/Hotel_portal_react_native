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

  // Active Screen: 'home' | 'detail' | 'category_list'
  const [activeScreen, setActiveScreen] = useState('home');
  const [detailComponent, setDetailComponent] = useState(null);
  const [selectedCategoryList, setSelectedCategoryList] = useState('all');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

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

  // URL Hash listener for direct navigation to category list
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleHashChange = () => {
        const hash = (window.location.hash || '').toLowerCase();
        if (hash.includes('hospital')) {
          setSelectedCategoryList('hospitals');
          setActiveScreen('category_list');
        } else if (hash.includes('pharmac')) {
          setSelectedCategoryList('pharmacies');
          setActiveScreen('category_list');
        } else if (hash.includes('gym')) {
          setSelectedCategoryList('gyms');
          setActiveScreen('category_list');
        } else if (hash.includes('cafe') || hash.includes('dining')) {
          setSelectedCategoryList('cafes');
          setActiveScreen('category_list');
        } else if (hash.includes('takeaway')) {
          setSelectedCategoryList('takeaway');
          setActiveScreen('category_list');
        } else if (hash.includes('delivery')) {
          setSelectedCategoryList('delivery');
          setActiveScreen('category_list');
        } else if (hash.includes('atm')) {
          setSelectedCategoryList('atms');
          setActiveScreen('category_list');
        } else if (hash.includes('pool')) {
          setSelectedCategoryList('pools');
          setActiveScreen('category_list');
        } else if (hash.includes('spa') || hash.includes('parlour')) {
          setSelectedCategoryList('spa');
          setActiveScreen('category_list');
        } else if (hash.includes('transit') || hash.includes('transport')) {
          setSelectedCategoryList('transportation');
          setActiveScreen('category_list');
        } else if (hash.includes('shop')) {
          setSelectedCategoryList('shopping');
          setActiveScreen('category_list');
        } else if (hash.includes('tourist')) {
          setSelectedCategoryList('tourist');
          setActiveScreen('category_list');
        } else if (hash === '#/guest' || hash === '#/home' || hash === '' || hash === '#/') {
          setActiveScreen('home');
        }
      };
      handleHashChange();
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
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
      // 1. Fetch ONLY approved hotels from MongoDB public endpoint
      const hRes = await apiService.fetchPublicHotels();
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

  const hotelAtms = useMemo(() => {
    return (activeHotel?.nearby?.atms || []).map((a) => ({
      ...a,
      componentType: 4,
      tag: a.tag || '24/7 ATM',
      category: '24/7 ATMs & Banking',
      latitude: a.latitude ?? a.lat,
      longitude: a.longitude ?? a.lng,
      location: a.location || a.address || `${activeHotel?.city || 'Local Area'}`,
      timing: a.timing || '24 Hours Open',
      offer: a.offer || 'Zero Surcharge for In-House Guests',
      additionalInfo: a.additionalInfo || 'Touchless Cash Dispense',
    }));
  }, [activeHotel]);

  const hotelSpa = useMemo(() => {
    return (activeHotel?.nearby?.spa || activeHotel?.nearby?.parlour || []).map((s) => ({
      ...s,
      componentType: 5,
      tag: s.tag || 'BEAUTY & SPA',
      category: 'Parlour & Spa',
      latitude: s.latitude ?? s.lat,
      longitude: s.longitude ?? s.lng,
      location: s.location || s.address || `${activeHotel?.city || 'Local Area'}`,
      timing: s.timing || s.timings || '9:00 AM - 8:30 PM',
      offer: s.offer || '15% Resident Spa Privilege',
      additionalInfo: s.additionalInfo || 'Ayurvedic & Holistic Care',
    }));
  }, [activeHotel]);

  const hotelTransit = useMemo(() => {
    return (activeHotel?.nearby?.transportation || []).map((t) => ({
      ...t,
      componentType: 4,
      tag: t.tag || t.type || 'TRANSPORTATION',
      category: 'Transit & Mobility',
      latitude: t.latitude ?? t.lat,
      longitude: t.longitude ?? t.lng,
      location: t.location || t.address || `${activeHotel?.city || 'Local Area'}`,
      timing: t.hours || t.timing || '24/7 On-Call Concierge Fleet',
      offer: t.offer || 'Private Chauffeur Dispatch',
      additionalInfo: t.subtitle || t.description || 'Verified Transit Hub',
    }));
  }, [activeHotel]);

  const hotelShopping = useMemo(() => {
    return (activeHotel?.nearby?.shopping || []).map((s) => ({
      ...s,
      componentType: 2,
      tag: s.tag || 'SHOPPING & MALLS',
      category: 'Shopping Malls',
      latitude: s.latitude ?? s.lat,
      longitude: s.longitude ?? s.lng,
      location: s.distance || s.location || '2.5 km from Hotel',
      timing: s.openingHours || s.timings || '10:00 AM - 10:00 PM',
      offer: s.offer || 'Premier Lifestyle Retail',
      additionalInfo: s.mallType || s.description || 'International Brands & Cinema',
    }));
  }, [activeHotel]);

  const hotelTourist = useMemo(() => {
    return (activeHotel?.nearby?.touristPlaces || []).map((tp) => ({
      ...tp,
      componentType: 1,
      tag: tp.tag || 'HERITAGE & EXCURSION',
      category: 'Tourist Landmarks',
      latitude: tp.latitude ?? tp.lat,
      longitude: tp.longitude ?? tp.lng,
      location: tp.location || tp.area || `${activeHotel?.city || 'Local Area'}`,
      timing: tp.timing || tp.timings || tp.visitingHours || '9:00 AM - 5:30 PM',
      offer: tp.offer || 'Guided Tour Available',
      additionalInfo: tp.subtitle || tp.description || 'Historic Heritage Excursion',
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
      ...hotelAtms,
      ...hotelSpa,
      ...hotelTransit,
      ...hotelShopping,
      ...hotelTourist,
      ...hotelFacilities,
    ];
  }, [
    hotelHospitals,
    hotelPharmacies,
    hotelGyms,
    hotelPools,
    hotelDining,
    hotelTakeaway,
    hotelDelivery,
    hotelAtms,
    hotelSpa,
    hotelTransit,
    hotelShopping,
    hotelTourist,
    hotelFacilities,
  ]);

  const bottomFilterTabs = useMemo(() => {
    return [
      { id: 'all', label: 'All Curations', icon: '🌟', count: allBottomItems.length },
      { id: 'hospitals', label: 'Hospitals (24/7)', icon: '🏥', count: hotelHospitals.length },
      { id: 'pharmacies', label: 'Pharmacy', icon: '💊', count: hotelPharmacies.length },
      { id: 'gyms', label: 'Wellness & Gyms', icon: '🏋️', count: hotelGyms.length },
      { id: 'cafes', label: 'Bistros & Cafes', icon: '🍽️', count: hotelDining.length },
      { id: 'takeaway', label: 'Express Takeaway', icon: '🥡', count: hotelTakeaway.length },
      { id: 'delivery', label: 'Suite Delivery', icon: '🛎️', count: hotelDelivery.length },
      { id: 'transportation', label: 'Transportation', icon: '🚆', count: hotelTransit.length },
      { id: 'shopping', label: 'Shopping Malls', icon: '🛍️', count: hotelShopping.length },
      { id: 'tourist', label: 'Tourist Places', icon: '🏛️', count: hotelTourist.length },
      { id: 'atms', label: '24/7 ATMs', icon: '🏧', count: hotelAtms.length },
      { id: 'pools', label: 'Swimming Pools', icon: '🏊', count: hotelPools.length },
      { id: 'spa', label: 'Parlour & Spa', icon: '💆', count: hotelSpa.length },
    ];
  }, [
    allBottomItems.length,
    hotelHospitals.length,
    hotelPharmacies.length,
    hotelGyms.length,
    hotelDining.length,
    hotelTakeaway.length,
    hotelDelivery.length,
    hotelTransit.length,
    hotelShopping.length,
    hotelTourist.length,
    hotelAtms.length,
    hotelPools.length,
    hotelSpa.length,
  ]);

  const getItemsForCategory = (categoryId) => {
    switch (categoryId) {
      case 'hospitals': return hotelHospitals;
      case 'pharmacies': return hotelPharmacies;
      case 'gyms': return hotelGyms;
      case 'pools': return hotelPools;
      case 'cafes':
      case 'dining': return hotelDining;
      case 'takeaway': return hotelTakeaway;
      case 'delivery': return hotelDelivery;
      case 'atms': return hotelAtms;
      case 'spa': return hotelSpa;
      case 'transportation':
      case 'transit': return hotelTransit;
      case 'shopping': return hotelShopping;
      case 'tourist': return hotelTourist;
      case 'facilities': return hotelFacilities;
      default: return allBottomItems;
    }
  };

  const getCategoryConfig = (categoryId) => {
    switch (categoryId) {
      case 'hospitals':
        return {
          id: 'hospitals',
          title: '24/7 Emergency Care & Hospitals',
          subtitle: `Multi-speciality hospitals, emergency trauma desks and ambulance services near ${activeHotel.city || activeHotel.name}`,
          icon: '🏥',
          label: 'Hospitals',
        };
      case 'pharmacies':
        return {
          id: 'pharmacies',
          title: '24/7 Pharmacies & Medical Dispensaries',
          subtitle: `Licensed chemists, prescription medicines and emergency medical supplies near ${activeHotel.city || activeHotel.name}`,
          icon: '💊',
          label: 'Pharmacies',
        };
      case 'gyms':
        return {
          id: 'gyms',
          title: 'Wellness Centers & Gymnasiums',
          subtitle: `High-performance fitness centers, strength training, steam & wellness clubs near ${activeHotel.city || activeHotel.name}`,
          icon: '🏋️',
          label: 'Wellness & Gyms',
        };
      case 'cafes':
      case 'dining':
        return {
          id: 'cafes',
          title: 'Bistros, Cafes & Fine Dining',
          subtitle: `Curated culinary venues, artisanal bakeries and fine restaurants near ${activeHotel.city || activeHotel.name}`,
          icon: '🍽️',
          label: 'Bistros & Dining',
        };
      case 'takeaway':
        return {
          id: 'takeaway',
          title: 'Express Takeaway & Fast Casual',
          subtitle: `Fresh handcrafted takeaway meals with priority express pickup for hotel guests near ${activeHotel.city || activeHotel.name}`,
          icon: '🥡',
          label: 'Express Takeaway',
        };
      case 'delivery':
        return {
          id: 'delivery',
          title: 'In-Suite Dining & Doorstep Delivery',
          subtitle: `Gourmet dishes, fresh brews and personal care items delivered directly to your guest suite`,
          icon: '🛎️',
          label: 'Suite Delivery',
        };
      case 'atms':
        return {
          id: 'atms',
          title: '24/7 ATMs & Banking Services',
          subtitle: `Verified automated cash dispensers and touchless currency facilities near ${activeHotel.city || activeHotel.name}`,
          icon: '🏧',
          label: '24/7 ATMs',
        };
      case 'pools':
        return {
          id: 'pools',
          title: 'Swimming Pools & Aquatic Care',
          subtitle: `Temperature-controlled pools, private cabanas and lap facilities accessible near ${activeHotel.city || activeHotel.name}`,
          icon: '🏊',
          label: 'Swimming Pools',
        };
      case 'spa':
        return {
          id: 'spa',
          title: 'Parlour, Salon & Ayurvedic Spa',
          subtitle: `Ayurvedic therapies, holistic massages and premium grooming salons near ${activeHotel.city || activeHotel.name}`,
          icon: '💆',
          label: 'Parlour & Spa',
        };
      case 'transportation':
      case 'transit':
        return {
          id: 'transportation',
          title: 'Transit, Mobility & Private Chauffeur',
          subtitle: `Railway junctions, metro hubs, airport transit and on-call concierge chauffeur fleet near ${activeHotel.city || activeHotel.name}`,
          icon: '🚆',
          label: 'Transit & Mobility',
        };
      case 'shopping':
        return {
          id: 'shopping',
          title: 'Shopping Malls & Retail Hubs',
          subtitle: `Premier lifestyle retail destinations, international fashion brands and multiplexes near ${activeHotel.city || activeHotel.name}`,
          icon: '🛍️',
          label: 'Shopping Malls',
        };
      case 'tourist':
        return {
          id: 'tourist',
          title: 'Historic Landmarks & Excursions',
          subtitle: `Palaces, monuments, botanical gardens and cultural landmarks near ${activeHotel.city || activeHotel.name}`,
          icon: '🏛️',
          label: 'Tourist Places',
        };
      default:
        return {
          id: 'all',
          title: 'Complete Hotel Curations & Local Guide',
          subtitle: `All verified amenities, emergency care, dining and attractions near ${activeHotel.name}, ${activeHotel.city}`,
          icon: '🌟',
          label: 'All Curations',
        };
    }
  };

  // Unconfigured Hotel Fallback Screen — Pure Guest Portal experience (ZERO admin controls)
  const activeHotelName = activeHotel?.name || activeHotel?.title || activeHotel?.hotelName;
  if (!activeHotel || !activeHotelName) {
    return (
      <View style={styles.unconfiguredContainer}>
        <View style={styles.unconfiguredCard}>
          <Text style={styles.unconfiguredIcon}>🏨</Text>
          <Text style={styles.unconfiguredTitle}>Guest Concierge Portal</Text>
          <Text style={styles.unconfiguredSubtitle}>
            Welcome to the Luxury Guest Concierge Portal.
          </Text>
          <Text style={styles.unconfiguredDetail}>
            No hotel property is currently active. Concierge services, dining reservations, wellness amenities, and turn-by-turn driving directions will appear here once an approved hotel is selected.
          </Text>
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
        onBack={() => {
          if (selectedCategoryList && selectedCategoryList !== 'all') {
            setActiveScreen('category_list');
          } else {
            setActiveScreen('home');
          }
        }}
      />
    );
  }

  // If in Dedicated Category List Page (Sir's Requirement: Sections 10-16)
  if (activeScreen === 'category_list') {
    const categoryInfo = getCategoryConfig(selectedCategoryList);
    const rawCategoryItems = getItemsForCategory(selectedCategoryList);
    const filteredCategoryItems = rawCategoryItems.filter((item) => {
      if (!categorySearchQuery.trim()) return true;
      const q = categorySearchQuery.toLowerCase();
      const titleMatch = (item.title || item.name || '').toLowerCase().includes(q);
      const subMatch = (item.subtitle || item.description || item.address || '').toLowerCase().includes(q);
      const locMatch = (item.location || item.place || item.area || '').toLowerCase().includes(q);
      return titleMatch || subMatch || locMatch;
    });

    return (
      <View style={styles.categoryScreenContainer}>
        {/* 1. TOP NAVIGATION & ORIGIN STAY BAR */}
        <View style={styles.categoryNavBar}>
          <TouchableOpacity
            style={styles.categoryBackBtn}
            onPress={() => {
              setActiveScreen('home');
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.location.hash = '#/guest';
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryBackIcon}>←</Text>
            <Text style={styles.categoryBackText}>Back to Hotel Portal</Text>
          </TouchableOpacity>

          {/* Active Hotel Origin Indicator */}
          <View style={styles.categoryOriginPill}>
            <Text style={styles.categoryOriginIcon}>🏨</Text>
            <Text style={styles.categoryOriginLabel}>
              Origin Stay:{' '}
              <Text style={styles.categoryOriginValue}>
                {activeHotel?.name || 'Active Hotel'}{activeHotel?.city ? `, ${activeHotel.city}` : ''}
              </Text>
            </Text>
            {activeHotel?.latitude && activeHotel?.longitude ? (
              <Text style={styles.categoryOriginCoords}>
                ({Number(activeHotel.latitude).toFixed(4)}°N, {Number(activeHotel.longitude).toFixed(4)}°E)
              </Text>
            ) : null}
          </View>
        </View>

        {/* 2. CATEGORY HEADER & SEARCH BAR */}
        <View style={styles.categoryPageHeader}>
          <View style={styles.categoryTitleGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={styles.categoryMainIcon}>{categoryInfo.icon}</Text>
              <Text style={styles.categoryMainTitle}>{categoryInfo.title.toUpperCase()}</Text>
              <View style={styles.categoryCountBadge}>
                <Text style={styles.categoryCountText}>{filteredCategoryItems.length} Places</Text>
              </View>
            </View>
            <Text style={styles.categoryMainSub}>{categoryInfo.subtitle}</Text>
          </View>

          {/* Search Box */}
          <View style={styles.categorySearchBox}>
            <Text style={styles.categorySearchIcon}>🔍</Text>
            <TextInput
              style={styles.categorySearchInput}
              placeholder={`Search ${categoryInfo.label}...`}
              placeholderTextColor="#64748B"
              value={categorySearchQuery}
              onChangeText={setCategorySearchQuery}
            />
            {categorySearchQuery ? (
              <TouchableOpacity onPress={() => setCategorySearchQuery('')}>
                <Text style={{ color: '#94A3B8', fontSize: 13, paddingHorizontal: 4 }}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* 3. CATEGORY QUICK SWITCHER CHIPS */}
        <View style={styles.categoryQuickTabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryQuickTabs}
          >
            {bottomFilterTabs.map((tab) => {
              const isCurrent = selectedCategoryList === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.categoryQuickTab, isCurrent && styles.categoryQuickTabActive]}
                  onPress={() => {
                    setSelectedCategoryList(tab.id);
                    setCategorySearchQuery('');
                    if (Platform.OS === 'web' && typeof window !== 'undefined') {
                      window.location.hash = `#/guest/${tab.id}`;
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryQuickTabIcon}>{tab.icon}</Text>
                  <Text style={[styles.categoryQuickTabText, isCurrent && styles.categoryQuickTabTextActive]}>
                    {tab.label}
                  </Text>
                  <View style={[styles.categoryQuickTabBadge, isCurrent && styles.categoryQuickTabBadgeActive]}>
                    <Text style={[styles.categoryQuickTabBadgeText, isCurrent && styles.categoryQuickTabBadgeTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. UNIVERSAL 5-COLUMN TABLE LIST (Sir's Dynamic Schema) */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 24 }}>
          <UniversalCategoryTableList
            items={filteredCategoryItems}
            category={selectedCategoryList}
            hotel={activeHotel}
            onSelectItem={handleOpenDetail}
            onDataChanged={loadData}
            allowAdminControls={false}
          />
        </ScrollView>
      </View>
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

        {/* Right: Language Pill, Refresh */}
        <View style={styles.headerRight}>

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
            items={hotelTourist.length > 0 ? hotelTourist : (activeHotel?.nearby?.touristPlaces || [])}
            emptyMessage="No tourist places found near this hotel."
            selectedId={selectedComponent?.id}
            onSelectComponent={handleSelectRouteItem}
            onViewDetails={(item) => handleOpenDetail(item)}
            onScanPress={handleOpenScan}
          />

          {/* 2. MIDDLE ROW: Left (Shopping Malls) | Right (Hotel Images Carousel + Google Map) */}
          <View style={styles.middleRow}>
            {/* LEFT PANEL (~27%): Simple Shopping List WITHOUT large images */}
            <View style={styles.shoppingColumn}>
              <SimpleShoppingList
                title={`🛍️ ${t.quadrantLeft || 'SHOPPING & MALLS'}`}
                subtitle={`Premier retail destinations near ${activeHotel.city || activeHotel.name}`}
                items={hotelShopping.length > 0 ? hotelShopping : (activeHotel?.nearby?.shopping || [])}
                hotel={activeHotel}
                onSelectItem={(item) => handleOpenDetail(item)}
              />
            </View>

            {/* CENTER / RIGHT PANEL (~73%): Hotel Showcase & Interactive Map directly beside it */}
            <View style={styles.hotelAndMapColumn}>
              <CentralDisplay
                hotel={activeHotel}
                component={selectedComponent || groupedComponents.center}
                onViewDetails={handleOpenDetail}
                onBookStay={handleOpenBooking}
              />
            </View>
          </View>

          {/* 3. BOTTOM CATEGORY BAR: Category navigation chips with zero vertical scrolling */}
          <View style={styles.bottomBarContainer}>
            <View style={styles.bottomBarHeaderRow}>
              <View style={styles.bottomBarHeaderLeft}>
                <Text style={styles.bottomBarDot}>✦</Text>
                <Text style={styles.bottomBarLabel}>EXPLORE NEARBY SERVICES & AMENITIES</Text>
              </View>
              <Text style={styles.bottomBarSub}>Select any category to view full verified listings with dynamic GPS routing</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bottomFilterTabsRow}
            >
              {bottomFilterTabs.map((tab) => {
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={styles.bottomTabChip}
                    onPress={() => {
                      setSelectedCategoryList(tab.id);
                      setActiveScreen('category_list');
                      if (Platform.OS === 'web' && typeof window !== 'undefined') {
                        window.location.hash = `#/guest/${tab.id}`;
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bottomTabIcon}>{tab.icon}</Text>
                    <Text style={styles.bottomTabText}>
                      {tab.label}
                    </Text>
                    <View style={styles.bottomTabCountBadge}>
                      <Text style={styles.bottomTabCountText}>
                        {tab.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
            items={hotelTourist.length > 0 ? hotelTourist : (activeHotel?.nearby?.touristPlaces || [])}
            emptyMessage="No tourist places found near this hotel."
            selectedId={selectedComponent?.id}
            onSelectComponent={handleSelectRouteItem}
            onViewDetails={(item) => handleOpenDetail(item)}
            onScanPress={handleOpenScan}
          />

          {/* 2. CENTER: HOTEL SPOTLIGHT & MAP */}
          <View style={styles.mobileCenterWrapper}>
            <CentralDisplay
              hotel={activeHotel}
              component={selectedComponent || groupedComponents.center}
              onViewDetails={handleOpenDetail}
              onBookStay={handleOpenBooking}
            />
          </View>

          {/* 3. MOBILE SHOPPING MALLS */}
          <View style={styles.mobileVerticalWrapper}>
            <SimpleShoppingList
              title={`🛍️ Shopping Malls`}
              subtitle={`Premier retail destinations near ${activeHotel.city || activeHotel.name}`}
              items={hotelShopping.length > 0 ? hotelShopping : (activeHotel?.nearby?.shopping || [])}
              hotel={activeHotel}
              onSelectItem={(item) => handleOpenDetail(item)}
            />
          </View>

          {/* 4. MOBILE BOTTOM CATEGORY BAR */}
          <View style={styles.bottomBarContainer}>
            <View style={styles.bottomBarHeaderRow}>
              <View style={styles.bottomBarHeaderLeft}>
                <Text style={styles.bottomBarDot}>✦</Text>
                <Text style={styles.bottomBarLabel}>EXPLORE NEARBY SERVICES & AMENITIES</Text>
              </View>
              <Text style={styles.bottomBarSub}>Select any category to view full verified listings</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bottomFilterTabsRow}
            >
              {bottomFilterTabs.map((tab) => {
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={styles.bottomTabChip}
                    onPress={() => {
                      setSelectedCategoryList(tab.id);
                      setActiveScreen('category_list');
                      if (Platform.OS === 'web' && typeof window !== 'undefined') {
                        window.location.hash = `#/guest/${tab.id}`;
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bottomTabIcon}>{tab.icon}</Text>
                    <Text style={styles.bottomTabText}>
                      {tab.label}
                    </Text>
                    <View style={styles.bottomTabCountBadge}>
                      <Text style={styles.bottomTabCountText}>
                        {tab.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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

  // 2. Desktop 5-Quadrant Master Container (Section 4 & 24: Single 100vh Viewport)
  desktopContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 3,
    paddingBottom: 3,
    justifyContent: 'space-between',
    display: 'flex',
    flexDirection: 'column',
    ...Platform.select({
      web: {
        height: 'calc(100vh - 38px)',
        maxHeight: 'calc(100vh - 38px)',
        overflow: 'hidden',
      },
      default: {
        flex: 1,
      },
    }),
  },
  middleRow: {
    flex: 1,
    minHeight: 280,
    maxHeight: 'calc(100vh - 275px)',
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
    alignItems: 'stretch',
  },
  shoppingColumn: {
    flex: 27,
    height: '100%',
    minHeight: 280,
  },
  hotelAndMapColumn: {
    flex: 73,
    height: '100%',
    minHeight: 280,
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

  // 4. Bottom Category Bar (Pinned at bottom of Viewport, 0 vertical scroll)
  bottomBarContainer: {
    flexShrink: 0,
    backgroundColor: '#090B13',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 192, 130, 0.25)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 2,
    zIndex: 50,
  },
  bottomBarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bottomBarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomBarDot: {
    color: '#E2C082',
    fontSize: 10,
  },
  bottomBarLabel: {
    color: '#E2C082',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bottomBarSub: {
    color: '#64748B',
    fontSize: 9,
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
    gap: 5,
    backgroundColor: '#12141A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 5,
    paddingHorizontal: 9,
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
    color: '#E2E8F0',
    fontSize: 10.5,
    fontWeight: '700',
  },
  bottomTabCountBadge: {
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
  },
  bottomTabCountText: {
    color: '#E2C082',
    fontSize: 9,
    fontWeight: '800',
  },

  // 5. Dedicated Category List Screen Styles (Sir's Requirement)
  categoryScreenContainer: {
    flex: 1,
    backgroundColor: '#070A12',
    flexDirection: 'column',
    ...Platform.select({
      web: {
        height: '100vh',
        overflow: 'hidden',
      },
    }),
  },
  categoryNavBar: {
    height: 44,
    backgroundColor: '#090C15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    flexShrink: 0,
  },
  categoryBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.4)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  categoryBackIcon: {
    color: '#E2C082',
    fontSize: 14,
    fontWeight: '800',
  },
  categoryBackText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryOriginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  categoryOriginIcon: {
    fontSize: 12,
  },
  categoryOriginLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryOriginValue: {
    color: '#E2C082',
    fontWeight: '800',
  },
  categoryOriginCoords: {
    color: '#64748B',
    fontSize: 10,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  categoryPageHeader: {
    backgroundColor: '#0D0F18',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    flexShrink: 0,
  },
  categoryTitleGroup: {
    flex: 1,
  },
  categoryMainIcon: {
    fontSize: 18,
  },
  categoryMainTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  categoryCountBadge: {
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1,
    borderColor: '#E2C082',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  categoryCountText: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
  },
  categoryMainSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  categorySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 34,
    width: 260,
  },
  categorySearchIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  categorySearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 11,
    padding: 0,
  },
  categoryQuickTabsContainer: {
    backgroundColor: '#0A0C14',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    flexShrink: 0,
  },
  categoryQuickTabs: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  categoryQuickTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 5,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  categoryQuickTabActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.16)',
    borderColor: '#E2C082',
  },
  categoryQuickTabIcon: {
    fontSize: 11,
  },
  categoryQuickTabText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  categoryQuickTabTextActive: {
    color: '#E2C082',
    fontWeight: '800',
  },
  categoryQuickTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  categoryQuickTabBadgeActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.25)',
  },
  categoryQuickTabBadgeText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
  },
  categoryQuickTabBadgeTextActive: {
    color: '#E2C082',
    fontWeight: '800',
  },
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
