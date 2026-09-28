// =============================================================================
// src/components/BookingModal.js
// Ultra-Luxury Concierge Booking Form Modal for Tourist Places & Cafes
// Allows hotel dining guests to fill details, select preferences, and book
// instantly with backend REST API persistence and dynamic confirmation vouchers.
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { apiService } from '../services/apiService';
import { getCategoryMeta } from './DisplayComponent';

const formatDateLabel = (d) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
};

const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function BookingModal({
  visible = false,
  component,
  onClose,
  onBookingConfirmed,
}) {
  if (!component) return null;

  const meta = getCategoryMeta(component.componentType, component.category);
  const type = parseInt(component.componentType, 10);
  const isHotel =
    type === 1 ||
    component.category?.toLowerCase().includes('hotel') ||
    component.id?.includes('hotel') ||
    component.id?.includes('center') ||
    component.title?.toLowerCase().includes('hotel') ||
    component.title?.toLowerCase().includes('resort') ||
    component.title?.toLowerCase().includes('palace');
  const isDining = !isHotel && (type === 4 || type >= 5);
  const isTourist = !isHotel && (type === 0 || type === 2);

  // Form Fields State
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Date selection mode: 'today' | 'tomorrow' | 'custom'
  const [dateMode, setDateMode] = useState('today');
  const [customCheckIn, setCustomCheckIn] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return toISODate(d);
  });
  const [nightsCount, setNightsCount] = useState(2);
  const [roomsCount, setRoomsCount] = useState(1);

  const [timeSlot, setTimeSlot] = useState(
    isHotel ? '2:00 PM (Standard Check-in)' : isDining ? '7:30 PM (Dinner)' : '10:00 AM (Morning)'
  );
  const [guestCount, setGuestCount] = useState(2);
  const [experienceType, setExperienceType] = useState(
    isHotel ? 'Executive Heritage Suite (Chamundi Hill View)' : isDining ? 'Courtyard Garden Window Table' : 'VIP Fast-Track & Priority Pass'
  );
  const [dietaryPreference, setDietaryPreference] = useState('Standard / No Restrictions');
  const [specialRequests, setSpecialRequests] = useState('');

  // UI Flow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Dates
  const todayDateObj = new Date();
  const tomorrowDateObj = new Date();
  tomorrowDateObj.setDate(todayDateObj.getDate() + 1);

  const todayStr = formatDateLabel(todayDateObj);
  const tomorrowStr = formatDateLabel(tomorrowDateObj);

  // Compute checkout date for custom selection
  const computedCheckOut = useMemo(() => {
    try {
      const parts = customCheckIn.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setDate(d.getDate() + nightsCount);
        return formatDateLabel(d);
      }
    } catch (e) {}
    return '';
  }, [customCheckIn, nightsCount]);

  const computedCheckInFormatted = useMemo(() => {
    try {
      const parts = customCheckIn.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return formatDateLabel(d);
      }
    } catch (e) {}
    return customCheckIn;
  }, [customCheckIn]);

  const resolvedBookingDate = useMemo(() => {
    if (dateMode === 'today') {
      return isHotel ? `Today (${todayStr}) • ${nightsCount} ${nightsCount === 1 ? 'Night' : 'Nights'}` : `Today (${todayStr})`;
    }
    if (dateMode === 'tomorrow') {
      return isHotel ? `Tomorrow (${tomorrowStr}) • ${nightsCount} ${nightsCount === 1 ? 'Night' : 'Nights'}` : `Tomorrow (${tomorrowStr})`;
    }
    return `Custom: ${computedCheckInFormatted} ➔ ${computedCheckOut} (${nightsCount} ${nightsCount === 1 ? 'Night' : 'Nights'})`;
  }, [dateMode, todayStr, tomorrowStr, computedCheckInFormatted, computedCheckOut, nightsCount, isHotel]);

  // Reset state when opened with a new component
  useEffect(() => {
    if (visible) {
      setConfirmedBooking(null);
      setErrorMessage('');
      setDateMode('today');
      // Pre-fill default time slot and experience based on category
      if (isHotel) {
        setTimeSlot('2:00 PM (Standard Check-in)');
        setExperienceType('Executive Heritage Suite (Chamundi Hill View)');
      } else if (isDining) {
        setTimeSlot('7:30 PM (Dinner)');
        setExperienceType('Courtyard Garden Window Table');
      } else if (isTourist) {
        setTimeSlot('10:00 AM (Morning)');
        setExperienceType('VIP Fast-Track & Priority Pass');
      } else {
        setTimeSlot('2:00 PM (Afternoon)');
        setExperienceType('Concierge Chauffeur Pass');
      }
    }
  }, [visible, component?.id]);

  // Time Slot Options based on category
  const timeSlotOptions = isHotel
    ? ['2:00 PM (Standard Check-in)', '12:00 PM (Priority Early Arrival)', '4:00 PM (Afternoon Arrival)', '8:00 PM (Late Night VIP Arrival)']
    : isDining
    ? ['12:30 PM (Lunch)', '4:00 PM (High Tea)', '7:30 PM (Sunset)', '9:00 PM (Late Dinner)']
    : isTourist
    ? ['9:30 AM (Morning Tour)', '11:30 AM (Guided)', '3:00 PM (Afternoon)', '5:30 PM (Golden Hour)']
    : ['10:00 AM', '1:00 PM', '4:00 PM', '6:30 PM'];

  // Seating / Suite / Experience Options
  const experienceOptions = isHotel
    ? [
        'Luxury Royal Heritage Room (King Bed • Chamundi View)',
        'Executive Heritage Suite (Balcony • VIP Lounge Access)',
        'Grand Royal Maharaja Suite (Panoramic Palace View • Butler)',
        'Presidential Heritage Penthouse (Private Terrace & Courtyard Pool)',
      ]
    : isDining
    ? ['Courtyard Garden Window Table', 'Outdoor Garden Terrace', 'Romantic Candlelit Corner', "Private Chef's Table"]
    : isTourist
    ? ['VIP Fast-Track & Priority Pass', 'Guided Heritage Historian Tour', 'Private Chauffeur Package']
    : ['Standard VIP Concierge Service', 'Dedicated Personal Assistant'];

  // Dietary Options (mainly for dining)
  const dietaryOptions = [
    'Standard / No Restrictions',
    'Vegetarian 🥗',
    'Vegan 🌱',
    'Gluten-Free 🌾',
    'Halal 🥩',
    'Jain Dietary',
  ];

  // Submission Handler
  const handleConfirmBooking = async () => {
    setErrorMessage('');
    if (!guestName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your contact phone or WhatsApp number.');
      return;
    }
    if (!isHotel && !roomNumber.trim()) {
      setErrorMessage('Please enter your hotel Room or Suite number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        componentId: component.id,
        componentTitle: component.title,
        category: isHotel ? 'Hotels' : meta.label,
        guestName: guestName.trim(),
        roomNumber: isHotel ? `${roomsCount} Room(s) • ${experienceType.split('(')[0].trim()}` : roomNumber.trim(),
        phone: phone.trim(),
        email: email.trim(),
        bookingDate: resolvedBookingDate,
        timeSlot,
        guestCount,
        experienceType,
        dietaryPreference: isDining ? dietaryPreference : '',
        specialRequests: specialRequests.trim(),
      };

      const result = await apiService.createBooking(payload);
      if (result && result.success) {
        setConfirmedBooking(result.booking);
        if (onBookingConfirmed) {
          onBookingConfirmed(result.booking);
        }
      } else {
        setErrorMessage(result?.error || 'Failed to submit booking. Please try again.');
      }
    } catch (err) {
      console.error('[BookingModal] Submit error:', err);
      setErrorMessage('An unexpected error occurred while booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    if (!confirmedBooking) return;
    const text = `🛎️ *${isHotel ? 'HOTEL SUITE RESERVATION' : 'HOTEL CONCIERGE VIP RESERVATION'}*\nRef: ${confirmedBooking.id}\nHotel/Venue: ${confirmedBooking.componentTitle}\nGuest: ${confirmedBooking.guestName}\nPhone: ${confirmedBooking.phone || 'N/A'}\nDates: ${confirmedBooking.bookingDate}\nArrival/Time: ${confirmedBooking.timeSlot}\nGuests: ${confirmedBooking.guestCount}\nSuite/Experience: ${confirmedBooking.experienceType}\nStatus: ${confirmedBooking.status}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          
          {/* ================================================================= */}
          {/* HEADER: Title, Subtitle, and Close '✕' Button                     */}
          {/* ================================================================= */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleColumn}>
              <View style={styles.badgeRow}>
                <Text style={styles.headerIcon}>🛎️</Text>
                <Text style={styles.headerBadgeText}>
                  {confirmedBooking
                    ? 'BOOKING CONFIRMED'
                    : isHotel
                    ? 'LUXURY HOTEL ROOM & SUITE RESERVATION'
                    : isDining
                    ? 'RESERVE DINING & TABLE'
                    : 'BOOK TOURIST VIP PASS'}
                </Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {confirmedBooking ? 'Reservation Voucher' : component.title}
              </Text>
              <Text style={styles.headerSubtitle}>
                {confirmedBooking
                  ? 'Your priority arrangement has been logged with the hotel concierge.'
                  : isHotel
                  ? 'Select your stay dates (Today, Tomorrow, or Custom) and suite preferences.'
                  : `Select your preferences and our hotel concierge desk will arrange your visit.`}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ================================================================= */}
          {/* BODY: Either Form View OR Confirmed Voucher View                  */}
          {/* ================================================================= */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {confirmedBooking ? (
              /* ============================================================= */
              /* STATE 2: CONFIRMED RESERVATION VOUCHER                        */
              /* ============================================================= */
              <View style={styles.confirmationWrapper}>
                {/* Gold Crest Stamp */}
                <View style={styles.stampCircle}>
                  <Text style={styles.stampIcon}>✓</Text>
                </View>
                <Text style={styles.confirmTitle}>Reservation Confirmed!</Text>
                <Text style={styles.confirmRef}>
                  Reference Code: <Text style={styles.confirmRefHighlight}>{confirmedBooking.id}</Text>
                </Text>

                {/* Voucher Ticket Details */}
                <View style={styles.voucherTicket}>
                  <View style={styles.voucherHeaderRow}>
                    <View style={styles.voucherVenueInfo}>
                      <Text style={styles.voucherVenueTitle}>{confirmedBooking.componentTitle}</Text>
                      <Text style={styles.voucherCategoryTag}>{confirmedBooking.category}</Text>
                    </View>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>● {confirmedBooking.status}</Text>
                    </View>
                  </View>

                  <View style={styles.voucherDivider} />

                  <View style={styles.voucherGrid}>
                    <View style={styles.voucherGridItem}>
                      <Text style={styles.voucherFieldLabel}>GUEST NAME</Text>
                      <Text style={styles.voucherFieldValue}>{confirmedBooking.guestName}</Text>
                    </View>
                    <View style={styles.voucherGridItem}>
                      <Text style={styles.voucherFieldLabel}>{isHotel ? 'ACCOMMODATION' : 'ROOM / SUITE'}</Text>
                      <Text style={styles.voucherFieldValue}>{confirmedBooking.roomNumber}</Text>
                    </View>
                    <View style={styles.voucherGridItem}>
                      <Text style={styles.voucherFieldLabel}>{isHotel ? 'STAY DATES & ARRIVAL' : 'DATE & TIME'}</Text>
                      <Text style={styles.voucherFieldValue}>
                        {confirmedBooking.bookingDate} • {confirmedBooking.timeSlot}
                      </Text>
                    </View>
                    <View style={styles.voucherGridItem}>
                      <Text style={styles.voucherFieldLabel}>GUESTS</Text>
                      <Text style={styles.voucherFieldValue}>{confirmedBooking.guestCount} Persons</Text>
                    </View>
                    <View style={[styles.voucherGridItem, { width: '100%' }]}>
                      <Text style={styles.voucherFieldLabel}>{isHotel ? 'RESERVED SUITE' : 'EXPERIENCE / TABLE'}</Text>
                      <Text style={styles.voucherFieldValue}>{confirmedBooking.experienceType}</Text>
                    </View>
                    {confirmedBooking.dietaryPreference ? (
                      <View style={[styles.voucherGridItem, { width: '100%' }]}>
                        <Text style={styles.voucherFieldLabel}>DIETARY PREFERENCE</Text>
                        <Text style={styles.voucherFieldValue}>{confirmedBooking.dietaryPreference}</Text>
                      </View>
                    ) : null}
                    {confirmedBooking.specialRequests ? (
                      <View style={[styles.voucherGridItem, { width: '100%' }]}>
                        <Text style={styles.voucherFieldLabel}>SPECIAL REQUESTS</Text>
                        <Text style={styles.voucherFieldValue}>"{confirmedBooking.specialRequests}"</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.voucherDivider} />

                  {/* Concierge Assurance Bar */}
                  <View style={styles.assuranceBar}>
                    <Text style={styles.assuranceIcon}>🛎️</Text>
                    <Text style={styles.assuranceText}>
                      Our Concierge Desk has received this request. You can also pick up physical VIP passes at the Main Lobby Concierge Counter.
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.confirmActionRow}>
                  <TouchableOpacity
                    style={styles.whatsappButton}
                    onPress={handleShareWhatsApp}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.whatsappButtonText}>📱 Share to WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={onClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.doneButtonText}>Done & Return</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* ============================================================= */
              /* STATE 1: INTERACTIVE BOOKING FORM                             */
              /* ============================================================= */
              <View style={styles.formContainer}>
                
                {/* Venue Strip */}
                <View style={styles.venueStrip}>
                  <Image source={{ uri: component.imageLink }} style={styles.venueThumb} />
                  <View style={styles.venueDetails}>
                    <Text style={styles.venueName} numberOfLines={1}>{component.title}</Text>
                    <Text style={styles.venueLoc} numberOfLines={1}>
                      📍 {component.location || 'Near Hotel'} • ⭐ {component.customerRatings || component.rating || '4.9'}
                    </Text>
                  </View>
                </View>

                {/* Error Banner */}
                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorBoxText}>⚠️ {errorMessage}</Text>
                  </View>
                ) : null}

                {/* Official Registration & Direct Links */}
                {isHotel ? (
                  <View style={styles.registrationLinksContainer}>
                    <Text style={styles.registrationLinksTitle}>🔗 DIRECT REGISTRATION & RESERVATION LINKS</Text>
                    <View style={styles.registrationLinksRow}>
                      <TouchableOpacity
                        style={styles.registrationLinkCard}
                        onPress={() => {
                          const url = component.externalUrl || component.websiteUrl || `https://www.google.com/search?q=${encodeURIComponent(component.title || 'Hotel')}`;
                          if (Platform.OS === 'web') window.open(url, '_blank');
                          else Linking.openURL(url);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.registrationLinkIcon}>🌐</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.registrationLinkText}>Official Hotel Link</Text>
                          <Text style={styles.registrationLinkSub}>Direct property location & site</Text>
                        </View>
                        <Text style={styles.registrationLinkArrow}>↗</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.registrationLinkCard}
                        onPress={() => {
                          const url = component.bookingUrl || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(component.title || 'Hotel')}`;
                          if (Platform.OS === 'web') window.open(url, '_blank');
                          else Linking.openURL(url);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.registrationLinkIcon}>🏨</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.registrationLinkText}>Booking.com Listing</Text>
                          <Text style={styles.registrationLinkSub}>Verified rates & instant check-in</Text>
                        </View>
                        <Text style={styles.registrationLinkArrow}>↗</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.registrationLinkCard}
                        onPress={() => {
                          const url = 'tel:+918212415566';
                          Linking.openURL(url).catch(() => {});
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.registrationLinkIcon}>📞</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.registrationLinkText}>Front Desk Direct Line</Text>
                          <Text style={styles.registrationLinkSub}>+91 821 241 5566 (24/7 Concierge)</Text>
                        </View>
                        <Text style={styles.registrationLinkArrow}>↗</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* Section 1: Guest Credentials */}
                <Text style={styles.formSectionHeading}>1. GUEST DETAILS</Text>
                
                <View style={styles.inputRow}>
                  <View style={[styles.inputWrapper, { flex: isHotel ? 1 : 1.4 }]}>
                    <Text style={styles.inputLabel}>FULL GUEST NAME *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Mr. Alexander Wright"
                      placeholderTextColor="#64748B"
                      value={guestName}
                      onChangeText={setGuestName}
                    />
                  </View>

                  {isHotel ? (
                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>CONTACT PHONE / WHATSAPP *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. +91 98765 43210"
                        placeholderTextColor="#64748B"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </View>
                  ) : (
                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>ROOM / SUITE # *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Suite 402"
                        placeholderTextColor="#64748B"
                        value={roomNumber}
                        onChangeText={setRoomNumber}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.inputRow}>
                  {!isHotel ? (
                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>PHONE / WHATSAPP *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. +91 98765 43210"
                        placeholderTextColor="#64748B"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </View>
                  ) : (
                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>MEMBERSHIP / VIP CODE (OPTIONAL)</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. VIP Guest / Member"
                        placeholderTextColor="#64748B"
                        value={roomNumber}
                        onChangeText={setRoomNumber}
                      />
                    </View>
                  )}

                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>EMAIL ADDRESS (FOR VOUCHER)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. guest@example.com"
                      placeholderTextColor="#64748B"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                {/* Section 2: Date & Time Schedule (Today, Tomorrow, Custom) */}
                <Text style={styles.formSectionHeading}>
                  {isHotel ? '2. STAY SCHEDULE (TODAY, TOMORROW & CUSTOM)' : '2. DATE & TIME SCHEDULE'}
                </Text>

                {/* Date Selection Pills: Today, Tomorrow, Custom */}
                <View style={styles.pillsRow}>
                  <TouchableOpacity
                    style={[styles.pillBtn, dateMode === 'today' && styles.pillBtnActive]}
                    onPress={() => setDateMode('today')}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.pillBtnText, dateMode === 'today' && styles.pillBtnTextActive]}>
                      📅 Today
                    </Text>
                    <Text style={[styles.pillSubText, dateMode === 'today' && styles.pillSubTextActive]}>
                      {todayStr}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.pillBtn, dateMode === 'tomorrow' && styles.pillBtnActive]}
                    onPress={() => setDateMode('tomorrow')}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.pillBtnText, dateMode === 'tomorrow' && styles.pillBtnTextActive]}>
                      📅 Tomorrow
                    </Text>
                    <Text style={[styles.pillSubText, dateMode === 'tomorrow' && styles.pillSubTextActive]}>
                      {tomorrowStr}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.pillBtn, dateMode === 'custom' && styles.pillBtnActive]}
                    onPress={() => setDateMode('custom')}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.pillBtnText, dateMode === 'custom' && styles.pillBtnTextActive]}>
                      🗓️ Custom Date
                    </Text>
                    <Text style={[styles.pillSubText, dateMode === 'custom' && styles.pillSubTextActive]}>
                      Pick Date & Nights
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Custom Date Selector Box */}
                {dateMode === 'custom' && (
                  <View style={styles.customDateBox}>
                    <View style={styles.customDateRow}>
                      <View style={{ flex: 1.2 }}>
                        <Text style={styles.subInputLabel}>CHECK-IN DATE (YYYY-MM-DD):</Text>
                        <TextInput
                          style={styles.textInput}
                          value={customCheckIn}
                          onChangeText={setCustomCheckIn}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#64748B"
                        />
                      </View>

                      <View style={{ flex: 1.2 }}>
                        <Text style={styles.subInputLabel}>QUICK DATE PRESETS:</Text>
                        <View style={styles.quickPresetRow}>
                          <TouchableOpacity
                            style={styles.presetChip}
                            onPress={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 2);
                              setCustomCheckIn(toISODate(d));
                            }}
                          >
                            <Text style={styles.presetChipText}>+2 Days</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.presetChip}
                            onPress={() => {
                              const d = new Date();
                              const day = d.getDay();
                              const diff = (6 - day + 7) % 7 || 7;
                              d.setDate(d.getDate() + diff);
                              setCustomCheckIn(toISODate(d));
                            }}
                          >
                            <Text style={styles.presetChipText}>Weekend</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.presetChip}
                            onPress={() => {
                              const d = new Date();
                              d.setDate(d.getDate() + 7);
                              setCustomCheckIn(toISODate(d));
                            }}
                          >
                            <Text style={styles.presetChipText}>+1 Wk</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Stay Duration (Nights) */}
                    <View style={{ marginTop: 6 }}>
                      <Text style={styles.subInputLabel}>STAY DURATION (NUMBER OF NIGHTS):</Text>
                      <View style={styles.nightsChipsWrap}>
                        {[1, 2, 3, 4, 5, 7].map((num) => (
                          <TouchableOpacity
                            key={`night-${num}`}
                            style={[styles.nightChip, nightsCount === num && styles.nightChipActive]}
                            onPress={() => setNightsCount(num)}
                          >
                            <Text style={[styles.nightChipText, nightsCount === num && styles.nightChipTextActive]}>
                              {num} {num === 1 ? 'Night' : 'Nights'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Calculation summary banner */}
                    <View style={styles.dateSummaryChip}>
                      <Text style={styles.dateSummaryText}>
                        ✨ Check-in: <Text style={styles.goldHighlight}>{computedCheckInFormatted}</Text> ➔ Check-out: <Text style={styles.goldHighlight}>{computedCheckOut}</Text> ({nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'})
                      </Text>
                    </View>
                  </View>
                )}

                {/* Duration for Today & Tomorrow (for hotels) */}
                {isHotel && dateMode !== 'custom' && (
                  <View style={styles.quickNightsContainer}>
                    <Text style={styles.subInputLabel}>STAY DURATION (NUMBER OF NIGHTS):</Text>
                    <View style={styles.nightsChipsWrap}>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <TouchableOpacity
                          key={`stay-night-${num}`}
                          style={[styles.nightChip, nightsCount === num && styles.nightChipActive]}
                          onPress={() => setNightsCount(num)}
                        >
                          <Text style={[styles.nightChipText, nightsCount === num && styles.nightChipTextActive]}>
                            {num} {num === 1 ? 'Night' : 'Nights'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Time Slot Chips */}
                <View style={[styles.chipsContainer, { marginTop: 6 }]}>
                  {timeSlotOptions.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.chipBtn, timeSlot === slot && styles.chipBtnActive]}
                      onPress={() => setTimeSlot(slot)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipBtnText, timeSlot === slot && styles.chipBtnTextActive]}>
                        ⏰ {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Section 3: Guest Count & Experience Choice */}
                <Text style={styles.formSectionHeading}>
                  {isHotel
                    ? '3. SUITE SELECTION & ROOM CAPACITY'
                    : isDining
                    ? '3. PARTY SIZE & SEATING PREFERENCE'
                    : '3. PARTY SIZE & TOUR PACKAGE'}
                </Text>

                {isHotel ? (
                  <View style={[styles.inputRow, { marginVertical: 2 }]}>
                    <View style={[styles.counterRow, { flex: 1 }]}>
                      <Text style={styles.counterLabel}>ROOMS / SUITES:</Text>
                      <View style={styles.stepperWrap}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setRoomsCount(Math.max(1, roomsCount - 1))}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperValueText}>{roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setRoomsCount(Math.min(10, roomsCount + 1))}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={[styles.counterRow, { flex: 1.1 }]}>
                      <Text style={styles.counterLabel}>TOTAL GUESTS:</Text>
                      <View style={styles.stepperWrap}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperValueText}>{guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setGuestCount(Math.min(20, guestCount + 1))}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  /* Guests Counter */
                  <View style={styles.counterRow}>
                    <Text style={styles.counterLabel}>NUMBER OF GUESTS:</Text>
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValueText}>{guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setGuestCount(Math.min(20, guestCount + 1))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Experience / Seating Radio Buttons */}
                <View style={styles.experienceList}>
                  {experienceOptions.map((exp) => (
                    <TouchableOpacity
                      key={exp}
                      style={[styles.expRow, experienceType === exp && styles.expRowActive]}
                      onPress={() => setExperienceType(exp)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.radioCircle, experienceType === exp && styles.radioCircleActive]}>
                        {experienceType === exp && <View style={styles.radioDot} />}
                      </View>
                      <Text style={[styles.expRowText, experienceType === exp && styles.expRowTextActive]}>
                        {exp}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Dietary Preference for Dining */}
                {isDining && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.subLabel}>DIETARY PREFERENCES:</Text>
                    <View style={styles.dietaryWrap}>
                      {dietaryOptions.map((diet) => (
                        <TouchableOpacity
                          key={diet}
                          style={[styles.dietPill, dietaryPreference === diet && styles.dietPillActive]}
                          onPress={() => setDietaryPreference(diet)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.dietPillText, dietaryPreference === diet && styles.dietPillTextActive]}>
                            {diet}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Section 4: Special Notes */}
                <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                  <Text style={styles.inputLabel}>
                    {isHotel ? 'SPECIAL STAY REQUESTS & PREFERENCES' : 'SPECIAL REQUESTS / CHAUFFEUR NOTES'}
                  </Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder={
                      isHotel
                        ? "e.g. Sea-facing high floor requested, early arrival, anniversary celebration, airport pickup..."
                        : "e.g. Celebrating an anniversary, window view preferred, high chair needed..."
                    }
                    placeholderTextColor="#64748B"
                    multiline
                    numberOfLines={2}
                    value={specialRequests}
                    onChangeText={setSpecialRequests}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleConfirmBooking}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#0B0F19" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonIcon}>✓</Text>
                      <Text style={styles.submitButtonText}>
                        {isHotel ? 'Confirm Luxury Hotel Reservation' : 'Confirm Concierge Booking'}
                      </Text>
                      <Text style={styles.submitButtonArrow}>→</Text>
                    </>
                  )}
                </TouchableOpacity>

              </View>
            )}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 14, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: '#0B101D',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.28)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#0F1526',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleColumn: {
    flex: 1,
    paddingRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  headerIcon: {
    fontSize: 12,
  },
  headerBadgeText: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  closeButtonText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formContainer: {
    gap: 10,
  },
  venueStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  venueThumb: {
    width: 44,
    height: 44,
    borderRadius: 7,
    backgroundColor: '#1E2538',
  },
  venueDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  venueName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  venueLoc: {
    color: '#94A3B8',
    fontSize: 10.5,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 8,
  },
  errorBoxText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '600',
  },
  formSectionHeading: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputWrapper: {
    gap: 4,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    color: '#FFFFFF',
    fontSize: 12,
  },
  textArea: {
    minHeight: 52,
    textAlignVertical: 'top',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 7,
    paddingVertical: 7,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  pillBtnActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderColor: '#E2C082',
  },
  pillBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  pillBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  pillSubText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },
  pillSubTextActive: {
    color: '#E2C082',
    fontWeight: '700',
  },
  customDateBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  subInputLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  quickPresetRow: {
    flexDirection: 'row',
    gap: 4,
  },
  presetChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  presetChipText: {
    color: '#CBD5E1',
    fontSize: 9.5,
    fontWeight: '700',
  },
  nightsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  nightChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  nightChipActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.2)',
    borderColor: '#E2C082',
  },
  nightChipText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  nightChipTextActive: {
    color: '#E2C082',
    fontWeight: '800',
  },
  quickNightsContainer: {
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dateSummaryChip: {
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  dateSummaryText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  goldHighlight: {
    color: '#E2C082',
    fontWeight: '800',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  chipBtnActive: {
    backgroundColor: '#E2C082',
    borderColor: '#E2C082',
  },
  chipBtnText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  chipBtnTextActive: {
    color: '#0B0F19',
    fontWeight: '800',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  counterLabel: {
    color: '#CBD5E1',
    fontSize: 10.5,
    fontWeight: '700',
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(226, 192, 130, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.4)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  stepperBtnText: {
    color: '#E2C082',
    fontSize: 14,
    fontWeight: '900',
  },
  stepperValueText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    minWidth: 55,
    textAlign: 'center',
  },
  experienceList: {
    gap: 6,
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  expRowActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    borderColor: 'rgba(226, 192, 130, 0.5)',
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#E2C082',
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2C082',
  },
  expRowText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  expRowTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  subLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  dietaryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dietPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  dietPillActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: '#34D399',
  },
  dietPillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  dietPillTextActive: {
    color: '#34D399',
    fontWeight: '800',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2C082',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
    marginTop: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(226, 192, 130, 0.3)',
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonIcon: {
    color: '#0B0F19',
    fontSize: 13,
    fontWeight: '900',
  },
  submitButtonText: {
    color: '#0B0F19',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  submitButtonArrow: {
    color: '#0B0F19',
    fontSize: 14,
    fontWeight: '900',
  },

  // ===========================================================================
  // CONFIRMATION VOUCHER STYLES
  // ===========================================================================
  confirmationWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  stampCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 2,
    borderColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stampIcon: {
    color: '#34D399',
    fontSize: 24,
    fontWeight: 'bold',
  },
  confirmTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  confirmRef: {
    color: '#94A3B8',
    fontSize: 11,
  },
  confirmRefHighlight: {
    color: '#E2C082',
    fontWeight: '800',
  },
  voucherTicket: {
    width: '100%',
    backgroundColor: '#0F1628',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    gap: 8,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  voucherVenueInfo: {
    flex: 1,
    paddingRight: 8,
  },
  voucherVenueTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  voucherCategoryTag: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: '#34D399',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
  },
  voucherDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  voucherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  voucherGridItem: {
    width: '48%',
  },
  voucherFieldLabel: {
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  voucherFieldValue: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  assuranceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 192, 130, 0.08)',
    borderRadius: 7,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.2)',
  },
  assuranceIcon: {
    fontSize: 14,
  },
  assuranceText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 9.5,
    lineHeight: 13,
  },
  confirmActionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  doneButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },

  // Registration Links Styles
  registrationLinksContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  registrationLinksTitle: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  registrationLinksRow: {
    gap: 6,
  },
  registrationLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      },
    }),
  },
  registrationLinkIcon: {
    fontSize: 16,
  },
  registrationLinkText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  registrationLinkSub: {
    color: '#94A3B8',
    fontSize: 9.5,
    marginTop: 1,
  },
  registrationLinkArrow: {
    color: '#E2C082',
    fontSize: 13,
    fontWeight: '800',
  },
});
