// =============================================================================
// src/screens/DetailScreen.js
// Standardized Luxury Component Details Screen
// Standardized layout with consistent maxWidth (1040px), balanced cards,
// dynamic Google Maps directions from active hotel, and full category fidelity.
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
  useWindowDimensions,
} from 'react-native';
import { getCategoryMeta } from '../components/DisplayComponent';
import { getComponentDetails } from '../data/componentDetails';
import ScanToMobileModal from '../components/ScanToMobileModal';
import BookingModal from '../components/BookingModal';
import ChauffeurModal from '../components/ChauffeurModal';
import { HOTEL_START, getRouteDirections } from '../components/RouteDetailsModal';
import { activeHotelService } from '../services/activeHotelService';
import { getDirectionsUrl, openMapLink } from '../data/hotelsData';

export default function DetailScreen({ component, hotel, onBack }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const activeHotel = hotel || activeHotelService.getActiveHotel();
  const originName = activeHotel?.name || HOTEL_START.name;
  const originAddress = activeHotel?.address || activeHotel?.city || HOTEL_START.address;
  const originCity = activeHotel?.city || 'Local Area';

  const details = getComponentDetails(component);
  const meta = getCategoryMeta(component?.componentType, component?.category);

  // Active selected image for the hero banner (can be changed by clicking gallery thumbnails)
  const [activeImage, setActiveImage] = useState(component?.imageLink || (details?.gallery && details.gallery[0]));
  const [likesCount, setLikesCount] = useState(component?.likes || 120);
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
      setLikesCount((prev) => Math.max(0, prev - 1));
      setHasLiked(false);
    }
  };

  // Turn-by-Turn Dynamic Directions
  const rawDistance = component.distance || component.hotelDistance || component.location || details.location || '1.8 km';
  const cleanDistance = String(rawDistance).replace('📍', '').replace('from Hotel', '').trim();
  const driveTime = component.driveTime || (cleanDistance.includes('0.') ? '2 mins' : cleanDistance.includes('1.') ? '5 mins' : '12 mins');
  const walkTime = component.walkTime || (cleanDistance.includes('0.2') ? '3 mins' : cleanDistance.includes('0.5') ? '7 mins' : '20 mins');

  // Dynamic Google Maps URL using real active hotel and destination coordinates/address
  const googleMapsDirectionsUrl = getDirectionsUrl(activeHotel, component);

  const handleOpenGoogleMaps = () => {
    openMapLink(googleMapsDirectionsUrl);
  };

  const routeSteps = getRouteDirections(component, activeHotel);
  const isFoodCategory = String(component?.category || '').includes('dining') || String(component?.category || '').includes('restaurant') || String(component?.category || '').includes('takeaway') || parseInt(component?.componentType, 10) === 1 || parseInt(component?.componentType, 10) === 3;
  const isAttraction = String(component?.category || '').includes('tourist') || parseInt(component?.componentType, 10) === 5;

  return (
    <View style={styles.screenContainer}>
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backNavButton}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityLabel="Back to Hotel Portal"
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
          {/* Directions Quick Button */}
          <TouchableOpacity
            style={styles.directionsNavButton}
            onPress={handleOpenGoogleMaps}
            activeOpacity={0.8}
          >
            <Text style={styles.directionsNavIcon}>🧭</Text>
            <Text style={styles.directionsNavText}>Directions</Text>
          </TouchableOpacity>

          {/* VIP Concierge Booking Button */}
          <TouchableOpacity
            style={styles.bookNavButton}
            onPress={() => setBookingModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.bookNavIcon}>✦</Text>
            <Text style={styles.bookNavText}>Book / Reserve</Text>
          </TouchableOpacity>

          {/* Scan to Phone Button */}
          <TouchableOpacity
            style={styles.scanNavButton}
            onPress={() => setScanModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.scanNavIcon}>⌕</Text>
            <Text style={styles.scanNavText}>Scan Pass</Text>
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

      {/* 2. SCROLLABLE DETAILS BODY (STANDARDIZED MAX WIDTH) */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* HERO BANNER - STANDARDIZED COMPACT HEIGHT */}
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
                    ★ RECOMMENDED STAY AMENITY
                  </Text>
                </View>

                <View style={[
                  styles.availBadge,
                  (component.availability === 'Not Available') ? styles.availBadgeRed : styles.availBadgeGreen
                ]}>
                  <Text style={styles.availBadgeText}>
                    ● {component.availability || 'Available Today'}
                  </Text>
                </View>
              </View>

              {/* Title & Ratings inside Hero Scrim */}
              <View style={styles.heroBottomScrim}>
                <Text style={styles.heroTitle}>{component.title || details.title}</Text>
                <Text style={[styles.heroSubtitle, { color: meta.color }]}>
                  {component.subtitle || details.subtitle}
                </Text>

                <View style={styles.heroMetricsRow}>
                  <View style={styles.heroRatingPill}>
                    <Text style={styles.starText}>★</Text>
                    <Text style={styles.ratingNumber}>{(component.rating || details.rating || 4.9).toFixed(1)} / 5.0</Text>
                    <Text style={styles.ratingReviewCount}>
                      ({likesCount.toLocaleString()} guest recommendations)
                    </Text>
                  </View>

                  <View style={styles.distanceBadgeHeader}>
                    <Text style={styles.distanceBadgeHeaderText}>📍 {cleanDistance} from Hotel</Text>
                  </View>

                  {/* Hero Reserve Button */}
                  <TouchableOpacity
                    style={styles.heroBookBtn}
                    onPress={() => setBookingModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.heroBookBtnIcon}>✦</Text>
                    <Text style={styles.heroBookBtnText}>
                      {isFoodCategory ? 'Reserve Table' : 'Reserve / Book Pass'}
                    </Text>
                    <Text style={styles.heroBookBtnArrow}>→</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* PHOTO GALLERY THUMBNAILS (OPTIONAL) */}
        {details.gallery && details.gallery.length > 1 && (
          <View style={styles.galleryStripContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryStrip}>
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
                  <Image source={{ uri: imgUri }} style={styles.galleryThumb} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 3. TWO-COLUMN RESPONSIVE LAYOUT FOR BALANCED DETAIL PRESENTATION */}
        <View style={[styles.contentColumnsRow, !isDesktop && styles.contentColumnsStacked]}>
          
          {/* LEFT COLUMN: OVERVIEW, DETAILS MATRIX & FEATURES */}
          <View style={[styles.mainColumn, !isDesktop && styles.fullWidth]}>
            
            {/* Overview & Description Card */}
            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardSectionBadge}>ESSENTIAL INFORMATION</Text>
                <Text style={styles.cardSectionTitle}>{component.title || details.title}</Text>
                <Text style={styles.cardDescription}>
                  {component.description || component.shortDescription || details.longDescription || details.subtitle}
                </Text>
              </View>

              {/* Information Specification Grid */}
              <View style={styles.specGrid}>
                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>⏰</Text>
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Operating Hours</Text>
                    <Text style={styles.specValue}>{component.timings || component.timing || details.hours || 'Open Daily'}</Text>
                  </View>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>🎟️</Text>
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Pricing / Privilege</Text>
                    <Text style={styles.specValue}>{component.price || component.offer || details.admission || 'Complimentary / Resident Rate'}</Text>
                  </View>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>📍</Text>
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Location</Text>
                    <Text style={styles.specValue}>{component.location || component.address || details.location || originCity}</Text>
                  </View>
                </View>

                <View style={styles.specItem}>
                  <Text style={styles.specIcon}>📞</Text>
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Inquiry Hotline</Text>
                    <Text style={styles.specValue}>{component.contactPhone || details.contact || '+91 821 241 5566'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Highlights & Features */}
            {details.highlights && details.highlights.length > 0 && (
              <View style={styles.cardContainer}>
                <Text style={styles.cardSectionBadge}>HIGHLIGHTS & PERKS</Text>
                <View style={styles.highlightsWrap}>
                  {details.highlights.map((hl, hIdx) => (
                    <View key={`hl-${hIdx}`} style={styles.highlightPill}>
                      <Text style={styles.highlightPillCheck}>✓</Text>
                      <Text style={styles.highlightPillText}>{hl}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Tourist Landmark Heritage Lore (Only for Attractions with historical narrative) */}
            {isAttraction && (details.history || details.era) && (
              <View style={styles.cardContainer}>
                <View style={styles.heritageHeader}>
                  <Text style={styles.cardSectionBadge}>HERITAGE & LORE</Text>
                  {details.era && <Text style={styles.eraText}>⏳ {details.era}</Text>}
                </View>
                <Text style={styles.heritageText}>
                  {details.history || details.longDescription}
                </Text>
              </View>
            )}

            {/* Verified Guest Reviews */}
            {details.reviews && details.reviews.length > 0 && (
              <View style={styles.cardContainer}>
                <Text style={styles.cardSectionBadge}>VERIFIED GUEST EXPERIENCES</Text>
                <View style={styles.reviewsList}>
                  {details.reviews.slice(0, 2).map((rev, rIdx) => (
                    <View key={`rev-${rIdx}`} style={styles.reviewItem}>
                      <View style={styles.reviewHeaderRow}>
                        <Text style={styles.reviewAuthor}>{rev.author}</Text>
                        <Text style={styles.reviewRatingStars}>★ {rev.rating}</Text>
                      </View>
                      <Text style={styles.reviewComment}>"{rev.comment}"</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          </View>

          {/* RIGHT COLUMN: TURN-BY-TURN DIRECTIONS, BOOKING & PAYMENTS */}
          <View style={[styles.sideColumn, !isDesktop && styles.fullWidth]}>
            
            {/* START -> END TURN-BY-TURN GPS ROUTING CARD */}
            <View style={styles.navigationCard}>
              <View style={styles.navigationHeader}>
                <Text style={styles.navSectionBadge}>GPS DIRECTIONS & NAVIGATION</Text>
                <Text style={styles.navTitle}>Direct Route from Stay</Text>
              </View>

              {/* Start & End Point Box */}
              <View style={styles.endpointsContainer}>
                <View style={styles.endpointRow}>
                  <View style={styles.endpointDotA}>
                    <Text style={styles.endpointLetter}>A</Text>
                  </View>
                  <View style={styles.endpointTextWrap}>
                    <Text style={styles.endpointRole}>STARTING POINT (HOTEL)</Text>
                    <Text style={styles.endpointName} numberOfLines={1}>{originName}</Text>
                    <Text style={styles.endpointSub} numberOfLines={1}>{originAddress}</Text>
                  </View>
                </View>

                <View style={styles.connectorRow}>
                  <View style={styles.connectorLine} />
                  <View style={styles.travelTimePills}>
                    <Text style={styles.travelTimePill}>🚗 Drive: {driveTime}</Text>
                    <Text style={styles.travelTimePill}>🚶 Walk: {walkTime}</Text>
                  </View>
                </View>

                <View style={styles.endpointRow}>
                  <View style={styles.endpointDotB}>
                    <Text style={styles.endpointLetter}>B</Text>
                  </View>
                  <View style={styles.endpointTextWrap}>
                    <Text style={styles.endpointRole}>DESTINATION</Text>
                    <Text style={styles.endpointName} numberOfLines={1}>{component.title || details.title}</Text>
                    <Text style={styles.endpointSub} numberOfLines={1}>{component.location || component.address || originCity}</Text>
                  </View>
                </View>
              </View>

              {/* Steps Checklist */}
              {routeSteps && routeSteps.length > 0 && (
                <View style={styles.routeStepsBox}>
                  {routeSteps.slice(0, 3).map((st) => (
                    <View key={`st-${st.step}`} style={styles.stepRow}>
                      <Text style={styles.stepNum}>{st.step}.</Text>
                      <Text style={styles.stepText}>{st.text}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Primary Map Actions */}
              <View style={styles.navActionsBox}>
                <TouchableOpacity
                  style={styles.openMapsPrimaryBtn}
                  onPress={handleOpenGoogleMaps}
                  activeOpacity={0.85}
                  accessibilityLabel="Open route in Google Maps"
                >
                  <Text style={styles.openMapsPrimaryIcon}>🧭</Text>
                  <Text style={styles.openMapsPrimaryText}>Open in Google Maps Live Navigation</Text>
                  <Text style={styles.openMapsArrow}>↗</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.chauffeurSecondaryBtn}
                  onPress={() => setChauffeurModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.chauffeurBtnText}>🚗 Dispatch Private Chauffeur</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Instant Reservation & Booking Desk */}
            <View style={styles.bookingDeskCard}>
              <View style={styles.bookingDeskHeader}>
                <Text style={styles.bookingDeskBadge}>CONCIERGE DESK</Text>
                <Text style={styles.bookingDeskTitle}>Reserve Priority Guest Pass</Text>
                <Text style={styles.bookingDeskSub}>
                  Complimentary reservation handling by {originName} front desk.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.confirmBookingActionBtn}
                onPress={() => setBookingModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBookingActionText}>
                  {bookingSuccess ? '✓ Reservation Requested' : '✦ Reserve / Book Now'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Accepted Payments & Contact Badges */}
            <View style={styles.paymentsCard}>
              <Text style={styles.paymentCardBadge}>ACCEPTED PAYMENT METHODS</Text>
              <View style={styles.paymentBadgesList}>
                {['UPI / QR', 'Credit Card', 'Debit Card', 'Cash'].map((pm, pIdx) => (
                  <View key={`pm-${pIdx}`} style={styles.pmBadge}>
                    <Text style={styles.pmBadgeText}>✓ {pm}</Text>
                  </View>
                ))}
              </View>
            </View>

          </View>
        </View>

        {/* BOTTOM RETURN BAR */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomReturnBtn} onPress={onBack}>
            <Text style={styles.bottomReturnBtnText}>← Return to Hotel Portal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Booking Modal */}
      <BookingModal
        visible={bookingModalVisible}
        component={component}
        onClose={() => setBookingModalVisible(false)}
        onBookingConfirmed={() => setBookingSuccess(true)}
      />

      {/* Chauffeur Fleet Modal */}
      <ChauffeurModal
        visible={chauffeurModalVisible}
        component={component}
        onClose={() => setChauffeurModalVisible(false)}
        onDispatchConfirmed={() => setBookingSuccess(true)}
      />

      {/* Scan to Phone Modal */}
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
    backgroundColor: '#08090C',
    ...Platform.select({
      web: {
        height: '100vh',
        minHeight: '100vh',
        overflowX: 'hidden',
      },
    }),
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#08090C',
    padding: 24,
    gap: 12,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '700',
  },
  backButtonPrimary: {
    backgroundColor: '#E2C082',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#08090C',
    fontSize: 12,
    fontWeight: '800',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0E111A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.15)',
    flexShrink: 0,
    gap: 8,
  },
  backNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B28',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  backNavIcon: {
    color: '#E2C082',
    fontSize: 13,
    fontWeight: '900',
  },
  backNavText: {
    color: '#F8F6F0',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
  },
  categoryIcon: {
    fontSize: 11,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  navRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  directionsNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  directionsNavIcon: {
    fontSize: 11,
  },
  directionsNavText: {
    color: '#E2C082',
    fontSize: 10.5,
    fontWeight: '800',
  },
  bookNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2C082',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  bookNavIcon: {
    fontSize: 11,
    color: '#08090C',
  },
  bookNavText: {
    color: '#08090C',
    fontSize: 10.5,
    fontWeight: '800',
  },
  scanNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  scanNavIcon: {
    fontSize: 11,
    color: '#38BDF8',
  },
  scanNavText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  likeButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
  },
  likeIcon: {
    color: '#F87171',
    fontSize: 11,
  },
  likeIconActive: {
    color: '#EF4444',
  },
  likeCountText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: 1040,
    alignSelf: 'center',
    width: '100%',
    padding: 16,
    gap: 14,
  },

  // HERO BANNER - COMPACT STANDARDIZED DIMENSIONS
  heroWrapper: {
    width: '100%',
    height: Platform.OS === 'web' ? 240 : 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#121520',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageStyle: {
    borderRadius: 12,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: 'rgba(8, 9, 12, 0.45)',
  },
  heroTopBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotlightChip: {
    backgroundColor: 'rgba(15, 17, 26, 0.88)',
    borderWidth: 1,
    borderColor: '#E2C082',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  spotlightText: {
    color: '#E2C082',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  availBadgeGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22C55E',
  },
  availBadgeRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  availBadgeText: {
    color: '#F8F6F0',
    fontSize: 9.5,
    fontWeight: '700',
  },
  heroBottomScrim: {
    backgroundColor: 'rgba(8, 9, 14, 0.85)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  heroRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  starText: {
    color: '#FBBF24',
    fontSize: 10,
  },
  ratingNumber: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '800',
  },
  ratingReviewCount: {
    color: '#CBD5E1',
    fontSize: 9.5,
  },
  distanceBadgeHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceBadgeHeaderText: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '700',
  },
  heroBookBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2C082',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  heroBookBtnIcon: {
    fontSize: 9,
    color: '#08090C',
  },
  heroBookBtnText: {
    color: '#08090C',
    fontSize: 10,
    fontWeight: '800',
  },
  heroBookBtnArrow: {
    color: '#08090C',
    fontSize: 11,
    fontWeight: '900',
  },

  // GALLERY STRIP
  galleryStripContainer: {
    marginTop: -4,
  },
  galleryStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  galleryThumbWrapper: {
    width: 68,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  galleryThumbActive: {
    borderColor: '#E2C082',
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
  },

  // TWO-COLUMN DESKTOP LAYOUT
  contentColumnsRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  contentColumnsStacked: {
    flexDirection: 'column',
  },
  mainColumn: {
    flex: 1.3,
    gap: 14,
  },
  sideColumn: {
    flex: 1,
    gap: 14,
  },
  fullWidth: {
    width: '100%',
  },

  // CARD CONTAINERS
  cardContainer: {
    backgroundColor: '#0F121C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.2)',
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    gap: 3,
  },
  cardSectionBadge: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardSectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cardDescription: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  specItem: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  specIcon: {
    fontSize: 16,
  },
  specTextCol: {
    flex: 1,
  },
  specLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
  },
  specValue: {
    color: '#F8F6F0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  highlightsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 192, 130, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  highlightPillCheck: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
  },
  highlightPillText: {
    color: '#E2C082',
    fontSize: 10.5,
    fontWeight: '700',
  },
  heritageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eraText: {
    color: '#CBD5E1',
    fontSize: 10,
  },
  heritageText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    lineHeight: 18,
  },
  reviewsList: {
    gap: 8,
  },
  reviewItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    color: '#F8F6F0',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewRatingStars: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
  },
  reviewComment: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontStyle: 'italic',
    lineHeight: 15,
  },

  // NAVIGATION / GPS DIRECTIONS CARD (RIGHT SIDE)
  navigationCard: {
    backgroundColor: '#0E1322',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    padding: 14,
    gap: 12,
  },
  navigationHeader: {
    gap: 2,
  },
  navSectionBadge: {
    color: '#38BDF8',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  endpointsContainer: {
    backgroundColor: 'rgba(8, 11, 18, 0.65)',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  endpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  endpointDotA: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endpointDotB: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endpointLetter: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  endpointTextWrap: {
    flex: 1,
  },
  endpointRole: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '800',
  },
  endpointName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  endpointSub: {
    color: '#64748B',
    fontSize: 9.5,
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    gap: 10,
    marginVertical: 2,
  },
  connectorLine: {
    width: 2,
    height: 16,
    backgroundColor: '#334155',
  },
  travelTimePills: {
    flexDirection: 'row',
    gap: 6,
  },
  travelTimePill: {
    color: '#38BDF8',
    fontSize: 9.5,
    fontWeight: '700',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routeStepsBox: {
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 8,
    borderRadius: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  stepNum: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  stepText: {
    color: '#CBD5E1',
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
  navActionsBox: {
    gap: 8,
  },
  openMapsPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  openMapsPrimaryIcon: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  openMapsPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  openMapsArrow: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  chauffeurSecondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 7,
    borderRadius: 7,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  chauffeurBtnText: {
    color: '#CBD5E1',
    fontSize: 10.5,
    fontWeight: '700',
  },

  // BOOKING DESK CARD
  bookingDeskCard: {
    backgroundColor: '#0F121C',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    padding: 14,
    gap: 10,
  },
  bookingDeskHeader: {
    gap: 3,
  },
  bookingDeskBadge: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bookingDeskTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  bookingDeskSub: {
    color: '#94A3B8',
    fontSize: 10.5,
    lineHeight: 15,
  },
  confirmBookingActionBtn: {
    backgroundColor: '#E2C082',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  confirmBookingActionText: {
    color: '#08090C',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // PAYMENTS CARD
  paymentsCard: {
    backgroundColor: '#0F121C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 8,
  },
  paymentCardBadge: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  paymentBadgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pmBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pmBadgeText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },

  // BOTTOM RETURN BAR
  bottomBar: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 8,
  },
  bottomReturnBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#161B28',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  bottomReturnBtnText: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '800',
  },
});
