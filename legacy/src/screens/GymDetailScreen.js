// =============================================================================
// src/screens/GymDetailScreen.js
// Dedicated Next-Page Details Screen for a Selected Gym / Wellness Center
// Features:
// 1. Hero banner with interactive gallery photo switcher
// 2. Metrics matrix (Distance from Stay, Drive Time, Walk Time, Hours)
// 3. Prominent "📍 GET DIRECTIONS" button with dynamic origin & destination coordinates
// 4. Multi-modal navigation links (Driving, Walking, Transit)
// 5. Turn-by-turn route breakdown from Active Hotel
// 6. Comprehensive fitness philosophy, facilities grid, contact cards, resident privileges
// 7. Back navigation: "← Back to Gyms"
// =============================================================================

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Linking,
  useWindowDimensions,
  Alert,
} from 'react-native';

import { HOTEL_START, HOTEL_ORIGIN_QUERY } from '../components/RouteDetailsModal';
import { apiService } from '../services/apiService';
import { getDirectionsUrl } from '../data/hotelsData';

export default function GymDetailScreen({
  gym,
  hotel = null,
  onBackToGyms,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // Active gallery image
  const [activeImage, setActiveImage] = useState(gym?.imageLink || (gym?.gallery && gym.gallery[0]));
  const [likesCount, setLikesCount] = useState(gym?.likes || 4200);
  const [hasLiked, setHasLiked] = useState(false);
  const [chauffeurSuccess, setChauffeurSuccess] = useState(false);

  if (!gym) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No gym information provided.</Text>
        <TouchableOpacity style={styles.backButtonPrimary} onPress={onBackToGyms}>
          <Text style={styles.backButtonPrimaryText}>← Back to Gyms</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hotelName = hotel?.name || 'Your Hotel';
  const hotelCity = hotel?.city || 'Local Area';
  const privilegeCode = `${(hotel?.name || 'HOTEL').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'RESIDENT'}-FIT-2026`;

  // Interactive like counter
  const handleLike = async () => {
    if (!hasLiked) {
      setLikesCount((prev) => prev + 1);
      setHasLiked(true);
      try {
        await apiService.likeComponent(gym.id);
      } catch (e) {}
    } else {
      setLikesCount((prev) => Math.max(0, prev - 1));
      setHasLiked(false);
    }
  };

  // Google Maps Dynamic Directions calculation from current hotel
  const openDirections = (mode = 'driving') => {
    const url = getDirectionsUrl(hotel, gym);
    if (!url) {
      const msg = !hotel || (!hotel.latitude && !hotel.lat)
        ? 'Hotel location not configured. Please configure hotel in Admin Dashboard.'
        : 'Directions unavailable for this destination (missing coordinates).';
      if (Platform.OS === 'web') alert(msg);
      return;
    }
    const finalUrl = mode === 'driving' ? url : `${url}&travelmode=${mode}`;
    if (Platform.OS === 'web') {
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(finalUrl).catch((err) => console.error('Error opening maps:', err));
    }
  };

  // Chauffeur booking simulation
  const handleRequestChauffeur = () => {
    setChauffeurSuccess(true);
    const msg = `Private Hotel Chauffeur has been dispatched from ${hotelName} concierge desk for your trip to "${gym.title}". Please meet the driver at the main hotel porch.`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Chauffeur Dispatched', msg);
    }
  };

  // Generate Turn-by-Turn Route Steps
  const getTurnByTurnSteps = () => {
    const hotelName = hotel?.name || 'Hotel';
    const hotelAddr = hotel?.address || hotel?.city || 'Hotel Porch';
    const gymTitle = gym.title || gym.name || 'Fitness Center';
    const gymLocation = gym.area || gym.location || gym.address || 'nearby location';
    const distanceStr = gym.hotelDistance || gym.distance || '';

    return [
      { step: 1, text: `Depart ${hotelName} entrance on ${hotelAddr}.` },
      { step: 2, text: `Follow primary connecting avenue towards ${gymLocation}.` },
      { step: 3, text: `Proceed along the main arterial corridor directly to ${gymTitle}.` },
      { step: 4, text: `Arrive at main entrance / fitness club reception${distanceStr ? ` (${distanceStr})` : ''}.` },
    ];
  };

  const steps = getTurnByTurnSteps();
  const cleanDistance = (gym.distance || gym.hotelDistance || '2.5 km').replace('📍', '').replace('from Hotel', '').trim();
  const galleryList = Array.isArray(gym.gallery) && gym.gallery.length > 0 ? gym.gallery : [gym.imageLink];

  return (
    <View style={styles.container}>
      {/* =================================================================== */}
      {/* 1. TOP NAVIGATION BAR                                               */}
      {/* =================================================================== */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToGyms}
          activeOpacity={0.8}
          accessibilityLabel="Back to Gyms"
        >
          <Text style={styles.backButtonIcon}>←</Text>
          <Text style={styles.backButtonText}>Back to Gyms</Text>
        </TouchableOpacity>

        <View style={styles.topRightControls}>
          <TouchableOpacity
            style={[styles.likeButton, hasLiked && styles.likeButtonActive]}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Text style={styles.likeHeartIcon}>{hasLiked ? '❤️' : '🤍'}</Text>
            <Text style={[styles.likeButtonCount, hasLiked && styles.likeButtonCountActive]}>
              {likesCount.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* =================================================================== */}
      {/* 2. SCROLLABLE DETAILS CONTENT                                       */}
      {/* =================================================================== */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={true}
      >
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.heroImageWrapper}>
            <Image
              source={{ uri: activeImage || gym.imageLink }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlayGradient} />

            {/* Badges on Hero */}
            <View style={styles.heroTopBadges}>
              {gym.tag && (
                <View style={styles.heroTagBadge}>
                  <Text style={styles.heroTagText}>{gym.tag}</Text>
                </View>
              )}
              <View style={styles.heroStatusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.heroStatusText}>{gym.availability || 'Open Now'}</Text>
              </View>
            </View>

            {/* Hero Title & Subtitle Over Image */}
            <View style={styles.heroCaption}>
              <Text style={styles.heroTitle}>{gym.title}</Text>
              <Text style={styles.heroSubtitle}>{gym.subtitle}</Text>
              <View style={styles.heroRatingRow}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={styles.ratingScore}>{Number(gym.rating || 4.9).toFixed(2)}</Text>
                  <Text style={styles.ratingMax}>/ 5.0</Text>
                </View>
                <Text style={styles.heroReviewsCount}>• {likesCount.toLocaleString()} Guests Recommended</Text>
              </View>
            </View>
          </View>

          {/* Photo Gallery Thumbnail Strip */}
          {galleryList.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryStrip}
            >
              {galleryList.map((imgUri, gIdx) => {
                const isActive = activeImage === imgUri;
                return (
                  <TouchableOpacity
                    key={gIdx}
                    onPress={() => setActiveImage(imgUri)}
                    style={[styles.thumbnailButton, isActive && styles.thumbnailButtonActive]}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: imgUri }} style={styles.thumbnailImage} resizeMode="cover" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* =================================================================== */}
        {/* 3. METRICS MATRIX (DISTANCE, DRIVE, WALK, TIMINGS)                  */}
        {/* =================================================================== */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardIcon}>📍</Text>
            <Text style={styles.metricCardValue}>{cleanDistance}</Text>
            <Text style={styles.metricCardLabel}>From Hotel</Text>
            <Text style={styles.metricCardSub}>{hotelName}</Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardHighlight]}>
            <Text style={styles.metricCardIcon}>🚗</Text>
            <Text style={[styles.metricCardValue, styles.metricCardValueHighlight]}>
              {gym.driveTime || '6 mins'}
            </Text>
            <Text style={styles.metricCardLabel}>Drive Time</Text>
            <Text style={styles.metricCardSub}>Direct route</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricCardIcon}>🚶</Text>
            <Text style={styles.metricCardValue}>{gym.walkTime || '20 mins'}</Text>
            <Text style={styles.metricCardLabel}>Walk / Stroll</Text>
            <Text style={styles.metricCardSub}>Pleasant neighborhood</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricCardIcon}>⏰</Text>
            <Text style={styles.metricCardValue} numberOfLines={1}>
              {gym.timings ? gym.timings.split(',')[0] : 'Open Daily'}
            </Text>
            <Text style={styles.metricCardLabel}>Hours Today</Text>
            <Text style={styles.metricCardSub}>Full hours below</Text>
          </View>
        </View>

        {/* =================================================================== */}
        {/* 4. HIGH-VISIBILITY "GET DIRECTIONS" ACTION SECTION                   */}
        {/* =================================================================== */}
        <View style={styles.directionsCard}>
          <View style={styles.directionsHeader}>
            <View style={styles.directionsTitleArea}>
              <Text style={styles.directionsPreTitle}>TRANSIT & ROUTE NAVIGATION</Text>
              <Text style={styles.directionsTitle}>Directions From Your Stay</Text>
              <Text style={styles.directionsSubtitle}>
                Instant real-time navigation from <Text style={{ color: '#E2C082' }}>{hotelName}{hotel?.city ? `, ${hotel.city}` : ''}</Text> to {gym.title}.
              </Text>
            </View>
          </View>

          {/* LARGE PRIMARY "GET DIRECTIONS" BUTTON */}
          <TouchableOpacity
            style={styles.primaryGetDirectionsButton}
            onPress={() => openDirections('driving')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryDirectionsIcon}>📍</Text>
            <View style={styles.primaryDirectionsTextCol}>
              <Text style={styles.primaryDirectionsText}>GET DIRECTIONS IN GOOGLE MAPS</Text>
              <Text style={styles.primaryDirectionsSub}>
                Opens live driving navigation ({cleanDistance} • {gym.driveTime || '6 mins drive'})
              </Text>
            </View>
            <Text style={styles.primaryDirectionsArrow}>➔</Text>
          </TouchableOpacity>

          {/* Multi-Modal Mode Buttons */}
          <View style={styles.multiModeRow}>
            <TouchableOpacity
              style={styles.modeOptionButton}
              onPress={() => openDirections('driving')}
              activeOpacity={0.7}
            >
              <Text style={styles.modeOptionIcon}>🚗</Text>
              <Text style={styles.modeOptionText}>Drive ({gym.driveTime || '6 mins'})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeOptionButton}
              onPress={() => openDirections('walking')}
              activeOpacity={0.7}
            >
              <Text style={styles.modeOptionIcon}>🚶</Text>
              <Text style={styles.modeOptionText}>Walk ({gym.walkTime || '22 mins'})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeOptionButton}
              onPress={() => openDirections('transit')}
              activeOpacity={0.7}
            >
              <Text style={styles.modeOptionIcon}>🚌</Text>
              <Text style={styles.modeOptionText}>Public Transit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeOptionButton, styles.modeOptionButtonGold]}
              onPress={handleRequestChauffeur}
              activeOpacity={0.7}
            >
              <Text style={styles.modeOptionIcon}>🛎️</Text>
              <Text style={styles.modeOptionTextGold}>
                {chauffeurSuccess ? 'Chauffeur Dispatched' : 'Hotel Chauffeur'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Turn-by-Turn Route Preview */}
          <View style={styles.turnByTurnContainer}>
            <Text style={styles.turnByTurnHeader}>Turn-By-Turn Navigation Steps</Text>
            <View style={styles.stepsList}>
              {steps.map((st, sIdx) => (
                <View key={sIdx} style={styles.stepItem}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{st.step}</Text>
                  </View>
                  <Text style={styles.stepText}>{st.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* =================================================================== */}
        {/* 5. DESCRIPTION & WELLNESS HERITAGE                                  */}
        {/* =================================================================== */}
        <View style={styles.contentCard}>
          <Text style={styles.sectionHeader}>About & Fitness Philosophy</Text>
          <Text style={styles.fullDescriptionText}>
            {gym.fullDescription || gym.shortDescription}
          </Text>

          {/* Highlights / Features Grid */}
          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Facilities & Amenities</Text>
          <View style={styles.facilitiesGrid}>
            {(gym.services || ['Weight Training', 'Cardio Suite', 'Personal Coaching', 'Locker Rooms']).map((srv, idx) => (
              <View key={idx} style={styles.facilityCard}>
                <Text style={styles.facilityCardCheck}>✓</Text>
                <Text style={styles.facilityCardText}>{srv}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* =================================================================== */}
        {/* 6. HOTEL RESIDENT PRIVILEGE & CONTACT INFO                          */}
        {/* =================================================================== */}
        <View style={styles.twoColumnGrid}>
          {/* Privilege Box */}
          <View style={styles.privilegeCard}>
            <View style={styles.privilegeHeaderRow}>
              <Text style={styles.privilegeCrown}>👑</Text>
              <Text style={styles.privilegeTitle}>RESIDENT GUEST PRIVILEGES</Text>
            </View>
            <Text style={styles.privilegeText}>
              Guests staying at <Text style={{ color: '#E2C082', fontWeight: 'bold' }}>{hotelName}</Text> enjoy priority access, complimentary trial day passes, and reserved morning yoga shala mat placements upon showing room verification.
            </Text>
            <View style={styles.privilegeCodeBox}>
              <Text style={styles.privilegeCodeLabel}>CONCIERGE ACCESS CODE:</Text>
              <Text style={styles.privilegeCodeValue}>{privilegeCode}</Text>
            </View>
          </View>

          {/* Contact & Hours Box */}
          <View style={styles.contactCard}>
            <Text style={styles.sectionHeader}>Hours & Contact Details</Text>
            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>⏰</Text>
              <View style={styles.contactTextGroup}>
                <Text style={styles.contactLabel}>Operating Timings:</Text>
                <Text style={styles.contactValue}>{gym.timings || '6:00 AM - 10:00 PM'}</Text>
              </View>
            </View>

            <View style={styles.contactRow}>
              <Text style={styles.contactIcon}>📍</Text>
              <View style={styles.contactTextGroup}>
                <Text style={styles.contactLabel}>Address:</Text>
                <Text style={styles.contactValue}>{gym.address || gym.location}</Text>
              </View>
            </View>

            {gym.contactPhone && (
              <TouchableOpacity
                style={styles.contactRowInteractive}
                onPress={() => Linking.openURL(`tel:${gym.contactPhone}`)}
              >
                <Text style={styles.contactIcon}>📞</Text>
                <View style={styles.contactTextGroup}>
                  <Text style={styles.contactLabel}>Phone (Tap to Call):</Text>
                  <Text style={styles.contactValuePhone}>{gym.contactPhone}</Text>
                </View>
              </TouchableOpacity>
            )}

            {gym.contactEmail && (
              <TouchableOpacity
                style={styles.contactRowInteractive}
                onPress={() => Linking.openURL(`mailto:${gym.contactEmail}`)}
              >
                <Text style={styles.contactIcon}>✉️</Text>
                <View style={styles.contactTextGroup}>
                  <Text style={styles.contactLabel}>Email Inquiry:</Text>
                  <Text style={styles.contactValuePhone}>{gym.contactEmail}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Back to Gyms Bottom Button */}
        <View style={styles.bottomNavSection}>
          <TouchableOpacity
            style={styles.bottomBackButton}
            onPress={onBackToGyms}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomBackArrow}>←</Text>
            <Text style={styles.bottomBackText}>Back to Gyms List</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1014',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F1014',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  backButtonPrimary: {
    backgroundColor: '#E2C082',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonPrimaryText: {
    color: '#0F1014',
    fontWeight: '700',
    fontSize: 14,
  },
  topBar: {
    backgroundColor: '#14161F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    gap: 8,
  },
  backButtonIcon: {
    color: '#E2C082',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#E2C082',
    fontSize: 14,
    fontWeight: '700',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  likeButtonActive: {
    backgroundColor: 'rgba(235, 87, 87, 0.15)',
    borderColor: '#EB5757',
  },
  likeHeartIcon: {
    fontSize: 14,
  },
  likeButtonCount: {
    color: '#A0A5B5',
    fontSize: 13,
    fontWeight: '700',
  },
  likeButtonCountActive: {
    color: '#FF6B6B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  scrollContentDesktop: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  heroSection: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#161822',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.2)',
  },
  heroImageWrapper: {
    position: 'relative',
    height: Platform.OS === 'web' ? 380 : 260,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 16, 20, 0.55)',
  },
  heroTopBadges: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTagBadge: {
    backgroundColor: 'rgba(15, 16, 20, 0.9)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2C082',
  },
  heroTagText: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 16, 20, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27AE60',
  },
  heroStatusText: {
    color: '#27AE60',
    fontSize: 11,
    fontWeight: '700',
  },
  heroCaption: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 32 : 24,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? "'Playfair Display', Georgia, serif" : 'serif',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    color: '#D4AF37',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 192, 130, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2C082',
    gap: 4,
  },
  ratingStar: {
    fontSize: 12,
  },
  ratingScore: {
    color: '#E2C082',
    fontSize: 13,
    fontWeight: '800',
  },
  ratingMax: {
    color: '#C0C4D6',
    fontSize: 11,
  },
  heroReviewsCount: {
    color: '#E0E3EB',
    fontSize: 12,
    fontWeight: '600',
  },
  galleryStrip: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: '#12141C',
  },
  thumbnailButton: {
    width: 80,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailButtonActive: {
    borderColor: '#E2C082',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#161822',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 4,
  },
  metricCardHighlight: {
    borderColor: 'rgba(226, 192, 130, 0.4)',
    backgroundColor: 'rgba(226, 192, 130, 0.06)',
  },
  metricCardIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  metricCardValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricCardValueHighlight: {
    color: '#E2C082',
  },
  metricCardLabel: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricCardSub: {
    color: '#656A7B',
    fontSize: 10,
    textAlign: 'center',
  },
  directionsCard: {
    backgroundColor: '#161822',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.5)',
    gap: 16,
  },
  directionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  directionsTitleArea: {
    flex: 1,
  },
  directionsPreTitle: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  directionsTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? "'Playfair Display', Georgia, serif" : 'serif',
    marginBottom: 4,
  },
  directionsSubtitle: {
    color: '#A0A5B5',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryGetDirectionsButton: {
    backgroundColor: '#E2C082',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 4px 16px rgba(226, 192, 130, 0.35)',
  },
  primaryDirectionsIcon: {
    fontSize: 26,
  },
  primaryDirectionsTextCol: {
    flex: 1,
  },
  primaryDirectionsText: {
    color: '#0F1014',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  primaryDirectionsSub: {
    color: '#3A321E',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  primaryDirectionsArrow: {
    color: '#0F1014',
    fontSize: 22,
    fontWeight: 'bold',
  },
  multiModeRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  modeOptionButton: {
    flex: 1,
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  modeOptionButtonGold: {
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    borderColor: 'rgba(226, 192, 130, 0.4)',
  },
  modeOptionIcon: {
    fontSize: 14,
  },
  modeOptionText: {
    color: '#C0C4D6',
    fontSize: 12,
    fontWeight: '600',
  },
  modeOptionTextGold: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '700',
  },
  turnByTurnContainer: {
    backgroundColor: '#0F1014',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  turnByTurnHeader: {
    color: '#E2C082',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  stepsList: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(226, 192, 130, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    color: '#A0A5B5',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  contentCard: {
    backgroundColor: '#161822',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeader: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? "'Playfair Display', Georgia, serif" : 'serif',
    marginBottom: 12,
  },
  fullDescriptionText: {
    color: '#A5AAB8',
    fontSize: 14,
    lineHeight: 23,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  facilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  facilityCardCheck: {
    color: '#27AE60',
    fontWeight: 'bold',
    fontSize: 13,
  },
  facilityCardText: {
    color: '#E0E3EB',
    fontSize: 13,
    fontWeight: '600',
  },
  twoColumnGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
  },
  privilegeCard: {
    flex: 1,
    backgroundColor: 'rgba(226, 192, 130, 0.06)',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    gap: 12,
  },
  privilegeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privilegeCrown: {
    fontSize: 18,
  },
  privilegeTitle: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  privilegeText: {
    color: '#C0C4D6',
    fontSize: 13,
    lineHeight: 20,
  },
  privilegeCodeBox: {
    backgroundColor: '#0F1014',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.2)',
    alignItems: 'center',
  },
  privilegeCodeLabel: {
    color: '#8E94A5',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  privilegeCodeValue: {
    color: '#E2C082',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#161822',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  contactRowInteractive: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(226, 192, 130, 0.08)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.2)',
  },
  contactIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  contactTextGroup: {
    flex: 1,
  },
  contactLabel: {
    color: '#8E94A5',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  contactValuePhone: {
    color: '#E2C082',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomNavSection: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  bottomBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  bottomBackArrow: {
    color: '#E2C082',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomBackText: {
    color: '#E2C082',
    fontSize: 14,
    fontWeight: '700',
  },
});
