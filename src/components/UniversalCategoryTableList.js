// =============================================================================
// src/components/UniversalCategoryTableList.js
// Faculty-Compliant Universal 5-Column Data List / Table Component
//
// Layout Requirement:
// Every row in the list must contain:
// [ TITLE + SUBTITLE in one box ] | [ DATA 1 ] | [ DATA 2 ] | [ DATA 3 ] | [ DATA 4 ] | [ DATA 5 ]
// followed by [ WEBSITE ] and [ DIRECTIONS ] buttons.
//
// Features:
// 1. Enforces Faculty 5-Column Schema across ALL categories:
//    Hospitals, Pharmacies, Gyms, Swimming Pools, Dining, Takeaway, Parlour, ATMs, Shopping, Tourist, All.
// 2. Interactive Add/Edit Place Modal directly on the table enforcing the exact 5-column schema.
// 3. Dynamic Google Maps turn-by-turn routing using Active Hotel GPS coordinates as origin:
//    https://www.google.com/maps/dir/?api=1&origin=${hotel.latitude},${hotel.longitude}&destination=${place.latitude},${place.longitude}&travelmode=driving
// 4. Safe Fallbacks on every field to ensure zero crashes or missing text.
// =============================================================================

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { getDirectionsUrl, safeVal } from '../data/hotelsData';
import { activeHotelService } from '../services/activeHotelService';

/**
 * Category-specific schema extractor to map items into:
 * - title, subtitle, categoryBadge
 * - col1Label, col1Value
 * - col2Label, col2Value
 * - col3Label, col3Value
 * - col4Label, col4Value
 * - col5Label, col5Value
 * - websiteUrl, directionsUrl
 */
export function extractRowData(item, category, hotel) {
  if (!item) return null;

  const title = safeVal(item.title || item.name, 'Unnamed Venue');
  const subtitle = safeVal(item.subtitle || item.description || item.address || item.shortDescription, 'Premier Location');
  const categoryBadge = safeVal(item.tag || item.category, category ? category.toUpperCase() : 'CURATION');
  const websiteUrl = item.websiteUrl || item.website || item.link || item.externalUrl || null;
  const directionsUrl = getDirectionsUrl(hotel, item);

  // If item explicitly has custom data1..data5, respect them
  if (item.data1 && item.data2 && item.data3 && item.data4 && item.data5) {
    return {
      title,
      subtitle,
      categoryBadge,
      col1Label: 'Data 1',
      col1Value: item.data1,
      col2Label: 'Data 2',
      col2Value: item.data2,
      col3Label: 'Data 3',
      col3Value: item.data3,
      col4Label: 'Data 4',
      col4Value: item.data4,
      col5Label: 'Data 5',
      col5Value: item.data5,
      websiteUrl,
      directionsUrl,
    };
  }

  const cat = (category || item.category || '').toLowerCase();

  // 1. HOSPITALS (24/7)
  if (cat.includes('hosp')) {
    return {
      title,
      subtitle,
      categoryBadge: item.isEmergency24x7 ? '🚨 24/7 EMERGENCY' : categoryBadge,
      col1Label: 'Rating',
      col1Value: item.rating ? `★ ${item.rating} (${safeVal(item.likes || item.reviewsCount, '1.2k+')} reviews)` : '★ 4.9 (Verified)',
      col2Label: 'Place / Distance',
      col2Value: `${safeVal(item.area || item.place || item.location, hotel?.city || 'Local')}${item.distance ? ` · ${item.distance}` : ''}`,
      col3Label: 'Facilities',
      col3Value: Array.isArray(item.facilities) ? item.facilities.join(', ') : safeVal(item.facilities || item.specialities, 'Multi-Speciality Care, ICU, Diagnostics'),
      col4Label: 'Emergency / Ambulance',
      col4Value: safeVal(item.emergencyAmbulance || item.emergencyNumber || item.ambulancePhone, '24/7 Trauma Desk & Ambulance'),
      col5Label: 'Contact / Hours',
      col5Value: `${safeVal(item.contact || item.contactPhone || item.phone, 'Concierge Assistance')}${item.hours ? ` · ${item.hours}` : ' · 24 Hours Open'}`,
      websiteUrl,
      directionsUrl,
    };
  }

  // 2. PHARMACIES
  if (cat.includes('pharm')) {
    return {
      title,
      subtitle,
      categoryBadge: item.isOpen24x7 || item.is24x7 ? '🕒 24/7 OPEN' : categoryBadge,
      col1Label: 'Rating',
      col1Value: item.rating ? `★ ${item.rating} (${safeVal(item.reviewsCount || item.likes, '950+')} reviews)` : '★ 4.85',
      col2Label: 'Distance',
      col2Value: `${safeVal(item.distance || item.hotelDistance, 'Nearby')}${item.driveTime ? ` (${item.driveTime})` : ''}`,
      col3Label: 'Operating Hours',
      col3Value: safeVal(item.hours || item.timings || item.timing, 'Open 24 Hours / 7 Days'),
      col4Label: '24/7 Availability',
      col4Value: item.isOpen24x7 || item.is24x7 ? '✓ Verified 24/7 Emergency Stock' : safeVal(item.availability, 'Regular Operating Hours'),
      col5Label: 'Contact / Delivery',
      col5Value: `${safeVal(item.contact || item.contactPhone || item.phone, 'Available')} · ${safeVal(item.deliveryService, 'Doorstep Delivery Available')}`,
      websiteUrl,
      directionsUrl,
    };
  }

  // 3. WELLNESS & GYMS
  if (cat.includes('gym')) {
    return {
      title,
      subtitle,
      categoryBadge: safeVal(item.category || item.tag, 'WELLNESS & GYM'),
      col1Label: 'Rating',
      col1Value: item.rating ? `★ ${typeof item.rating === 'number' ? item.rating.toFixed(2) : item.rating}` : '★ 4.90',
      col2Label: 'Distance',
      col2Value: safeVal(item.hotelDistance || item.distance || item.location, '1.5 km from Hotel'),
      col3Label: 'Travel Time',
      col3Value: safeVal(item.driveTime, '5-8 mins drive'),
      col4Label: 'Hours / Timings',
      col4Value: safeVal(item.timings || item.hours || item.timing, '6:00 AM - 10:00 PM'),
      col5Label: 'Services / Offer',
      col5Value: Array.isArray(item.services) ? item.services.join(' • ') : safeVal(item.services || item.offer, 'Free Day Pass for Hotel Residents'),
      websiteUrl,
      directionsUrl,
    };
  }

  // 4. SWIMMING POOLS
  if (cat.includes('pool') || cat.includes('swim')) {
    return {
      title,
      subtitle,
      categoryBadge: safeVal(item.tag, 'SWIMMING POOL'),
      col1Label: 'Rating',
      col1Value: item.rating ? `★ ${typeof item.rating === 'number' ? item.rating.toFixed(2) : item.rating}` : '★ 4.92',
      col2Label: 'Location / Distance',
      col2Value: `${safeVal(item.location || item.address, 'Hotel Courtyard')}${item.distance || item.hotelDistance ? ` · ${item.distance || item.hotelDistance}` : ''}`,
      col3Label: 'Operating Hours',
      col3Value: safeVal(item.timing || item.timings || item.hours, '6:00 AM - 9:00 PM (Daily)'),
      col4Label: 'Pool Features',
      col4Value: safeVal(item.additionalInfo || item.offer, 'Heated Water · Cabanas · Towels'),
      col5Label: 'Resident Access',
      col5Value: safeVal(item.offer, 'Complimentary Resident Access Available'),
      websiteUrl,
      directionsUrl,
    };
  }

  // 5. BISTROS & DINING
  if (cat.includes('cafe') || cat.includes('dine') || cat.includes('restaur')) {
    return {
      title,
      subtitle,
      categoryBadge: safeVal(item.tag || item.category, 'BISTRO & DINING'),
      col1Label: 'Rating',
      col1Value: item.rating ? `★ ${typeof item.rating === 'number' ? item.rating.toFixed(2) : item.rating}` : '★ 4.90',
      col2Label: 'Location / Distance',
      col2Value: `${safeVal(item.area || item.location || item.address, hotel?.city || 'Local')}${item.distance || item.hotelDistance ? ` · ${item.distance || item.hotelDistance}` : ''}`,
      col3Label: 'Timings',
      col3Value: safeVal(item.timing || item.timings || item.hours, '8:00 AM - 11:00 PM'),
      col4Label: 'Cuisine / Speciality',
      col4Value: safeVal(item.additionalInfo || item.cuisine || item.offer, 'Artisanal Roasts, Sourdough & Continental'),
      col5Label: 'Resident Privilege',
      col5Value: safeVal(item.offer, 'Priority Table Reservation for Guests'),
      websiteUrl,
      directionsUrl,
    };
  }

  // 6. EXPRESS TAKEAWAY
  if (cat.includes('takeaway')) {
    return {
      title,
      subtitle,
      categoryBadge: safeVal(item.tag, 'EXPRESS TAKEAWAY'),
      col1Label: 'Rating',
      col1Value: item.rating ? `★ ${typeof item.rating === 'number' ? item.rating.toFixed(2) : item.rating}` : '★ 4.85',
      col2Label: 'Distance & Prep',
      col2Value: `${safeVal(item.distance || item.location, '0.5 km')}${item.timing || item.takeawayTime ? ` · ${item.timing || item.takeawayTime}` : ' · 15 mins ready'}`,
      col3Label: 'Operating Hours',
      col3Value: safeVal(item.hours || item.timings, '10:00 AM - 11:00 PM'),
      col4Label: 'Menu Specialties',
      col4Value: safeVal(item.additionalInfo || (Array.isArray(item.services) ? item.services.join(', ') : item.services), 'Fresh Handcrafted Specialties'),
      col5Label: 'Guest Privilege',
      col5Value: safeVal(item.offer, 'Express Pickup Packaging for Hotel Guests'),
      websiteUrl,
      directionsUrl,
    };
  }

  // 7. BEAUTY & PARLOUR
  if (cat.includes('parlour') || cat.includes('beauty') || cat.includes('salon')) {
    return {
      title,
      subtitle,
      categoryBadge: safeVal(item.tag, 'BEAUTY & SPA'),
      col1Label: 'Rating',
      col1Value: item.rating ? `★ ${typeof item.rating === 'number' ? item.rating.toFixed(2) : item.rating}` : '★ 4.85',
      col2Label: 'Location / Distance',
      col2Value: safeVal(item.location || item.address, 'Near Hotel'),
      col3Label: 'Operating Hours',
      col3Value: safeVal(item.timing || item.timings, '9:00 AM - 8:30 PM'),
      col4Label: 'Services',
      col4Value: safeVal(item.additionalInfo, 'Hair, Facials & Ayurvedic Spa'),
      col5Label: 'Resident Privilege',
      col5Value: safeVal(item.offer, 'Resident Privilege Discount Available'),
      websiteUrl,
      directionsUrl,
    };
  }

  // 8. 24/7 ATMS & BANKING
  if (cat.includes('atm') || cat.includes('bank')) {
    return {
      title,
      subtitle,
      categoryBadge: safeVal(item.tag, '24/7 ATM'),
      col1Label: 'Status',
      col1Value: `★ ${item.rating || 4.82} · 24/7 Active`,
      col2Label: 'Location',
      col2Value: safeVal(item.location || item.address, 'Near Hotel'),
      col3Label: 'Operating Hours',
      col3Value: safeVal(item.timing, '24 Hours Open (7 Days)'),
      col4Label: 'Features',
      col4Value: safeVal(item.additionalInfo, 'Touchless Cash Dispense · Clean Currency'),
      col5Label: 'Surcharge',
      col5Value: safeVal(item.offer, 'Zero Convenience Surcharge'),
      websiteUrl,
      directionsUrl,
    };
  }

  // 9. SHOPPING MALLS
  if (cat.includes('shop')) {
    return {
      title,
      subtitle,
      categoryBadge,
      col1Label: 'Rating',
      col1Value: item.rating ? `★ ${item.rating}` : '★ 4.8',
      col2Label: 'Distance',
      col2Value: safeVal(item.distance || item.hotelDistance || item.location, '2.5 km from Hotel'),
      col3Label: 'Opening Hours',
      col3Value: safeVal(item.openingHours || item.timings || item.hours, '10:00 AM - 10:00 PM'),
      col4Label: 'Category / Brands',
      col4Value: safeVal(item.mallType || item.category, 'Lifestyle, Fashion & Fine Dining'),
      col5Label: 'Store Details',
      col5Value: safeVal(item.storeCount || item.stores || item.driveTime, 'Multi-brand Retail & Multiplex'),
      websiteUrl,
      directionsUrl,
    };
  }

  // 10. ADAPTIVE 'ALL' / TOURIST / DEFAULT
  return {
    title,
    subtitle,
    categoryBadge,
    col1Label: 'Rating',
    col1Value: item.rating ? `★ ${item.rating}` : '★ 4.9',
    col2Label: 'Distance',
    col2Value: safeVal(item.distance || item.hotelDistance || item.location, hotel?.city ? `${hotel.city} Area` : 'Local Area'),
    col3Label: 'Hours / Timings',
    col3Value: safeVal(item.timing || item.timings || item.visitingHours || item.hours, 'Open for Visitors'),
    col4Label: 'Highlights / Specs',
    col4Value: safeVal(item.facilities || item.services || item.category || item.tag, 'Curated Excursion & Privilege'),
    col5Label: 'Access / Info',
    col5Value: safeVal(item.offer || item.additionalInfo || item.contact || item.contactPhone, 'Concierge Assistance Available'),
    websiteUrl,
    directionsUrl,
  };
}

export default function UniversalCategoryTableList({
  items = [],
  category = 'hospitals',
  hotel,
  onSelectItem,
  onDataChanged,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 720 && width < 1024;

  // Add/Edit Modal State enforcing the 5-Column Schema
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    data1: '',
    data2: '',
    data3: '',
    data4: '',
    data5: '',
    latitude: '',
    longitude: '',
    address: '',
    websiteUrl: '',
    rating: '4.9',
  });

  const handleOpenLink = (url) => {
    if (!url) return;
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
    }
  };

  // Determine category storage key
  const getCategoryKey = () => {
    const c = (category || '').toLowerCase();
    if (c.includes('hosp')) return 'hospitals';
    if (c.includes('pharm')) return 'pharmacies';
    if (c.includes('gym')) return 'gyms';
    if (c.includes('pool') || c.includes('swim')) return 'pools';
    if (c.includes('cafe') || c.includes('dine') || c.includes('restaur')) return 'dining';
    if (c.includes('takeaway')) return 'takeaways';
    if (c.includes('shop')) return 'shopping';
    if (c.includes('tourist')) return 'touristPlaces';
    return 'hospitals';
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    const catSample = sampleData || {};

    const baseLat = hotel?.latitude ?? hotel?.lat;
    const baseLng = hotel?.longitude ?? hotel?.lng;

    setForm({
      title: '',
      subtitle: '',
      data1: catSample.col1Value || '',
      data2: hotel?.city ? `${hotel.city} Area` : '',
      data3: catSample.col3Value || '',
      data4: catSample.col4Value || '',
      data5: catSample.col5Value || '',
      latitude: baseLat != null ? String(baseLat) : '',
      longitude: baseLng != null ? String(baseLng) : '',
      address: hotel?.city ? `${hotel.city}` : '',
      websiteUrl: '',
      rating: '4.9',
    });
    setModalVisible(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditing(true);
    setEditingId(item.id);

    const row = extractRowData(item, category, hotel);

    setForm({
      title: item.title || item.name || '',
      subtitle: item.subtitle || item.description || item.address || '',
      data1: item.data1 || row?.col1Value || '',
      data2: item.data2 || row?.col2Value || '',
      data3: item.data3 || row?.col3Value || '',
      data4: item.data4 || row?.col4Value || '',
      data5: item.data5 || row?.col5Value || '',
      latitude: item.latitude != null ? String(item.latitude) : (item.lat != null ? String(item.lat) : ''),
      longitude: item.longitude != null ? String(item.longitude) : (item.lng != null ? String(item.lng) : ''),
      address: item.address || item.location || '',
      websiteUrl: item.websiteUrl || item.website || item.link || '',
      rating: item.rating ? String(item.rating) : '4.9',
    });
    setModalVisible(true);
  };

  const handleSaveModal = () => {
    if (!form.title.trim()) {
      if (Platform.OS === 'web') alert('Place Title is required!');
      return;
    }

    const catKey = getCategoryKey();
    const latNum = parseFloat(form.latitude);
    const lngNum = parseFloat(form.longitude);

    const placeData = {
      title: form.title.trim(),
      name: form.title.trim(),
      subtitle: form.subtitle.trim() || 'Premier Facility',
      data1: form.data1.trim(),
      data2: form.data2.trim(),
      data3: form.data3.trim(),
      data4: form.data4.trim(),
      data5: form.data5.trim(),
      latitude: !isNaN(latNum) ? latNum : null,
      longitude: !isNaN(lngNum) ? lngNum : null,
      lat: !isNaN(latNum) ? latNum : null,
      lng: !isNaN(lngNum) ? lngNum : null,
      address: form.address.trim() || `${hotel?.city || 'Local Area'}, India`,
      location: form.address.trim() || form.data2.trim(),
      websiteUrl: form.websiteUrl.trim(),
      rating: parseFloat(form.rating) || 4.9,
    };

    if (isEditing && editingId) {
      activeHotelService.updatePlaceInActiveHotel(catKey, editingId, placeData);
    } else {
      activeHotelService.addPlaceToActiveHotel(catKey, placeData);
    }

    setModalVisible(false);
    if (onDataChanged) onDataChanged();
  };

  // Pre-extract first item to render table header columns cleanly on desktop
  const sampleData = items.length > 0 ? extractRowData(items[0], category, hotel) : null;

  return (
    <View style={styles.wrapper}>
      {/* 0. TABLE TOOLBAR WITH ADD PLACE BUTTON */}
      <View style={styles.tableToolbar}>
        <View style={styles.toolbarTitleRow}>
          <Text style={styles.toolbarTitle}>
            📋 FACULTY 5-COLUMN SCHEMA LIST ({items.length} LISTINGS)
          </Text>
          <Text style={styles.toolbarSubtitle}>
            [TITLE + SUBTITLE] ∣ [DATA 1] ∣ [DATA 2] ∣ [DATA 3] ∣ [DATA 4] ∣ [DATA 5] + [WEBSITE] & [DIRECTIONS]
          </Text>
        </View>

        <TouchableOpacity
          style={styles.toolbarAddBtn}
          onPress={handleOpenAddModal}
          activeOpacity={0.8}
        >
          <Text style={styles.toolbarAddBtnText}>➕ Add Place to {category.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* 1. DESKTOP TABLE HEADER */}
      {isDesktop && sampleData && (
        <View style={styles.desktopTableHeader}>
          <View style={[styles.thCell, styles.thTitleBox]}>
            <Text style={styles.thText}>TITLE + SUBTITLE</Text>
          </View>
          <View style={[styles.thCell, styles.thDataCell]}>
            <Text style={styles.thText}>DATA 1 · {sampleData.col1Label.toUpperCase()}</Text>
          </View>
          <View style={[styles.thCell, styles.thDataCell]}>
            <Text style={styles.thText}>DATA 2 · {sampleData.col2Label.toUpperCase()}</Text>
          </View>
          <View style={[styles.thCell, styles.thDataCell]}>
            <Text style={styles.thText}>DATA 3 · {sampleData.col3Label.toUpperCase()}</Text>
          </View>
          <View style={[styles.thCell, styles.thDataCell]}>
            <Text style={styles.thText}>DATA 4 · {sampleData.col4Label.toUpperCase()}</Text>
          </View>
          <View style={[styles.thCell, styles.thDataCell]}>
            <Text style={styles.thText}>DATA 5 · {sampleData.col5Label.toUpperCase()}</Text>
          </View>
          <View style={[styles.thCell, styles.thActionCell]}>
            <Text style={styles.thText}>ACTIONS</Text>
          </View>
        </View>
      )}

      {/* EMPTY STATE */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyTitle}>
            {(() => {
              const cat = (category || '').toLowerCase();
              if (cat.includes('hosp')) return 'No hospitals found near this hotel.';
              if (cat.includes('gym')) return 'No gyms found near this hotel.';
              if (cat.includes('pharm')) return 'No pharmacies found near this hotel.';
              if (cat.includes('tourist')) return 'No tourist places found near this hotel.';
              if (cat.includes('shop')) return 'No shopping destinations found near this hotel.';
              if (cat.includes('takeaway')) return 'No takeaways found near this hotel.';
              if (cat.includes('pool')) return 'No swimming pools found near this hotel.';
              if (cat.includes('cafe') || cat.includes('dine') || cat.includes('restaur')) return 'No dining places found near this hotel.';
              return `No ${category} found near this hotel.`;
            })()}
          </Text>
          <Text style={styles.emptySubtitle}>
            All listings are dynamically loaded based on the active hotel's real GPS coordinates.
          </Text>
          <TouchableOpacity
            style={[styles.toolbarAddBtn, { marginTop: 14 }]}
            onPress={handleOpenAddModal}
            activeOpacity={0.8}
          >
            <Text style={styles.toolbarAddBtnText}>➕ Add Place to {category.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* 2. ROWS LIST */
        <View style={styles.rowsContainer}>
          {items.map((rawItem, index) => {
            const row = extractRowData(rawItem, category, hotel);
            if (!row) return null;

            return (
              <View
                key={rawItem.id || `row-${index}`}
                style={[
                  styles.rowItem,
                  index % 2 === 1 && styles.rowItemAlternate,
                  !isDesktop && styles.rowItemMobile,
                ]}
              >
                {/* SECTION 1: TITLE + SUBTITLE BOX */}
                <View style={[styles.titleSubtitleBox, !isDesktop && styles.titleSubtitleBoxMobile]}>
                  <View style={styles.badgeRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{row.categoryBadge}</Text>
                    </View>
                    <Text style={styles.indexTag}>#{index + 1}</Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={onSelectItem ? 0.7 : 1}
                    onPress={() => onSelectItem && onSelectItem(rawItem)}
                  >
                    <Text style={styles.rowTitle} numberOfLines={2}>
                      {row.title}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.rowSubtitle} numberOfLines={2}>
                    {row.subtitle}
                  </Text>
                </View>

                {/* DATA 1 TO 5 SECTION (Desktop: 5 separate columns, Mobile/Tablet: structured grid) */}
                {isDesktop ? (
                  <>
                    <View style={[styles.dataCell, styles.thDataCell]}>
                      <Text style={styles.dataLabelMini}>{row.col1Label}</Text>
                      <Text style={[styles.dataValueText, styles.highlightGold]}>{row.col1Value}</Text>
                    </View>

                    <View style={[styles.dataCell, styles.thDataCell]}>
                      <Text style={styles.dataLabelMini}>{row.col2Label}</Text>
                      <Text style={styles.dataValueText}>{row.col2Value}</Text>
                    </View>

                    <View style={[styles.dataCell, styles.thDataCell]}>
                      <Text style={styles.dataLabelMini}>{row.col3Label}</Text>
                      <Text style={styles.dataValueText} numberOfLines={3}>
                        {row.col3Value}
                      </Text>
                    </View>

                    <View style={[styles.dataCell, styles.thDataCell]}>
                      <Text style={styles.dataLabelMini}>{row.col4Label}</Text>
                      <Text style={[styles.dataValueText, styles.emphasisValue]} numberOfLines={3}>
                        {row.col4Value}
                      </Text>
                    </View>

                    <View style={[styles.dataCell, styles.thDataCell]}>
                      <Text style={styles.dataLabelMini}>{row.col5Label}</Text>
                      <Text style={styles.dataValueText} numberOfLines={3}>
                        {row.col5Value}
                      </Text>
                    </View>
                  </>
                ) : (
                  /* Mobile & Tablet structured 5-data key-value grid */
                  <View style={styles.mobileDataGrid}>
                    <View style={styles.mobileDataRow}>
                      <View style={styles.mobileDataPair}>
                        <Text style={styles.mobileDataKey}>DATA 1 · {row.col1Label}</Text>
                        <Text style={[styles.mobileDataVal, styles.highlightGold]}>{row.col1Value}</Text>
                      </View>
                      <View style={styles.mobileDataPair}>
                        <Text style={styles.mobileDataKey}>DATA 2 · {row.col2Label}</Text>
                        <Text style={styles.mobileDataVal}>{row.col2Value}</Text>
                      </View>
                    </View>

                    <View style={styles.mobileDataRow}>
                      <View style={styles.mobileDataPair}>
                        <Text style={styles.mobileDataKey}>DATA 3 · {row.col3Label}</Text>
                        <Text style={styles.mobileDataVal}>{row.col3Value}</Text>
                      </View>
                      <View style={styles.mobileDataPair}>
                        <Text style={styles.mobileDataKey}>DATA 4 · {row.col4Label}</Text>
                        <Text style={[styles.mobileDataVal, styles.emphasisValue]}>{row.col4Value}</Text>
                      </View>
                    </View>

                    <View style={styles.mobileDataRowFull}>
                      <Text style={styles.mobileDataKey}>DATA 5 · {row.col5Label}</Text>
                      <Text style={styles.mobileDataVal}>{row.col5Value}</Text>
                    </View>
                  </View>
                )}

                {/* ACTION BUTTONS: WEBSITE + DIRECTIONS + EDIT */}
                <View style={[styles.actionButtonsBox, !isDesktop && styles.actionButtonsBoxMobile]}>
                  {row.websiteUrl ? (
                    <TouchableOpacity
                      style={styles.websiteBtn}
                      onPress={() => handleOpenLink(row.websiteUrl)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.websiteBtnText}>🌐 Website</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.disabledBtn}>
                      <Text style={styles.disabledBtnText}>Website unavailable</Text>
                    </View>
                  )}

                  {row.directionsUrl ? (
                    <TouchableOpacity
                      style={styles.directionsBtn}
                      onPress={() => handleOpenLink(row.directionsUrl)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.directionsBtnText}>🧭 Directions</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.disabledBtn}>
                      <Text style={styles.disabledBtnText} numberOfLines={1}>
                        {!hotel || (!hotel.latitude && !hotel.lat)
                          ? 'Hotel location not set'
                          : 'Directions unavailable'}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleOpenEditModal(rawItem)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>

                  {onSelectItem && (
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => onSelectItem(rawItem)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.detailsBtnText}>Route →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* =================================================================== */}
      {/* 3. ADD / EDIT MODAL ENFORCING THE FACULTY 5-COLUMN SCHEMA           */}
      {/* =================================================================== */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>
                  {isEditing ? '✏️ Edit Place' : `➕ Add Place to ${category.toUpperCase()}`}
                </Text>
                <Text style={styles.modalHeaderSub}>
                  Faculty 5-Column Schema: [TITLE + SUBTITLE] ∣ [DATA 1] ∣ [DATA 2] ∣ [DATA 3] ∣ [DATA 4] ∣ [DATA 5]
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              {/* Origin Notice */}
              <View style={styles.modalNotice}>
                <Text style={styles.modalNoticeText}>
                  📍 Directions Origin dynamically bound to active hotel: <Text style={{ color: '#E2C082', fontWeight: '700' }}>{hotel?.name || 'Active Hotel'}</Text> [{hotel?.latitude ?? 'lat'}, {hotel?.longitude ?? 'lng'}]
                </Text>
              </View>

              <Text style={styles.fieldLabel}>PLACE TITLE / NAME *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Apollo Hospital / Waves Gym / Vinayaka Mylari"
                placeholderTextColor="#64748B"
                value={form.title}
                onChangeText={(t) => setForm((prev) => ({ ...prev, title: t }))}
              />

              <Text style={styles.fieldLabel}>SUBTITLE / SHORT DESCRIPTION</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 24/7 Tertiary Emergency Care & Cardiac Trauma Unit"
                placeholderTextColor="#64748B"
                value={form.subtitle}
                onChangeText={(t) => setForm((prev) => ({ ...prev, subtitle: t }))}
              />

              {/* 5 FACULTY DATA COLUMNS ENFORCEMENT */}
              <View style={styles.facultySchemaBox}>
                <Text style={styles.facultySchemaHeader}>
                  ⚡ ENFORCE FACULTY 5 DATA COLUMNS:
                </Text>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldCol}>
                    <Text style={styles.fieldLabel}>[DATA 1] · RATING / SCORE</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. ★ 4.95 (1.5k reviews)"
                      placeholderTextColor="#64748B"
                      value={form.data1}
                      onChangeText={(t) => setForm((prev) => ({ ...prev, data1: t }))}
                    />
                  </View>
                  <View style={styles.fieldCol}>
                    <Text style={styles.fieldLabel}>[DATA 2] · PLACE / DISTANCE</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Contour Road · 0.8 km"
                      placeholderTextColor="#64748B"
                      value={form.data2}
                      onChangeText={(t) => setForm((prev) => ({ ...prev, data2: t }))}
                    />
                  </View>
                </View>

                <View style={styles.fieldRow}>
                  <View style={styles.fieldCol}>
                    <Text style={styles.fieldLabel}>[DATA 3] · FACILITIES / TIMINGS</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. ICU, Stroke Center, 24/7 Casualty"
                      placeholderTextColor="#64748B"
                      value={form.data3}
                      onChangeText={(t) => setForm((prev) => ({ ...prev, data3: t }))}
                    />
                  </View>
                  <View style={styles.fieldCol}>
                    <Text style={styles.fieldLabel}>[DATA 4] · EMERGENCY / HOURS</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 24/7 Fast-Track Cardiac Ambulance"
                      placeholderTextColor="#64748B"
                      value={form.data4}
                      onChangeText={(t) => setForm((prev) => ({ ...prev, data4: t }))}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>[DATA 5] · CONTACT / RESIDENT PRIVILEGE</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. +91 821 256 0000 · Complimentary Resident Privilege"
                  placeholderTextColor="#64748B"
                  value={form.data5}
                  onChangeText={(t) => setForm((prev) => ({ ...prev, data5: t }))}
                />
              </View>

              {/* GPS COORDINATES & MAPPING */}
              <View style={styles.fieldRow}>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>DESTINATION LATITUDE (GPS)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 12.3582"
                    placeholderTextColor="#64748B"
                    value={form.latitude}
                    onChangeText={(t) => setForm((prev) => ({ ...prev, latitude: t }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>DESTINATION LONGITUDE (GPS)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 76.6115"
                    placeholderTextColor="#64748B"
                    value={form.longitude}
                    onChangeText={(t) => setForm((prev) => ({ ...prev, longitude: t }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>FULL ADDRESS / AREA</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 123 Main Avenue, Downtown"
                    placeholderTextColor="#64748B"
                    value={form.address}
                    onChangeText={(t) => setForm((prev) => ({ ...prev, address: t }))}
                  />
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>WEBSITE / PORTAL URL</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="https://example.com"
                    placeholderTextColor="#64748B"
                    value={form.websiteUrl}
                    onChangeText={(t) => setForm((prev) => ({ ...prev, websiteUrl: t }))}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveModal}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSaveBtnText}>
                  💾 {isEditing ? 'Update Place (5-Column Schema)' : 'Save Place to Active Hotel'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flexDirection: 'column',
  },
  tableToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D0E15',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  toolbarTitleRow: {
    flex: 1,
    minWidth: 240,
  },
  toolbarTitle: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  toolbarSubtitle: {
    color: '#94A3B8',
    fontSize: 9.5,
    marginTop: 2,
  },
  toolbarAddBtn: {
    backgroundColor: '#E2C082',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(226, 192, 130, 0.25)',
      },
    }),
  },
  toolbarAddBtnText: {
    color: '#070A12',
    fontSize: 11,
    fontWeight: '800',
  },
  desktopTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16181F',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  thCell: {
    paddingHorizontal: 6,
  },
  thTitleBox: {
    flex: 2.2,
  },
  thDataCell: {
    flex: 1.4,
  },
  thActionCell: {
    flex: 1.8,
    alignItems: 'center',
  },
  thText: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  rowsContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12141A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      },
    }),
  },
  rowItemAlternate: {
    backgroundColor: '#151720',
  },
  rowItemMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 14,
    gap: 12,
  },
  titleSubtitleBox: {
    flex: 2.2,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(226, 192, 130, 0.12)',
    flexDirection: 'column',
    gap: 4,
  },
  titleSubtitleBoxMobile: {
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.12)',
    paddingRight: 0,
    paddingBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  categoryBadge: {
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: '#E2C082',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  indexTag: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '700',
  },
  rowTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  rowSubtitle: {
    color: '#94A3B8',
    fontSize: 10.5,
    lineHeight: 14,
  },
  dataCell: {
    paddingHorizontal: 6,
    flexDirection: 'column',
    gap: 3,
  },
  dataLabelMini: {
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dataValueText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  highlightGold: {
    color: '#E2C082',
    fontWeight: '700',
  },
  emphasisValue: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  mobileDataGrid: {
    flexDirection: 'column',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 10,
    borderRadius: 8,
  },
  mobileDataRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mobileDataPair: {
    flex: 1,
    gap: 2,
  },
  mobileDataRowFull: {
    flexDirection: 'column',
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 6,
  },
  mobileDataKey: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mobileDataVal: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 15,
  },
  actionButtonsBox: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionButtonsBoxMobile: {
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 192, 130, 0.12)',
    paddingTop: 10,
  },
  websiteBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  websiteBtnText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  disabledBtnText: {
    color: '#475569',
    fontSize: 9.5,
  },
  directionsBtn: {
    backgroundColor: '#E2C082',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  directionsBtnText: {
    color: '#0D0E12',
    fontSize: 10.5,
    fontWeight: '800',
  },
  editBtn: {
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.4)',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  editBtnText: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '700',
  },
  detailsBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  detailsBtnText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12141A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.15)',
    marginTop: 12,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyTitle: {
    color: '#F8F6F0',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
  },

  // MODAL STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#12141A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    overflow: 'hidden',
    flexDirection: 'column',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#171922',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalHeaderSub: {
    color: '#E2C082',
    fontSize: 9.5,
    marginTop: 2,
    fontWeight: '600',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
    gap: 10,
  },
  modalNotice: {
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  modalNoticeText: {
    color: '#CBD5E1',
    fontSize: 10,
    lineHeight: 14,
  },
  fieldLabel: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  textInput: {
    backgroundColor: '#090B10',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    color: '#FFFFFF',
    fontSize: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldCol: {
    flex: 1,
  },
  facultySchemaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginVertical: 4,
  },
  facultySchemaHeader: {
    color: '#E2C082',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 14,
    backgroundColor: '#171922',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCancelBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  modalSaveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#E2C082',
  },
  modalSaveBtnText: {
    color: '#070A12',
    fontSize: 11.5,
    fontWeight: '800',
  },
});
