// =============================================================================
// src/screens/DetailScreen.js
// Dedicated Next Page / In-Depth Details Screen for Display Components
// Features rich hero imagery, photo gallery switcher, metric cards,
// exclusive hotel guest privileges, detailed history/guide, and concierge CTAs.
// =============================================================================

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ImageBackground,
  Image,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { getCategoryMeta } from '../components/DisplayComponent';
import { getComponentDetails } from '../data/componentDetails';
import ScanToMobileModal from '../components/ScanToMobileModal';
import BookingModal from '../components/BookingModal';
import ChauffeurModal from '../components/ChauffeurModal';
import { HOTEL_START, HOTEL_ORIGIN_QUERY, getRouteDirections, getGoogleMapsDestinationQuery } from '../components/RouteDetailsModal';
import { apiService } from '../services/apiService';
import { activeHotelService } from '../services/activeHotelService';

export default function DetailScreen({ component, hotel, onBack }) {
  const activeHotel = hotel || activeHotelService.getActiveHotel();
  const originName = activeHotel?.name || HOTEL_START.name;
  const originAddress = activeHotel?.address || activeHotel?.city || HOTEL_START.address;
  const originCity = activeHotel?.city || 'Local Area';
  const originLat = activeHotel?.latitude;
  const originLng = activeHotel?.longitude;

  const details = getComponentDetails(component);
  const meta = getCategoryMeta(component?.componentType, component?.category);

  // Active selected image for the hero banner (can be changed by clicking gallery thumbnails)
  const [activeImage, setActiveImage] = useState(component?.imageLink);
  const [likesCount, setLikesCount] = useState(component?.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [chauffeurModalVisible, setChauffeurModalVisible] = useState(false);

  if (!component || !details) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Component details not found.</Text>
        <TouchableOpacity style={styles.backButtonPrimary} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Hotel Portal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLike = () => {
    if (!hasLiked) {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
    } else {
      setLikesCount((prev) => prev - 1);
      setHasLiked(false);
    }
  };

  const handleConciergeBooking = () => {
    setBookingSuccess(true);
    const msg = `Your VIP Concierge arrangement for "${component.title}" has been requested! The ${originName} concierge desk is preparing your priority pass and chauffeur dispatch.`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Concierge Booking Confirmed', msg);
    }
  };

  const handleChauffeurBooking = () => {
    const msg = `Private Mercedes Chauffeur dispatched to ${originName} Porch for transit to "${component.title}". Please meet driver at the Main Entrance.`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Chauffeur Dispatched', msg);
    }
  };

  // Authentic Start ➔ End route calculations from Active Hotel
  const rawDistance = component.distance || component.hotelDistance || component.location || details.location || '2.4 km';
  const cleanDistance = String(rawDistance).replace('📍', '').replace('from Hotel', '').trim();
  const driveTime = component.driveTime || (cleanDistance.includes('0.') ? '2 mins' : cleanDistance.includes('1.') ? '4 mins' : '12 mins');
  const autoTime = cleanDistance.includes('0.') ? '3 mins' : cleanDistance.includes('1.') ? '6 mins' : '16 mins';
  const walkTime = component.walkTime || (cleanDistance.includes('0.2') ? '2 mins' : cleanDistance.includes('0.3') ? '3 mins' : cleanDistance.includes('0.6') ? '7 mins' : '25 mins');

  const destinationQuery = (component?.latitude && component?.longitude)
    ? `${component.latitude},${component.longitude}`
    : encodeURIComponent(component?.address || component?.location || getGoogleMapsDestinationQuery(component));

  const googleMapsDirectionsUrl = (originLat && originLng)
    ? `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destinationQuery}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddress)}&destination=${destinationQuery}&travelmode=driving`;

  const handleOpenGoogleMaps = () => {
    if (Platform.OS === 'web') {
      window.open(googleMapsDirectionsUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(googleMapsDirectionsUrl).catch((err) => console.error('Error opening maps:', err));
    }
  };

  const routeSteps = getRouteDirections(component, activeHotel);

  return (
    <View style={styles.screenContainer}>
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backNavButton}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.backNavIcon}>←</Text>
          <Text style={styles.backNavText}>Back to Hotel Portal</Text>
        </TouchableOpacity>

        {/* Category Pill */}
        <View
          style={[
            styles.categoryPill,
            { backgroundColor: meta.badgeBg, borderColor: meta.borderColor },
          ]}
        >
          <Text style={styles.categoryIcon}>{meta.icon}</Text>
          <Text style={[styles.categoryPillText, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>

        <View style={styles.navRightGroup}>
          {/* VIP Concierge Booking Button */}
          <TouchableOpacity
            style={styles.bookNavButton}
            onPress={() => setBookingModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.bookNavIcon}>🛎️</Text>
            <Text style={styles.bookNavText}>Book / Reserve</Text>
          </TouchableOpacity>

          {/* Scan to Phone / VIP Pass Button */}
          <TouchableOpacity
            style={styles.scanNavButton}
            onPress={() => setScanModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.scanNavIcon}>📱</Text>
            <Text style={styles.scanNavText}>Scan to Phone</Text>
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity
            style={[styles.likeButton, hasLiked && styles.likeButtonActive]}
            onPress={handleLike}
            activeOpacity={0.8}
          >
            <Text style={[styles.likeIcon, hasLiked && styles.likeIconActive]}>♥</Text>
            <Text style={styles.likeCountText}>{likesCount.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. SCROLLABLE DETAILS BODY */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        
        {/* HERO BANNER */}
        <View style={styles.heroWrapper}>
          <ImageBackground
            source={{ uri: activeImage || component.imageLink }}
            style={styles.heroImage}
            imageStyle={styles.heroImageStyle}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay}>
              <View style={styles.heroTopBadges}>
                <View style={styles.spotlightChip}>
                  <Text style={styles.spotlightText}>
                    ★ PRIORITY #{details.priority} • TOP RECOMMENDATION
                  </Text>
                </View>

                {details.tag ? (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{details.tag}</Text>
                  </View>
                ) : null}
              </View>

              {/* Title & Ratings inside Hero Bottom Scrim */}
              <View style={styles.heroBottomScrim}>
                <Text style={styles.heroTitle}>{details.title}</Text>
                <Text style={[styles.heroSubtitle, { color: meta.color }]}>
                  {details.subtitle}
                </Text>

                <View style={styles.heroMetricsRow}>
                  <View style={styles.heroRatingPill}>
                    <Text style={styles.starText}>★</Text>
                    <Text style={styles.ratingNumber}>{details.rating} / 5.0</Text>
                    <Text style={styles.ratingReviewCount}>
                      ({details.likes.toLocaleString()} guest reviews)
                    </Text>
                  </View>

                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>● Verified Destination</Text>
                  </View>

                  {/* Prominent Golden Book Now Button in Hero */}
                  <TouchableOpacity
                    style={styles.heroBookBtn}
                    onPress={() => setBookingModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.heroBookBtnIcon}>🛎️</Text>
                    <Text style={styles.heroBookBtnText}>
                      {parseInt(component?.componentType, 10) === 4
                        ? 'Reserve Table'
                        : 'Book VIP Pass'}
                    </Text>
                    <Text style={styles.heroBookBtnArrow}>→</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* 3. PHOTO GALLERY THUMBNAILS (CLICK TO CHANGE HERO IMAGE) */}
        {details.gallery && details.gallery.length > 1 && (
          <View style={styles.gallerySection}>
            <Text style={styles.sectionLabel}>PHOTO GALLERY (TAP TO VIEW)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryRow}>
              {details.gallery.map((imgUri, idx) => (
                <TouchableOpacity
                  key={`gallery-${idx}`}
                  activeOpacity={0.8}
                  onPress={() => setActiveImage(imgUri)}
                  style={[
                    styles.galleryThumbWrapper,
                    activeImage === imgUri && styles.galleryThumbActive,
                  ]}
                >
                  <Image source={{ uri: imgUri }} style={styles.galleryThumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 3.5. SUPERVISOR SPECIFICATION: 3 TO 4 ADDITIONAL INFORMATION DETAILS & REGISTRATION */}
        <View style={styles.supervisorDetailsCard}>
          <View style={styles.supervisorCardHeader}>
            <Text style={styles.supervisorCardBadge}>CONTENT TYPE {component.componentType || '5+'} • DOUBLE SCREEN</Text>
            <Text style={styles.supervisorSectionTitle}>{component.title || details.title}</Text>
            <Text style={styles.supervisorSubtitle}>{component.subtitle || details.subtitle}</Text>
            <Text style={styles.supervisorDescText}>
              {component.shortDescription || details.longDescription || 'Exclusive luxury experience reserved for discerning hotel guests.'}
            </Text>
          </View>

          {/* 3 TO 4 BULLET INFORMATION STRINGS */}
          <View style={styles.bulletListContainer}>
            <View style={styles.bulletItemRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletLabel}>Timing:</Text>
              <Text style={styles.bulletValue}>
                {component.timing || details.hours || '8:00 AM – 11:30 PM Daily'}
              </Text>
            </View>

            <View style={styles.bulletItemRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletLabel}>Offer / Discount:</Text>
              <Text style={styles.bulletValue}>
                {component.offer || details.admission || '20% Privilege Discount for Hotel Residents'}
              </Text>
            </View>

            <View style={styles.bulletItemRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletLabel}>Location:</Text>
              <Text style={styles.bulletValue}>
                {component.location || details.location || hotel?.address || 'Near Hotel'}
              </Text>
            </View>

            <View style={styles.bulletItemRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletLabel}>Additional information:</Text>
              <Text style={styles.bulletValue}>
                {component.additionalInfo || 'VIP Priority Seating & Complimentary Welcome Refreshments'}
              </Text>
            </View>
          </View>

          {/* PROMINENT REGISTER / BOOK NOW BUTTON */}
          <TouchableOpacity
            style={styles.prominentRegisterButton}
            onPress={() => setBookingModalVisible(true)}
            activeOpacity={0.88}
          >
            <Text style={styles.prominentRegisterIcon}>📝</Text>
            <Text style={styles.prominentRegisterText}>REGISTER / BOOK NOW</Text>
            <Text style={styles.prominentRegisterArrow}>➔</Text>
          </TouchableOpacity>
        </View>

        {/* 3.6. START ➔ ENDING POINT & TURN-BY-TURN DIRECTIONS (FOR ALL PLACES) */}
        <View style={styles.routeNavigationCard}>
          <View style={styles.routeNavigationHeader}>
            <View style={styles.routeNavigationTitleRow}>
              <Text style={styles.routeNavigationIcon}>🧭</Text>
              <View>
                <Text style={styles.routeNavigationTitle}>START ➔ ENDING POINT NAVIGATION & DIRECTIONS</Text>
                <Text style={styles.routeNavigationSubtitle}>
                  Verified route from {originName} ({originCity}) to destination
                </Text>
              </View>
            </View>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceBadgeText}>📍 {cleanDistance}</Text>
            </View>
          </View>

          {/* Route Endpoints Box */}
          <View style={styles.routeEndpointsBox}>
            {/* Point A: Origin */}
            <View style={styles.routePointRow}>
              <View style={styles.pointDotStart}>
                <Text style={styles.pointDotLetter}>A</Text>
              </View>
              <View style={styles.pointContent}>
                <Text style={styles.pointTypeStart}>🟢 STARTING POINT (HOTEL ORIGIN)</Text>
                <Text style={styles.pointName}>{originName}</Text>
                <Text style={styles.pointAddress}>{originAddress}</Text>
              </View>
            </View>

            {/* Travel Times Banner with connecting line */}
            <View style={styles.routeConnectorContainer}>
              <View style={styles.routeConnectorLine} />
              <View style={styles.travelChipsRow}>
                <View style={styles.travelChip}>
                  <Text style={styles.travelChipText}>🚗 Drive: {driveTime}</Text>
                </View>
                <View style={styles.travelChip}>
                  <Text style={styles.travelChipText}>🛺 Auto: {autoTime}</Text>
                </View>
                <View style={styles.travelChip}>
                  <Text style={styles.travelChipText}>🚶 Walk: {walkTime}</Text>
                </View>
              </View>
            </View>

            {/* Point B: Destination */}
            <View style={styles.routePointRow}>
              <View style={styles.pointDotEnd}>
                <Text style={styles.pointDotLetter}>B</Text>
              </View>
              <View style={styles.pointContent}>
                <Text style={styles.pointTypeEnd}>🔴 ENDING POINT (DESTINATION)</Text>
                <Text style={styles.pointName}>{component.title || details.title}</Text>
                <Text style={styles.pointAddress}>
                  {component.location || details.location || component.address || originCity}
                </Text>
              </View>
            </View>
          </View>

          {/* Turn-by-Turn Route Directions */}
          <View style={styles.routeStepsCard}>
            <Text style={styles.routeStepsTitle}>TURN-BY-TURN ROUTE GUIDANCE</Text>
            {routeSteps.map((s) => (
              <View key={`detail-step-${s.step}`} style={styles.stepItemRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{s.step}</Text>
                </View>
                <Text style={styles.stepText}>{s.text}</Text>
              </View>
            ))}
          </View>

          {/* Navigation Action Buttons */}
          <View style={styles.routeActionsRow}>
            <TouchableOpacity
              style={styles.googleMapsButton}
              onPress={handleOpenGoogleMaps}
              activeOpacity={0.85}
            >
              <Text style={styles.googleMapsIcon}>🗺️</Text>
              <Text style={styles.googleMapsText}>Open in Google Maps Live Navigation</Text>
              <Text style={styles.googleMapsArrow}>➔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chauffeurRideButton}
              onPress={() => setChauffeurModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.chauffeurRideIcon}>🚗</Text>
              <Text style={styles.chauffeurRideText}>Book Chauffeur Ride</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3.8. EXCURSION TRANSIT & EMERGENCY HEALTHCARE (FOR ATTRACTIONS & CITY HIGHLIGHTS) */}
        {(component.metroStation || component.nearestHospital || component.hospitalPhone) && (
          <View style={styles.transitEmergencyCard}>
            <View style={styles.transitEmergencyHeader}>
              <View style={styles.transitEmergencyTitleRow}>
                <Text style={styles.transitEmergencyIcon}>🚆 🏥</Text>
                <View>
                  <Text style={styles.transitEmergencyTitle}>RAILWAY, TRANSIT & EMERGENCY CARE LINK</Text>
                  <Text style={styles.transitEmergencySub}>
                    {originCity} transit links & immediate 24/7 medical priority for hotel residents
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.transitEmergencyGrid}>
              {component.metroStation && (
                <View style={styles.transitEmergencyItem}>
                  <Text style={styles.transitItemIcon}>🚆</Text>
                  <View style={styles.transitItemContent}>
                    <Text style={styles.transitItemLabel}>NEAREST RAILWAY / TRANSIT</Text>
                    <Text style={styles.transitItemValue}>{component.metroStation}</Text>
                    <Text style={styles.transitItemSub}>{component.metroDistance || '0.8 km'} • {component.metroTravelTime || 'Direct line'}</Text>
                  </View>
                </View>
              )}

              {component.nearestHospital && (
                <View style={styles.transitEmergencyItem}>
                  <Text style={styles.transitItemIcon}>🏥</Text>
                  <View style={styles.transitItemContent}>
                    <Text style={styles.transitItemLabel}>24/7 EMERGENCY HOSPITAL</Text>
                    <Text style={styles.transitItemValue}>{component.nearestHospital}</Text>
                    <Text style={styles.transitItemSub}>{component.hospitalDistance || '1.2 km away'} • Direct Hotel Billing</Text>
                  </View>
                </View>
              )}

              {component.hospitalPhone && (
                <View style={styles.transitEmergencyItem}>
                  <Text style={styles.transitItemIcon}>📞</Text>
                  <View style={styles.transitItemContent}>
                    <Text style={styles.transitItemLabel}>EMERGENCY HOTLINE</Text>
                    <Text style={styles.transitItemValue}>{component.hospitalPhone}</Text>
                    <Text style={styles.transitItemSub}>Direct Concierge Emergency Dispatch</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 4. QUICK INFORMATION MATRIX (4 METRIC CARDS) */}
        <View style={styles.infoMatrix}>
          
          <View style={styles.infoCard}>
            <View style={styles.infoIconWrapper}>
              <Text style={styles.infoIcon}>📍</Text>
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoTitle}>DISTANCE FROM HOTEL</Text>
              <Text style={styles.infoValue}>{details.location}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconWrapper}>
              <Text style={styles.infoIcon}>⏰</Text>
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoTitle}>VISITING HOURS</Text>
              <Text style={styles.infoValue}>{details.hours}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconWrapper}>
              <Text style={styles.infoIcon}>🎟️</Text>
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoTitle}>ADMISSION PRIVILEGE</Text>
              <Text style={styles.infoValue}>{details.admission}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconWrapper}>
              <Text style={styles.infoIcon}>📞</Text>
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoTitle}>CONCIERGE HOTLINE</Text>
              <Text style={styles.infoValue}>{details.contact}</Text>
            </View>
          </View>

        </View>

        {/* 4.5. HOTEL-SPECIFIC PAYMENT METHODS & AVAILABILITY (Part 6 & Part 8) */}
        <View style={styles.hotelPaymentsCard}>
          <View style={styles.hotelPaymentsHeader}>
            <View style={styles.hotelPaymentsTitleGroup}>
              <Text style={styles.hotelPaymentsIcon}>💳</Text>
              <View>
                <Text style={styles.hotelPaymentsTitle}>ACCEPTED PAYMENT METHODS</Text>
                <Text style={styles.hotelPaymentsSub}>
                  Configured specifically for {component.title}
                </Text>
              </View>
            </View>

            {/* Clear Availability Indicator (Part 6 & Part 15) */}
            <View
              style={[
                styles.availIndicatorBadge,
                (component.availability === 'Available' || !component.availability)
                  ? styles.availIndicatorGreen
                  : styles.availIndicatorRed,
              ]}
            >
              <Text
                style={[
                  styles.availIndicatorText,
                  {
                    color:
                      component.availability === 'Not Available'
                        ? '#FCA5A5'
                        : '#4ADE80',
                  },
                ]}
              >
                ● Availability: {component.availability || 'Available'}
              </Text>
            </View>
          </View>

          {/* Payment Badges Grid - Only displaying this hotel's methods! */}
          <View style={styles.paymentBadgesGrid}>
            {(Array.isArray(component.paymentMethods) && component.paymentMethods.length > 0
              ? component.paymentMethods
              : ['UPI', 'Credit Card', 'Debit Card', 'Cash']
            ).map((method, idx) => {
              const methodName = typeof method === 'string' ? method : (method?.name || method?.label || String(method || 'Payment'));
              return (
                <View key={`pm-${idx}`} style={styles.paymentBadgeItem}>
                  <Text style={styles.paymentBadgeIcon}>
                    {methodName.includes('UPI')
                      ? '📱'
                      : methodName.includes('Card')
                      ? '💳'
                      : methodName.includes('Cash')
                      ? '💵'
                      : methodName.includes('Apple')
                      ? '🍏'
                      : '🏦'}
                  </Text>
                  <Text style={styles.paymentBadgeName}>{methodName}</Text>
                  <Text style={styles.paymentBadgeCheck}>✓ Verified</Text>
                </View>
              );
            })}
          </View>

          {/* Contact Details (Part 6) */}
          <View style={styles.hotelContactRow}>
            <Text style={styles.hotelContactItem}>
              📞 {component.contactPhone || details.contact || '+91 821 241 5566'}
            </Text>
            <Text style={styles.hotelContactItem}>
              ✉️ {component.contactEmail || `concierge@${(activeHotel?.name || 'hotel').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}
            </Text>
            <Text style={styles.hotelContactItem}>
              📍 {component.location || details.location || originAddress} ({component.distance || '0.2 km'})
            </Text>
          </View>
        </View>

        {/* 5. HOTEL GUEST EXCLUSIVE PRIVILEGES CARD */}
        <View style={styles.privilegeCard}>
          <View style={styles.privilegeHeader}>
            <Text style={styles.crownIcon}>👑</Text>
            <Text style={styles.privilegeTitle}>HOTEL GUEST EXCLUSIVE PERKS</Text>
          </View>
          <View style={styles.perksList}>
            {details.perks.map((perk, index) => (
              <View key={`perk-${index}`} style={styles.perkRow}>
                <Text style={styles.perkDot}>✦</Text>
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. KEY HIGHLIGHTS */}
        <View style={styles.highlightsSection}>
          <Text style={styles.sectionHeading}>Key Highlights & Features</Text>
          <View style={styles.highlightsGrid}>
            {details.highlights.map((highlight, index) => (
              <View key={`hl-${index}`} style={styles.highlightBadge}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 7. AUTHENTIC ROYAL HISTORY, HERITAGE & ORIGIN STORY */}
        <View style={styles.historyCard}>
          <View style={styles.historyCardHeader}>
            <View style={styles.historyHeaderLeft}>
              <Text style={styles.historyCrownIcon}>🏛️</Text>
              <View style={styles.historyTitlesWrap}>
                <Text style={styles.historySectionTitle}>ROYAL HISTORY, HERITAGE & ORIGIN STORY</Text>
                <Text style={styles.historySubtitle}>
                  Authentic {originCity} lore, dynastic provenance & cultural origin
                </Text>
              </View>
            </View>

            {/* Badges for Era and Heritage */}
            <View style={styles.historyBadgesRow}>
              {details.era ? (
                <View style={styles.eraBadge}>
                  <Text style={styles.eraBadgeText}>⏳ {details.era}</Text>
                </View>
              ) : null}
              {details.heritageBadge ? (
                <View style={styles.heritageBadgePill}>
                  <Text style={styles.heritageBadgeText}>👑 {details.heritageBadge}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Full Historical Narrative */}
          <Text style={styles.historyStoryText}>
            {details.history || details.longDescription}
          </Text>

          {/* Historical Milestones */}
          {Array.isArray(details.historicalMilestones) && details.historicalMilestones.length > 0 ? (
            <View style={styles.milestonesBox}>
              <Text style={styles.milestonesBoxTitle}>📜 KEY HISTORICAL MILESTONES & ARCHITECTURAL LORE</Text>
              <View style={styles.milestonesList}>
                {details.historicalMilestones.map((milestone, idx) => (
                  <View key={`milestone-${idx}`} style={styles.milestoneRow}>
                    <Text style={styles.milestoneDot}>✦</Text>
                    <Text style={styles.milestoneText}>{milestone}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {/* 8. VERIFIED GUEST REVIEWS */}
        {details.reviews && details.reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionHeading}>Verified Guest Experiences</Text>
            <View style={styles.reviewsList}>
              {details.reviews.map((rev, index) => (
                <View key={`rev-${index}`} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View>
                      <Text style={styles.reviewAuthor}>{rev.author}</Text>
                      <Text style={styles.reviewDate}>{rev.date}</Text>
                    </View>
                    <View style={styles.reviewRatingPill}>
                      <Text style={styles.starTextSmall}>★</Text>
                      <Text style={styles.reviewRatingNumber}>{rev.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>"{rev.comment}"</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 8.5. VIP RESERVATION & INSTANT BOOKING BANNER */}
        <View style={styles.bookingPromptCard}>
          <View style={styles.bookingPromptHeader}>
            <View style={styles.bookingPromptIconCircle}>
              <Text style={styles.bookingPromptIcon}>🛎️</Text>
            </View>
            <View style={styles.bookingPromptTitles}>
              <Text style={styles.bookingPromptTitle}>
                {parseInt(component?.componentType, 10) === 4
                  ? 'Reserve Dining & Table Details'
                  : 'Book VIP Concierge Pass & Tour'}
              </Text>
              <Text style={styles.bookingPromptSubtitle}>
                Fill your guest details, select preferred timing, party size, and table/tour preferences.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.openBookingFormButton}
            onPress={() => setBookingModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.openBookingFormIcon}>✍️</Text>
            <Text style={styles.openBookingFormText}>Fill Details & Confirm Reservation</Text>
            <Text style={styles.openBookingFormArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* 9. BOTTOM CONCIERGE ACTION CTA BAR */}
        <View style={styles.bottomActionCard}>
          <View style={styles.actionPrompt}>
            <Text style={styles.actionPromptTitle}>Ready to Visit?</Text>
            <Text style={styles.actionPromptSubtitle}>
              Let our hotel concierge desk arrange your pass, private ride, or reservation.
            </Text>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => setBookingModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionText}>
                {bookingSuccess ? '✓ Reservation Logged' : '🛎️ Fill Details & Book Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() => setChauffeurModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryActionText}>🚗 Book Private Chauffeur</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scanFooterButton}
              onPress={() => setScanModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.scanFooterIcon}>📱</Text>
              <Text style={styles.scanFooterText}>Scan QR / GPS Route & VIP Pass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backFooterButton}
              onPress={onBack}
              activeOpacity={0.8}
            >
              <Text style={styles.backFooterText}>← Return to Portal</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Concierge Booking Modal */}
      <BookingModal
        visible={bookingModalVisible}
        component={component}
        onClose={() => setBookingModalVisible(false)}
        onBookingConfirmed={() => setBookingSuccess(true)}
      />

      {/* Private Chauffeur Fleet Modal */}
      <ChauffeurModal
        visible={chauffeurModalVisible}
        component={component}
        onClose={() => setChauffeurModalVisible(false)}
        onDispatchConfirmed={() => setBookingSuccess(true)}
      />

      {/* Scan to Phone / VIP Privilege Pass Modal */}
      <ScanToMobileModal
        visible={scanModalVisible}
        item={component}
        hotel={activeHotel}
        onClose={() => setScanModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#08090E',
    ...Platform.select({
      web: {
        height: '100vh',
        minHeight: '100vh',
        overflow: 'hidden',
      },
      default: {
        height: '100%',
      },
    }),
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0F121C',
    borderBottomWidth: 1,
    borderBottomColor: '#1A2030',
    flexShrink: 0,
    gap: 8,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2234',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#2B354C',
    gap: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  backNavIcon: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '900',
  },
  backNavText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    gap: 4,
  },
  categoryIcon: {
    fontSize: 11,
  },
  categoryPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  navRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2C082',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(226, 192, 130, 0.3)',
      },
    }),
  },
  bookNavIcon: {
    fontSize: 11,
  },
  bookNavText: {
    color: '#0B0F19',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scanNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.45)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  scanNavIcon: {
    fontSize: 12,
  },
  scanNavText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  likeButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
  },
  likeIcon: {
    color: '#F87171',
    fontSize: 13,
  },
  likeIconActive: {
    color: '#EF4444',
  },
  likeCountText: {
    color: '#FCA5A5',
    fontSize: 10.5,
    fontWeight: '800',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 12,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  heroWrapper: {
    width: '100%',
    height: 280,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#151926',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageStyle: {
    borderRadius: 14,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 14,
    ...Platform.select({
      web: {
        backgroundImage:
          'linear-gradient(180deg, rgba(8, 10, 16, 0.35) 0%, rgba(8, 10, 16, 0.1) 35%, rgba(8, 10, 16, 0.88) 75%, rgba(8, 10, 16, 0.98) 100%)',
      },
      default: {
        backgroundColor: 'rgba(8, 10, 16, 0.5)',
      },
    }),
  },
  heroTopBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotlightChip: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 5,
  },
  spotlightText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tagBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  tagBadgeText: {
    color: '#6EE7B7',
    fontSize: 8.5,
    fontWeight: '800',
  },
  heroBottomScrim: {
    gap: 3,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.3,
    ...Platform.select({
      web: {
        textShadow: '0 2px 6px rgba(0,0,0,0.8)',
      },
    }),
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    ...Platform.select({
      web: {
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      },
    }),
  },
  heroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  heroRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 18, 28, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 4,
  },
  starText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingNumber: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '900',
  },
  ratingReviewCount: {
    color: '#94A3B8',
    fontSize: 9.5,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verifiedText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
  },
  heroBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2C082',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 6,
    gap: 5,
    marginLeft: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 3px 10px rgba(226, 192, 130, 0.4)',
      },
    }),
  },
  heroBookBtnIcon: {
    fontSize: 10.5,
  },
  heroBookBtnText: {
    color: '#0B0F19',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  heroBookBtnArrow: {
    color: '#0B0F19',
    fontSize: 11,
    fontWeight: '900',
  },
  // Gallery
  gallerySection: {
    gap: 6,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  galleryThumbWrapper: {
    width: 100,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  galleryThumbActive: {
    borderColor: '#6366F1',
    borderWidth: 2,
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
  },
  // Info Matrix
  infoMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#0F121C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E2434',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#181E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    fontSize: 16,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoTitle: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  infoValue: {
    color: '#E2E8F0',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 1,
  },
  // Privilege Card
  privilegeCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    padding: 12,
    gap: 8,
  },
  privilegeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crownIcon: {
    fontSize: 14,
  },
  privilegeTitle: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  perksList: {
    gap: 5,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  perkDot: {
    color: '#F59E0B',
    fontSize: 10,
    marginTop: 1,
  },
  perkText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
    lineHeight: 14,
  },
  // Highlights
  highlightsSection: {
    gap: 8,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#242C40',
    gap: 5,
  },
  checkIcon: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  highlightText: {
    color: '#CBD5E1',
    fontSize: 9.5,
    fontWeight: '600',
  },
  // Royal History, Heritage & Story Card
  historyCard: {
    backgroundColor: 'rgba(17, 21, 33, 0.96)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    padding: 14,
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.2)',
    paddingBottom: 10,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 240,
  },
  historyCrownIcon: {
    fontSize: 22,
  },
  historyTitlesWrap: {
    flex: 1,
  },
  historySectionTitle: {
    color: '#F8F6F0',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    ...Platform.select({
      web: {
        fontFamily: "'Playfair Display', Georgia, serif",
      },
    }),
  },
  historySubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  historyBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  eraBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eraBadgeText: {
    color: '#FBBF24',
    fontSize: 9.5,
    fontWeight: '800',
  },
  heritageBadgePill: {
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.5)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heritageBadgeText: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '800',
  },
  historyStoryText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  milestonesBox: {
    backgroundColor: 'rgba(10, 13, 22, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.18)',
    padding: 10,
    gap: 8,
  },
  milestonesBoxTitle: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  milestonesList: {
    gap: 6,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  milestoneDot: {
    color: '#E2C082',
    fontSize: 10,
    marginTop: 1,
  },
  milestoneText: {
    color: '#CBD5E1',
    fontSize: 10.5,
    lineHeight: 15,
    flex: 1,
  },
  // Story Card
  storyCard: {
    backgroundColor: '#0F121C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1C2232',
    padding: 12,
    gap: 8,
  },
  longDescriptionText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '400',
  },
  // Reviews
  reviewsSection: {
    gap: 8,
  },
  reviewsList: {
    gap: 8,
  },
  reviewCard: {
    backgroundColor: '#0E111A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A202E',
    padding: 10,
    gap: 5,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  reviewDate: {
    color: '#64748B',
    fontSize: 8.5,
  },
  reviewRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    gap: 2,
  },
  starTextSmall: {
    color: '#FBBF24',
    fontSize: 9,
  },
  reviewRatingNumber: {
    color: '#FDE68A',
    fontSize: 9,
    fontWeight: '800',
  },
  reviewComment: {
    color: '#CBD5E1',
    fontSize: 9.5,
    lineHeight: 14,
    fontStyle: 'italic',
  },
  // Booking Prompt Banner
  bookingPromptCard: {
    backgroundColor: 'rgba(226, 192, 130, 0.07)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  bookingPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookingPromptIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1,
    borderColor: '#E2C082',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingPromptIcon: {
    fontSize: 16,
  },
  bookingPromptTitles: {
    flex: 1,
    gap: 2,
  },
  bookingPromptTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  bookingPromptSubtitle: {
    color: '#CBD5E1',
    fontSize: 10,
    lineHeight: 14,
  },
  openBookingFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2C082',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(226, 192, 130, 0.25)',
      },
    }),
  },
  openBookingFormIcon: {
    fontSize: 12,
  },
  openBookingFormText: {
    color: '#0B0F19',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  openBookingFormArrow: {
    color: '#0B0F19',
    fontSize: 12,
    fontWeight: '900',
  },
  // Bottom Action Card
  bottomActionCard: {
    backgroundColor: '#101422',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    padding: 14,
    gap: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  actionPrompt: {
    gap: 2,
  },
  actionPromptTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  actionPromptSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  primaryActionButton: {
    backgroundColor: '#E2C082',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 3px 10px rgba(226, 192, 130, 0.3)',
      },
    }),
  },
  primaryActionText: {
    color: '#0B0F19',
    fontSize: 10.5,
    fontWeight: '900',
  },
  secondaryActionButton: {
    backgroundColor: '#1E2436',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#2F3850',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  secondaryActionText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  scanFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 7,
    gap: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  scanFooterIcon: {
    fontSize: 12,
  },
  scanFooterText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
  },
  backFooterButton: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  backFooterText: {
    color: '#818CF8',
    fontSize: 10,
    fontWeight: '800',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '700',
  },
  backButtonPrimary: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // ===========================================================================
  // SUPERVISOR SPECIFICATION: DETAILS CARD & BULLET LIST STYLES
  // ===========================================================================
  supervisorDetailsCard: {
    backgroundColor: '#0F1626',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 14,
    gap: 14,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
      },
    }),
  },
  supervisorCardHeader: {
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  supervisorCardBadge: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  supervisorSectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  supervisorSubtitle: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '600',
  },
  supervisorDescText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  bulletListContainer: {
    backgroundColor: 'rgba(7, 10, 18, 0.6)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  bulletItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    color: '#E2C082',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  bulletLabel: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    minWidth: 145,
  },
  bulletValue: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  prominentRegisterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2C082',
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 10,
    gap: 10,
    marginTop: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(226, 192, 130, 0.4)',
        transition: 'transform 0.15s ease',
      },
    }),
  },
  prominentRegisterIcon: {
    fontSize: 15,
  },
  prominentRegisterText: {
    color: '#070A12',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  prominentRegisterArrow: {
    color: '#070A12',
    fontSize: 14,
    fontWeight: '900',
  },
  hotelPaymentsCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    marginVertical: 14,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  hotelPaymentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  hotelPaymentsTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hotelPaymentsIcon: {
    fontSize: 24,
  },
  hotelPaymentsTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  hotelPaymentsSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  availIndicatorBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  availIndicatorGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  availIndicatorRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  availIndicatorText: {
    fontSize: 12,
    fontWeight: '800',
  },
  paymentBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  paymentBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentBadgeIcon: {
    fontSize: 16,
  },
  paymentBadgeName: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
  },
  paymentBadgeCheck: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  hotelContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  hotelContactItem: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  transitEmergencyCard: {
    backgroundColor: '#0F1626',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 16,
    marginBottom: 20,
  },
  transitEmergencyHeader: {
    marginBottom: 12,
  },
  transitEmergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transitEmergencyIcon: {
    fontSize: 22,
  },
  transitEmergencyTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  transitEmergencySub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  transitEmergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  transitEmergencyItem: {
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 10,
  },
  transitItemIcon: {
    fontSize: 20,
  },
  transitItemContent: {
    flex: 1,
  },
  transitItemLabel: {
    color: '#38BDF8',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  transitItemValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  transitItemSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  routeNavigationCard: {
    backgroundColor: '#0F1626',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    padding: 16,
    marginBottom: 20,
  },
  routeNavigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  routeNavigationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  routeNavigationIcon: {
    fontSize: 22,
  },
  routeNavigationTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  routeNavigationSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  distanceBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  distanceBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  routeEndpointsBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginBottom: 14,
  },
  routePointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pointDotStart: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pointDotEnd: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pointDotLetter: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  pointContent: {
    flex: 1,
  },
  pointTypeStart: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pointTypeEnd: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pointName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  pointAddress: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  routeConnectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingLeft: 12,
  },
  routeConnectorLine: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  travelChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  travelChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  travelChipText: {
    color: '#CBD5E1',
    fontSize: 10.5,
    fontWeight: '600',
  },
  routeStepsCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  routeStepsTitle: {
    color: '#F59E0B',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 11.5,
    lineHeight: 17,
  },
  routeActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  googleMapsButton: {
    flex: 1,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#0284C7',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  googleMapsIcon: {
    fontSize: 16,
  },
  googleMapsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  googleMapsArrow: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  chauffeurRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  chauffeurRideIcon: {
    fontSize: 14,
  },
  chauffeurRideText: {
    color: '#F1F5F9',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
