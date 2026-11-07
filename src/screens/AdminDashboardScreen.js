// =============================================================================
// src/screens/AdminDashboardScreen.js
// Dedicated Administrator Console with Full CRUD & Hotel-Specific Configuration
// Supports:
// 1. Overview & MongoDB Summary
// 2. Hotels Management (FULL CRUD: Create, Read, Update, Delete + Payment Methods)
// 3. Restaurants Management (FULL CRUD: Create, Read, Update, Delete)
// 4. Gyms Management (FULL CRUD: Create, Read, Update, Delete)
// 5. Takeaway Partners (FULL CRUD: Create, Read, Update, Delete)
// 6. Home Delivery Services (FULL CRUD: Create, Read, Update, Delete)
// 7. Hotel-Specific Payment Methods Configurator (Add/Remove methods per hotel)
// 8. 1-Click Availability Matrix across all entities
// 9. Guest Bookings Manager (View, Filter, Cancel & Delete Bookings)
// =============================================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Modal,
} from 'react-native';

import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { activeHotelService } from '../services/activeHotelService';
import { searchHotelByName, fetchHotelDetailsByPlaceId, getApiConfigStatus } from '../services/placeSearchService';
import HotelAutocompleteSearch from '../components/HotelAutocompleteSearch';
import LucideIcon from '../components/LucideIcon';
import { LUXURY_THEME } from '../theme/luxuryTheme';

const ADMIN_TABS = [
  { id: 'overview', label: 'Dashboard Overview', icon: 'layout-dashboard', section: 'DASHBOARD' },
  { id: 'hotel_config', label: 'Hotel & Location Config', icon: 'settings', section: 'PROPERTY & DISCOVERY' },
  { id: 'hotels', label: 'Hotels Directory', icon: 'building-2', section: 'PROPERTY & DISCOVERY' },
  { id: 'places_manager', label: 'Nearby Places & Categories', icon: 'compass', section: 'PROPERTY & DISCOVERY' },
  { id: 'restaurants', label: 'Restaurants & Dining', icon: 'utensils', section: 'GUEST AMENITIES' },
  { id: 'gyms', label: 'Gyms & Wellness', icon: 'dumbbell', section: 'GUEST AMENITIES' },
  { id: 'pools', label: 'Swimming Pools', icon: 'waves', section: 'GUEST AMENITIES' },
  { id: 'facilities', label: 'Hotel Facilities & Services', icon: 'sparkles', section: 'GUEST AMENITIES' },
  { id: 'takeaway', label: 'Takeaway Partners', icon: 'shopping-bag', section: 'GUEST AMENITIES' },
  { id: 'delivery', label: 'Home Delivery', icon: 'truck', section: 'GUEST AMENITIES' },
  { id: 'payments', label: 'Hotel Payment Config', icon: 'credit-card', section: 'OPERATIONS' },
  { id: 'availability', label: 'Availability Matrix', icon: 'calendar', section: 'OPERATIONS' },
];

const STANDARD_PAYMENT_OPTIONS = [
  'UPI (GPay / PhonePe / Paytm)',
  'Credit Card (Visa / Mastercard / Amex)',
  'Debit Card (RuPay / Maestro)',
  'Net Banking (All Major Banks)',
  'Cash at Front Desk',
  'Apple Pay',
  'International Wire Transfer',
];

const ENRICHED_PAYMENT_OPTIONS = [
  {
    id: 'upi',
    name: 'UPI (GPay / PhonePe / Paytm)',
    shortName: 'UPI',
    icon: 'phone',
    desc: 'Instant mobile QR & VPA payments via BHIM, Google Pay, PhonePe, and Paytm',
    tag: 'Instant QR & Mobile',
  },
  {
    id: 'credit_card',
    name: 'Credit Card (Visa / Mastercard / Amex)',
    shortName: 'Credit Card',
    icon: 'credit-card',
    desc: 'International and domestic credit cards with 3D Secure 2.0 fraud protection',
    tag: 'Global 3D Secure',
  },
  {
    id: 'debit_card',
    name: 'Debit Card (RuPay / Maestro)',
    shortName: 'Debit Card',
    icon: 'credit-card',
    desc: 'Direct account debit cards issued by Indian & international banking networks',
    tag: 'Instant Settlement',
  },
  {
    id: 'net_banking',
    name: 'Net Banking (All Major Banks)',
    shortName: 'Net Banking',
    icon: 'building-2',
    desc: 'Direct net banking gateway integrated across 50+ major public & private banks',
    tag: '50+ Banks Supported',
  },
  {
    id: 'cash',
    name: 'Cash at Front Desk',
    shortName: 'Cash',
    icon: 'dollar-sign',
    desc: 'Physical currency payment accepted at the front desk concierge counter upon arrival',
    tag: 'On-Property Settle',
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    shortName: 'Apple Pay',
    icon: 'credit-card',
    desc: 'One-touch biometric NFC payments for iOS, iPhone, and Apple Watch users',
    tag: 'Biometric NFC',
  },
  {
    id: 'wire_transfer',
    name: 'International Wire Transfer',
    shortName: 'Wire Transfer',
    icon: 'external-link',
    desc: 'Direct SWIFT / IBAN wire transfer for VIP suites, delegations, and long-term stays',
    tag: 'SWIFT / IBAN',
  },
  {
    id: 'corporate',
    name: 'Corporate Direct Account',
    shortName: 'Corporate Account',
    icon: 'building-2',
    desc: 'Direct corporate monthly invoicing and consolidated GST voucher billing',
    tag: 'Monthly Invoicing',
  },
];

const generate10DigitId = () => {
  const min = 1000000000;
  const max = 9999999999;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
};

// No hardcoded hotel presets — Admin searches for their actual hotel using place search.

export default function AdminDashboardScreen({
  activeHotel: propActiveHotel,
  onSetActiveHotel,
  onLaunchGuestWebsite,
  onBackToGuestPortal,
  onOpenSuperAdmin,
  onLogout,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  const [activeTab, setActiveTab] = useState('hotel_config');
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hotel Search & Confirmation State
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');
  const [selectedSearchResult, setSelectedSearchResult] = useState(null); // chosen from search dropdown
  const [confirmedHotelData, setConfirmedHotelData] = useState(null); // fetched place details
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [apiConfigStatus] = useState(() => getApiConfigStatus());
  const [connectedDbName, setConnectedDbName] = useState('hotelApiDb');

  // Active Hotel & Location Configurator State
  const [currentActiveHotel, setCurrentActiveHotel] = useState(
    propActiveHotel || activeHotelService.getActiveHotel() || null
  );

  const [hotelConfigForm, setHotelConfigForm] = useState(() => {
    const init = propActiveHotel || activeHotelService.getActiveHotel();
    return {
      name: init?.name || init?.title || '',
      city: init?.city || init?.location || '',
      address: init?.address || '',
      latitude: init?.latitude != null ? String(init.latitude) : '',
      longitude: init?.longitude != null ? String(init.longitude) : '',
      imageLink: init?.imageLink || (init?.images && init.images[0]) || '',
      subtitle: init?.subtitle || '',
      pricePerNight: init?.pricePerNight || '₹18,500 / night',
      rating: init?.rating ? String(init.rating) : '4.9',
    };
  });

  // Up to 8 hotel pictures state with verified unique 10-digit IDs
  const [hotelImages, setHotelImages] = useState(() => {
    const init = propActiveHotel || activeHotelService.getActiveHotel();
    if (init && init.imageObjects && Array.isArray(init.imageObjects) && init.imageObjects.length > 0) {
      return init.imageObjects.slice(0, 8);
    }
    if (init && init.images && Array.isArray(init.images) && init.images.length > 0) {
      return init.images.slice(0, 8).map((img, idx) => ({
        id: (typeof img === 'object' && img && img.id) || generate10DigitId(),
        url: typeof img === 'object' && img && img.url ? img.url : img,
        caption: (typeof img === 'object' && img && img.caption) || (init.imageCaptions && init.imageCaptions[idx]) || ('Property Photo ' + (idx + 1)),
      }));
    }
    if (init && init.imageLink) {
      return [{ id: generate10DigitId(), url: init.imageLink, caption: 'Hotel Exterior' }];
    }
    // No active hotel — start with empty gallery
    return [];
  });

  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [newImageCaptionInput, setNewImageCaptionInput] = useState('');

  // Places & Custom Categories Manager State
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState('touristPlaces');
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState(null);
  const [customCatModalVisible, setCustomCatModalVisible] = useState(false);
  const [customCatKey, setCustomCatKey] = useState('');
  const [customCatName, setCustomCatName] = useState('');
  const [customCatIcon, setCustomCatIcon] = useState('sparkles');

  const [newPlaceForm, setNewPlaceForm] = useState({
    title: '',
    subtitle: '',
    category: 'touristPlaces',
    latitude: '',
    longitude: '',
    address: '',
    distance: '',
    rating: '4.8',
    imageLink: '',
    websiteUrl: '',
    timings: '9:00 AM - 6:00 PM',
    data1: '',
    data2: '',
    data3: '',
    data4: '',
    data5: '',
  });

  // 1. Upload Local Picture from Device (Assigned 10-Digit Unique ID, Max 8)
  const handleTriggerFileUpload = () => {
    if (hotelImages.length >= 8) {
      showToast('Maximum 8 pictures reached. Remove an image to upload a new one.', 'error');
      return;
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.style.position = 'fixed';
      input.style.top = '-9999px';
      input.style.left = '-9999px';
      input.style.opacity = '0';
      document.body.appendChild(input);

      input.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        setTimeout(() => {
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
        }, 1000);

        if (!files.length) return;

        const remainingSlots = 8 - hotelImages.length;
        const toUpload = files.slice(0, remainingSlots);

        toUpload.forEach(async (file) => {
          const unique10DigitId = generate10DigitId();
          const cleanName = (file.name || 'Property Image').replace(/\.[^/.]+$/, '');
          const curHotelId = currentActiveHotel?.id || 'default-hotel';

          const addUploadedImage = (finalUrl) => {
            setHotelImages((prev) => {
              if (prev.length >= 8) return prev;
              const newSlot = {
                id: unique10DigitId,
                url: finalUrl,
                name: file.name,
                caption: cleanName,
              };
              const updatedList = [...prev, newSlot];

              setHotelConfigForm((f) => ({
                ...f,
                imageLink: f.imageLink || finalUrl,
              }));

              const cur = activeHotelService.getActiveHotel();
              if (cur) {
                const updatedHotel = {
                  ...cur,
                  images: updatedList.map((img) => (typeof img === 'object' && img?.url ? img.url : img)),
                  imageObjects: updatedList,
                  imageLink: updatedList[0]?.url || cur.imageLink,
                };
                activeHotelService.saveAndActivateHotel(updatedHotel);
                setCurrentActiveHotel(updatedHotel);
              }

              return updatedList;
            });
            showToast(`Uploaded "${file.name}"!`, 'success');
          };

          try {
            showToast(`Generating secure upload link for ${file.name}...`, 'info');
            const presignedRes = await apiService.getPresignedUrl(curHotelId, file.name, file.type);
            
            if (presignedRes.success && presignedRes.data) {
              const { uploadUrl, fileUrl } = presignedRes.data;
              
              showToast(`Uploading ${file.name} to secure storage...`, 'info');
              const uploadRes = await apiService.uploadFileToS3(uploadUrl, file);
              
              if (uploadRes.success) {
                addUploadedImage(fileUrl);
              } else {
                throw new Error(uploadRes.error || 'Upload failed');
              }
            } else {
              throw new Error(presignedRes.error || 'Failed to get upload URL');
            }
          } catch (err) {
            console.warn('S3 Upload Error, falling back to local base64:', err);
            const reader = new FileReader();
            reader.onload = (event) => {
              const rawDataUrl = event?.target?.result;
              if (rawDataUrl) {
                addUploadedImage(rawDataUrl);
              }
            };
            reader.readAsDataURL(file);
          }
        });
      };
      input.click();
    } else {
      showToast('File upload is supported on web browsers.', 'info');
    }
  };

  // 2. Add Picture via URL (Assigned 10-Digit Unique ID, Max 8)
  const handleAddImageUrl = () => {
    if (hotelImages.length >= 8) {
      showToast('Maximum 8 pictures reached. Remove an image to add a new one.', 'error');
      return;
    }
    const trimmed = newImageUrlInput.trim();
    if (!trimmed) {
      showToast('Please paste a valid Image URL!', 'error');
      return;
    }
    const unique10DigitId = generate10DigitId();
    const caption = newImageCaptionInput.trim() || `Property Photo ${hotelImages.length + 1}`;

    setHotelImages((prev) => {
      const updated = [
        ...prev,
        {
          id: unique10DigitId,
          url: trimmed,
          caption,
        },
      ];
      setHotelConfigForm((f) => ({
        ...f,
        imageLink: f.imageLink || trimmed,
      }));
      const cur = activeHotelService.getActiveHotel();
      if (cur) {
        activeHotelService.saveAndActivateHotel({
          ...cur,
          images: updated.map((img) => (typeof img === 'object' && img?.url ? img.url : img)),
          imageObjects: updated,
          imageLink: updated[0]?.url || cur.imageLink,
        });
      }
      return updated;
    });
    setNewImageUrlInput('');
    setNewImageCaptionInput('');
    showToast(`Added Picture • Assigned 10-Digit ID: ${unique10DigitId}!`, 'success');
  };

  // 3. Remove Picture Slot
  const handleRemoveImage = (indexToRemove) => {
    const target = hotelImages[indexToRemove];
    setHotelImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      const cur = activeHotelService.getActiveHotel();
      if (cur) {
        activeHotelService.saveAndActivateHotel({
          ...cur,
          images: updated.map((img) => (typeof img === 'object' && img?.url ? img.url : img)),
          imageObjects: updated,
          imageLink: updated[0]?.url || null,
        });
      }
      return updated;
    });
    showToast(`Removed picture (ID: ${target?.id || indexToRemove + 1}).`, 'info');
  };

  // 4. Reorder Picture Slots (Move Left / Right)
  const handleMoveImage = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= hotelImages.length) return;
    setHotelImages((prev) => {
      const copy = [...prev];
      const item = copy.splice(fromIndex, 1)[0];
      copy.splice(toIndex, 0, item);
      return copy;
    });
 showToast(`Reordered picture slot ${fromIndex + 1} -> ${toIndex + 1}`, 'info');
  };

  const handleSelectSearchResult = async (result) => {
    if (!result) return;
    setSelectedSearchResult(result);

    // Case 1: External Discovered Hotel (from Google Places API)
    // Populates the registration form for review WITHOUT automatically saving to MongoDB
    if (result.isExternalDiscovery || result.source === 'google_places') {
      setIsFetchingDetails(true);
      try {
        let details = null;
        if (result.placeId && !result.placeId.startsWith('prop-')) {
          const detRes = await apiService.fetchPlaceDetails(result.placeId);
          if (detRes && detRes.success && detRes.data) {
            details = detRes.data;
          }
        }

        const h = details || result;
        const hotelName = h.name || h.title || result.name || 'Discovered Hotel';
        const hotelAddress = h.address || result.address || '';
        const hotelCity = h.city || result.city || (hotelAddress ? hotelAddress.split(',').slice(-3, -2)[0]?.trim() : '') || 'Local Area';
        const hotelLat = h.latitude != null ? h.latitude : result.latitude;
        const hotelLng = h.longitude != null ? h.longitude : result.longitude;
        const hotelPhotos = (h.photos && h.photos.length > 0) ? h.photos : (h.images || result.images || []);
        const heroPhoto = h.imageLink || (hotelPhotos[0]?.url || hotelPhotos[0]) || result.imageLink || '';

        const tempId = 'prop_' + Date.now();
        const externalHotelObj = {
          id: tempId,
          hotelPropertyId: tempId,
          name: hotelName,
          title: hotelName,
          city: hotelCity,
          location: hotelCity,
          address: hotelAddress,
          latitude: hotelLat != null ? hotelLat : null,
          longitude: hotelLng != null ? hotelLng : null,
          imageLink: typeof heroPhoto === 'string' ? heroPhoto : (heroPhoto?.url || ''),
          images: hotelPhotos.map((p) => (typeof p === 'string' ? p : p.url)).filter(Boolean),
          pricePerNight: '₹18,500 / night',
          rating: h.rating || result.rating || 4.8,
          status: 'pending', // Requires admin review and save before database registration
          paymentMethods: ['Credit Card', 'Debit Card', 'UPI / QR', 'Cash at Reception'],
          availability: 'Available',
          source: 'google_places',
          isExternalDiscovery: true,
          googlePlaceId: result.placeId,
        };

        setConfirmedHotelData(externalHotelObj);
        setHotelConfigForm({
          name: externalHotelObj.name,
          city: externalHotelObj.city,
          address: externalHotelObj.address,
          latitude: externalHotelObj.latitude != null ? String(externalHotelObj.latitude) : '',
          longitude: externalHotelObj.longitude != null ? String(externalHotelObj.longitude) : '',
          imageLink: externalHotelObj.imageLink,
          subtitle: externalHotelObj.address,
          pricePerNight: externalHotelObj.pricePerNight,
          rating: String(externalHotelObj.rating),
        });

        if (hotelPhotos.length > 0) {
          setHotelImages(
            hotelPhotos.slice(0, 8).map((p, idx) => ({
              id: generate10DigitId(),
              url: typeof p === 'string' ? p : (p.url || ''),
              caption: typeof p === 'object' && p.caption ? p.caption : `Hotel Photo ${idx + 1}`,
            })).filter((img) => img.url)
          );
        }

        showToast(`Discovered "${externalHotelObj.name}" via Google Places. Review details below and click "SAVE & ACTIVATE" to register in MongoDB.`, 'info');
      } catch (err) {
        showToast(`Could not load place details: ${err.message}`, 'error');
      } finally {
        setIsFetchingDetails(false);
      }
      return;
    }

    // Case 2: Registered Hotel in MongoDB
    const h = result.raw || result;
    const hotelPropertyId = result.hotelPropertyId || h.hotelPropertyId || result.id || h.id || h._id;
    const hotelName = result.name || h.name || h.title || h.hotelName || 'Selected Hotel';
    const hotelCity = result.city || h.city || '';
    const hotelAddress = result.address || h.address || h.hotelAddress || '';
    const hotelLat = result.latitude != null ? result.latitude : (h.latitude != null ? h.latitude : (h.hotelLatLong ? parseFloat(h.hotelLatLong.split(',')[0]) : null));
    const hotelLng = result.longitude != null ? result.longitude : (h.longitude != null ? h.longitude : (h.hotelLatLong ? parseFloat(h.hotelLatLong.split(',')[1]) : null));
    const hotelImagesList = result.images || h.images || (result.image ? [result.image] : (h.imageLink ? [h.imageLink] : []));
    const heroImage = result.image || h.imageLink || (hotelImagesList && hotelImagesList[0]) || '';

    const hotelObj = {
      id: hotelPropertyId,
      hotelPropertyId: hotelPropertyId,
      name: hotelName,
      title: hotelName,
      city: hotelCity,
      location: hotelCity,
      address: hotelAddress,
      latitude: hotelLat,
      longitude: hotelLng,
      imageLink: heroImage,
      images: hotelImagesList,
      pricePerNight: result.pricePerNight || h.pricePerNight || '₹18,500 / night',
      rating: result.rating || h.rating || 4.8,
      status: result.status || h.status || 'approved',
      paymentMethods: h.paymentMethods || ['Credit Card', 'Debit Card', 'UPI / QR', 'Cash at Reception'],
      availability: h.availability || 'Available',
      isDatabaseMatch: true,
      raw: h,
    };

    setConfirmedHotelData(hotelObj);
    setHotelConfigForm({
      name: hotelObj.name || '',
      city: hotelObj.city || '',
      address: hotelObj.address || '',
      latitude: hotelObj.latitude != null ? String(hotelObj.latitude) : '',
      longitude: hotelObj.longitude != null ? String(hotelObj.longitude) : '',
      imageLink: hotelObj.imageLink || '',
      subtitle: hotelObj.address || '',
      pricePerNight: hotelObj.pricePerNight || '',
      rating: hotelObj.rating ? String(hotelObj.rating) : '',
    });

    if (hotelObj.images && hotelObj.images.length > 0) {
      setHotelImages(
        hotelObj.images.map((img, idx) => ({
          id: generate10DigitId(),
          url: typeof img === 'string' ? img : (img?.url || ''),
          caption: typeof img === 'object' && img?.caption ? img.caption : `Hotel Photo ${idx + 1}`,
        })).filter((img) => img.url)
      );
    }

    // Automatically activate and save this MongoDB hotel
    const activated = activeHotelService.saveAndActivateHotel(hotelObj);
    setCurrentActiveHotel(activated);
    if (onSetActiveHotel) onSetActiveHotel(activated);

    showToast(`Selected "${hotelObj.name}" (${hotelObj.city || 'Active Hotel'}) from MongoDB database.`, 'success');
  };

  const handleConfirmHotelFromSearch = async () => {
    if (!confirmedHotelData) {
      showToast('Please search for and select your hotel first.', 'error');
      return;
    }
    // This triggers the full save flow with confirmed real data
    await handleSaveHotelConfigFromData(confirmedHotelData);
  };

  const handleSaveHotelConfigFromData = async (hotelData) => {
    const saved = activeHotelService.saveAndActivateHotel({
      ...hotelData,
      images: hotelImages.length > 0 ? hotelImages.map((img) => (typeof img === 'object' && img && img.url ? img.url : img)) : (hotelData.images || []),
      imageObjects: hotelImages.length > 0 ? hotelImages : (hotelData.imageObjects || []),
    });
    setCurrentActiveHotel(saved);
    setConfirmedHotelData(null);
    setSelectedSearchResult(null);
    setHotelSearchQuery('');
    if (onSetActiveHotel) onSetActiveHotel(saved);
    showToast('Hotel "' + saved.name + '" is now ACTIVE! Scanning nearby places...', 'success');

    // Automatically trigger nearby places search for active hotel coordinates
    if (saved.latitude != null && saved.longitude != null) {
      setIsFetchingDetails(true);
      try {
        const enriched = await activeHotelService.populateAllNearby(saved, 5000, (label, curr, total) => {
          showToast(`Scanning nearby ${label} (${curr}/${total})...`, 'info');
        });
        if (enriched) {
          setCurrentActiveHotel(enriched);
          if (onSetActiveHotel) onSetActiveHotel(enriched);
          showToast(`"${saved.name}" ready with real nearby places!`, 'success');
        }
      } catch (e) {
        console.warn('Nearby scan error:', e);
      } finally {
        setIsFetchingDetails(false);
      }
    }
  };

  const handleSaveHotelConfig = async (andLaunchGuest = false) => {
    if (!hotelConfigForm.name.trim()) {
      showToast('Hotel Name is required!', 'error');
      return;
    }

    const latVal = parseFloat(hotelConfigForm.latitude);
    const lngVal = parseFloat(hotelConfigForm.longitude);

    const finalImageUrls = hotelImages.length > 0
      ? hotelImages.map((img) => (typeof img === 'object' && img && img.url ? img.url : img))
      : (hotelConfigForm.imageLink.trim() ? [hotelConfigForm.imageLink.trim()] : []);

    const heroImageUrl = finalImageUrls[0] || hotelConfigForm.imageLink.trim() || '';

    const cur = activeHotelService.getActiveHotel() || {};

    const hotelPayload = {
      ...cur,
      name: hotelConfigForm.name.trim(),
      title: hotelConfigForm.name.trim(),
      city: hotelConfigForm.city.trim(),
      location: hotelConfigForm.city.trim(),
      address: hotelConfigForm.address.trim(),
      latitude: !isNaN(latVal) ? latVal : null,
      longitude: !isNaN(lngVal) ? lngVal : null,
      imageLink: heroImageUrl,
      images: finalImageUrls,
      imageObjects: hotelImages,
      imageCaptions: hotelImages.map((img) => (img && img.caption) || 'Property Photo'),
      subtitle: hotelConfigForm.subtitle.trim() || hotelConfigForm.address.trim() || '',
      pricePerNight: hotelConfigForm.pricePerNight.trim() || '',
      rating: parseFloat(hotelConfigForm.rating) || null,
      nearby: cur.nearby || undefined,
      status: cur.status || 'pending',
    };

    let saved = activeHotelService.saveAndActivateHotel(hotelPayload);

    // Save directly to MongoDB backend via apiService
    try {
      const propId = saved.hotelPropertyId || saved.id || cur.hotelPropertyId || cur.id;
      let apiRes = null;
      if (propId && !String(propId).startsWith('hotel-')) {
        apiRes = await apiService.updateHotel(propId, saved);
      } else {
        apiRes = await apiService.createHotel(saved);
      }
      if (apiRes && apiRes.data) {
        saved = { ...saved, ...apiRes.data };
      }
    } catch (e) {
      console.warn('[AdminDashboard] MongoDB saveHotel warning:', e.message);
    }

    setCurrentActiveHotel(saved);
    if (onSetActiveHotel) onSetActiveHotel(saved);

    showToast('Your hotel has been submitted for approval. Please wait for Super Admin approval.', 'info');

    // Trigger nearby scan ONLY if coordinates valid AND no places exist yet
    const hasAnyPlaces = Object.values(saved.nearby || {}).some((arr) => Array.isArray(arr) && arr.length > 0);
    if (!hasAnyPlaces && saved.latitude != null && saved.longitude != null) {
      activeHotelService.populateAllNearby(saved, 5000, (label, curr, total) => {
        showToast(`Scanning nearby ${label} (${curr}/${total})...`, 'info');
      }).then((enriched) => {
        if (enriched) {
          setCurrentActiveHotel(enriched);
          if (onSetActiveHotel) onSetActiveHotel(enriched);
        }
      }).catch(console.warn);
    }

    if (andLaunchGuest) {
      if (saved.status === 'approved') {
        if (onLaunchGuestWebsite) {
          onLaunchGuestWebsite(saved);
        } else if (onBackToGuestPortal) {
          onBackToGuestPortal();
        }
      } else {
        showToast('Hotel is pending Super Admin approval. It cannot be launched for guests until approved.', 'info');
      }
    }
  };

  const handleClearActiveHotel = () => {
    activeHotelService.setActiveHotel(null);
    setCurrentActiveHotel(null);
    setHotelImages([]);
    setHotelConfigForm({
      name: '',
      city: '',
      address: '',
      latitude: '',
      longitude: '',
      imageLink: '',
      subtitle: '',
      pricePerNight: '₹18,500 / night',
      rating: '4.9',
    });
    if (onSetActiveHotel) onSetActiveHotel(null);
    showToast('Active Hotel cleared. Guest portal will now display unconfigured state.', 'info');
  };

  // Places and Categories Operations
  const handleClearAllPlaces = () => {
    const updated = activeHotelService.clearAllNearbyPlaces();
    if (updated) {
      setCurrentActiveHotel(updated);
      if (onSetActiveHotel) onSetActiveHotel(updated);
      showToast('All nearby places cleared.', 'info');
    }
  };

  const handlePopulatePresetPlaces = () => {
    setIsLoading(true);
    try {
      const updated = activeHotelService.populatePresetPlaces(currentActiveHotel);
      if (updated) {
        setCurrentActiveHotel(updated);
        if (onSetActiveHotel) onSetActiveHotel(updated);
        showToast(`Populated verified places for ${updated.name || 'hotel'}!`, 'success');
      } else {
        showToast('Unable to populate places. Please configure hotel first.', 'error');
      }
    } catch (e) {
      showToast('Error populating places: ' + e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddPlaceModal = (categoryKey = 'touristPlaces') => {
    setSelectedPlaceCategory(categoryKey);
    setEditingPlaceId(null);
    const baseLat = currentActiveHotel && currentActiveHotel.latitude ? Number(currentActiveHotel.latitude) : 12.9716;
    const baseLng = currentActiveHotel && currentActiveHotel.longitude ? Number(currentActiveHotel.longitude) : 77.5946;
    const offset = (Math.random() - 0.5) * 0.03;

    setNewPlaceForm({
      title: '',
      subtitle: '',
      category: categoryKey,
      latitude: (baseLat + offset).toFixed(4),
      longitude: (baseLng + offset).toFixed(4),
      address: currentActiveHotel && currentActiveHotel.city ? `${currentActiveHotel.city} Area` : 'Local Area',
      distance: '1.2 km from Hotel',
      rating: '4.8',
      imageLink: '',
      websiteUrl: '',
      timings: '9:00 AM - 6:00 PM',
 data1: '★ 4.8 Rating',
      data2: '1.2 km from Hotel',
      data3: 'Concierge Partner',
      data4: 'Open Today',
      data5: 'Priority Access',
    });
    setPlaceModalVisible(true);
  };

  const handleOpenEditPlaceModal = (categoryKey, place) => {
    if (!place) return;
    const cat = place.category || categoryKey || selectedPlaceCategory || 'touristPlaces';
    setSelectedPlaceCategory(cat);
    setEditingPlaceId(place.id || null);
    setNewPlaceForm({
      title: place.title || place.name || '',
      subtitle: place.subtitle || place.description || '',
      category: cat,
      latitude: place.latitude != null ? String(place.latitude) : (place.lat != null ? String(place.lat) : ''),
      longitude: place.longitude != null ? String(place.longitude) : (place.lng != null ? String(place.lng) : ''),
      address: place.address || place.location || '',
      distance: place.distance || place.hotelDistance || '',
      rating: place.rating != null ? String(place.rating) : '4.8',
      imageLink: place.imageLink || place.image || place.img || '',
      websiteUrl: place.websiteUrl || place.link || '',
      timings: place.timings || place.hours || place.timing || '',
 data1: place.data1 || (place.rating ? `★ ${place.rating} Rating` : 'Top Rated'),
      data2: place.data2 || place.distance || '1.0 km from Hotel',
      data3: place.data3 || place.specialty || place.amenity || 'Concierge Partner',
      data4: place.data4 || place.hours || place.timings || 'Open Today',
      data5: place.data5 || place.offer || 'Priority Access',
    });
    setPlaceModalVisible(true);
  };

  const handleSaveNewPlace = async () => {
    if (!newPlaceForm.title.trim()) {
      showToast('Place Title / Name is required!', 'error');
      return;
    }

    const targetCat = newPlaceForm.category || selectedPlaceCategory || 'touristPlaces';

    const placeData = {
      title: newPlaceForm.title.trim(),
      subtitle: newPlaceForm.subtitle.trim() || 'Curated Destination',
      category: targetCat,
      tag: targetCat.toUpperCase(),
      latitude: parseFloat(newPlaceForm.latitude) || null,
      longitude: parseFloat(newPlaceForm.longitude) || null,
      address: newPlaceForm.address.trim(),
      location: newPlaceForm.address.trim() || newPlaceForm.distance.trim(),
      distance: newPlaceForm.distance.trim() || '1.0 km',
      hotelDistance: newPlaceForm.distance.trim() || '1.0 km',
      rating: parseFloat(newPlaceForm.rating) || 4.8,
      likes: 1250,
      imageLink: newPlaceForm.imageLink.trim() || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
      websiteUrl: newPlaceForm.websiteUrl.trim(),
      link: newPlaceForm.websiteUrl.trim(),
      timings: newPlaceForm.timings.trim() || 'Open Daily',
      hours: newPlaceForm.timings.trim() || 'Open Daily',
      data1: newPlaceForm.data1.trim(),
      data2: newPlaceForm.data2.trim(),
      data3: newPlaceForm.data3.trim(),
      data4: newPlaceForm.data4.trim(),
      data5: newPlaceForm.data5.trim(),
    };

    setIsLoading(true);
    try {
      if (editingPlaceId) {
        try {
          await apiService.updateDisplayComponent(editingPlaceId, placeData);
        } catch (e) {
          console.warn('[AdminDashboard] updateDisplayComponent failed:', e.message);
        }
        const updated = activeHotelService.updatePlaceInActiveHotel(targetCat, editingPlaceId, placeData);
        if (updated) {
          setCurrentActiveHotel(updated);
          if (onSetActiveHotel) onSetActiveHotel(updated);
        }
        setSelectedPlaceCategory(targetCat);
        setPlaceModalVisible(false);
        setEditingPlaceId(null);
        showToast(`Updated "${placeData.title}" in ${targetCat}!`, 'success');
      } else {
        let savedDoc = null;
        try {
          const propId = currentActiveHotel?.hotelPropertyId || currentActiveHotel?.id || '1000000001';
          const res = await apiService.createDisplayComponent({
            ...placeData,
            hotelPropertyId: propId,
          });
          if (res && res.success && res.data) {
            savedDoc = res.data;
          }
        } catch (e) {
          console.warn('[AdminDashboard] createDisplayComponent failed:', e.message);
        }
        const itemToSave = savedDoc ? { ...placeData, id: savedDoc.id, _id: savedDoc.id } : placeData;
        const updated = activeHotelService.addPlaceToActiveHotel(targetCat, itemToSave);
        if (updated) {
          setCurrentActiveHotel(updated);
          if (onSetActiveHotel) onSetActiveHotel(updated);
        }
        setSelectedPlaceCategory(targetCat);
        setPlaceModalVisible(false);
        showToast(`Saved & Created "${placeData.title}" in ${targetCat}!`, 'success');
      }
      await apiService.fetchDatabaseStatus().then((s) => { if (s && s.database) setConnectedDbName(s.database); }).catch(() => {});
    loadAllAdminData();
    } catch (err) {
      showToast('Error saving place: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlace = async (categoryKey, placeId, placeTitle) => {
    try {
      await apiService.deleteDisplayComponent(placeId);
    } catch (e) {
      console.warn('[AdminDashboard] deleteDisplayComponent failed:', e.message);
    }
    const updated = activeHotelService.deletePlaceFromActiveHotel(categoryKey, placeId);
    if (updated) {
      setCurrentActiveHotel(updated);
      if (onSetActiveHotel) onSetActiveHotel(updated);
      showToast(`Removed "${placeTitle || 'Place'}" from ${categoryKey}.`, 'info');
    }
    loadAllAdminData();
  };

  const handleCreateCustomCategory = () => {
    if (!customCatKey.trim() || !customCatName.trim()) {
      showToast('Category Key and Display Name are required!', 'error');
      return;
    }
    const cleanKey = customCatKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const updated = activeHotelService.addCustomCategory(cleanKey, customCatName.trim(), customCatIcon || 'sparkles');
    if (updated) {
      setCurrentActiveHotel(updated);
      if (onSetActiveHotel) onSetActiveHotel(updated);
      setSelectedPlaceCategory(cleanKey);
      setCustomCatModalVisible(false);
      setCustomCatKey('');
      setCustomCatName('');
      showToast(`Created custom category "${customCatName.trim()}"!`, 'success');
    }
  };

  const handleDeleteCustomCategory = (catKey, catName) => {
    const updated = activeHotelService.deleteCustomCategory(catKey);
    if (updated) {
      setCurrentActiveHotel(updated);
      if (onSetActiveHotel) onSetActiveHotel(updated);
      if (selectedPlaceCategory === catKey) {
        setSelectedPlaceCategory('touristPlaces');
      }
      showToast(`Removed category "${catName || catKey}".`, 'info');
    }
  };

  // Data Collections — start empty, loaded from API
  const [hotels, setHotels] = useState([]);
  const [hotelsDirectorySearch, setHotelsDirectorySearch] = useState('');
  const [hotelStatusFilter, setHotelStatusFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'rejected'
  const [componentSearchQuery, setComponentSearchQuery] = useState('');
  const [componentAvailabilityFilter, setComponentAvailabilityFilter] = useState('all'); // 'all' | 'available' | 'unavailable'
  const [recentActivity, setRecentActivity] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [pools, setPools] = useState([]);
  const [takeaway, setTakeaway] = useState([]);
  const [homeDelivery, setHomeDelivery] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(null);

  const logActivity = (description, type = 'info') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRecentActivity((prev) => [
      { id: Date.now() + Math.random(), time: timeStr, description, type },
      ...prev.slice(0, 19),
    ]);
  };

  // Hotel Payment Methods Editor State
  const [selectedHotelForPayments, setSelectedHotelForPayments] = useState(null);
  const [hotelPaymentMethods, setHotelPaymentMethods] = useState([]);
  const [customPaymentInput, setCustomPaymentInput] = useState('');

  const allDisplayPaymentMethods = useMemo(() => {
    const standardNames = ENRICHED_PAYMENT_OPTIONS.map((o) => o.name.toLowerCase());
    const customList = hotelPaymentMethods
      .filter(
        (m) =>
          !standardNames.some(
            (sn) => sn.includes(m.toLowerCase()) || m.toLowerCase().includes(sn)
          )
      )
      .map((cm, idx) => ({
        id: `custom-${idx}`,
        name: cm,
        shortName: cm,
 icon: '✦',
        desc: 'Custom hotel-specific payment arrangement configured for this property',
        tag: 'Custom Method',
        isCustom: true,
      }));
    return [...ENRICHED_PAYMENT_OPTIONS, ...customList];
  }, [hotelPaymentMethods]);

  const isPaymentMethodChecked = (methodName) => {
    return hotelPaymentMethods.some(
      (m) =>
        m.toLowerCase().includes(methodName.toLowerCase()) ||
        methodName.toLowerCase().includes(m.toLowerCase())
    );
  };

  // General Create / Edit CRUD Modal State
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [modalCategory, setModalCategory] = useState('hotels'); // 'hotels' | 'restaurants' | 'gyms' | 'takeaway' | 'delivery'
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [formFields, setFormFields] = useState({
    title: '',
    subtitle: '',
    location: '',
    distance: '',
    price: '',
    rating: '4.8',
    imageLink: '',
    availability: 'Available',
    cuisine: '',
    timings: '',
    takeawayEnabled: true,
    homeDeliveryEnabled: true,
    timeEstimate: '',
    paymentMethods: ['UPI', 'Credit Card', 'Cash'],
  });

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const unsubscribe = activeHotelService.subscribe((updatedHotel) => {
      if (updatedHotel) {
        setCurrentActiveHotel(updatedHotel);
      }
    });
    loadAllAdminData();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const loadAllAdminData = async (targetHotelId = null) => {
    setIsLoading(true);
    try {
      const activeId = targetHotelId || currentActiveHotel?.hotelPropertyId || currentActiveHotel?.id;

      // 1. Summary
      const sumRes = await apiService.fetchSummary();
      if (sumRes && sumRes.data) {
        setSummary(sumRes.data);
      }

      // 2. Hotels
      const hRes = await apiService.fetchHotels();
      if (hRes && Array.isArray(hRes.data)) {
        setHotels(hRes.data);
        const cur = hRes.data.find((h) => h.id === selectedHotelForPayments?.id) || hRes.data[0];
        if (cur) {
          setSelectedHotelForPayments(cur);
          setHotelPaymentMethods(cur.paymentMethods || []);
        }
      }

      // 3. Restaurants
      const rRes = await apiService.fetchRestaurants(activeId);
      if (rRes && Array.isArray(rRes.data)) {
        setRestaurants(rRes.data);
      }

      // 4. Gyms
      const gRes = await apiService.fetchGyms(activeId);
      if (gRes && Array.isArray(gRes.data)) {
        setGyms(gRes.data);
      }

      // 4b. Swimming Pools
      const pRes = await apiService.fetchSwimmingPools(activeId);
      if (pRes && Array.isArray(pRes.data)) {
        setPools(pRes.data);
      }

      // 5. Takeaway
      const tRes = await apiService.fetchTakeaway(activeId);
      if (tRes && Array.isArray(tRes.data)) {
        setTakeaway(tRes.data);
      }

      // 6. Home Delivery
      const dRes = await apiService.fetchHomeDelivery(activeId);
      if (dRes && Array.isArray(dRes.data)) {
        setHomeDelivery(dRes.data);
      }

      // 6b. Hotel Facilities & Services
      const fRes = await apiService.fetchFacilities(activeId);
      if (fRes && Array.isArray(fRes.data)) {
        setFacilities(fRes.data);
      }

      // 7. Bookings
      const bRes = await apiService.fetchBookings();
      if (bRes && bRes.data) {
        setBookings(bRes.data);
      }
    } catch (err) {
      console.warn('[AdminDashboard] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Availability Toggler
  const handleToggleAvailability = async (categoryType, item) => {
    const nextAvail = item.availability === 'Available' || !item.availability ? 'Not Available' : 'Available';
    try {
      await apiService.toggleAvailability(categoryType, item.id, nextAvail);
      showToast(`Updated ${item.title || item.name} to "${nextAvail}"`);

      // Update local state immediately
      const updater = (list) =>
        list.map((it) => (it.id === item.id ? { ...it, availability: nextAvail } : it));

      if (categoryType === 'hotels') setHotels(updater);
      else if (categoryType === 'restaurants') setRestaurants(updater);
      else if (categoryType === 'gyms') setGyms(updater);
      else if (categoryType === 'takeaway') setTakeaway(updater);
      else if (categoryType === 'home_delivery') setHomeDelivery(updater);
    } catch (err) {
      showToast('Failed to update availability', 'error');
    }
  };

  // ===========================================================================
  // CRUD OPERATIONS: CREATE & EDIT MODAL HANDLERS
  // ===========================================================================
  const handleOpenCreateModal = (category) => {
    setModalCategory(category);
    setModalMode('create');
    setEditingItem(null);
    setFormFields({
      title: '',
      subtitle: '',
      location: currentActiveHotel?.city || '',
      distance: '0.8 km from Hotel',
      price:
        category === 'hotels'
          ? '₹8,500 / night'
          : category === 'restaurants'
          ? '₹₹₹₹'
          : category === 'gyms'
          ? '₹1,500 / day pass'
          : (category === 'pools' || category === 'swimming_pools')
          ? 'Resident Access Available'
          : category === 'facilities'
          ? 'Complimentary'
          : category === 'takeaway'
          ? 'Min ₹400'
          : 'Free Suite Delivery',
      rating: '4.8',
      imageLink:
        category === 'hotels'
          ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80'
          : category === 'restaurants'
          ? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
          : category === 'gyms'
          ? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'
          : (category === 'pools' || category === 'swimming_pools')
          ? 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&q=80'
          : category === 'facilities'
          ? 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80'
          : category === 'takeaway'
          ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'
          : 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80',
      availability: 'Available',
      cuisine: 'Continental & Indian Fusion',
      timings: '6:00 AM - 10:00 PM Daily',
      takeawayEnabled: true,
      homeDeliveryEnabled: true,
      timeEstimate: '15 mins ready',
      paymentMethods: ['UPI', 'Credit Card', 'Cash'],
    });
    setItemModalVisible(true);
  };

  const handleOpenEditModal = (category, item) => {
    setModalCategory(category);
    setModalMode('edit');
    setEditingItem(item);
    setFormFields({
      title: item.title || item.name || '',
      subtitle: item.subtitle || item.shortDescription || '',
      location: item.location || '',
      distance: item.distance || '',
      price:
        item.pricePerNight ||
        item.priceRange ||
        item.passPrice ||
        item.minOrder ||
        item.deliveryFee ||
        '',
      rating: String(item.rating || '4.8'),
      imageLink: item.imageLink || '',
      availability: item.availability || 'Available',
      cuisine: item.cuisine || '',
      timings: item.timings || item.timing || '',
      takeawayEnabled: Boolean(item.takeaway),
      homeDeliveryEnabled: Boolean(item.homeDelivery),
      timeEstimate: item.takeawayTime || item.deliveryTime || '',
      paymentMethods: Array.isArray(item.paymentMethods)
        ? item.paymentMethods
        : ['UPI', 'Credit Card', 'Cash'],
    });
    setItemModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!formFields.title.trim()) {
      showToast('Title / Name is required', 'error');
      return;
    }
    setIsLoading(true);
    try {
      if (modalCategory === 'hotels') {
        const payload = {
          title: formFields.title,
          subtitle: formFields.subtitle,
          location: formFields.location,
          distance: formFields.distance,
          pricePerNight: formFields.price || '₹24,500 / night',
          rating: parseFloat(formFields.rating) || 4.8,
          imageLink: formFields.imageLink,
          availability: formFields.availability,
          paymentMethods: formFields.paymentMethods,
        };
        if (modalMode === 'create') {
          const res = await apiService.createHotel(payload);
          const newItem = (res && res.data) ? res.data : { ...payload, id: `hotel-${Date.now()}` };
          setHotels((prev) => [newItem, ...prev]);
          const activated = activeHotelService.saveAndActivateHotel(newItem);
          setCurrentActiveHotel(activated);
          if (onSetActiveHotel) onSetActiveHotel(activated);
          showToast(`Created & Activated hotel "${formFields.title}"!`);
        } else if (editingItem) {
          const res = await apiService.updateHotel(editingItem.id, payload);
          const updatedItem = (res && res.data) ? res.data : { ...editingItem, ...payload };
          setHotels((prev) =>
            prev.map((h) => (h.id === editingItem.id ? { ...h, ...payload } : h))
          );
          if (currentActiveHotel?.id === editingItem.id) {
            const saved = activeHotelService.saveAndActivateHotel({ ...currentActiveHotel, ...payload });
            setCurrentActiveHotel(saved);
            if (onSetActiveHotel) onSetActiveHotel(saved);
          }
          showToast(`Updated hotel "${formFields.title}"!`);
        }
      } else if (modalCategory === 'restaurants') {
        const payload = {
          title: formFields.title,
          subtitle: formFields.subtitle,
          cuisine: formFields.cuisine || 'Continental',
          location: formFields.location,
          address: formFields.location,
          distance: formFields.distance,
          hotelDistance: formFields.distance,
          priceRange: formFields.price || '₹₹₹₹',
          price: formFields.price || '₹₹₹₹',
          rating: parseFloat(formFields.rating) || 4.8,
          imageLink: formFields.imageLink,
          availability: formFields.availability,
          takeaway: formFields.takeawayEnabled,
          homeDelivery: formFields.homeDeliveryEnabled,
          timings: formFields.timings || '12:00 PM - 11:30 PM',
          hotelPropertyId: currentActiveHotel?.hotelPropertyId || currentActiveHotel?.id || '1000000001',
        };
        if (modalMode === 'create') {
          const res = await apiService.createRestaurant(payload);
          const itemToSave = (res && res.data) ? res.data : { ...payload, id: `rest-${Date.now()}` };
          setRestaurants((prev) => [itemToSave, ...prev]);
          const updatedHotel = activeHotelService.addPlaceToActiveHotel('restaurants', itemToSave);
          activeHotelService.addPlaceToActiveHotel('dining', itemToSave);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Created restaurant "${formFields.title}"!`);
        } else if (editingItem) {
          await apiService.updateRestaurant(editingItem.id, payload);
          setRestaurants((prev) =>
            prev.map((r) => (r.id === editingItem.id ? { ...r, ...payload } : r))
          );
          const updatedHotel = activeHotelService.updatePlaceInActiveHotel('restaurants', editingItem.id, payload);
          activeHotelService.updatePlaceInActiveHotel('dining', editingItem.id, payload);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Updated restaurant "${formFields.title}"!`);
        }
      } else if (modalCategory === 'gyms') {
        const payload = {
          title: formFields.title,
          subtitle: formFields.subtitle,
          location: formFields.location,
          address: formFields.location,
          distance: formFields.distance,
          hotelDistance: formFields.distance,
          passPrice: formFields.price || '₹1,500 / day pass',
          price: formFields.price || '₹1,500 / day pass',
          rating: parseFloat(formFields.rating) || 4.8,
          imageLink: formFields.imageLink,
          availability: formFields.availability,
          timings: formFields.timings || '6:00 AM - 10:00 PM Daily',
          hotelPropertyId: currentActiveHotel?.hotelPropertyId || currentActiveHotel?.id || '1000000001',
        };
        if (modalMode === 'create') {
          const res = await apiService.createGym(payload);
          const itemToSave = (res && res.data) ? res.data : { ...payload, id: `gym-${Date.now()}` };
          setGyms((prev) => [itemToSave, ...prev]);
          const updatedHotel = activeHotelService.addPlaceToActiveHotel('gyms', itemToSave);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Created gym "${formFields.title}"!`);
        } else if (editingItem) {
          await apiService.updateGym(editingItem.id, payload);
          setGyms((prev) =>
            prev.map((g) => (g.id === editingItem.id ? { ...g, ...payload } : g))
          );
          const updatedHotel = activeHotelService.updatePlaceInActiveHotel('gyms', editingItem.id, payload);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Updated gym "${formFields.title}"!`);
        }
      } else if (modalCategory === 'pools' || modalCategory === 'swimming_pools') {
        const payload = {
          title: formFields.title,
          subtitle: formFields.subtitle,
          location: formFields.location,
          address: formFields.location,
          distance: formFields.distance,
          hotelDistance: formFields.distance,
          price: formFields.price || 'Complimentary for Resident Guests',
          rating: parseFloat(formFields.rating) || 4.9,
          imageLink: formFields.imageLink,
          availability: formFields.availability,
          timings: formFields.timings || '6:00 AM - 9:00 PM Daily',
          category: 'pools',
          hotelPropertyId: currentActiveHotel?.hotelPropertyId || currentActiveHotel?.id || '1000000001',
        };
        if (modalMode === 'create') {
          const res = await apiService.createSwimmingPool(payload);
          const itemToSave = (res && res.data) ? res.data : { ...payload, id: `pool-${Date.now()}` };
          setPools((prev) => [itemToSave, ...prev]);
          const updatedHotel = activeHotelService.addPlaceToActiveHotel('pools', itemToSave);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Created swimming pool "${formFields.title}"!`);
        } else if (editingItem) {
          await apiService.updateSwimmingPool(editingItem.id, payload);
          setPools((prev) =>
            prev.map((p) => (p.id === editingItem.id ? { ...p, ...payload } : p))
          );
          const updatedHotel = activeHotelService.updatePlaceInActiveHotel('pools', editingItem.id, payload);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Updated swimming pool "${formFields.title}"!`);
        }
      } else if (modalCategory === 'takeaway') {
        const payload = {
          title: formFields.title,
          subtitle: formFields.subtitle,
          location: formFields.location,
          address: formFields.location,
          distance: formFields.distance,
          hotelDistance: formFields.distance,
          minOrder: formFields.price || 'Min ₹400',
          price: formFields.price || 'Min ₹400',
          rating: parseFloat(formFields.rating) || 4.8,
          imageLink: formFields.imageLink,
          availability: formFields.availability,
          takeawayTime: formFields.timeEstimate || '15 mins ready',
          timings: formFields.timeEstimate || '15 mins ready',
          hotelPropertyId: currentActiveHotel?.hotelPropertyId || currentActiveHotel?.id || '1000000001',
        };
        if (modalMode === 'create') {
          const res = await apiService.createTakeaway(payload);
          const itemToSave = (res && res.data) ? res.data : { ...payload, id: `takeaway-${Date.now()}` };
          setTakeaway((prev) => [itemToSave, ...prev]);
          const updatedHotel = activeHotelService.addPlaceToActiveHotel('takeaways', itemToSave);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Created takeaway "${formFields.title}"!`);
        } else if (editingItem) {
          await apiService.updateTakeaway(editingItem.id, payload);
          setTakeaway((prev) =>
            prev.map((t) => (t.id === editingItem.id ? { ...t, ...payload } : t))
          );
          const updatedHotel = activeHotelService.updatePlaceInActiveHotel('takeaways', editingItem.id, payload);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Updated takeaway "${formFields.title}"!`);
        }
      } else if (modalCategory === 'delivery') {
        const payload = {
          title: formFields.title,
          subtitle: formFields.subtitle,
          location: formFields.location,
          address: formFields.location,
          radius: formFields.distance || '5 km',
          distance: formFields.distance || '5 km',
          deliveryFee: formFields.price || 'Free Suite Delivery',
          price: formFields.price || 'Free Suite Delivery',
          rating: parseFloat(formFields.rating) || 4.8,
          imageLink: formFields.imageLink,
          availability: formFields.availability,
          deliveryTime: formFields.timeEstimate || '25-30 mins',
          timings: formFields.timeEstimate || '25-30 mins',
          hotelPropertyId: currentActiveHotel?.hotelPropertyId || currentActiveHotel?.id || '1000000001',
        };
        if (modalMode === 'create') {
          const res = await apiService.createHomeDelivery(payload);
          const itemToSave = (res && res.data) ? res.data : { ...payload, id: `delivery-${Date.now()}` };
          setHomeDelivery((prev) => [itemToSave, ...prev]);
          const updatedHotel = activeHotelService.addPlaceToActiveHotel('homeDelivery', itemToSave);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Created delivery service "${formFields.title}"!`);
        } else if (editingItem) {
          await apiService.updateHomeDelivery(editingItem.id, payload);
          setHomeDelivery((prev) =>
            prev.map((d) => (d.id === editingItem.id ? { ...d, ...payload } : d))
          );
          const updatedHotel = activeHotelService.updatePlaceInActiveHotel('homeDelivery', editingItem.id, payload);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Updated delivery partner "${formFields.title}"!`);
        }
      } else if (modalCategory === 'facilities') {
        const payload = {
          title: formFields.title,
          subtitle: formFields.subtitle,
          location: formFields.location,
          address: formFields.location,
          distance: formFields.distance || 'On-Property',
          hotelDistance: formFields.distance || 'On-Property',
          price: formFields.price || 'Complimentary',
          rating: parseFloat(formFields.rating) || 4.9,
          imageLink: formFields.imageLink,
          availability: formFields.availability,
          timings: formFields.timings || '24/7 Service',
          category: 'facilities',
          hotelPropertyId: currentActiveHotel?.hotelPropertyId || currentActiveHotel?.id || '1000000001',
        };
        if (modalMode === 'create') {
          const res = await apiService.createFacility(payload);
          const itemToSave = (res && res.data) ? res.data : { ...payload, id: `fac-${Date.now()}` };
          setFacilities((prev) => [itemToSave, ...prev]);
          const updatedHotel = activeHotelService.addPlaceToActiveHotel('facilities', itemToSave);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Created facility "${formFields.title}"!`);
        } else if (editingItem) {
          await apiService.updateFacility(editingItem.id, payload);
          setFacilities((prev) =>
            prev.map((f) => (f.id === editingItem.id ? { ...f, ...payload } : f))
          );
          const updatedHotel = activeHotelService.updatePlaceInActiveHotel('facilities', editingItem.id, payload);
          if (updatedHotel) {
            setCurrentActiveHotel(updatedHotel);
            if (onSetActiveHotel) onSetActiveHotel(updatedHotel);
          }
          showToast(`Updated facility "${formFields.title}"!`);
        }
      }
      setItemModalVisible(false);
      loadAllAdminData();
    } catch (err) {
      showToast('Error saving item: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (category, item) => {
    const itemName = item.title || item.name || 'this item';
    if (Platform.OS === 'web') {
      if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
        return;
      }
    }
    setIsLoading(true);
    try {
      if (category === 'hotels') {
        await apiService.deleteHotel(item.id);
        setHotels((prev) => prev.filter((h) => h.id !== item.id));
      } else if (category === 'restaurants') {
        await apiService.deleteRestaurant(item.id);
        setRestaurants((prev) => prev.filter((r) => r.id !== item.id));
        activeHotelService.deletePlaceFromActiveHotel('restaurants', item.id);
        activeHotelService.deletePlaceFromActiveHotel('dining', item.id);
      } else if (category === 'gyms') {
        await apiService.deleteGym(item.id);
        setGyms((prev) => prev.filter((g) => g.id !== item.id));
        activeHotelService.deletePlaceFromActiveHotel('gyms', item.id);
      } else if (category === 'pools' || category === 'swimming_pools') {
        await apiService.deleteSwimmingPool(item.id);
        setPools((prev) => prev.filter((p) => p.id !== item.id));
        activeHotelService.deletePlaceFromActiveHotel('pools', item.id);
      } else if (category === 'takeaway') {
        await apiService.deleteTakeaway(item.id);
        setTakeaway((prev) => prev.filter((t) => t.id !== item.id));
        activeHotelService.deletePlaceFromActiveHotel('takeaways', item.id);
      } else if (category === 'delivery') {
        await apiService.deleteHomeDelivery(item.id);
        setHomeDelivery((prev) => prev.filter((d) => d.id !== item.id));
        activeHotelService.deletePlaceFromActiveHotel('homeDelivery', item.id);
      } else if (category === 'facilities') {
        await apiService.deleteFacility(item.id);
        setFacilities((prev) => prev.filter((f) => f.id !== item.id));
        activeHotelService.deletePlaceFromActiveHotel('facilities', item.id);
      }
      const cur = activeHotelService.getActiveHotel();
      if (cur) {
        setCurrentActiveHotel(cur);
        if (onSetActiveHotel) onSetActiveHotel(cur);
      }
      showToast(`Deleted "${itemName}" successfully!`);
      loadAllAdminData();
    } catch (err) {
      showToast('Failed to delete: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Booking
  const handleDeleteBooking = async (booking) => {
    const bId = booking.id || booking._id;
    if (Platform.OS === 'web') {
      if (!window.confirm(`Cancel reservation for guest "${booking.guestName}"?`)) return;
    }
    try {
      await apiService.deleteBooking(bId);
      setBookings((prev) => prev.filter((b) => (b.id || b._id) !== bId));
      showToast('Reservation cancelled and deleted from MongoDB');
    } catch (err) {
      showToast('Failed to cancel booking', 'error');
    }
  };

  // Hotel Payment Methods Editor Handlers
  const handleSelectHotelForPayments = (hotel) => {
    setSelectedHotelForPayments(hotel);
    setHotelPaymentMethods(hotel.paymentMethods || []);
  };

  const handleTogglePaymentMethod = (method) => {
    setHotelPaymentMethods((prev) => {
      const exists = prev.some(
        (m) =>
          m.toLowerCase().includes(method.toLowerCase()) ||
          method.toLowerCase().includes(m.toLowerCase())
      );
      if (exists) {
        return prev.filter(
          (m) =>
            !m.toLowerCase().includes(method.toLowerCase()) &&
            !method.toLowerCase().includes(m.toLowerCase())
        );
      } else {
        return [...prev, method];
      }
    });
  };

  const handleAddCustomPayment = () => {
    if (!customPaymentInput.trim()) return;
    if (!hotelPaymentMethods.includes(customPaymentInput.trim())) {
      setHotelPaymentMethods([...hotelPaymentMethods, customPaymentInput.trim()]);
      setCustomPaymentInput('');
    }
  };

  const handleSaveHotelPaymentMethods = async () => {
    if (!selectedHotelForPayments) return;
    setIsLoading(true);
    try {
      const res = await apiService.updateHotelPaymentMethods(
        selectedHotelForPayments.id,
        hotelPaymentMethods
      );
      if (res && res.success) {
        showToast(`Saved payment methods for ${selectedHotelForPayments.title}!`);
        // Update local hotels state
        setHotels((prev) =>
          prev.map((h) =>
            h.id === selectedHotelForPayments.id
              ? { ...h, paymentMethods: hotelPaymentMethods }
              : h
          )
        );
      } else {
        showToast('Payment methods saved to local cache');
      }
    } catch (err) {
      showToast('Error saving payment methods', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle hotel payment status (Paid / Not Made)
  const handleToggleHotelPayment = async (hotel) => {
    const currentStatus = hotel.paymentStatus || 'Paid';
    const newStatus = currentStatus === 'Paid' ? 'Not Made' : 'Paid';
    const updatedHotel = {
      ...hotel,
      paymentStatus: newStatus,
      paymentDate: newStatus === 'Paid' ? new Date().toISOString() : null,
    };

    // Optimistically update local state
    setHotels((prev) =>
      prev.map((h) => (h.id === hotel.id ? updatedHotel : h))
    );

    try {
      if (apiService.isOnline) {
        await apiService.updateHotel(hotel.id, updatedHotel);
        showToast(`Payment for ${hotel.title || hotel.name}: marked as ${newStatus}`);
      } else {
        showToast(`Payment status updated to ${newStatus} (local)`);
      }
    } catch (err) {
      console.error('Failed to update hotel payment status:', err);
      showToast('Failed to update payment status', 'error');
      // Revert on error
      setHotels((prev) =>
        prev.map((h) => (h.id === hotel.id ? hotel : h))
      );
    }
  };

  // Reset all to defaults
  const handleResetAllData = async () => {
    if (Platform.OS === 'web') {
      if (
        !window.confirm(
          'Are you sure you want to reset all hotels, restaurants, gyms, and dummy data to factory seeds?'
        )
      ) {
        return;
      }
    }
    setIsLoading(true);
    try {
      await apiService.resetAllData();
      showToast('Database reset to factory seeds successfully!');
      await loadAllAdminData();
    } catch (err) {
      showToast('Reset failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ===========================================================================
  // RENDER TAB: HOTEL & DYNAMIC LOCATION CONFIGURATOR
  // ===========================================================================
  const renderHotelConfigTab = () => (
    <View style={styles.tabContentContainer}>
      {/* Header Banner */}
      <View style={styles.overviewHero}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LucideIcon name="hotel" size={20} color="#C5A46D" />
            <Text style={styles.overviewGreeting}>HOTEL & LOCATION CONFIGURATOR</Text>
          </View>
          <Text style={styles.overviewSub}>
            Configure hotel property details & exact GPS coordinates. This active hotel serves as the single source of truth and origin for all guest portal views & turn-by-turn driving directions.
          </Text>
        </View>
        {currentActiveHotel && (
          <TouchableOpacity
            style={styles.activeGuestLaunchBtn}
            onPress={() => {
              if (onLaunchGuestWebsite) {
                onLaunchGuestWebsite(currentActiveHotel);
              } else if (onBackToGuestPortal) {
                onBackToGuestPortal();
              }
            }}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LucideIcon name="external-link" size={14} color="#101114" />
              <Text style={styles.activeGuestLaunchText}>
                Launch Guest Website ({currentActiveHotel.name})
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Hotel Status Box */}
      <View style={[styles.activeStatusCard, currentActiveHotel ? styles.activeStatusCardActive : styles.activeStatusCardEmpty]}>
        <View style={styles.activeStatusHeader}>
          <LucideIcon name={currentActiveHotel ? "check-circle" : "alert-triangle"} size={20} color={currentActiveHotel ? "#4E9F76" : "#D49A3D"} />
          <View style={{ flex: 1 }}>
            <Text style={styles.activeStatusTitle}>
              {currentActiveHotel
                ? `ACTIVE HOTEL: ${currentActiveHotel.name.toUpperCase()} (${(currentActiveHotel.city || currentActiveHotel.location || '').toUpperCase()})`
                : 'NO ACTIVE HOTEL CONFIGURED'}
            </Text>
            <Text style={styles.activeStatusDetails}>
              {currentActiveHotel
                ? `Address: ${currentActiveHotel.address} • GPS Coordinates: [${currentActiveHotel.latitude ?? 'N/A'}, ${currentActiveHotel.longitude ?? 'N/A'}]`
                : 'Guest portal will display "Hotel not configured" fallback until you configure and save a hotel.'}
            </Text>
          </View>
          {currentActiveHotel && (
            <TouchableOpacity
              style={styles.clearActiveBtn}
              onPress={handleClearActiveHotel}
              activeOpacity={0.8}
            >
              <Text style={styles.clearActiveBtnText}>Clear / Unset</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Hotel Database Connection Status */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(78, 159, 118, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(78, 159, 118, 0.25)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4E9F76' }} />
          <Text style={{ color: '#F2EFE8', fontSize: 12, fontWeight: '700' }}>
            HOTEL DATABASE: CONNECTED (MongoDB hotelApiDb)
          </Text>
        </View>
        <Text style={{ color: '#4E9F76', fontSize: 11, fontWeight: '600' }}>
          Live Google-Style Search Active
        </Text>
      </View>

      {/* Real Hotel Search — Google-Style Search */}
      <View style={[styles.presetSection, { zIndex: 1000 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={styles.presetSectionTitle}>HOTEL SEARCH DIRECTORY</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4E9F76' }} />
            <Text style={{ color: '#C5A46D', fontSize: 11, fontWeight: '600' }}>Google-Style Autocomplete</Text>
          </View>
        </View>
        <Text style={styles.presetSectionSub}>
          Live suggestions while typing (>= 2 characters). Search MongoDB by hotel name, city, location, or address with instant partial and typo matching.
        </Text>

        {/* Dedicated Google-Style Live Autocomplete Search Component */}
        <HotelAutocompleteSearch
          onSelectHotel={handleSelectSearchResult}
          placeholder="Type hotel name, city, or address (e.g. Mango, Emerald, Bengaluru)..."
          maxSuggestions={8}
        />

        {/* Confirmed Hotel Preview */}
        {confirmedHotelData && (
          <View style={{ backgroundColor: '#0D3B1F', borderRadius: 10, borderWidth: 1, borderColor: '#4E9F76', padding: 14, marginTop: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: '#4E9F76', fontSize: 12, fontWeight: '700' }}>ACTIVE HOTEL SELECTED:</Text>
              <View style={{ backgroundColor: 'rgba(78, 159, 118, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: '#4E9F76', fontSize: 10, fontWeight: '700' }}>READY IN CONFIGURATOR</Text>
              </View>
            </View>
            <Text style={{ color: '#F2EFE8', fontSize: 15, fontWeight: '700' }}>{confirmedHotelData.name}</Text>
            <Text style={{ color: '#A5A39D', fontSize: 12, marginTop: 4 }}>{confirmedHotelData.address || confirmedHotelData.city}</Text>
            <Text style={{ color: '#A5A39D', fontSize: 12, marginTop: 2 }}>
              Coordinates: [{confirmedHotelData.latitude != null ? Number(confirmedHotelData.latitude).toFixed(4) : 'N/A'}, {confirmedHotelData.longitude != null ? Number(confirmedHotelData.longitude).toFixed(4) : 'N/A'}]
            </Text>
            <TouchableOpacity
              style={[styles.saveConfigBtn, { marginTop: 10 }]}
              onPress={handleConfirmHotelFromSearch}
              activeOpacity={0.85}
            >
              <Text style={styles.saveConfigBtnText}>SAVE & ACTIVATE ACROSS PORTAL</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Hotel Configuration Form */}
      <View style={styles.configFormCard}>
        {/* Hotel Approval Status Notice */}
        <View style={{
          backgroundColor: currentActiveHotel?.status === 'approved'
            ? 'rgba(78, 159, 118, 0.12)'
            : currentActiveHotel?.status === 'rejected'
            ? 'rgba(217, 83, 79, 0.12)'
            : 'rgba(245, 158, 11, 0.12)',
          borderWidth: 1,
          borderColor: currentActiveHotel?.status === 'approved'
            ? 'rgba(78, 159, 118, 0.35)'
            : currentActiveHotel?.status === 'rejected'
            ? 'rgba(217, 83, 79, 0.35)'
            : 'rgba(245, 158, 11, 0.35)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: '#A5A39D', textTransform: 'uppercase' }}>
              APPROVAL STATUS
            </Text>
            <View style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
              backgroundColor: currentActiveHotel?.status === 'approved'
                ? '#2E5A44'
                : currentActiveHotel?.status === 'rejected'
                ? '#8C2424'
                : '#8C6F3E',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>
                {currentActiveHotel?.status === 'approved'
                  ? 'APPROVED'
                  : currentActiveHotel?.status === 'rejected'
                  ? 'REJECTED'
                  : 'PENDING'}
              </Text>
            </View>
          </View>
          {currentActiveHotel?.status === 'approved' ? (
            <Text style={{ color: '#4E9F76', fontSize: 13, lineHeight: 18 }}>
              Your hotel has been approved by Super Admin and is publicly active on the guest portal.
            </Text>
          ) : currentActiveHotel?.status === 'rejected' ? (
            <View>
              <Text style={{ color: '#D9534F', fontSize: 13, lineHeight: 18 }}>
                Your hotel submission was rejected by Super Admin.
              </Text>
              {currentActiveHotel?.rejectionReason ? (
                <Text style={{ color: '#FECACA', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                  Reason: {currentActiveHotel.rejectionReason}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={{ color: '#D49A3D', fontSize: 13, lineHeight: 18 }}>
              ⏳ Your hotel has been submitted for approval. Please wait for Super Admin approval.
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LucideIcon name="file-text" size={18} color="#C5A46D" />
            <Text style={styles.configFormTitle}>HOTEL SPECIFICATIONS & GPS ORIGIN</Text>
          </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>HOTEL NAME *</Text>
            <TextInput
              style={styles.formInput}
              value={hotelConfigForm.name}
              onChangeText={(text) => setHotelConfigForm((prev) => ({ ...prev, name: text }))}
              placeholder="e.g. Enter Hotel Name"
              placeholderTextColor="#807E78"
            />
          </View>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>HOTEL LOCATION / CITY *</Text>
            <TextInput
              style={styles.formInput}
              value={hotelConfigForm.city}
              onChangeText={(text) => setHotelConfigForm((prev) => ({ ...prev, city: text }))}
              placeholder="e.g. Enter Hotel City"
              placeholderTextColor="#807E78"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>FULL PROPERTY ADDRESS</Text>
            <TextInput
              style={styles.formInput}
              value={hotelConfigForm.address}
              onChangeText={(text) => setHotelConfigForm((prev) => ({ ...prev, address: text }))}
              placeholder="e.g. 23, HAL Old Airport Rd, HAL 2nd Stage, Kodihalli"
              placeholderTextColor="#807E78"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>LATITUDE (DECIMAL) *</Text>
            <TextInput
              style={styles.formInput}
              value={hotelConfigForm.latitude}
              onChangeText={(text) => setHotelConfigForm((prev) => ({ ...prev, latitude: text }))}
              placeholder="e.g. 12.9606"
              placeholderTextColor="#807E78"
              keyboardType="numeric"
            />
            <Text style={styles.fieldHint}>Used as exact origin for driving directions</Text>
          </View>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>LONGITUDE (DECIMAL) *</Text>
            <TextInput
              style={styles.formInput}
              value={hotelConfigForm.longitude}
              onChangeText={(text) => setHotelConfigForm((prev) => ({ ...prev, longitude: text }))}
              placeholder="e.g. 77.6484"
              placeholderTextColor="#807E78"
              keyboardType="numeric"
            />
            <Text style={styles.fieldHint}>Used as exact origin for driving directions</Text>
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>SUBTITLE / PROPERTY TAGLINE</Text>
            <TextInput
              style={styles.formInput}
              value={hotelConfigForm.subtitle}
              onChangeText={(text) => setHotelConfigForm((prev) => ({ ...prev, subtitle: text }))}
              placeholder="e.g. Modern Palace of the Golden Age"
              placeholderTextColor="#807E78"
            />
          </View>
        </View>

        {/* ============================================================= */}
        {/* HOTEL GALLERY & PHOTO UPLOAD SECTION (MAX 8 PICTURES)        */}
        {/* ============================================================= */}
        <View style={styles.gallerySectionCard}>
          <View style={styles.gallerySectionHeader}>
            <View style={{ flex: 1, minWidth: 280 }}>
              <Text style={styles.gallerySectionTitle}>
                HOTEL PICTURES & GALLERY ({hotelImages.length} / 8 PICTURES)
              </Text>
              <Text style={styles.gallerySectionSub}>
                Upload up to 8 high-resolution pictures from your device or paste image URLs. Each picture is automatically assigned a verified unique 10-digit tracking ID and cycles in the guest portal gallery.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.uploadDeviceBtn,
                hotelImages.length >= 8 && styles.uploadDeviceBtnDisabled,
              ]}
              onPress={handleTriggerFileUpload}
              disabled={hotelImages.length >= 8}
              activeOpacity={0.8}
            >
              <Text style={styles.uploadDeviceBtnText}>
                Upload Pictures (From Device)
              </Text>
            </TouchableOpacity>
          </View>

          {/* 8 Picture Slots Grid */}
          <View style={styles.pictureSlotsGrid}>
            {hotelImages.map((img, index) => (
              <View key={img.id || index} style={styles.pictureSlotCard}>
                <View style={styles.slotImageWrapper}>
                  <Image source={{ uri: img.url }} style={styles.slotImageThumb} />
                  <View style={styles.slotBadgePill}>
                    <Text style={styles.slotBadgePillText}>
                      Slot {index + 1} {index === 0 ? '(Hero Cover)' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.slotRemoveBtn}
                    onPress={() => handleRemoveImage(index)}
                    activeOpacity={0.8}
                  >
 <LucideIcon name="x" size={13} color="#D9534F" />
                  </TouchableOpacity>
                </View>

                {/* 10-Digit Unique ID Badge */}
                <View style={styles.slotIdBadgeRow}>
                  <Text style={styles.slotIdIcon}>🆔</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slotIdLabel}>10-DIGIT UNIQUE ID:</Text>
                    <Text style={styles.slotIdValue}>{img.id}</Text>
                  </View>
                </View>

                {/* Picture Caption / Description */}
                <Text style={styles.slotCaptionText} numberOfLines={1}>
                  {img.caption || `Property Photo ${index + 1}`}
                </Text>

                {/* Reorder Buttons (Move Left / Move Right) */}
                <View style={styles.slotReorderRow}>
                  <TouchableOpacity
                    style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                    onPress={() => handleMoveImage(index, index - 1)}
                    disabled={index === 0}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.reorderBtnText}>← Left</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reorderBtn, index === hotelImages.length - 1 && styles.reorderBtnDisabled]}
                    onPress={() => handleMoveImage(index, index + 1)}
                    disabled={index === hotelImages.length - 1}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.reorderBtnText}>Right →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Empty Slots Placeholders if less than 8 */}
            {Array.from({ length: Math.max(0, 8 - hotelImages.length) }).map((_, emptyIdx) => {
              const slotNumber = hotelImages.length + emptyIdx + 1;
              return (
                <TouchableOpacity
                  key={`empty-${emptyIdx}`}
                  style={styles.emptySlotCard}
                  onPress={handleTriggerFileUpload}
                  activeOpacity={0.8}
                >
                  <LucideIcon name="plus" size={24} color="#807E78" />
                  <Text style={styles.emptySlotTitle}>Slot {slotNumber} of 8 Available</Text>
                  <Text style={styles.emptySlotHint}>Click to upload image file</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Option: Add Image via Direct URL */}
          {hotelImages.length < 8 && (
            <View style={styles.addUrlBox}>
              <Text style={styles.addUrlBoxTitle}>OR ADD PICTURE VIA DIRECT IMAGE URL</Text>
              <View style={styles.addUrlRow}>
                <TextInput
                  style={[styles.formInput, { flex: 2, minWidth: 200 }]}
                  value={newImageUrlInput}
                  onChangeText={setNewImageUrlInput}
                  placeholder="Paste picture link: https://images.unsplash.com/..."
                  placeholderTextColor="#807E78"
                />
                <TextInput
                  style={[styles.formInput, { flex: 1.2, minWidth: 150 }]}
                  value={newImageCaptionInput}
                  onChangeText={setNewImageCaptionInput}
                  placeholder="Caption (e.g. Suite Bedroom)"
                  placeholderTextColor="#807E78"
                />
                <TouchableOpacity
                  style={styles.addUrlActionBtn}
                  onPress={handleAddImageUrl}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <LucideIcon name="plus" size={13} color="#101114" />
                  <Text style={styles.addUrlActionBtnText}>Add with 10-Digit ID</Text>
                </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>STARTING RATE / PRICE PER NIGHT</Text>
            <TextInput
              style={styles.formInput}
              value={hotelConfigForm.pricePerNight}
              onChangeText={(text) => setHotelConfigForm((prev) => ({ ...prev, pricePerNight: text }))}
              placeholder="e.g. ₹28,000 / night"
              placeholderTextColor="#807E78"
            />
          </View>
          <View style={styles.formCol}>
            <Text style={styles.formLabel}>GUEST STAR RATING</Text>
            <TextInput
              style={styles.formInput}
              value={hotelConfigForm.rating}
              onChangeText={(text) => setHotelConfigForm((prev) => ({ ...prev, rating: text }))}
              placeholder="e.g. 4.9"
              placeholderTextColor="#807E78"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.configActionButtons}>
          <TouchableOpacity
            style={styles.saveOnlyBtn}
            onPress={() => handleSaveHotelConfig(false)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <LucideIcon name="check" size={13} color="#101114" />
                <Text style={styles.saveOnlyBtnText}>Submit for Approval</Text>
              </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveAndLaunchBtn,
              currentActiveHotel?.status !== 'approved' && { opacity: 0.7, borderColor: '#807E78' }
            ]}
            onPress={() => handleSaveHotelConfig(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.saveAndLaunchBtnText}>
              {currentActiveHotel?.status === 'approved'
 ? ' LAUNCH GUEST WEBSITE →'
                : '⏳ SUBMIT HOTEL FOR APPROVAL'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ===========================================================================
  // ===========================================================================
  // RENDER TAB: OVERVIEW (EXECUTIVE ADMIN DASHBOARD)
  // ===========================================================================
  const renderOverviewTab = () => {
    const nearbyCount = Object.values(currentActiveHotel?.nearby || {}).reduce(
      (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
      0
    );
    const totalComponents =
      restaurants.length +
      gyms.length +
      pools.length +
      facilities.length +
      takeaway.length +
      homeDelivery.length +
      nearbyCount;

    const approvedHotelsCount = hotels.filter((h) => (h.status || 'pending').toLowerCase() === 'approved').length;
    const pendingHotelsCount = hotels.filter((h) => (h.status || 'pending').toLowerCase() === 'pending').length;
    const paidHotelsCount = hotels.filter((h) => (h.paymentStatus || 'Paid').toLowerCase() === 'paid').length;

    return (
      <View style={styles.tabContentContainer}>
        {/* Executive Header Banner */}
        <View style={styles.overviewHero}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <Text style={styles.overviewGreeting}>HOTEL OPERATIONS & EXECUTIVE DASHBOARD</Text>
              <View style={styles.liveDbPill}>
                <View style={styles.liveDbDot} />
                <Text style={styles.liveDbText}>Live MongoDB ({connectedDbName})</Text>
              </View>
            </View>
            <Text style={styles.overviewSub}>
              Multi-Property Administration • Real-Time Component Isolation • Synchronized with Guest Experience
            </Text>
          </View>
          <View style={styles.overviewHeaderActions}>
            <TouchableOpacity
              style={styles.headerPrimaryActionBtn}
              onPress={() => handleOpenCreateModal('restaurants')}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <LucideIcon name="plus" size={14} color="#101114" />
                <Text style={styles.headerPrimaryActionBtnText}>Add Component</Text>
              </View>
            </TouchableOpacity>
            {currentActiveHotel && (
              <TouchableOpacity
                style={styles.headerGuestLaunchBtn}
                onPress={() => {
                  if (onLaunchGuestWebsite) {
                    onLaunchGuestWebsite(currentActiveHotel);
                  } else if (onBackToGuestPortal) {
                    onBackToGuestPortal();
                  }
                }}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <LucideIcon name="external-link" size={14} color="#F2EFE8" />
                  <Text style={styles.headerGuestLaunchBtnText}>
                    Open Guest Portal ({currentActiveHotel.city || 'Portal'})
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Prominent Active Hotel Profile Card */}
        <View style={styles.activeHotelProfileCard}>
          <View style={styles.activeHotelProfileHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <LucideIcon name="award" size={13} color="#C5A46D" />
                  <Text style={styles.activeHotelBadgeText}>CURRENT ACTIVE HOTEL</Text>
                </View>
                <View style={[
                  styles.statusBadgePill,
                  currentActiveHotel?.status === 'approved'
                    ? styles.statusBadgeApproved
                    : currentActiveHotel?.status === 'rejected'
                    ? styles.statusBadgeRejected
                    : styles.statusBadgePending,
                ]}>
                  <Text style={styles.statusBadgePillText}>
                    {(currentActiveHotel?.status || 'PENDING').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.activeHotelNameText}>
                {currentActiveHotel?.name || 'No Hotel Currently Selected'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <LucideIcon name="map-pin" size={13} color="#A5A39D" />
                <Text style={styles.activeHotelLocationText}>
                  {currentActiveHotel?.address || currentActiveHotel?.city || 'Address unconfigured'}
                </Text>
              </View>
              <View style={styles.activeHotelMetaRow}>
                <Text style={styles.activeHotelMetaItem}>
                  Coordinates: [{currentActiveHotel?.latitude != null ? Number(currentActiveHotel.latitude).toFixed(4) : 'N/A'}, {currentActiveHotel?.longitude != null ? Number(currentActiveHotel.longitude).toFixed(4) : 'N/A'}]
                </Text>
                <Text style={styles.activeHotelMetaDivider}>•</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <LucideIcon name="star" size={12} color="#C5A46D" />
                  <Text style={styles.activeHotelMetaItem}>{currentActiveHotel?.rating || '4.9'}</Text>
                </View>
                <Text style={styles.activeHotelMetaDivider}>•</Text>
                <Text style={styles.activeHotelMetaItem}>{currentActiveHotel?.pricePerNight || '₹18,500 / night'}</Text>
                <Text style={styles.activeHotelMetaDivider}>•</Text>
                <Text style={styles.activeHotelMetaItem}>ID: {currentActiveHotel?.hotelPropertyId || currentActiveHotel?.id || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.activeHotelProfileActions}>
              <TouchableOpacity
                style={styles.profileActionBtn}
                onPress={() => setActiveTab('hotel_config')}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <LucideIcon name="settings" size={13} color="#F2EFE8" />
                  <Text style={styles.profileActionBtnText}>Configure</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileActionBtn}
                onPress={() => setActiveTab('hotels')}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <LucideIcon name="building-2" size={13} color="#F2EFE8" />
                  <Text style={styles.profileActionBtnText}>Switch Hotel</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Total Components Highlight & Category Metrics Grid */}
        <View style={styles.metricsSummaryContainer}>
          <View style={styles.totalComponentsHeroCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.totalComponentsLabel}>TOTAL ACTIVE COMPONENTS</Text>
              <Text style={styles.totalComponentsNumber}>{totalComponents}</Text>
              <Text style={styles.totalComponentsSub}>
                Amenities, dining options, wellness facilities & curated places active for this property
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addComponentDirectBtn}
              onPress={() => handleOpenCreateModal('restaurants')}
              activeOpacity={0.8}
            >
              <Text style={styles.addComponentDirectBtnText}>+ Add New</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metricsGrid}>
            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => setActiveTab('restaurants')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <LucideIcon name="utensils" size={18} color="#C5A46D" />
                <Text style={styles.metricValue}>{restaurants.length}</Text>
              </View>
              <Text style={styles.metricLabel}>Restaurants & Dining</Text>
              <Text style={styles.metricSub}>Fine dining & multi-cuisine</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => setActiveTab('gyms')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <LucideIcon name="dumbbell" size={18} color="#C5A46D" />
                <Text style={styles.metricValue}>{gyms.length}</Text>
              </View>
              <Text style={styles.metricLabel}>Gyms & Wellness</Text>
              <Text style={styles.metricSub}>Fitness centers & day passes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => setActiveTab('pools')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <LucideIcon name="waves" size={18} color="#C5A46D" />
                <Text style={styles.metricValue}>{pools.length}</Text>
              </View>
              <Text style={styles.metricLabel}>Swimming Pools</Text>
              <Text style={styles.metricSub}>Infinity & heated pools</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => setActiveTab('facilities')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <LucideIcon name="sparkles" size={18} color="#C5A46D" />
                <Text style={styles.metricValue}>{facilities.length}</Text>
              </View>
              <Text style={styles.metricLabel}>Hotel Facilities</Text>
              <Text style={styles.metricSub}>Spa, concierge & services</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => setActiveTab('takeaway')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <LucideIcon name="shopping-bag" size={18} color="#C5A46D" />
                <Text style={styles.metricValue}>{takeaway.length + homeDelivery.length}</Text>
              </View>
              <Text style={styles.metricLabel}>Takeaway & Delivery</Text>
              <Text style={styles.metricSub}>Express partners & delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => setActiveTab('places_manager')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <LucideIcon name="compass" size={18} color="#C5A46D" />
                <Text style={styles.metricValue}>{nearbyCount}</Text>
              </View>
              <Text style={styles.metricLabel}>Curated Nearby Places</Text>
              <Text style={styles.metricSub}>Attractions, transit & shopping</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => setActiveTab('hotels')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <LucideIcon name="building-2" size={18} color="#C5A46D" />
                <Text style={styles.metricValue}>{hotels.length}</Text>
              </View>
              <Text style={styles.metricLabel}>Registered Hotels</Text>
              <Text style={styles.metricSub}>{approvedHotelsCount} Approved • {pendingHotelsCount} Pending</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => setActiveTab('payments')}
              activeOpacity={0.8}
            >
              <View style={styles.metricCardHeader}>
                <LucideIcon name="credit-card" size={18} color="#C5A46D" />
                <Text style={styles.metricValue}>{paidHotelsCount} / {hotels.length}</Text>
              </View>
              <Text style={styles.metricLabel}>Hotels Settled</Text>
              <Text style={styles.metricSub}>Active billing & payment config</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Real-Time Session Activity Feed (Only actual data!) */}
        <View style={styles.activitySection}>
          <View style={styles.activitySectionHeader}>
            <View>
              <Text style={styles.subSectionTitle}>SESSION ACTIVITY LOG</Text>
              <Text style={styles.activitySectionSub}>
                Real-time tracking of hotel and component modifications in this session
              </Text>
            </View>
            <View style={styles.liveActivityPill}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveActivityText}>Live Monitoring</Text>
            </View>
          </View>

          {recentActivity.length === 0 ? (
            <View style={styles.activityEmptyState}>
              <LucideIcon name="clock" size={28} color="#A5A39D" style={{ marginBottom: 8 }} />
              <Text style={styles.activityEmptyTitle}>No Modifications in Current Session</Text>
              <Text style={styles.activityEmptySub}>
                All updates made to hotels, dining, wellness, or amenities will appear here in real time as they occur.
              </Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {recentActivity.map((act) => (
                <View key={act.id} style={styles.activityItem}>
                  <View style={styles.activityTimeCol}>
                    <Text style={styles.activityTimeText}>{act.time}</Text>
                  </View>
                  <View style={styles.activityTypeBadge}>
                    <Text style={styles.activityTypeText}>{(act.type || 'INFO').toUpperCase()}</Text>
                  </View>
                  <Text style={styles.activityDescText} numberOfLines={2}>
                    {act.description}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Management Shortcuts */}
        <View style={{ marginTop: 8 }}>
          <Text style={styles.subSectionTitle}>Quick Management Shortcuts</Text>
          <View style={styles.shortcutsRow}>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => handleOpenCreateModal('restaurants')}
              activeOpacity={0.8}
            >
              <LucideIcon name="utensils" size={20} color="#C5A46D" style={{ marginBottom: 6 }} />
              <Text style={styles.shortcutTitle}>Add New Restaurant / Amenity</Text>
              <Text style={styles.shortcutDesc}>
                Create dining options, fitness centers, or hotel amenities for this property
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setActiveTab('hotels')}
              activeOpacity={0.8}
            >
              <LucideIcon name="building-2" size={20} color="#C5A46D" style={{ marginBottom: 6 }} />
              <Text style={styles.shortcutTitle}>Hotels Directory</Text>
              <Text style={styles.shortcutDesc}>
                Browse, search, edit, and switch between registered hotel properties
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setActiveTab('places_manager')}
              activeOpacity={0.8}
            >
              <LucideIcon name="compass" size={20} color="#C5A46D" style={{ marginBottom: 6 }} />
              <Text style={styles.shortcutTitle}>Nearby Places & Categories</Text>
              <Text style={styles.shortcutDesc}>
                Curate attractions, shopping, transit, and medical gateways with GPS directions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setActiveTab('payments')}
              activeOpacity={0.8}
            >
              <LucideIcon name="credit-card" size={20} color="#C5A46D" style={{ marginBottom: 6 }} />
              <Text style={styles.shortcutTitle}>Hotel Payment Methods</Text>
              <Text style={styles.shortcutDesc}>
                Configure UPI, Cards, Net Banking, and Cash individually per hotel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => setActiveTab('availability')}
              activeOpacity={0.8}
            >
              <LucideIcon name="calendar" size={20} color="#C5A46D" style={{ marginBottom: 6 }} />
              <Text style={styles.shortcutTitle}>1-Click Availability Matrix</Text>
              <Text style={styles.shortcutDesc}>
                Instantly toggle operational status for hotels, dining, and gyms
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ===========================================================================
  // RENDER TAB: HOTELS (CRUD - VERTICAL LIST WITH PAYMENT STATUS & SEARCH)
  // ===========================================================================
  const renderHotelsTab = () => {
    const query = hotelsDirectorySearch.trim().toLowerCase();
    const approvedCount = hotels.filter((h) => (h.status || 'pending').toLowerCase() === 'approved').length;
    const pendingCount = hotels.filter((h) => (h.status || 'pending').toLowerCase() === 'pending').length;
    const rejectedCount = hotels.filter((h) => (h.status || 'pending').toLowerCase() === 'rejected').length;

    const filteredHotels = hotels.filter((h) => {
      if (hotelStatusFilter !== 'all') {
        const st = (h.status || 'pending').toLowerCase();
        if (st !== hotelStatusFilter.toLowerCase()) return false;
      }
      if (query) {
        const titleMatch = (h.title || h.name || '').toLowerCase().includes(query);
        const locMatch = (h.location || h.city || h.address || '').toLowerCase().includes(query);
        const idMatch = (h.hotelPropertyId || h.id || '').toLowerCase().includes(query);
        return titleMatch || locMatch || idMatch;
      }
      return true;
    });

    return (
      <View style={styles.tabContentContainer}>
        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text style={styles.sectionTitle}>HOTELS DIRECTORY ({hotels.length})</Text>
              <View style={styles.directoryCountPills}>
                <View style={styles.countPillApproved}>
                  <Text style={styles.countPillApprovedText}>{approvedCount} Approved</Text>
                </View>
                <View style={styles.countPillPending}>
                  <Text style={styles.countPillPendingText}>{pendingCount} Pending</Text>
                </View>
                {rejectedCount > 0 && (
                  <View style={styles.countPillRejected}>
                    <Text style={styles.countPillRejectedText}>{rejectedCount} Rejected</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.sectionSub}>
              Multi-Hotel Directory • Live Approvals, GPS Coordinates, Rates & Integrated Payment Management
            </Text>
          </View>

          <View style={styles.headerButtonsRow}>
            {authService.isSuperAdmin() && (
              <TouchableOpacity
                style={styles.createItemBtn}
                onPress={() => handleOpenCreateModal('hotels')}
                activeOpacity={0.8}
              >
                <Text style={styles.createItemBtnText}>+ Add New Hotel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => loadAllAdminData()}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <LucideIcon name="refresh-cw" size={13} color="#F2EFE8" />
                <Text style={styles.addBtnText}>Refresh</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Directory Search & Status Filter Bar */}
        <View style={styles.directoryControlsBar}>
          <View style={styles.directorySearchInputWrap}>
            <Text style={styles.searchIconText}>⌕</Text>
            <TextInput
              style={styles.directorySearchInput}
              value={hotelsDirectorySearch}
              onChangeText={setHotelsDirectorySearch}
              placeholder="Search hotels by name, city, location, or hotel ID..."
              placeholderTextColor="#807E78"
              autoCapitalize="none"
            />
            {hotelsDirectorySearch.length > 0 && (
              <TouchableOpacity
                onPress={() => setHotelsDirectorySearch('')}
                style={styles.clearSearchBtn}
                activeOpacity={0.7}
              >
 <LucideIcon name="x" size={13} color="#A5A39D" />
              </TouchableOpacity>
            )}
          </View>

          {/* Status Filter Tabs */}
          <View style={styles.statusFilterTabs}>
            {[
              { key: 'all', label: `All (${hotels.length})` },
              { key: 'approved', label: `Approved (${approvedCount})` },
              { key: 'pending', label: `Pending (${pendingCount})` },
              { key: 'rejected', label: `Rejected (${rejectedCount})` },
            ].map((st) => (
              <TouchableOpacity
                key={st.key}
                style={[
                  styles.statusFilterTab,
                  hotelStatusFilter === st.key && styles.statusFilterTabActive,
                ]}
                onPress={() => setHotelStatusFilter(st.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.statusFilterTabText,
                    hotelStatusFilter === st.key && styles.statusFilterTabTextActive,
                  ]}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vertical Hotels List */}
        <View style={styles.verticalHotelsContainer}>
          {filteredHotels.length === 0 ? (
            <View style={styles.directoryEmptyStateCard}>
              <LucideIcon name="building-2" size={32} color="#A5A39D" style={{ marginBottom: 8 }} />
              <Text style={styles.directoryEmptyTitle}>
                {hotels.length === 0
                  ? 'No Hotels Registered in Database'
                  : `No hotels match "${hotelsDirectorySearch || hotelStatusFilter}"`}
              </Text>
              <Text style={styles.directoryEmptySub}>
                {hotels.length === 0
                  ? 'Use "+ Add New Hotel" or hotel discovery to register the first property.'
                  : 'Try searching by city or partial hotel name, or reset your filters.'}
              </Text>
              {(hotelsDirectorySearch || hotelStatusFilter !== 'all') && (
                <TouchableOpacity
                  style={styles.resetFiltersBtn}
                  onPress={() => {
                    setHotelsDirectorySearch('');
                    setHotelStatusFilter('all');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetFiltersBtnText}>Reset Search & Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredHotels.map((h) => {
              const isAvail = h.availability === 'Available' || !h.availability;
              const isPaid = (h.paymentStatus || 'Paid') === 'Paid';
              const isActiveHotel =
                (currentActiveHotel?.hotelPropertyId && currentActiveHotel?.hotelPropertyId === (h.hotelPropertyId || h.id)) ||
                (currentActiveHotel?.id && currentActiveHotel?.id === h.id);
              const hotelStatus = (h.status || 'pending').toLowerCase();

              return (
                <View
                  key={h.id || h.hotelPropertyId}
                  style={[
                    styles.verticalHotelCard,
                    isActiveHotel && styles.verticalHotelCardActive,
                  ]}
                >
                  {/* Top Header Row with Thumbnail, Title & Badges */}
                  <View style={styles.verticalHotelHeaderRow}>
                    <View style={styles.hotelThumbWrap}>
                      <Image
                        source={{
                          uri:
                            h.imageLink ||
                            (h.images && h.images[0]) ||
                            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
                        }}
                        style={styles.verticalHotelThumb}
                      />
                    </View>

                    <View style={styles.verticalHotelMainInfo}>
                      <View style={styles.verticalHotelTitleLine}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                          <Text style={styles.verticalHotelTitle}>{h.title || h.name}</Text>
                          {isActiveHotel && (
                            <View style={styles.activeHotelPillBadge}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <LucideIcon name="award" size={11} color="#C5A46D" />
                              <Text style={styles.activeHotelPillBadgeText}>ACTIVE</Text>
                            </View>
                            </View>
                          )}
                          <View
                            style={[
                              styles.hotelStatusBadge,
                              hotelStatus === 'approved'
                                ? styles.hotelStatusApproved
                                : hotelStatus === 'rejected'
                                ? styles.hotelStatusRejected
                                : styles.hotelStatusPending,
                            ]}
                          >
                            <Text style={styles.hotelStatusBadgeText}>
                              hotelStatus.toUpperCase()
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.verticalHotelPrice}>
                          {h.pricePerNight || '₹24,500'}
                          <Text style={{ fontSize: 11, color: '#A5A39D' }}> / night</Text>
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                        <LucideIcon name="map-pin" size={12} color="#A5A39D" />
                        <Text style={styles.verticalHotelLocation}>{h.location || h.city || h.address}</Text>
                        <Text style={{ color: '#2A2B31' }}>•</Text>
                        <LucideIcon name="star" size={12} color="#C5A46D" />
                        <Text style={styles.verticalHotelLocation}>{h.rating || 4.9}</Text>
                        <Text style={{ color: '#2A2B31' }}>•</Text>
                        <Text style={styles.verticalHotelLocation}>ID: {h.hotelPropertyId || h.id}</Text>
                      </View>
                      {h.description ? (
                        <Text style={styles.verticalHotelDesc} numberOfLines={2}>
                          {h.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Payment Status Bar */}
                  <View
                    style={[
                      styles.paymentStatusBar,
                      isPaid ? styles.paymentBarPaid : styles.paymentBarUnpaid,
                    ]}
                  >
                    <View style={styles.paymentStatusInfo}>
                      <LucideIcon name={isPaid ? "check-circle" : "alert-triangle"} size={16} color={isPaid ? "#4E9F76" : "#D49A3D"} />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.paymentStatusTitle,
                            isPaid ? styles.paymentTextPaid : styles.paymentTextUnpaid,
                          ]}
                        >
                          {isPaid ? 'PAYMENT STATUS: COMPLETED (PAID)' : 'PAYMENT STATUS: NOT MADE / PENDING'}
                        </Text>
                        <Text style={styles.paymentStatusSub}>
                          {isPaid
                            ? `Payment verified for billing cycle • Default Method: ${(h.paymentMethods && h.paymentMethods[0]) || 'UPI / Card'}`
                            : 'Action required: Hotel subscription / vendor payment is currently pending'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.paymentToggleBtn,
                        isPaid ? styles.paymentToggleBtnMarkUnpaid : styles.paymentToggleBtnMarkPaid,
                      ]}
                      onPress={() => handleToggleHotelPayment(h)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.paymentToggleBtnText}>{isPaid ? 'Mark Pending' : 'Mark Paid'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Accepted Payment Methods Row */}
                  <View style={styles.verticalHotelFooterRow}>
                    <View style={styles.hotelPmRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <LucideIcon name="credit-card" size={12} color="#A5A39D" />
                        <Text style={styles.hotelPmLabel}>Accepted Methods:</Text>
                      </View>
                      <View style={styles.hotelPmChips}>
                        {(h.paymentMethods || ['UPI', 'Credit Card', 'Cash']).map((pm, idx) => (
                          <View key={`hpm-${idx}`} style={styles.hotelPmChip}>
                            <Text style={styles.hotelPmChipText}>{pm}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Hotel Action Controls */}
                    <View style={styles.tableActionsCol}>
                      <TouchableOpacity
                        style={[
                          styles.availToggleBtn,
                          isAvail ? styles.availGreenBtn : styles.availRedBtn,
                        ]}
                        onPress={() => handleToggleAvailability('hotels', h)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <LucideIcon name={isAvail ? "check-circle" : "x-circle"} size={12} color={isAvail ? "#4E9F76" : "#D9534F"} />
                          <Text style={styles.availToggleText}>{isAvail ? 'Available' : 'Unavailable'}</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.editItemBtn}
                        onPress={() => handleOpenEditModal('hotels', h)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <LucideIcon name="edit" size={12} color="#F2EFE8" />
                          <Text style={styles.editItemBtnText}>Edit</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteItemBtn}
                        onPress={() => handleDeleteItem('hotels', h)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <LucideIcon name="trash-2" size={12} color="#D9534F" />
                          <Text style={styles.deleteItemBtnText}>Delete</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.activateHotelDirectBtn,
                          isActiveHotel && styles.activateHotelDirectBtnCurrent,
                        ]}
                        onPress={() => {
                          const saved = activeHotelService.saveAndActivateHotel(h);
                          setCurrentActiveHotel(saved);
                          if (onSetActiveHotel) onSetActiveHotel(saved);
                          loadAllAdminData(h.hotelPropertyId || h.id);
                          logActivity(`Switched active hotel to: "${h.title || h.name}"`, 'hotel');
                          showToast(`"${h.title || h.name}" is now the Active Hotel!`, 'success');
                          if (onLaunchGuestWebsite) {
                            onLaunchGuestWebsite(saved);
                          } else if (onBackToGuestPortal) {
                            onBackToGuestPortal();
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <LucideIcon name="award" size={13} color={isActiveHotel ? "#101114" : "#C5A46D"} />
                          <Text style={styles.activateHotelDirectBtnText}>
                            {isActiveHotel ? 'Active Property (Launch)' : 'Set Active & Launch'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.configPmBtn}
                        onPress={() => {
                          handleSelectHotelForPayments(h);
                          setActiveTab('payments');
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <LucideIcon name="credit-card" size={12} color="#A5A39D" />
                          <Text style={styles.configPmBtnText}>Payment Config</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    );
  };

  // ===========================================================================
  // REUSABLE COMPONENT SECTION RENDERER
  // ===========================================================================
  const renderComponentSection = ({
    categoryKey,
    title,
    icon,
    subtitle,
    items,
    addLabel,
    formatSubtitle,
    formatPriceOrRate,
    renderBadges,
  }) => {
    const query = componentSearchQuery.trim().toLowerCase();
    const availCount = items.filter((i) => i.availability === 'Available' || !i.availability).length;
    const unavailCount = items.length - availCount;

    const filteredItems = items.filter((item) => {
      // 1. Availability filter
      const isAvail = item.availability === 'Available' || !item.availability;
      if (componentAvailabilityFilter === 'available' && !isAvail) return false;
      if (componentAvailabilityFilter === 'unavailable' && isAvail) return false;

      // 2. Search query filter
      if (query) {
        const textToSearch = [
          item.title,
          item.name,
          item.cuisine,
          item.location,
          item.address,
          item.subtitle,
          item.timings,
          item.description,
          Array.isArray(item.facilities) ? item.facilities.join(' ') : '',
        ].filter(Boolean).join(' ').toLowerCase();

        return textToSearch.includes(query);
      }
      return true;
    });

    return (
      <View style={styles.tabContentContainer}>
        {/* Section Header Row */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <LucideIcon name={icon || "sparkles"} size={20} color="#C5A46D" />
                <Text style={styles.sectionTitle}>{title.toUpperCase()} ({items.length})</Text>
              </View>
              <View style={styles.componentCountBadge}>
                <Text style={styles.componentCountBadgeText}>
                  {availCount} Available • {unavailCount} Unavailable
                </Text>
              </View>
            </View>
            <Text style={styles.sectionSub}>{subtitle}</Text>
          </View>
          <TouchableOpacity
            style={styles.createItemBtn}
            onPress={() => handleOpenCreateModal(categoryKey)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <LucideIcon name="plus" size={13} color="#101114" />
              <Text style={styles.createItemBtnText}>{addLabel}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Live Search & Filter Controls Bar */}
        <View style={styles.componentControlsBar}>
          <View style={styles.componentSearchInputWrap}>
            <Text style={styles.searchIconText}>⌕</Text>
            <TextInput
              style={styles.componentSearchInput}
              value={componentSearchQuery}
              onChangeText={setComponentSearchQuery}
              placeholder={`Search ${title.toLowerCase()} by name, details, or location...`}
              placeholderTextColor="#807E78"
              autoCapitalize="none"
            />
            {componentSearchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setComponentSearchQuery('')}
                style={styles.clearSearchBtn}
                activeOpacity={0.7}
              >
 <LucideIcon name="x" size={13} color="#A5A39D" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.componentAvailTabs}>
            {[
              { key: 'all', label: `All (${items.length})` },
              { key: 'available', label: `Available (${availCount})` },
              { key: 'unavailable', label: `Unavailable (${unavailCount})` },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.componentAvailTab,
                  componentAvailabilityFilter === tab.key && styles.componentAvailTabActive,
                ]}
                onPress={() => setComponentAvailabilityFilter(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.componentAvailTabText,
                    componentAvailabilityFilter === tab.key && styles.componentAvailTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Component Items List */}
        <View style={styles.itemsTable}>
          {filteredItems.length === 0 ? (
            <View style={styles.directoryEmptyStateCard}>
              <LucideIcon name={icon || "sparkles"} size={32} color="#A5A39D" style={{ marginBottom: 8 }} />
              <Text style={styles.directoryEmptyTitle}>
                {items.length === 0
                  ? `No ${title} Configured Yet`
                  : `No ${title.toLowerCase()} match "${componentSearchQuery || componentAvailabilityFilter}"`}
              </Text>
              <Text style={styles.directoryEmptySub}>
                {items.length === 0
 ? `No ${title.toLowerCase()} configured for ${currentActiveHotel?.name || 'this hotel'} yet. Click "+ ${addLabel}" above to create one.`
                  : 'Try searching for different keywords or clear your search filters.'}
              </Text>
              {items.length === 0 ? (
                <TouchableOpacity
                  style={[styles.createItemBtn, { marginTop: 12 }]}
                  onPress={() => handleOpenCreateModal(categoryKey)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <LucideIcon name="plus" size={13} color="#101114" />
              <Text style={styles.createItemBtnText}>{addLabel}</Text>
            </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.resetFiltersBtn}
                  onPress={() => {
                    setComponentSearchQuery('');
                    setComponentAvailabilityFilter('all');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetFiltersBtnText}>Reset Filter</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredItems.map((item) => {
              const isAvail = item.availability === 'Available' || !item.availability;
              return (
                <View key={item.id} style={styles.tableCard}>
                  <Image
                    source={{
                      uri:
                        item.imageLink ||
                        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
                    }}
                    style={styles.itemThumb}
                  />
                  <View style={styles.tableInfoCol}>
                    <View style={styles.tableTitleRow}>
                      <Text style={styles.tableItemTitle}>{item.title || item.name}</Text>
                      {formatPriceOrRate ? (
                        <Text style={styles.tablePrice}>{formatPriceOrRate(item)}</Text>
                      ) : null}
                    </View>
                    {formatSubtitle ? (
                      <Text style={styles.tableItemSub}>{formatSubtitle(item)}</Text>
                    ) : null}
                    {renderBadges ? renderBadges(item) : null}
                  </View>

                  <View style={styles.tableActionsCol}>
                    <TouchableOpacity
                      style={[
                        styles.availToggleBtn,
                        isAvail ? styles.availGreenBtn : styles.availRedBtn,
                      ]}
                      onPress={() => handleToggleAvailability(categoryKey, item)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <LucideIcon name={isAvail ? "check-circle" : "x-circle"} size={12} color={isAvail ? "#4E9F76" : "#D9534F"} />
                          <Text style={styles.availToggleText}>{isAvail ? 'Available' : 'Unavailable'}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editItemBtn}
                      onPress={() => handleOpenEditModal(categoryKey, item)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <LucideIcon name="edit" size={12} color="#F2EFE8" />
                          <Text style={styles.editItemBtnText}>Edit</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteItemBtn}
                      onPress={() => handleDeleteItem(categoryKey, item)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <LucideIcon name="trash-2" size={12} color="#D9534F" />
                          <Text style={styles.deleteItemBtnText}>Delete</Text>
                        </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    );
  };

  // ===========================================================================
  // RENDER TABS: AMENITIES & SERVICES (CRUD)
  // ===========================================================================
  const renderRestaurantsTab = () =>
    renderComponentSection({
      categoryKey: 'restaurants',
      title: 'Restaurants & Fine Dining',
 icon: '',
      subtitle: 'Manage dining partners, menus, takeaway, delivery flags, and operational availability',
      items: restaurants,
      addLabel: 'Add New Restaurant',
 formatSubtitle: (r) => `${r.cuisine || 'Continental'} • ${r.location || 'Hotel Ground Floor'} • ★ ${r.rating || 4.8}`,
      formatPriceOrRate: (r) => r.priceRange || r.price || '₹₹₹₹',
      renderBadges: (r) => (
        <View style={styles.badgeRow}>
 <Text style={styles.tagBadge}>Takeaway: {r.takeaway ? '✓ YES' : '✗ NO'}</Text>
 <Text style={styles.tagBadge}>Delivery: {r.homeDelivery ? '✓ YES' : '✗ NO'}</Text>
          {r.timings ? <Text style={styles.tagBadge}>⏱️ {r.timings}</Text> : null}
        </View>
      ),
    });

  const renderGymsTab = () =>
    renderComponentSection({
      categoryKey: 'gyms',
      title: 'Gyms & Wellness Centers',
 icon: '',
      subtitle: 'Fitness centers, personal training, spa services, and day pass rates',
      items: gyms,
      addLabel: 'Add New Gym',
 formatSubtitle: (g) => ` ${g.timings || '6:00 AM - 10:00 PM'} • ${g.location || 'Wellness Wing'}`,
      formatPriceOrRate: (g) => `${g.passPrice || '₹1,500'}/day`,
      renderBadges: (g) => (
        <Text style={styles.facilitiesText}>
          Facilities: {(Array.isArray(g.facilities) ? g.facilities.join(' • ') : g.facilities) || 'Full Gym, Sauna, Steam Room'}
        </Text>
      ),
    });

  const renderPoolsTab = () =>
    renderComponentSection({
      categoryKey: 'pools',
      title: 'Swimming Pools',
 icon: '',
      subtitle: 'Infinity pools, heated wellness water, and poolside cabanas',
      items: pools,
      addLabel: 'Add Swimming Pool',
 formatSubtitle: (p) => ` ${p.timings || p.timing || '6:00 AM - 9:00 PM'} • ${p.location || 'Hotel Courtyard'} • ★ ${p.rating || 4.9}`,
      formatPriceOrRate: (p) => p.price || 'Resident Access',
      renderBadges: (p) => (
        <Text style={styles.facilitiesText}>
          {p.subtitle || p.shortDescription || 'Heated infinity pool with poolside loungers'}
        </Text>
      ),
    });

  const renderTakeawayTab = () =>
    renderComponentSection({
      categoryKey: 'takeaway',
      title: 'Takeaway Partners',
 icon: '',
      subtitle: 'Express pickup times, minimum order values, and partner availability',
      items: takeaway,
      addLabel: 'Add Takeaway Partner',
 formatSubtitle: (t) => ` Ready in ${t.takeawayTime || '15 mins'} • ${t.location || 'Hotel Lobby'}`,
      formatPriceOrRate: (t) => t.minOrder || 'Min ₹400',
    });

  const renderDeliveryTab = () =>
    renderComponentSection({
      categoryKey: 'delivery',
      title: 'Home Delivery Services',
 icon: '',
      subtitle: 'Room delivery radius, delivery fees, minimum orders, and status',
      items: homeDelivery,
      addLabel: 'Add Delivery Service',
 formatSubtitle: (d) => ` Radius: ${d.deliveryRadius || '5 km'} • Fee: ${d.deliveryFee || 'Free'}`,
      formatPriceOrRate: (d) => d.minOrder || 'Min ₹500',
    });

  const renderFacilitiesTab = () =>
    renderComponentSection({
      categoryKey: 'facilities',
      title: 'Hotel Facilities & Services',
 icon: '',
      subtitle: 'Concierge, executive lounges, spa treatments, valet & premium guest amenities',
      items: facilities,
      addLabel: 'Add Hotel Facility',
 formatSubtitle: (f) => ` ${f.timings || '24/7 Available'} • ${f.location || 'Main Lobby'}`,
      formatPriceOrRate: (f) => f.category || 'Guest Service',
      renderBadges: (f) => (
        <Text style={styles.facilitiesText}>
          {f.description || f.subtitle || 'Complimentary premium guest amenity'}
        </Text>
      ),
    });

  // RENDER TAB: HOTEL PAYMENT METHODS (VERTICAL LAYOUT)
  // ===========================================================================
  const renderPaymentsTab = () => (
    <View style={styles.tabContentContainer}>
      <View style={styles.sectionHeaderRow}>
        <View>
 <Text style={styles.sectionTitle}> HOTEL PAYMENT METHODS & STATUS MANAGER</Text>
          <Text style={styles.sectionSub}>
            Vertical configuration: select a hotel to manage accepted payment methods and account settlement status.
          </Text>
        </View>
      </View>

      {/* Main Full-Width Vertical Workspace (No Right-Side Column) */}
      <View style={styles.pmLayoutRow}>
        
        {/* TOP: HORIZONTAL HOTEL SELECTOR TABS */}
        <View style={styles.pmHotelsCol}>
          <View style={styles.pmColHeaderRow}>
 <Text style={styles.pmColHeaderTitle}> SELECT HOTEL TO CONFIGURE ({hotels.length} PROPERTIES)</Text>
            <Text style={styles.pmColHeaderSub}>Click any hotel below to configure accepted payment methods & account status</Text>
          </View>
          
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pmHotelsHorizontalScroll}
          >
            {hotels.map((h) => {
              const isSelected = selectedHotelForPayments?.id === h.id;
              const isPaid = (h.paymentStatus || 'Paid').toLowerCase() === 'paid';
              const methodCount = (h.paymentMethods || []).length;
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.pmHotelCardHorizontal, isSelected && styles.pmHotelCardActive]}
                  onPress={() => handleSelectHotelForPayments(h)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: h.imageLink }} style={styles.pmHotelThumb} />
                  <View style={styles.pmHotelMeta}>
                    <View style={styles.pmHotelHeader}>
                      <Text
                        style={[styles.pmHotelName, isSelected && styles.pmHotelNameActive]}
                        numberOfLines={1}
                      >
                        {h.title || h.name}
                      </Text>
                      {isSelected && (
                        <View style={styles.pmActiveBadge}>
                          <Text style={styles.pmActiveBadgeText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.pmHotelLoc} numberOfLines={1}>
 {h.location}
                    </Text>
                    <View style={styles.pmHotelBadges}>
                      <Text
                        style={[
                          styles.pmPayStatusBadge,
                          isPaid ? styles.pmPayStatusPaid : styles.pmPayStatusPending,
                        ]}
                      >
 {isPaid ? ' Paid' : ' Pending'}
                      </Text>
                      <Text style={styles.pmMethodCountBadge}>
 {methodCount} Methods
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* FULL-WIDTH VERTICAL PAYMENT CONFIGURATION */}
        <View style={styles.pmConfigCol}>
          
          {/* Selected Hotel Overview Card */}
          <View style={styles.pmSelectedHotelHeader}>
            <Image
              source={{ uri: selectedHotelForPayments?.imageLink }}
              style={styles.pmSelectedHotelThumb}
            />
            <View style={styles.pmSelectedHotelInfo}>
              <View style={styles.pmSelectedHotelTopRow}>
                <Text style={styles.pmSelectedHotelTitle}>
                  {selectedHotelForPayments?.title}
                </Text>
                <Text style={styles.pmSelectedHotelPrice}>
                  {selectedHotelForPayments?.pricePerNight || '₹8,500 / night'}
                </Text>
              </View>
              <Text style={styles.pmSelectedHotelAddress}>
 {selectedHotelForPayments?.location}
              </Text>
              
              {/* Hotel Account Payment Status Banner with 1-Click Toggle */}
              <View style={styles.pmAccountStatusRow}>
                <TouchableOpacity
                  style={[
                    styles.pmAccountStatusBtn,
                    (selectedHotelForPayments?.paymentStatus || '').toLowerCase() === 'paid'
                      ? styles.pmAccountStatusPaid
                      : styles.pmAccountStatusPending,
                  ]}
                  onPress={() => handleToggleHotelPayment(selectedHotelForPayments)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pmAccountStatusText}>
                    {(selectedHotelForPayments?.paymentStatus || '').toLowerCase() === 'paid'
 ? ' Account Payment: COMPLETED (PAID) — Click to Mark as Not Made ↺'
 : ' Account Payment: NOT MADE / PENDING — Click to Mark as Paid ✓'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Vertical Accepted Payment Methods Section Header */}
          <View style={styles.pmSectionTitleRow}>
            <View>
              <Text style={styles.pmSectionTitle}>
 ACCEPTED PAYMENT METHODS (VERTICAL CONFIGURATION)
              </Text>
              <Text style={styles.pmSectionSub}>
                Click any vertical card below to toggle acceptance on or off for {selectedHotelForPayments?.title}.
              </Text>
            </View>
            <View style={styles.pmActiveCounter}>
              <Text style={styles.pmActiveCounterText}>
                {hotelPaymentMethods.length} Methods Enabled
              </Text>
            </View>
          </View>

          {/* VERTICAL LIST OF PAYMENT METHODS */}
          <View style={styles.verticalPaymentList}>
            {allDisplayPaymentMethods.map((pm) => {
              const isChecked = isPaymentMethodChecked(pm.name);
              return (
                <TouchableOpacity
                  key={pm.id}
                  style={[
                    styles.verticalPaymentItem,
                    isChecked && styles.verticalPaymentItemChecked,
                  ]}
                  onPress={() => handleTogglePaymentMethod(pm.name)}
                  activeOpacity={0.85}
                >
                  {/* Left: Icon circle */}
                  <View
                    style={[
                      styles.vpmIconWrap,
                      isChecked && styles.vpmIconWrapChecked,
                    ]}
                  >
                    <Text style={styles.vpmIconText}>{pm.icon}</Text>
                  </View>

                  {/* Center: Title + Subtitle + Tag */}
                  <View style={styles.vpmInfoCol}>
                    <View style={styles.vpmTitleRow}>
                      <Text
                        style={[
                          styles.vpmTitleText,
                          isChecked && styles.vpmTitleTextChecked,
                        ]}
                      >
                        {pm.name}
                      </Text>
                      <Text
                        style={[
                          styles.vpmTagBadge,
                          isChecked && styles.vpmTagBadgeChecked,
                        ]}
                      >
                        {pm.tag}
                      </Text>
                    </View>
                    <Text style={styles.vpmDescText}>{pm.desc}</Text>
                  </View>

                  {/* Right: Vertical Toggle Pill */}
                  <View
                    style={[
                      styles.vpmToggleBtn,
                      isChecked
                        ? styles.vpmToggleBtnActive
                        : styles.vpmToggleBtnInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.vpmToggleText,
                        isChecked
                          ? styles.vpmToggleTextActive
                          : styles.vpmToggleTextInactive,
                      ]}
                    >
 {isChecked ? '✓ ACCEPTED' : '+ ENABLE'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add Custom Payment Method (Vertical Input Card) */}
          <View style={styles.customAddCard}>
 <Text style={styles.customAddTitle}>+ ADD CUSTOM PAYMENT METHOD</Text>
            <Text style={styles.customAddSub}>
              Enter any bespoke billing agreement, corporate voucher, or alternative currency.
            </Text>
            <View style={styles.customAddRow}>
              <TextInput
                style={styles.customInput}
                placeholder="e.g. Sodexo Meal Pass, Bitcoin Lightning, Diners Club..."
                placeholderTextColor="#807E78"
                value={customPaymentInput}
                onChangeText={setCustomPaymentInput}
              />
              <TouchableOpacity
                style={styles.customAddBtn}
                onPress={handleAddCustomPayment}
                activeOpacity={0.8}
              >
                <Text style={styles.customAddBtnText}>+ Add Method</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Changes Button */}
          <TouchableOpacity
            style={styles.savePaymentsBtn}
            onPress={handleSaveHotelPaymentMethods}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#101114" size="small" />
            ) : (
              <Text style={styles.savePaymentsBtnText}>
 Save Accepted Payment Methods for {selectedHotelForPayments?.title}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ===========================================================================
  // RENDER TAB: AVAILABILITY MATRIX
  // ===========================================================================
  const renderAvailabilityTab = () => (
    <View style={styles.tabContentContainer}>
      <View style={styles.sectionHeaderRow}>
        <View>
 <Text style={styles.sectionTitle}> 1-CLICK AVAILABILITY MATRIX</Text>
          <Text style={styles.sectionSub}>
            Direct operational control: click any badge to toggle between 'Available' and 'Not Available'
          </Text>
        </View>
      </View>

      {/* Hotels Group */}
 <Text style={styles.matrixGroupTitle}> Hotels ({hotels.length})</Text>
      <View style={styles.matrixGrid}>
        {hotels.map((h) => {
          const isAvail = h.availability === 'Available' || !h.availability;
          return (
            <View key={h.id} style={styles.matrixCard}>
              <Text style={styles.matrixCardTitle} numberOfLines={1}>{h.title || h.name}</Text>
              <Text style={styles.matrixCardSub}>{h.pricePerNight || '₹24,500'}</Text>
              <TouchableOpacity
                style={[styles.matrixBadge, isAvail ? styles.availGreenBtn : styles.availRedBtn]}
                onPress={() => handleToggleAvailability('hotels', h)}
                activeOpacity={0.8}
              >
                <Text style={styles.matrixBadgeText}>
 {isAvail ? ' Available' : ' Not Available'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Restaurants Group */}
 <Text style={styles.matrixGroupTitle}> Restaurants ({restaurants.length})</Text>
      <View style={styles.matrixGrid}>
        {restaurants.map((r) => {
          const isAvail = r.availability === 'Available' || !r.availability;
          return (
            <View key={r.id} style={styles.matrixCard}>
              <Text style={styles.matrixCardTitle} numberOfLines={1}>{r.title || r.name}</Text>
              <Text style={styles.matrixCardSub}>{r.cuisine}</Text>
              <TouchableOpacity
                style={[styles.matrixBadge, isAvail ? styles.availGreenBtn : styles.availRedBtn]}
                onPress={() => handleToggleAvailability('restaurants', r)}
                activeOpacity={0.8}
              >
                <Text style={styles.matrixBadgeText}>
 {isAvail ? ' Available' : ' Not Available'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Gyms Group */}
 <Text style={styles.matrixGroupTitle}> Gyms ({gyms.length})</Text>
      <View style={styles.matrixGrid}>
        {gyms.map((g) => {
          const isAvail = g.availability === 'Available' || !g.availability;
          return (
            <View key={g.id} style={styles.matrixCard}>
              <Text style={styles.matrixCardTitle} numberOfLines={1}>{g.title || g.name}</Text>
              <Text style={styles.matrixCardSub}>{g.timings || '6am - 10pm'}</Text>
              <TouchableOpacity
                style={[styles.matrixBadge, isAvail ? styles.availGreenBtn : styles.availRedBtn]}
                onPress={() => handleToggleAvailability('gyms', g)}
                activeOpacity={0.8}
              >
                <Text style={styles.matrixBadgeText}>
 {isAvail ? ' Available' : ' Not Available'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );

  // ===========================================================================
  // RENDER TAB: NEARBY PLACES & CATEGORIES MANAGER
  // ===========================================================================
  const renderPlacesManagerTab = () => {
    const STANDARD_PLACE_CATEGORIES = [
      { key: 'touristPlaces', label: 'Tourist Places', icon: 'compass' },
      { key: 'shopping', label: 'Shopping & Malls', icon: 'shopping-bag' },
      { key: 'transportation', label: 'Transit & Mobility', icon: 'truck' },
      { key: 'hospitals', label: 'Hospitals (24/7)', icon: 'shield-check' },
      { key: 'pharmacies', label: 'Pharmacies (24/7)', icon: 'activity' },
      { key: 'gyms', label: 'Wellness & Gyms', icon: 'dumbbell' },
      { key: 'pools', label: 'Swimming Pools', icon: 'waves' },
      { key: 'takeaways', label: 'Takeaways', icon: 'shopping-bag' },
      { key: 'dining', label: 'Fine Dining', icon: 'utensils' },
    ];

    const allCategories = [
      ...STANDARD_PLACE_CATEGORIES,
      ...((currentActiveHotel?.customCategories || []).map((c) => ({
        key: c.key || c.id,
        label: c.name || c.label || c.key,
        icon: c.icon || 'sparkles',
        isCustom: true,
      }))),
    ];

    const currentCategoryPlaces = currentActiveHotel?.nearby?.[selectedPlaceCategory] || [];
    const activeCatObj = allCategories.find((c) => c.key === selectedPlaceCategory) || allCategories[0];

    const handleTestDirections = (place) => {
      const directionsUrl = activeHotelService.calculateDynamicDirections(currentActiveHotel, place);
      if (directionsUrl && Platform.OS === 'web') {
        window.open(directionsUrl, '_blank', 'noopener,noreferrer');
      } else if (directionsUrl) {
        Linking.openURL(directionsUrl);
      } else {
        showToast('Cannot generate directions: Hotel GPS coordinates are unset!', 'error');
      }
    };

    return (
      <View style={styles.tabContentContainer}>
        {/* 1. Header & Live Origin Verification Bar */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <LucideIcon name="compass" size={20} color="#C5A46D" />
              <Text style={styles.sectionTitle}>NEARBY PLACES & CATEGORIES</Text>
            </View>
            <Text style={styles.sectionSub}>
              Manage attractions, shopping, transit, medical gateways and custom categories for {currentActiveHotel?.name || 'Active Hotel'}
            </Text>
          </View>

          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              style={styles.createItemBtn}
              onPress={() => handleOpenAddPlaceModal(selectedPlaceCategory)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <LucideIcon name="plus" size={13} color="#101114" />
                  <Text style={styles.createItemBtnText}>Add Place to {activeCatObj.label}</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addBtn, { borderColor: '#C5A46D' }]}
              onPress={() => setCustomCatModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <LucideIcon name="plus" size={13} color="#C5A46D" />
                <Text style={styles.addBtnText}>Add Custom Category</Text>
              </View>
            </TouchableOpacity>

            {activeCatObj.isCustom && (
              <TouchableOpacity
                style={[styles.deleteItemBtn, { alignSelf: 'center', marginVertical: 0 }]}
                onPress={() => handleDeleteCustomCategory(activeCatObj.key, activeCatObj.label)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <LucideIcon name="trash-2" size={12} color="#D9534F" />
                    <Text style={styles.deleteItemBtnText}>Delete Category</Text>
                  </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 2. LIVE ORIGIN VERIFICATION BANNER */}
        <View style={styles.placesOriginBanner}>
          <View style={styles.placesOriginHeader}>
 <Text style={styles.placesOriginIcon}></Text>
            <View style={{ flex: 1 }}>
              <View style={styles.placesOriginTitleRow}>
                <Text style={styles.placesOriginTitle}>
                  PERMANENT ORIGIN FOR ALL TURNS & DIRECTIONS:
                </Text>
                <View style={styles.placesOriginStatusBadge}>
                  <Text style={styles.placesOriginStatusText}>
                    {currentActiveHotel?.latitude && currentActiveHotel?.longitude
 ? ' GPS ORIGIN VERIFIED'
 : ' GPS COORDS NOT SET'}
                  </Text>
                </View>
              </View>
              <Text style={styles.placesOriginHotelName}>
                {currentActiveHotel?.name || 'Hotel Not Configured'} ({currentActiveHotel?.city || 'Unset'})
              </Text>
              <Text style={styles.placesOriginCoords}>
 Origin: Lat: {currentActiveHotel?.latitude ?? 'Not set'}, Lng: {currentActiveHotel?.longitude ?? 'Not set'} • Address: {currentActiveHotel?.address || 'Not set'}
              </Text>
              <Text style={styles.placesOriginFormula}>
 Formula: origin={currentActiveHotel?.latitude || 'hotel_lat'},{currentActiveHotel?.longitude || 'hotel_lng'} -> destination=place.latitude,place.longitude
              </Text>
            </View>
          </View>

          {/* Quick Action Buttons Row */}
          <View style={styles.placesActionPillsRow}>
            <TouchableOpacity
              style={styles.placesPresetBtn}
              onPress={handlePopulatePresetPlaces}
              activeOpacity={0.8}
            >
              <Text style={styles.placesPresetBtnText}>
 Populate Verified Places for {currentActiveHotel?.city || 'City'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.placesClearBtn}
              onPress={handleClearAllPlaces}
              activeOpacity={0.8}
            >
              <Text style={styles.placesClearBtnText}>
 Clear All Places (Test Empty State)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Category Filter Tabs */}
        <View style={styles.placesCatSelectorBox}>
          <Text style={styles.placesCatSelectorLabel}>
            SELECT CATEGORY TO VIEW & MANAGE ({allCategories.length} CATEGORIES):
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.placesCatScroll}
          >
            {allCategories.map((cat) => {
              const count = (currentActiveHotel?.nearby?.[cat.key] || []).length;
              const isSelected = selectedPlaceCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.placesCatChip,
                    isSelected && styles.placesCatChipActive,
                  ]}
                  onPress={() => setSelectedPlaceCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.placesCatIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.placesCatText,
                      isSelected && styles.placesCatTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                  <View
                    style={[
                      styles.placesCatCountBadge,
                      isSelected && styles.placesCatCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.placesCatCountText,
                        isSelected && styles.placesCatCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Places Cards / Table for Selected Category */}
        <View style={styles.placesListWrapper}>
          <View style={styles.placesListHeaderRow}>
            <Text style={styles.placesListHeaderTitle}>
              {activeCatObj.icon} {activeCatObj.label.toUpperCase()} ({currentCategoryPlaces.length} LISTINGS)
            </Text>
            <TouchableOpacity
              style={styles.inlineAddPlaceBtn}
              onPress={() => handleOpenAddPlaceModal(selectedPlaceCategory)}
              activeOpacity={0.8}
            >
              <Text style={styles.inlineAddPlaceBtnText}>
 + Add New Place
              </Text>
            </TouchableOpacity>
          </View>

          {currentCategoryPlaces.length === 0 ? (
            <View style={styles.placesEmptyCard}>
 <Text style={styles.placesEmptyIcon}></Text>
              <Text style={styles.placesEmptyTitle}>
                No {activeCatObj.label} added yet for {currentActiveHotel?.city || 'this hotel'}
              </Text>
              <Text style={styles.placesEmptySub}>
                The guest website will show a clean, elegant empty state ("No items added yet") for this category.
              </Text>
              <View style={styles.placesEmptyActions}>
                <TouchableOpacity
                  style={styles.placesEmptyAddBtn}
                  onPress={() => handleOpenAddPlaceModal(selectedPlaceCategory)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.placesEmptyAddBtnText}>
 + Add First Place to {activeCatObj.label}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.placesEmptyPopulateBtn}
                  onPress={handlePopulatePresetPlaces}
                  activeOpacity={0.8}
                >
                  <Text style={styles.placesEmptyPopulateBtnText}>
 Load City Preset Places
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.placesCardsCol}>
              {currentCategoryPlaces.map((place, pIdx) => {
                const hasGps = place.latitude != null && place.longitude != null;
                return (
                  <View key={place.id || `p-${pIdx}`} style={styles.placeItemCard}>
                    {/* Thumbnail Image */}
                    <Image
                      source={{ uri: place.imageLink || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80' }}
                      style={styles.placeItemThumb}
                    />

                    {/* Middle Info Column */}
                    <View style={styles.placeItemInfoCol}>
                      <View style={styles.placeItemTopRow}>
                        <Text style={styles.placeItemTitle} numberOfLines={1}>
                          {place.title || place.name}
                        </Text>
                        <View style={styles.placeItemBadge}>
                          <Text style={styles.placeItemBadgeText}>
 ★ {place.rating || 4.8}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.placeItemSubtitle} numberOfLines={1}>
                        {place.subtitle || place.description || 'Curated Destination'}
                      </Text>

                      {/* Location & GPS Info */}
                      <View style={styles.placeItemMetaRow}>
                        <Text style={styles.placeItemMetaText}>
 {place.address || place.location || 'Local Area'} ({place.distance || '1.2 km'})
                        </Text>
                        <Text
                          style={[
                            styles.placeItemCoordsBadge,
                            hasGps ? styles.placeItemCoordsValid : styles.placeItemCoordsMissing,
                          ]}
                        >
                          {hasGps
                            ? `GPS: ${Number(place.latitude).toFixed(4)}, ${Number(place.longitude).toFixed(4)}`
                            : 'GPS: Missing Coords'}
                        </Text>
                      </View>

                      {/* 10-Digit ID & Faculty 5-Data Preview */}
                      <View style={styles.placeIdAndDataRow}>
                        <View style={styles.placeItem10DigitBadge}>
                          <Text style={styles.placeItem10DigitLabel}>10-DIGIT ID:</Text>
                          <Text style={styles.placeItem10DigitValue}>{place.id || 'N/A'}</Text>
                        </View>
                        {(place.data1 || place.timing || place.hours) && (
                          <Text style={styles.placeItemDataPoint} numberOfLines={1}>
                            • {place.data1 || place.timing || place.hours}
                          </Text>
                        )}
                        {(place.data3 || place.offer) && (
                          <Text style={styles.placeItemDataPoint} numberOfLines={1}>
                            • {place.data3 || place.offer}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Right Action Column */}
                    <View style={styles.placeItemActionsCol}>
                      <TouchableOpacity
                        style={styles.placeItemEditBtn}
                        onPress={() => handleOpenEditPlaceModal(selectedPlaceCategory, place)}
                        activeOpacity={0.8}
                      >
 <Text style={styles.placeItemEditBtnText}> Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.placeItemDirBtn}
                        onPress={() => handleTestDirections(place)}
                        activeOpacity={0.8}
                      >
 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <LucideIcon name="compass" size={13} color="#F2EFE8" />
                          <Text style={styles.placeItemDirBtnText}>Test Directions</Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.placeItemDeleteBtn}
                        onPress={() => handleDeletePlace(selectedPlaceCategory, place.id, place.title)}
                        activeOpacity={0.8}
                      >
 <Text style={styles.placeItemDeleteBtnText}> Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  // ===========================================================================
  // ADD PLACE POPUP MODAL (WITH 10-DIGIT ID & FACULTY 5 DATA POINTS)
  // ===========================================================================
  const renderPlaceModal = () => {
    return (
      <Modal
        visible={placeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPlaceModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>
 {editingPlaceId ? ' Edit Place Details' : '+ Add New Place to Active Hotel'}
                </Text>
                <Text style={styles.modalHeaderSub}>
                  {editingPlaceId
                    ? `Update place specifications • Live GPS routing origin bound to ${currentActiveHotel?.name}`
                    : `Assigned verified 10-digit ID • Live GPS routing origin bound to ${currentActiveHotel?.name}`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPlaceModalVisible(false)}
              >
 <LucideIcon name="x" size={16} color="#A5A39D" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalFormContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.formLabel}>Target Category *</Text>
              <View style={styles.availSelectorRow}>
                {[
 { key: 'touristPlaces', label: 'Tourist Places', icon: '' },
 { key: 'shopping', label: 'Shopping', icon: '' },
 { key: 'transportation', label: 'Transit', icon: '' },
 { key: 'hospitals', label: 'Hospitals', icon: '' },
 { key: 'pharmacies', label: 'Pharmacies', icon: '' },
 { key: 'gyms', label: 'Gyms', icon: '' },
 { key: 'pools', label: 'Swimming Pools', icon: '' },
 { key: 'takeaways', label: 'Takeaways', icon: '' },
 { key: 'dining', label: 'Dining', icon: '' },
                  ...((currentActiveHotel?.customCategories || []).map((c) => ({
                    key: c.key || c.id,
                    label: c.name || c.label || c.key,
                    icon: c.icon || 'sparkles',
                  }))),
                ].map((c) => {
                  const cKey = c.key;
                  const isSel = newPlaceForm.category === cKey;
                  return (
                    <TouchableOpacity
                      key={cKey}
                      style={[styles.availPill, isSel && styles.availPillActiveGreen]}
                      onPress={() => setNewPlaceForm({ ...newPlaceForm, category: cKey })}
                    >
                      <Text style={[styles.availPillText, isSel && { color: '#C5A46D' }]}>
                        {c.icon} {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.formLabel}>Place Title / Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Lalbagh Botanical Gardens"
                placeholderTextColor="#807E78"
                value={newPlaceForm.title}
                onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, title: text })}
              />

              <Text style={styles.formLabel}>Subtitle / Short Description</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Historic Glass House & 240-Acre Royal Botanical Haven"
                placeholderTextColor="#807E78"
                value={newPlaceForm.subtitle}
                onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, subtitle: text })}
              />

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Destination Latitude (GPS) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 12.9507"
                    placeholderTextColor="#807E78"
                    value={newPlaceForm.latitude}
                    onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, latitude: text })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Destination Longitude (GPS) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 77.5848"
                    placeholderTextColor="#807E78"
                    value={newPlaceForm.longitude}
                    onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, longitude: text })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Address / Area</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 123 Main Avenue, City, Postal Code"
                    placeholderTextColor="#807E78"
                    value={newPlaceForm.address}
                    onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, address: text })}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Distance from Hotel</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 3.2 km"
                    placeholderTextColor="#807E78"
                    value={newPlaceForm.distance}
                    onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, distance: text })}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Rating (out of 5.0)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 4.9"
                    placeholderTextColor="#807E78"
                    value={newPlaceForm.rating}
                    onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, rating: text })}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Operating Hours / Timings</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 6:00 AM - 7:00 PM"
                    placeholderTextColor="#807E78"
                    value={newPlaceForm.timings}
                    onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, timings: text })}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Image Web Link (URL)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="https://images.unsplash.com/photo-..."
                placeholderTextColor="#807E78"
                value={newPlaceForm.imageLink}
                onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, imageLink: text })}
              />

              <Text style={styles.formLabel}>Website / Portal URL</Text>
              <TextInput
                style={styles.formInput}
                placeholder="https://example.com"
                placeholderTextColor="#807E78"
                value={newPlaceForm.websiteUrl}
                onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, websiteUrl: text })}
              />

              {/* Faculty 5-Column Data Specification */}
              <View style={styles.catSpecificBlock}>
                <Text style={styles.formLabel}>Faculty 5 Data Points Specification:</Text>
                <TextInput
                  style={[styles.formInput, { marginBottom: 6 }]}
 placeholder="Data 1 (e.g. ★ 4.9 Guest Rating)"
                  placeholderTextColor="#807E78"
                  value={newPlaceForm.data1}
                  onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, data1: text })}
                />
                <TextInput
                  style={[styles.formInput, { marginBottom: 6 }]}
                  placeholder="Data 2 (e.g. 2.4 km from Hotel)"
                  placeholderTextColor="#807E78"
                  value={newPlaceForm.data2}
                  onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, data2: text })}
                />
                <TextInput
                  style={[styles.formInput, { marginBottom: 6 }]}
                  placeholder="Data 3 (e.g. Priority Resident Privilege)"
                  placeholderTextColor="#807E78"
                  value={newPlaceForm.data3}
                  onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, data3: text })}
                />
                <TextInput
                  style={[styles.formInput, { marginBottom: 6 }]}
                  placeholder="Data 4 (e.g. Open 6am - 7pm)"
                  placeholderTextColor="#807E78"
                  value={newPlaceForm.data4}
                  onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, data4: text })}
                />
                <TextInput
                  style={styles.formInput}
                  placeholder="Data 5 (e.g. Concierge Chauffeur Booking)"
                  placeholderTextColor="#807E78"
                  value={newPlaceForm.data5}
                  onChangeText={(text) => setNewPlaceForm({ ...newPlaceForm, data5: text })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPlaceModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveNewPlace}
              >
                <Text style={styles.modalSaveText}>
 {editingPlaceId ? ' Save Place Changes' : ' Add Place & Generate 10-Digit ID'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ===========================================================================
  // ADD CUSTOM CATEGORY MODAL
  // ===========================================================================
  const renderCustomCategoryModal = () => {
    return (
      <Modal
        visible={customCatModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomCatModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { maxWidth: 450 }]}>
            <View style={styles.modalHeader}>
              <View>
 <Text style={styles.modalHeaderTitle}> Add Custom Category</Text>
                <Text style={styles.modalHeaderSub}>
                  Create bespoke tracks (e.g. Art Galleries, Temples, Beaches, Nightlife)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCustomCatModalVisible(false)}
              >
 <LucideIcon name="x" size={16} color="#A5A39D" />
              </TouchableOpacity>
            </View>

            <View style={[styles.modalFormContent, { padding: 18, gap: 14 }]}>
              <Text style={styles.formLabel}>Category Display Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Art Galleries & Museums"
                placeholderTextColor="#807E78"
                value={customCatName}
                onChangeText={(text) => {
                  setCustomCatName(text);
                  if (!customCatKey || customCatKey === customCatName.toLowerCase().replace(/[^a-z0-9]/g, '_')) {
                    setCustomCatKey(text.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                  }
                }}
              />

              <Text style={styles.formLabel}>Category Storage Key (Alphanumeric) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. art_galleries"
                placeholderTextColor="#807E78"
                value={customCatKey}
                onChangeText={setCustomCatKey}
              />

              <Text style={styles.formLabel}>Category Icon (Emoji)</Text>
              <TextInput
                style={styles.formInput}
 placeholder="e.g. sparkles"
                placeholderTextColor="#807E78"
                value={customCatIcon}
                onChangeText={setCustomCatIcon}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCustomCatModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCreateCustomCategory}
              >
                <Text style={styles.modalSaveText}>Create Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ===========================================================================
  // CRUD POPUP MODAL (CREATE / EDIT FORM)
  // ===========================================================================
  const renderItemModal = () => {
    const isEdit = modalMode === 'edit';
    const catLabel =
      modalCategory === 'hotels'
        ? 'Hotel Property'
        : modalCategory === 'restaurants'
        ? 'Restaurant & Dining'
        : modalCategory === 'gyms'
        ? 'Gym & Wellness'
        : (modalCategory === 'pools' || modalCategory === 'swimming_pools')
        ? 'Swimming Pool'
        : modalCategory === 'takeaway'
        ? 'Takeaway Partner'
        : (modalCategory === 'delivery' || modalCategory === 'homeDelivery')
        ? 'Home / Suite Delivery'
        : 'Hotel Facility & Service';

    return (
      <Modal
        visible={itemModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>
 {isEdit ? ` Edit ${catLabel}` : `+ Add New ${catLabel}`}
                </Text>
                <Text style={styles.modalHeaderSub}>
                  Persists to MongoDB & updates Guest Portal immediately ({modalCategory})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setItemModalVisible(false)}
              >
 <LucideIcon name="x" size={16} color="#A5A39D" />
              </TouchableOpacity>
            </View>

            {/* Category Selector Tabs when Creating */}
            {!isEdit && (
              <View style={styles.modalCategoryPicker}>
                <Text style={styles.formCategoryPickerLabel}>SELECT COMPONENT CATEGORY:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryChipsScroll}>
                  {[
 { key: 'restaurants', label: ' Dining', defaultPrice: '₹₹₹₹' },
 { key: 'gyms', label: ' Gym & Fitness', defaultPrice: '₹1,500 / day pass' },
 { key: 'pools', label: ' Swimming Pool', defaultPrice: 'Resident Access Available' },
 { key: 'facilities', label: ' Facility / Service', defaultPrice: 'Complimentary' },
 { key: 'takeaway', label: ' Takeaway', defaultPrice: 'Min ₹400' },
 { key: 'delivery', label: ' Room Delivery', defaultPrice: 'Free Suite Delivery' },
 { key: 'hotels', label: ' Hotel Property', defaultPrice: '₹8,500 / night' },
                  ].map((cat) => {
                    const isSelected = modalCategory === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                        onPress={() => {
                          setModalCategory(cat.key);
                          if (!formFields.price || formFields.price.includes('₹') || formFields.price.includes('Free') || formFields.price.includes('Complimentary')) {
                            setFormFields((prev) => ({ ...prev, price: cat.defaultPrice }));
                          }
                        }}
                      >
                        <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Modal Body / Scrollable Form */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalFormContent}
              showsVerticalScrollIndicator={true}
            >
              {/* Image Preview */}
              {formFields.imageLink ? (
                <View style={styles.formImagePreviewWrapper}>
                  <Image source={{ uri: formFields.imageLink }} style={styles.formImagePreview} />
                  <Text style={styles.formImageNote}>Live Image Preview</Text>
                </View>
              ) : null}

              {/* Title / Name */}
              <Text style={styles.formLabel}>Title / Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Royal Sea Palace Resort"
                placeholderTextColor="#807E78"
                value={formFields.title}
                onChangeText={(text) => setFormFields({ ...formFields, title: text })}
              />

              {/* Subtitle / Description */}
              <Text style={styles.formLabel}>Subtitle / Short Description</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 5-Star Heritage Palace Hotel & Suites"
                placeholderTextColor="#807E78"
                value={formFields.subtitle}
                onChangeText={(text) => setFormFields({ ...formFields, subtitle: text })}
              />

              {/* Location & Distance */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Location Area</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. City Center / Neighborhood"
                    placeholderTextColor="#807E78"
                    value={formFields.location}
                    onChangeText={(text) => setFormFields({ ...formFields, location: text })}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Distance from Hotel</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 0.5 km"
                    placeholderTextColor="#807E78"
                    value={formFields.distance}
                    onChangeText={(text) => setFormFields({ ...formFields, distance: text })}
                  />
                </View>
              </View>

              {/* Price / Rate & Rating */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>
                    {modalCategory === 'hotels'
                      ? 'Price / Night'
                      : modalCategory === 'restaurants'
                      ? 'Price Range / Cost for Two'
                      : modalCategory === 'gyms'
                      ? 'Day Pass / Membership Rate'
                      : (modalCategory === 'pools' || modalCategory === 'swimming_pools')
                      ? 'Pool Pass Rate / Access Fee'
                      : modalCategory === 'takeaway'
                      ? 'Min Order Value'
                      : (modalCategory === 'delivery' || modalCategory === 'homeDelivery')
                      ? 'Delivery Fee'
                      : 'Service Fee / Access (e.g. Complimentary)'}
                  </Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. ₹24,500 / night"
                    placeholderTextColor="#807E78"
                    value={formFields.price}
                    onChangeText={(text) => setFormFields({ ...formFields, price: text })}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Rating (out of 5.0)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 4.9"
                    placeholderTextColor="#807E78"
                    value={formFields.rating}
                    onChangeText={(text) => setFormFields({ ...formFields, rating: text })}
                  />
                </View>
              </View>

              {/* Image Link */}
              <Text style={styles.formLabel}>Image Web Link (URL)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="https://images.unsplash.com/photo-..."
                placeholderTextColor="#807E78"
                value={formFields.imageLink}
                onChangeText={(text) => setFormFields({ ...formFields, imageLink: text })}
              />

              {/* Availability Selector */}
              <Text style={styles.formLabel}>Operational Status</Text>
              <View style={styles.availSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.availPill,
                    formFields.availability === 'Available' && styles.availPillActiveGreen,
                  ]}
                  onPress={() => setFormFields({ ...formFields, availability: 'Available' })}
                >
 <Text style={styles.availPillText}> Available</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.availPill,
                    formFields.availability === 'Not Available' && styles.availPillActiveRed,
                  ]}
                  onPress={() => setFormFields({ ...formFields, availability: 'Not Available' })}
                >
 <Text style={styles.availPillText}> Not Available</Text>
                </TouchableOpacity>
              </View>

              {/* Category Specific Options */}
              {modalCategory === 'restaurants' && (
                <View style={styles.catSpecificBlock}>
                  <Text style={styles.formLabel}>Cuisine Type</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Pan-Asian & Sushi"
                    placeholderTextColor="#807E78"
                    value={formFields.cuisine}
                    onChangeText={(text) => setFormFields({ ...formFields, cuisine: text })}
                  />
                  <View style={styles.checkboxRow}>
                    <TouchableOpacity
                      style={styles.checkboxItem}
                      onPress={() =>
                        setFormFields({
                          ...formFields,
                          takeawayEnabled: !formFields.takeawayEnabled,
                        })
                      }
                    >
                      <Text style={styles.checkboxIcon}>
 <LucideIcon name={formFields.takeawayEnabled ? "check-circle" : "circle"} size={16} color={formFields.takeawayEnabled ? "#C5A46D" : "#807E78"} />
                      </Text>
                      <Text style={styles.checkboxLabel}>Enable Takeaway Pickup</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkboxItem}
                      onPress={() =>
                        setFormFields({
                          ...formFields,
                          homeDeliveryEnabled: !formFields.homeDeliveryEnabled,
                        })
                      }
                    >
                      <Text style={styles.checkboxIcon}>
 <LucideIcon name={formFields.homeDeliveryEnabled ? "check-circle" : "circle"} size={16} color={formFields.homeDeliveryEnabled ? "#C5A46D" : "#807E78"} />
                      </Text>
                      <Text style={styles.checkboxLabel}>Enable Room Delivery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {(modalCategory === 'gyms' || modalCategory === 'pools' || modalCategory === 'swimming_pools' || modalCategory === 'facilities' || modalCategory === 'restaurants') && (
                <View style={styles.catSpecificBlock}>
                  <Text style={styles.formLabel}>Operating Hours / Timings</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 6:00 AM - 10:00 PM Daily"
                    placeholderTextColor="#807E78"
                    value={formFields.timings}
                    onChangeText={(text) => setFormFields({ ...formFields, timings: text })}
                  />
                </View>
              )}

              {(modalCategory === 'takeaway' || modalCategory === 'delivery') && (
                <View style={styles.catSpecificBlock}>
                  <Text style={styles.formLabel}>Estimated Time (Ready / Delivery)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 15 mins ready or 25-30 mins"
                    placeholderTextColor="#807E78"
                    value={formFields.timeEstimate}
                    onChangeText={(text) => setFormFields({ ...formFields, timeEstimate: text })}
                  />
                </View>
              )}

              {modalCategory === 'hotels' && (
                <View style={styles.catSpecificBlock}>
                  <Text style={styles.formLabel}>Accepted Payment Methods (Hotels Only)</Text>
                  <View style={styles.optionsGrid}>
                    {STANDARD_PAYMENT_OPTIONS.map((opt, idx) => {
                      const isChecked = formFields.paymentMethods.some(
                        (m) =>
                          m.toLowerCase().includes(opt.toLowerCase()) ||
                          opt.toLowerCase().includes(m.toLowerCase())
                      );
                      return (
                        <TouchableOpacity
                          key={`opt-f-${idx}`}
                          style={[
                            styles.paymentOptionItem,
                            isChecked && styles.paymentOptionItemChecked,
                          ]}
                          onPress={() => {
                            const cur = formFields.paymentMethods;
                            const next = isChecked
                              ? cur.filter(
                                  (m) =>
                                    !m.toLowerCase().includes(opt.toLowerCase()) &&
                                    !opt.toLowerCase().includes(m.toLowerCase())
                                )
                              : [...cur, opt];
                            setFormFields({ ...formFields, paymentMethods: next });
                          }}
                        >
                          <Text
                            style={[
                              styles.optCheckbox,
                              isChecked && styles.optCheckboxChecked,
                            ]}
                          >
 <LucideIcon name={isChecked ? "check-circle" : "circle"} size={16} color={isChecked ? "#C5A46D" : "#807E78"} />
                          </Text>
                          <Text
                            style={[
                              styles.optLabel,
                              isChecked && styles.optLabelChecked,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer CTA */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setItemModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveItem}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#101114" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>
                    isEdit ? 'Update & Save' : 'Save Component'
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Top Admin Navigation Bar */}
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderLeft}>
          <LucideIcon name="hotel" size={22} color="#C5A46D" />
          <View>
            <Text style={styles.adminHeaderTitle}>HOTEL ADMIN CONSOLE</Text>
            <Text style={styles.adminHeaderSubtitle}>
              Property & Amenities Management • Live MongoDB ({connectedDbName})
            </Text>
          </View>
          {currentActiveHotel && (
            <View style={styles.headerActiveHotelPill}>
              <View style={styles.headerActiveDot} />
              <Text style={styles.headerActiveHotelText} numberOfLines={1}>
 {currentActiveHotel.name} ({currentActiveHotel.city || 'Active'})
              </Text>
            </View>
          )}
        </View>

        <View style={styles.adminHeaderRight}>
          <TouchableOpacity
            style={styles.addComponentHeaderBtn}
            onPress={() => handleOpenCreateModal('restaurants')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LucideIcon name="plus" size={14} color="#101114" />
              <Text style={styles.addComponentHeaderBtnText}>Add Component</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestPortalBtn}
            onPress={() => {
              if (onLaunchGuestWebsite) {
                onLaunchGuestWebsite(currentActiveHotel);
              } else if (onBackToGuestPortal) {
                onBackToGuestPortal();
              }
            }}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <LucideIcon name="external-link" size={14} color="#F2EFE8" />
              <Text style={styles.guestPortalBtnText}>
                Open Guest Website ({currentActiveHotel?.name ? (currentActiveHotel.city || 'Active') : 'Portal'})
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <LucideIcon name="log-out" size={13} color="#D9534F" />
              <Text style={styles.logoutBtnText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast Notification */}
      {toastMessage && (
        <View
          style={[
            styles.toast,
            toastMessage.type === 'error' ? styles.toastError : styles.toastSuccess,
          ]}
        >
          <Text style={styles.toastText}>{toastMessage.message}</Text>
        </View>
      )}

      {/* Main Admin Workspace: Sidebar Tabs + Content */}
      <View style={[styles.bodyLayout, !isDesktop && styles.bodyLayoutMobile]}>
        {/* Navigation Tabs Bar / Sidebar */}
        <View style={[styles.tabsBar, !isDesktop && styles.tabsBarMobile]}>
          <ScrollView
            horizontal={!isDesktop}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {ADMIN_TABS.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              const prevTab = idx > 0 ? ADMIN_TABS[idx - 1] : null;
              const showSectionHeader = isDesktop && (!prevTab || prevTab.section !== tab.section);

              return (
                <React.Fragment key={tab.id}>
                  {showSectionHeader && (
                    <View style={styles.tabSectionHeader}>
                      <Text style={styles.tabSectionHeaderText}>{tab.section}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.tabButton, isActive && styles.tabButtonActive]}
                    onPress={() => {
                      setActiveTab(tab.id);
                      setComponentSearchQuery('');
                    }}
                    activeOpacity={0.8}
                  >
                    <LucideIcon name={tab.icon} size={17} color={isActive ? "#C5A46D" : "#A5A39D"} />
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab Content Display */}
        <ScrollView
          style={styles.contentArea}
          contentContainerStyle={styles.contentAreaInner}
          showsVerticalScrollIndicator={true}
        >
          {activeTab === 'hotel_config' && renderHotelConfigTab()}
          {activeTab === 'places_manager' && renderPlacesManagerTab()}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'hotels' && renderHotelsTab()}
          {activeTab === 'restaurants' && renderRestaurantsTab()}
          {activeTab === 'gyms' && renderGymsTab()}
          {activeTab === 'pools' && renderPoolsTab()}
          {activeTab === 'takeaway' && renderTakeawayTab()}
          {activeTab === 'delivery' && renderDeliveryTab()}
          {activeTab === 'facilities' && renderFacilitiesTab()}
          {activeTab === 'payments' && renderPaymentsTab()}
          {activeTab === 'availability' && renderAvailabilityTab()}
        </ScrollView>
      </View>

      {/* Interactive CRUD Modal Dialog */}
      {itemModalVisible && renderItemModal()}
      {placeModalVisible && renderPlaceModal()}
      {customCatModalVisible && renderCustomCategoryModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#101114',
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B31',
    flexWrap: 'wrap',
    gap: 12,
  },
  adminHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminHeaderLogo: {
    fontSize: 22,
  },
  adminHeaderTitle: {
    color: '#F2EFE8',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  adminHeaderSubtitle: {
    color: '#A5A39D',
    fontSize: 11,
  },
  adminHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addComponentHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#C5A46D',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F6E05E',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  addComponentHeaderBtnText: {
    color: '#101114',
    fontSize: 11,
    fontWeight: '900',
  },
  guestPortalBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(197, 164, 109, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C5A46D',
  },
  guestPortalBtnText: {
    color: '#C5A46D',
    fontSize: 11,
    fontWeight: '800',
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  logoutBtnText: {
    color: '#D9534F',
    fontSize: 11,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  toastSuccess: {
    backgroundColor: '#059669',
  },
  toastError: {
    backgroundColor: '#DC2626',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Layout
  bodyLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  bodyLayoutMobile: {
    flexDirection: 'column',
  },
  tabsBar: {
    width: 220,
    backgroundColor: 'rgba(10, 15, 28, 0.95)',
    borderRightWidth: 1,
    borderRightColor: '#2A2B31',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabsBarMobile: {
    width: '100%',
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B31',
    paddingVertical: 6,
  },
  tabsScrollContent: {
    gap: 4,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(197, 164, 109, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.4)',
  },
  tabIcon: {
    fontSize: 15,
  },
  tabLabel: {
    color: '#A5A39D',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#C5A46D',
    fontWeight: '800',
  },

  contentArea: {
    flex: 1,
  },
  contentAreaInner: {
    padding: 16,
    paddingBottom: 40,
  },
  tabContentContainer: {
    gap: 16,
  },

  // Overview Tab
  overviewHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1D21',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2B31',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewGreeting: {
    color: '#C5A46D',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  overviewSub: {
    color: '#A5A39D',
    fontSize: 11,
    marginTop: 2,
  },
  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  resetButtonText: {
    color: '#D9534F',
    fontSize: 11,
    fontWeight: '700',
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#1C1D21',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2B31',
    gap: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      },
    }),
  },
  metricIcon: {
    fontSize: 20,
  },
  metricValue: {
    color: '#F2EFE8',
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#C5A46D',
    fontSize: 11.5,
    fontWeight: '700',
  },
  metricSub: {
    color: '#807E78',
    fontSize: 10,
  },

  subSectionTitle: {
    color: '#F2EFE8',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
  },
  shortcutsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shortcutCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#1C1D21',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2B31',
    gap: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  shortcutIcon: {
    fontSize: 20,
  },
  shortcutTitle: {
    color: '#C5A46D',
    fontSize: 12.5,
    fontWeight: '800',
  },
  shortcutDesc: {
    color: '#A5A39D',
    fontSize: 11,
    lineHeight: 16,
  },

  // Directory Tables
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B31',
  },
  sectionTitle: {
    color: '#F2EFE8',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionSub: {
    color: '#A5A39D',
    fontSize: 11.5,
    marginTop: 2,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createItemBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(197, 164, 109, 0.22)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C5A46D',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  createItemBtnText: {
    color: '#F2EFE8',
    fontSize: 12,
    fontWeight: '800',
  },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#2A2B31',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2B31',
  },
  addBtnText: {
    color: '#C5A46D',
    fontSize: 12,
    fontWeight: '800',
  },
  // Vertical Hotel List & Payment Status Styles
  verticalHotelsContainer: {
    gap: 16,
  },
  verticalHotelCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2B31',
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  verticalHotelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  verticalHotelThumb: {
    width: 100,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#25262B',
  },
  verticalHotelMainInfo: {
    flex: 1,
    gap: 4,
  },
  verticalHotelTitleLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  verticalHotelTitle: {
    color: '#F2EFE8',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  verticalHotelPrice: {
    color: '#C5A46D',
    fontSize: 15,
    fontWeight: '800',
  },
  verticalHotelLocation: {
    color: '#A5A39D',
    fontSize: 12,
    fontWeight: '500',
  },
  verticalHotelDesc: {
    color: '#807E78',
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  paymentStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentBarPaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  paymentBarUnpaid: {
    backgroundColor: 'rgba(217, 83, 79, 0.12)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  paymentStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 200,
  },
  paymentStatusIcon: {
    fontSize: 18,
  },
  paymentStatusTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  paymentTextPaid: {
    color: '#4E9F76',
  },
  paymentTextUnpaid: {
    color: '#D9534F',
  },
  paymentStatusSub: {
    color: '#A5A39D',
    fontSize: 11,
    marginTop: 1,
  },
  paymentToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  paymentToggleBtnMarkUnpaid: {
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  paymentToggleBtnMarkPaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  paymentToggleBtnText: {
    color: '#F2EFE8',
    fontSize: 11,
    fontWeight: '800',
  },
  verticalHotelFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemsTable: {
    gap: 10,
  },
  tableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1D21',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2B31',
    gap: 12,
    flexWrap: 'wrap',
  },
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  tableInfoCol: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  tableTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableItemTitle: {
    color: '#F2EFE8',
    fontSize: 13.5,
    fontWeight: '800',
  },
  tablePrice: {
    color: '#C5A46D',
    fontSize: 12,
    fontWeight: '800',
  },
  tableItemSub: {
    color: '#A5A39D',
    fontSize: 11,
  },
  hotelPmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  hotelPmLabel: {
    color: '#807E78',
    fontSize: 10.5,
    fontWeight: '700',
  },
  hotelPmChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  hotelPmChip: {
    backgroundColor: '#25262B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2A2B31',
  },
  hotelPmChipText: {
    color: '#F2EFE8',
    fontSize: 10,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  tagBadge: {
    color: '#A5A39D',
    fontSize: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  facilitiesText: {
    color: '#807E78',
    fontSize: 10.5,
  },
  tableActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  availToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  availGreenBtn: {
    backgroundColor: 'rgba(78, 159, 118, 0.15)',
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  availRedBtn: {
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  availToggleText: {
    color: '#F2EFE8',
    fontSize: 11,
    fontWeight: '800',
  },
  editItemBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  editItemBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  deleteItemBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  deleteItemBtnText: {
    color: '#D9534F',
    fontSize: 11,
    fontWeight: '800',
  },
  configPmBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#2A2B31',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2B31',
  },
  configPmBtnText: {
    color: '#C5A46D',
    fontSize: 11,
    fontWeight: '700',
  },

  // ===========================================================================
  // Vertical Payment Manager Tab Styles
  // ===========================================================================
  pmLayoutRow: {
    flexDirection: 'column',
    gap: 16,
    width: '100%',
    alignItems: 'stretch',
  },
  pmLayoutRowMobile: {
    flexDirection: 'column',
    gap: 14,
  },
  pmHotelsCol: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2B31',
    padding: 12,
  },
  pmHotelsColMobile: {
    width: '100%',
  },
  pmColHeaderRow: {
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B31',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pmColHeaderTitle: {
    color: '#C5A46D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pmColHeaderSub: {
    color: '#807E78',
    fontSize: 10,
  },
  pmHotelsHorizontalScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 2,
  },
  pmHotelsScroll: {
    maxHeight: 680,
  },
  pmHotelCardHorizontal: {
    width: 270,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#1C1D21',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2B31',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  pmHotelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#1C1D21',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2B31',
    marginBottom: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  pmHotelCardActive: {
    backgroundColor: 'rgba(197, 164, 109, 0.14)',
    borderColor: '#C5A46D',
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(197, 164, 109, 0.25)' },
    }),
  },
  pmHotelThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#25262B',
  },
  pmHotelMeta: {
    flex: 1,
    gap: 2,
  },
  pmHotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pmHotelName: {
    color: '#F2EFE8',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  pmHotelNameActive: {
    color: '#F2EFE8',
    fontWeight: '800',
  },
  pmActiveBadge: {
    backgroundColor: '#C5A46D',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  pmActiveBadgeText: {
    color: '#101114',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pmHotelLoc: {
    color: '#A5A39D',
    fontSize: 10,
  },
  pmHotelBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  pmPayStatusBadge: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  pmPayStatusPaid: {
    backgroundColor: 'rgba(78, 159, 118, 0.2)',
    color: '#4E9F76',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  pmPayStatusPending: {
    backgroundColor: 'rgba(217, 83, 79, 0.2)',
    color: '#D9534F',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  pmMethodCountBadge: {
    fontSize: 9,
    fontWeight: '600',
    color: '#A5A39D',
    backgroundColor: '#2A2B31',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pmConfigCol: {
    width: '100%',
    gap: 14,
  },
  pmSelectedHotelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.25)',
  },
  pmSelectedHotelThumb: {
    width: 74,
    height: 74,
    borderRadius: 10,
  },
  pmSelectedHotelInfo: {
    flex: 1,
    gap: 4,
  },
  pmSelectedHotelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pmSelectedHotelTitle: {
    color: '#F2EFE8',
    fontSize: 16,
    fontWeight: '800',
  },
  pmSelectedHotelPrice: {
    color: '#C5A46D',
    fontSize: 13,
    fontWeight: '800',
  },
  pmSelectedHotelAddress: {
    color: '#A5A39D',
    fontSize: 11,
  },
  pmAccountStatusRow: {
    marginTop: 4,
  },
  pmAccountStatusBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  pmAccountStatusPaid: {
    backgroundColor: 'rgba(78, 159, 118, 0.15)',
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  pmAccountStatusPending: {
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  pmAccountStatusText: {
    color: '#F2EFE8',
    fontSize: 11,
    fontWeight: '800',
  },
  pmSectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  pmSectionTitle: {
    color: '#F2EFE8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pmSectionSub: {
    color: '#A5A39D',
    fontSize: 11,
    marginTop: 2,
  },
  pmActiveCounter: {
    backgroundColor: 'rgba(78, 159, 118, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pmActiveCounterText: {
    color: '#4E9F76',
    fontSize: 11,
    fontWeight: '800',
  },
  verticalPaymentList: {
    gap: 8,
  },
  verticalPaymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2B31',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  verticalPaymentItemChecked: {
    backgroundColor: 'rgba(197, 164, 109, 0.1)',
    borderColor: '#C5A46D',
  },
  vpmIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#2A2B31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vpmIconWrapChecked: {
    backgroundColor: 'rgba(197, 164, 109, 0.2)',
    borderColor: '#C5A46D',
  },
  vpmIconText: {
    fontSize: 20,
  },
  vpmInfoCol: {
    flex: 1,
    gap: 3,
  },
  vpmTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vpmTitleText: {
    color: '#A5A39D',
    fontSize: 13,
    fontWeight: '700',
  },
  vpmTitleTextChecked: {
    color: '#F2EFE8',
    fontWeight: '800',
  },
  vpmTagBadge: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#807E78',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vpmTagBadgeChecked: {
    color: '#C5A46D',
    backgroundColor: 'rgba(197, 164, 109, 0.15)',
  },
  vpmDescText: {
    color: '#A5A39D',
    fontSize: 11,
    lineHeight: 15,
  },
  vpmToggleBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
  },
  vpmToggleBtnActive: {
    backgroundColor: 'rgba(78, 159, 118, 0.2)',
    borderColor: '#4E9F76',
  },
  vpmToggleBtnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  vpmToggleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vpmToggleTextActive: {
    color: '#4E9F76',
  },
  vpmToggleTextInactive: {
    color: '#A5A39D',
  },
  customAddCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2B31',
    padding: 12,
    gap: 6,
    marginTop: 4,
  },
  customAddTitle: {
    color: '#C5A46D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  customAddSub: {
    color: '#A5A39D',
    fontSize: 10.5,
    marginBottom: 4,
  },
  customAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#25262B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2B31',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 12,
  },
  customAddBtn: {
    backgroundColor: '#2A2B31',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAddBtnText: {
    color: '#C5A46D',
    fontSize: 11.5,
    fontWeight: '700',
  },
  savePaymentsBtn: {
    backgroundColor: '#C5A46D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  savePaymentsBtnText: {
    color: '#101114',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Availability Matrix
  matrixGroupTitle: {
    color: '#C5A46D',
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 8,
  },
  matrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  matrixCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#1C1D21',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2A2B31',
    gap: 4,
  },
  matrixCardTitle: {
    color: '#F2EFE8',
    fontSize: 12,
    fontWeight: '700',
  },
  matrixCardSub: {
    color: '#807E78',
    fontSize: 10,
  },
  matrixBadge: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  matrixBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },

  // Bookings Tab
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
  },
  bookingCard: {
    backgroundColor: '#1C1D21',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2B31',
    gap: 6,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  bookingTitle: {
    color: '#F2EFE8',
    fontSize: 13.5,
    fontWeight: '800',
  },
  bookingRefText: {
    color: '#807E78',
    fontSize: 10,
    marginTop: 1,
  },
  bookingHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingStatusBadge: {
    color: '#4E9F76',
    fontSize: 10.5,
    fontWeight: '800',
    backgroundColor: 'rgba(78, 159, 118, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  cancelBookingBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  cancelBookingText: {
    color: '#D9534F',
    fontSize: 10.5,
    fontWeight: '700',
  },
  bookingDetailText: {
    color: '#A5A39D',
    fontSize: 11.5,
  },

  // Modal Dialog Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    backgroundColor: '#101114',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C5A46D',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B31',
  },
  modalHeaderTitle: {
    color: '#F2EFE8',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalHeaderSub: {
    color: '#A5A39D',
    fontSize: 11,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2A2B31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#A5A39D',
    fontSize: 14,
    fontWeight: '700',
  },
  modalCategoryPicker: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#1C1D21',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B31',
  },
  formCategoryPickerLabel: {
    color: '#C5A46D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  categoryChipsScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: '#2A2B31',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: 6,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  categoryChipActive: {
    backgroundColor: 'rgba(197, 164, 109, 0.25)',
    borderColor: '#C5A46D',
  },
  categoryChipText: {
    color: '#A5A39D',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: '#F2EFE8',
    fontWeight: '800',
  },
  modalScrollView: {
    maxHeight: 520,
  },
  modalFormContent: {
    padding: 18,
    gap: 12,
  },
  formImagePreviewWrapper: {
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  formImagePreview: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2B31',
  },
  formImageNote: {
    color: '#807E78',
    fontSize: 10,
  },
  formLabel: {
    color: '#C5A46D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  formInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2B31',
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
  },
  availSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  availPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: '#2A2B31',
    alignItems: 'center',
  },
  availPillActiveGreen: {
    backgroundColor: 'rgba(78, 159, 118, 0.2)',
    borderColor: '#4E9F76',
  },
  availPillActiveRed: {
    backgroundColor: 'rgba(217, 83, 79, 0.2)',
    borderColor: '#D9534F',
  },
  availPillText: {
    color: '#F2EFE8',
    fontSize: 11.5,
    fontWeight: '800',
  },
  catSpecificBlock: {
    backgroundColor: '#1C1D21',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2B31',
    gap: 8,
    marginTop: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkboxIcon: {
    color: '#C5A46D',
    fontSize: 15,
  },
  checkboxLabel: {
    color: '#A5A39D',
    fontSize: 11.5,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#2A2B31',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  modalCancelText: {
    color: '#A5A39D',
    fontSize: 12,
    fontWeight: '700',
  },
  modalSaveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#C5A46D',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  modalSaveText: {
    color: '#101114',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // ---------------------------------------------------------------------------
  // Hotel Configurator & Active Hotel Styles
  // ---------------------------------------------------------------------------
  activeGuestLaunchBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#C5A46D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8BD8A',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  activeGuestLaunchText: {
    color: '#101114',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  activeStatusCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  activeStatusCardActive: {
    backgroundColor: 'rgba(78, 159, 118, 0.12)',
    borderColor: 'rgba(78, 159, 118, 0.4)',
  },
  activeStatusCardEmpty: {
    backgroundColor: 'rgba(217, 83, 79, 0.12)',
    borderColor: 'rgba(217, 83, 79, 0.35)',
  },
  activeStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeStatusIcon: {
    fontSize: 24,
  },
  activeStatusTitle: {
    color: '#F2EFE8',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeStatusDetails: {
    color: '#A5A39D',
    fontSize: 12,
    marginTop: 4,
  },
  clearActiveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(217, 83, 79, 0.2)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(217, 83, 79, 0.5)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  clearActiveBtnText: {
    color: '#D9534F',
    fontSize: 11,
    fontWeight: '700',
  },
  presetSection: {
    marginBottom: 24,
    backgroundColor: '#1C1D21',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2B31',
  },
  presetSectionTitle: {
    color: '#C5A46D',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  presetSectionSub: {
    color: '#A5A39D',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#25262B',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.25)',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.2s ease' },
    }),
  },
  presetCardLabel: {
    color: '#C5A46D',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  presetCardName: {
    color: '#F2EFE8',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  presetCardCoords: {
    color: '#A5A39D',
    fontSize: 11,
    marginBottom: 6,
  },
  presetCardHint: {
    color: '#A5A39D',
    fontSize: 10.5,
    fontStyle: 'italic',
  },
  configFormCard: {
    backgroundColor: '#1C1D21',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.2)',
  },
  configFormTitle: {
    color: '#F2EFE8',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 14,
  },
  formCol: {
    flex: 1,
    minWidth: 260,
  },
  formLabel: {
    color: '#C5A46D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: 'rgba(7, 10, 18, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F2EFE8',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  fieldHint: {
    color: '#A5A39D',
    fontSize: 10.5,
    marginTop: 4,
    fontStyle: 'italic',
  },
  configActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2B31',
  },
  saveOnlyBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  saveOnlyBtnText: {
    color: '#F2EFE8',
    fontSize: 13,
    fontWeight: '800',
  },
  saveAndLaunchBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#C5A46D',
    borderWidth: 1,
    borderColor: '#D8BD8A',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  saveAndLaunchBtnText: {
    color: '#101114',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  activateHotelDirectBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(197, 164, 109, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C5A46D',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  activateHotelDirectBtnText: {
    color: '#C5A46D',
    fontSize: 10.5,
    fontWeight: '800',
  },

  // ---------------------------------------------------------------------------
  // 4-Picture Gallery & Upload Section Styles
  // ---------------------------------------------------------------------------
  gallerySectionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.3)',
    marginBottom: 16,
    gap: 14,
  },
  gallerySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B31',
    paddingBottom: 12,
  },
  gallerySectionTitle: {
    color: '#C5A46D',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  gallerySectionSub: {
    color: '#A5A39D',
    fontSize: 11,
    marginTop: 3,
  },
  uploadDeviceBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4E9F76',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.2s ease' },
    }),
  },
  uploadDeviceBtnDisabled: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderColor: 'rgba(100, 116, 139, 0.4)',
    opacity: 0.6,
    ...Platform.select({
      web: { cursor: 'not-allowed' },
    }),
  },
  uploadDeviceBtnText: {
    color: '#101114',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  pictureSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pictureSlotCard: {
    flex: 1,
    minWidth: 180,
    maxWidth: 260,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.25)',
    gap: 8,
  },
  slotImageWrapper: {
    position: 'relative',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#101114',
  },
  slotImageThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  slotBadgePill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(7, 10, 18, 0.85)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  slotBadgePillText: {
    color: '#F2EFE8',
    fontSize: 10,
    fontWeight: '800',
  },
  slotRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(217, 83, 79, 0.9)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  slotRemoveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 12,
  },
  slotIdBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 164, 109, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.35)',
  },
  slotIdIcon: {
    fontSize: 13,
  },
  slotIdLabel: {
    color: '#A5A39D',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  slotIdValue: {
    color: '#C5A46D',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    letterSpacing: 1,
  },
  slotCaptionText: {
    color: '#A5A39D',
    fontSize: 11,
    fontWeight: '600',
  },
  emptySlotCard: {
    flex: 1,
    minWidth: 180,
    maxWidth: 260,
    height: 190,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  emptySlotIcon: {
    fontSize: 24,
    color: '#A5A39D',
    marginBottom: 6,
  },
  emptySlotTitle: {
    color: '#A5A39D',
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySlotHint: {
    color: '#807E78',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  addUrlBox: {
    backgroundColor: 'rgba(7, 10, 18, 0.6)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2B31',
    gap: 8,
  },
  addUrlBoxTitle: {
    color: '#A5A39D',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  addUrlRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  addUrlActionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(197, 164, 109, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C5A46D',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  addUrlActionBtnText: {
    color: '#C5A46D',
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Picture Reorder Controls
  slotReorderRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  reorderBtn: {
    flex: 1,
    paddingVertical: 4,
    backgroundColor: '#2A2B31',
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  reorderBtnDisabled: {
    opacity: 0.35,
    ...Platform.select({
      web: { cursor: 'not-allowed' },
    }),
  },
  reorderBtnText: {
    color: '#A5A39D',
    fontSize: 10,
    fontWeight: '700',
  },

  // ---------------------------------------------------------------------------
  // Places & Categories Manager Styles
  // ---------------------------------------------------------------------------
  placesOriginBanner: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.35)',
    gap: 12,
  },
  placesOriginHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  placesOriginIcon: {
    fontSize: 28,
  },
  placesOriginTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  placesOriginTitle: {
    color: '#C5A46D',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  placesOriginStatusBadge: {
    backgroundColor: 'rgba(78, 159, 118, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(78, 159, 118, 0.4)',
  },
  placesOriginStatusText: {
    color: '#4E9F76',
    fontSize: 10,
    fontWeight: '800',
  },
  placesOriginHotelName: {
    color: '#F2EFE8',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  placesOriginCoords: {
    color: '#A5A39D',
    fontSize: 12,
    marginTop: 4,
  },
  placesOriginFormula: {
    color: '#A5A39D',
    fontSize: 10.5,
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  placesActionPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A2B31',
  },
  placesPresetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4E9F76',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  placesPresetBtnText: {
    color: '#4E9F76',
    fontSize: 11.5,
    fontWeight: '800',
  },
  placesClearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  placesClearBtnText: {
    color: '#D9534F',
    fontSize: 11.5,
    fontWeight: '800',
  },
  placesCatSelectorBox: {
    backgroundColor: '#1C1D21',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2B31',
    gap: 8,
  },
  placesCatSelectorLabel: {
    color: '#A5A39D',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  placesCatScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  placesCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#25262B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2B31',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  placesCatChipActive: {
    backgroundColor: 'rgba(197, 164, 109, 0.2)',
    borderColor: '#C5A46D',
  },
  placesCatIcon: {
    fontSize: 14,
  },
  placesCatText: {
    color: '#A5A39D',
    fontSize: 12,
    fontWeight: '700',
  },
  placesCatTextActive: {
    color: '#C5A46D',
    fontWeight: '800',
  },
  placesCatCountBadge: {
    backgroundColor: '#2A2B31',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  placesCatCountBadgeActive: {
    backgroundColor: 'rgba(197, 164, 109, 0.3)',
  },
  placesCatCountText: {
    color: '#A5A39D',
    fontSize: 10,
    fontWeight: '800',
  },
  placesCatCountTextActive: {
    color: '#101114',
    backgroundColor: '#C5A46D',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  placesListWrapper: {
    gap: 12,
  },
  placesListHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  placesListHeaderTitle: {
    color: '#F2EFE8',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  inlineAddPlaceBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(197, 164, 109, 0.2)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C5A46D',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  inlineAddPlaceBtnText: {
    color: '#C5A46D',
    fontSize: 11.5,
    fontWeight: '800',
  },
  placesEmptyCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 30,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placesEmptyIcon: {
    fontSize: 32,
  },
  placesEmptyTitle: {
    color: '#F2EFE8',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  placesEmptySub: {
    color: '#A5A39D',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 18,
  },
  placesEmptyActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  placesEmptyAddBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#C5A46D',
    borderRadius: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  placesEmptyAddBtnText: {
    color: '#101114',
    fontSize: 12,
    fontWeight: '900',
  },
  placesEmptyPopulateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4E9F76',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  placesEmptyPopulateBtnText: {
    color: '#4E9F76',
    fontSize: 12,
    fontWeight: '800',
  },
  placesCardsCol: {
    gap: 10,
  },
  placeItemCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2B31',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  placeItemThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#25262B',
  },
  placeItemInfoCol: {
    flex: 1,
    minWidth: 240,
    gap: 4,
  },
  placeItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  placeItemTitle: {
    color: '#F2EFE8',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  placeItemBadge: {
    backgroundColor: 'rgba(197, 164, 109, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  placeItemBadgeText: {
    color: '#C5A46D',
    fontSize: 10.5,
    fontWeight: '800',
  },
  placeItemSubtitle: {
    color: '#A5A39D',
    fontSize: 11.5,
  },
  placeItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  placeItemMetaText: {
    color: '#A5A39D',
    fontSize: 11,
  },
  placeItemCoordsBadge: {
    fontSize: 10.5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  placeItemCoordsValid: {
    color: '#4E9F76',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  placeItemCoordsMissing: {
    color: '#D9534F',
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
  },
  placeIdAndDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  placeItem10DigitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(197, 164, 109, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.25)',
  },
  placeItem10DigitLabel: {
    color: '#A5A39D',
    fontSize: 8.5,
    fontWeight: '800',
  },
  placeItem10DigitValue: {
    color: '#C5A46D',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  placeItemDataPoint: {
    color: '#807E78',
    fontSize: 10.5,
  },
  placeItemActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeItemEditBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  placeItemEditBtnText: {
    color: '#A5A39D',
    fontSize: 11,
    fontWeight: '700',
  },
  placeItemDirBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(197, 164, 109, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C5A46D',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  placeItemDirBtnText: {
    color: '#C5A46D',
    fontSize: 11,
    fontWeight: '800',
  },
  placeItemDeleteBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(217, 83, 79, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  placeItemDeleteBtnText: {
    color: '#D9534F',
    fontSize: 11,
    fontWeight: '700',
  },
  hotelSearchSubmitBtn: {
    backgroundColor: '#C5A46D',
    paddingHorizontal: 20,
    height: 36,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    ...Platform.select({
      web: { cursor: 'pointer', boxShadow: '0 2px 8px rgba(197, 164, 109, 0.3)' },
    }),
  },
  hotelSearchSubmitBtnText: {
    color: '#0A0D14',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  saveConfigBtn: {
    backgroundColor: '#4E9F76',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', boxShadow: '0 2px 10px rgba(78, 159, 118, 0.25)' },
    }),
  },
  saveConfigBtnText: {
    color: '#0A0D14',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // --- STAGE 3: DARK LUXURY ADMIN STYLES (#101114, #1C1D21, #C5A46D) ---
  headerActiveHotelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(197, 164, 109, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 12,
    gap: 6,
  },
  headerActiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4E9F76',
  },
  headerActiveHotelText: {
    color: '#C5A46D',
    fontSize: 11.5,
    fontWeight: '700',
    maxWidth: 240,
  },

  tabSectionHeader: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 6,
  },
  tabSectionHeaderText: {
    color: '#807E78',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  liveDbPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 159, 118, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(78, 159, 118, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 6,
  },
  liveDbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4E9F76',
  },
  liveDbText: {
    color: '#4E9F76',
    fontSize: 11,
    fontWeight: '700',
  },

  overviewHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  headerPrimaryActionBtn: {
    backgroundColor: '#C5A46D',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' },
    }),
  },
  headerPrimaryActionBtnText: {
    color: '#101114',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerGuestLaunchBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' },
    }),
  },
  headerGuestLaunchBtnText: {
    color: '#A5A39D',
    fontSize: 12.5,
    fontWeight: '700',
  },

  activeHotelProfileCard: {
    backgroundColor: '#1C1D21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.25)',
    borderLeftWidth: 4,
    borderLeftColor: '#C5A46D',
    padding: 18,
    marginBottom: 16,
  },
  activeHotelProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  activeHotelBadgeText: {
    color: '#C5A46D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  statusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeApproved: {
    backgroundColor: '#2E5A44',
  },
  statusBadgePending: {
    backgroundColor: '#8C6F3E',
  },
  statusBadgeRejected: {
    backgroundColor: '#8C2424',
  },
  statusBadgePillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeHotelNameText: {
    color: '#F2EFE8',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 4,
  },
  activeHotelLocationText: {
    color: '#A5A39D',
    fontSize: 13,
    marginBottom: 8,
  },
  activeHotelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  activeHotelMetaItem: {
    color: '#A5A39D',
    fontSize: 11.5,
    fontWeight: '600',
  },
  activeHotelMetaDivider: {
    color: '#475569',
    fontSize: 11,
  },
  activeHotelProfileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileActionBtn: {
    backgroundColor: '#25262B',
    borderWidth: 1,
    borderColor: '#2A2B31',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  profileActionBtnText: {
    color: '#F2EFE8',
    fontSize: 12,
    fontWeight: '700',
  },

  metricsSummaryContainer: {
    gap: 14,
    marginBottom: 16,
  },
  totalComponentsHeroCard: {
    backgroundColor: 'rgba(22, 26, 41, 0.9)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.25)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  totalComponentsLabel: {
    color: '#A5A39D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  totalComponentsNumber: {
    color: '#C5A46D',
    fontSize: 38,
    fontWeight: '900',
    marginVertical: 2,
  },
  totalComponentsSub: {
    color: '#A5A39D',
    fontSize: 12.5,
  },
  addComponentDirectBtn: {
    backgroundColor: '#C5A46D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  addComponentDirectBtnText: {
    color: '#101114',
    fontSize: 13,
    fontWeight: '800',
  },

  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  activitySection: {
    backgroundColor: '#1C1D21',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2B31',
    padding: 18,
    marginBottom: 16,
  },
  activitySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  activitySectionSub: {
    color: '#807E78',
    fontSize: 11.5,
    marginTop: 2,
  },
  liveActivityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 159, 118, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(78, 159, 118, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4E9F76',
  },
  liveActivityText: {
    color: '#4E9F76',
    fontSize: 10.5,
    fontWeight: '700',
  },
  activityEmptyState: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    gap: 6,
  },
  activityEmptyIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  activityEmptyTitle: {
    color: '#C5A46D',
    fontSize: 13.5,
    fontWeight: '700',
  },
  activityEmptySub: {
    color: '#807E78',
    fontSize: 11.5,
    textAlign: 'center',
    maxWidth: 440,
  },
  activityList: {
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  activityTimeCol: {
    minWidth: 60,
  },
  activityTimeText: {
    color: '#807E78',
    fontSize: 11,
    fontWeight: '600',
  },
  activityTypeBadge: {
    backgroundColor: 'rgba(197, 164, 109, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.25)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activityTypeText: {
    color: '#C5A46D',
    fontSize: 9.5,
    fontWeight: '800',
  },
  activityDescText: {
    color: '#F2EFE8',
    fontSize: 12,
    flex: 1,
  },

  directoryCountPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  countPillApproved: {
    backgroundColor: 'rgba(78, 159, 118, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(78, 159, 118, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countPillApprovedText: {
    color: '#4E9F76',
    fontSize: 10.5,
    fontWeight: '700',
  },
  countPillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countPillPendingText: {
    color: '#D49A3D',
    fontSize: 10.5,
    fontWeight: '700',
  },
  countPillRejected: {
    backgroundColor: 'rgba(217, 83, 79, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 83, 79, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countPillRejectedText: {
    color: '#D9534F',
    fontSize: 10.5,
    fontWeight: '700',
  },

  directoryControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1D21',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2B31',
    padding: 10,
    marginBottom: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  directorySearchInputWrap: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1D21',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2B31',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIconText: {
    color: '#C5A46D',
    fontSize: 14,
    fontWeight: '800',
  },
  directorySearchInput: {
    flex: 1,
    height: 38,
    color: '#F2EFE8',
    fontSize: 12.5,
    outlineStyle: 'none',
  },
  clearSearchBtn: {
    padding: 4,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  clearSearchBtnText: {
    color: '#A5A39D',
    fontSize: 12,
    fontWeight: '700',
  },
  statusFilterTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusFilterTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1C1D21',
    borderWidth: 1,
    borderColor: '#2A2B31',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  statusFilterTabActive: {
    backgroundColor: 'rgba(197, 164, 109, 0.15)',
    borderColor: '#C5A46D',
  },
  statusFilterTabText: {
    color: '#A5A39D',
    fontSize: 11,
    fontWeight: '700',
  },
  statusFilterTabTextActive: {
    color: '#C5A46D',
  },

  directoryEmptyStateCard: {
    backgroundColor: '#1C1D21',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2B31',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  directoryEmptyIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  directoryEmptyTitle: {
    color: '#C5A46D',
    fontSize: 15,
    fontWeight: '800',
  },
  directoryEmptySub: {
    color: '#807E78',
    fontSize: 12.5,
    textAlign: 'center',
    maxWidth: 460,
  },
  resetFiltersBtn: {
    marginTop: 10,
    backgroundColor: '#25262B',
    borderWidth: 1,
    borderColor: '#2A2B31',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  resetFiltersBtnText: {
    color: '#F2EFE8',
    fontSize: 12,
    fontWeight: '700',
  },

  hotelThumbWrap: {
    width: 100,
    height: 75,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#25262B',
  },
  verticalHotelThumb: {
    width: '100%',
    height: '100%',
  },
  verticalHotelCardActive: {
    borderColor: 'rgba(197, 164, 109, 0.5)',
    backgroundColor: 'rgba(22, 26, 41, 0.85)',
  },
  activeHotelPillBadge: {
    backgroundColor: 'rgba(197, 164, 109, 0.18)',
    borderWidth: 1,
    borderColor: '#C5A46D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeHotelPillBadgeText: {
    color: '#C5A46D',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hotelStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  hotelStatusApproved: {
    backgroundColor: '#2E5A44',
  },
  hotelStatusPending: {
    backgroundColor: '#8C6F3E',
  },
  hotelStatusRejected: {
    backgroundColor: '#8C2424',
  },
  hotelStatusBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activateHotelDirectBtnCurrent: {
    backgroundColor: '#C5A46D',
    borderColor: '#C5A46D',
  },

  componentControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1D21',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2B31',
    padding: 10,
    marginBottom: 14,
    gap: 12,
    flexWrap: 'wrap',
  },
  componentSearchInputWrap: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1D21',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2B31',
    paddingHorizontal: 12,
    gap: 8,
  },
  componentSearchInput: {
    flex: 1,
    height: 38,
    color: '#F2EFE8',
    fontSize: 12.5,
    outlineStyle: 'none',
  },
  componentAvailTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  componentAvailTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1C1D21',
    borderWidth: 1,
    borderColor: '#2A2B31',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  componentAvailTabActive: {
    backgroundColor: 'rgba(197, 164, 109, 0.15)',
    borderColor: '#C5A46D',
  },
  componentAvailTabText: {
    color: '#A5A39D',
    fontSize: 11,
    fontWeight: '700',
  },
  componentAvailTabTextActive: {
    color: '#C5A46D',
  },
  componentCountBadge: {
    backgroundColor: 'rgba(197, 164, 109, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  componentCountBadgeText: {
    color: '#C5A46D',
    fontSize: 10.5,
    fontWeight: '700',
  },
});

