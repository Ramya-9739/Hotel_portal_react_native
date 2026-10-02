// =============================================================================
// src/screens/GymListScreen.js
// Dedicated Wellness & Gyms List Page for Hotel Portal
// Features:
// 1. Compact vertical list of gyms and wellness centers (2-3 visible at once)
// 2. Real-time Search by name, area, category, and address
// 3. Category Filter Chips (All, Strength & Fitness, Ashtanga & Yoga, 24/7 Access, CrossFit, etc.)
// 4. Multi-criteria Sorting (Recommended, Nearest, Most Liked, Highest Rated, Priority)
// 5. Compact horizontal cards (Image ~240px on left, info on right, height ~195px on desktop)
// 6. Navigation to GymDetailScreen and instant Google Maps directions
// =============================================================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';

import { apiService } from '../services/apiService';
import { HOTEL_START } from '../components/RouteDetailsModal';
import { getDirectionsUrl } from '../data/hotelsData';

export default function GymListScreen({
  hotel = null,
  onBackToHotel,
  onSelectGym,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const isTablet = width >= 600 && width < 860;

  const defaultGyms = (hotel && hotel.nearby && hotel.nearby.gyms && hotel.nearby.gyms.length > 0) ? hotel.nearby.gyms : [];
  const [gyms, setGyms] = useState(defaultGyms);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'nearest' | 'likes' | 'rating' | 'priority'
  const [userLikedGyms, setUserLikedGyms] = useState({});

  // Sync gyms when hotel prop changes
  useEffect(() => {
    if (hotel?.nearby?.gyms && hotel.nearby.gyms.length > 0) {
      setGyms(hotel.nearby.gyms);
    } else {
      setGyms([]);
    }
  }, [hotel?.id, hotel?.city, hotel?.nearby?.gyms]);

  // Fetch gyms from API (with fallback)
  useEffect(() => {
    let isMounted = true;
    async function loadGyms() {
      if (hotel?.nearby?.gyms && hotel.nearby.gyms.length > 0) return;
      setLoading(true);
      try {
        const res = await apiService.fetchGyms();
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setGyms(res.data);
        }
      } catch (err) {
        console.warn('[GymListScreen] Error loading gyms:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadGyms();
    return () => { isMounted = false; };
  }, [hotel?.id]);

  // Handle real-time like toggle
  const handleToggleLike = async (gymId, currentLikes) => {
    const isLiked = !!userLikedGyms[gymId];
    const diff = isLiked ? -1 : 1;

    // Optimistic local state update
    setUserLikedGyms((prev) => ({
      ...prev,
      [gymId]: !isLiked,
    }));

    setGyms((prevGyms) =>
      prevGyms.map((g) => {
        if (g.id === gymId) {
          return {
            ...g,
            likes: Math.max(0, (g.likes || currentLikes || 0) + diff),
          };
        }
        return g;
      })
    );

    // Call backend API if available
    try {
      if (!isLiked) {
        await apiService.likeComponent(gymId);
      }
    } catch (e) {
      // ignore silently in offline mode
    }
  };

  // Launch Google Maps directly from card using dynamic origin from hotel
  const handleQuickDirections = (gym) => {
    const mapsUrl = getDirectionsUrl(hotel, gym);
    if (!mapsUrl) {
      const msg = !hotel || (!hotel.latitude && !hotel.lat)
        ? 'Hotel location coordinates not configured for turn-by-turn routing.'
        : 'Directions unavailable for this destination (missing coordinates).';
      if (Platform.OS === 'web') alert(msg);
      return;
    }

    if (Platform.OS === 'web') {
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(mapsUrl).catch((err) => console.error('Error opening maps:', err));
    }
  };

  // Available categories
  const categories = [
    'All',
    'Strength & Fitness',
    'Ashtanga & Yoga',
    '24/7 Access',
    'CrossFit & Functional',
    "Women's Fitness",
    'Spa & Wellness',
  ];

  // Helper to extract numeric distance in kilometers
  const getNumericDistance = (distanceStr) => {
    if (typeof distanceStr === 'number') return distanceStr;
    if (!distanceStr) return 999;
    const match = String(distanceStr).match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 999;
  };

  // Filtered & Sorted gyms
  const displayedGyms = useMemo(() => {
    let result = [...gyms];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          (g.title && g.title.toLowerCase().includes(q)) ||
          (g.subtitle && g.subtitle.toLowerCase().includes(q)) ||
          (g.area && g.area.toLowerCase().includes(q)) ||
          (g.location && g.location.toLowerCase().includes(q)) ||
          (g.address && g.address.toLowerCase().includes(q)) ||
          (g.category && g.category.toLowerCase().includes(q)) ||
          (Array.isArray(g.services) && g.services.some((s) => s.toLowerCase().includes(q)))
      );
    }

    // 2. Category filter
    if (activeCategory !== 'All') {
      result = result.filter((g) => {
        if (g.category === activeCategory) return true;
        const tag = (g.tag || '').toLowerCase();
        const sub = (g.subtitle || '').toLowerCase();
        const catLower = activeCategory.toLowerCase();
        if (catLower.includes('yoga') && (tag.includes('yoga') || sub.includes('yoga'))) return true;
        if (catLower.includes('24/7') && (tag.includes('24/7') || sub.includes('24/7') || (g.timings && g.timings.includes('24 Hours')))) return true;
        if (catLower.includes('crossfit') && (tag.includes('crossfit') || sub.includes('crossfit'))) return true;
        if (catLower.includes('women') && (tag.includes('women') || sub.includes('women'))) return true;
        if (catLower.includes('spa') && (tag.includes('spa') || sub.includes('spa'))) return true;
        return false;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'nearest') {
        return getNumericDistance(a.distance || a.hotelDistance) - getNumericDistance(b.distance || b.hotelDistance);
      }
      if (sortBy === 'likes') {
        return (b.likes || 0) - (a.likes || 0);
      }
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'priority') {
        return (a.priority || 99) - (b.priority || 99);
      }
      // 'recommended' default: blend priority and rating
      const priorityDiff = (a.priority || 99) - (b.priority || 99);
      if (priorityDiff !== 0) return priorityDiff;
      return (b.rating || 0) - (a.rating || 0);
    });

    return result;
  }, [gyms, searchQuery, activeCategory, sortBy]);

  return (
    <View style={styles.container}>
      {/* =================================================================== */}
      {/* 1. COMPACT TOP HEADER BAR                                           */}
      {/* =================================================================== */}
      <View style={styles.headerBar}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackToHotel}
            activeOpacity={0.8}
            accessibilityLabel="Back to Hotel"
          >
            <Text style={styles.backButtonIcon}>←</Text>
            <Text style={styles.backButtonText}>Back to Hotel</Text>
          </TouchableOpacity>

          <View style={styles.originPill}>
            <Text style={styles.originPillIcon}>🏨</Text>
            <Text style={styles.originPillText} numberOfLines={1}>
              {hotel?.name || 'Active Hotel'}{hotel?.city ? `, ${hotel.city}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.titleSection}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>🏋️ WELLNESS & GYMS</Text>
            </View>
            <View style={styles.curatedBadge}>
              <Text style={styles.curatedBadgeText}>{(hotel?.city || 'CURATED').toUpperCase()} • {gyms.length} VENUES</Text>
            </View>
          </View>

          <Text style={styles.pageTitle}>Gyms & Wellness Centers Near {hotel?.city || 'Hotel'}</Text>
          <Text style={styles.pageSubtitle}>
            Discover gyms, fitness centers, yoga studios and wellness centers near your stay.
          </Text>
        </View>

        {/* =================================================================== */}
        {/* 2. COMPACT SEARCH & FILTER CONTROLS                                 */}
        {/* =================================================================== */}
        <View style={styles.controlsWrapper}>
          {/* Search Box */}
          <View style={styles.searchBarContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search gyms, fitness centers, yoga studios..."
              placeholderTextColor="#787C8E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Chips Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsContainer}
          >
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sort By Row */}
          <View style={styles.sortBar}>
            <Text style={styles.sortLabel}>SORT BY:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptions}>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'recommended' && styles.sortButtonActive]}
                onPress={() => setSortBy('recommended')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'recommended' && styles.sortButtonTextActive]}>
                  ⭐ Recommended
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'nearest' && styles.sortButtonActive]}
                onPress={() => setSortBy('nearest')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'nearest' && styles.sortButtonTextActive]}>
                  📍 Nearest
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'likes' && styles.sortButtonActive]}
                onPress={() => setSortBy('likes')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'likes' && styles.sortButtonTextActive]}>
                  ❤️ Most Liked
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
                onPress={() => setSortBy('rating')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
                  ⭐ Highest Rated
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'priority' && styles.sortButtonActive]}
                onPress={() => setSortBy('priority')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'priority' && styles.sortButtonTextActive]}>
                  ⚡ Priority
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </View>

      {/* =================================================================== */}
      {/* 3. COMPACT VERTICAL GYM LIST (2-3 Cards visible simultaneously)      */}
      {/* =================================================================== */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={[
          styles.listContent,
          isDesktop && styles.listContentDesktop,
        ]}
        showsVerticalScrollIndicator={true}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E2C082" />
            <Text style={styles.loadingText}>Fetching {hotel?.city || 'local'} wellness centers...</Text>
          </View>
        ) : displayedGyms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No wellness centers found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? `We couldn't find any centers matching "${searchQuery}" in ${activeCategory}.` : `No fitness or wellness venues currently configured for ${hotel?.name || 'this hotel'}.`}
            </Text>
            <TouchableOpacity
              style={styles.resetFiltersButton}
              onPress={() => {
                setSearchQuery('');
                setActiveCategory('All');
                setSortBy('recommended');
              }}
            >
              <Text style={styles.resetFiltersText}>Reset Filters & Show All</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedGyms.map((gym, index) => (
            <CompactGymCard
              key={gym.id || `gym-${index}`}
              gym={gym}
              isDesktop={isDesktop}
              isTablet={isTablet}
              isLiked={!!userLikedGyms[gym.id]}
              onToggleLike={handleToggleLike}
              onSelectGym={onSelectGym}
              onQuickDirections={handleQuickDirections}
            />
          ))
        )}

        {/* Compact Footer */}
        <View style={styles.listFooter}>
          <Text style={styles.listFooterText}>
            {(hotel?.name ? hotel.name.toUpperCase() : 'HOTEL CONCIERGE')} • RESIDENT CONCIERGE DESK EXT. 101 • COMPLIMENTARY YOGA & GYM PASSES AVAILABLE
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Highly Compact, Information-Dense Gym Card
 * Desktop: Image (left ~240px) + Info (right), height ~195px
 * Mobile: Stacked compact layout
 */
function CompactGymCard({
  gym,
  isDesktop,
  isTablet,
  isLiked,
  onToggleLike,
  onSelectGym,
  onQuickDirections,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverProps =
    Platform.OS === 'web'
      ? {
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        }
      : {};

  const cleanDistance = (gym.distance || gym.hotelDistance || '2.0 km')
    .replace('📍', '')
    .replace('from Hotel', '')
    .trim();
  const driveTime = gym.driveTime || '6 mins drive';
  const walkTime = gym.walkTime || '20 mins walk';
  const shortDesc = gym.shortDescription || gym.fullDescription || '';
  const facilities = Array.isArray(gym.services) ? gym.services.slice(0, 3).join(' • ') : '';

  return (
    <View
      style={[
        styles.gymCard,
        isDesktop && styles.gymCardDesktop,
        isTablet && styles.gymCardTablet,
        isHovered && styles.gymCardHovered,
      ]}
      {...hoverProps}
    >
      {/* 1. Left Image Container with Badge */}
      <View
        style={[
          styles.cardImageContainer,
          isDesktop && styles.cardImageContainerDesktop,
          isTablet && styles.cardImageContainerTablet,
        ]}
      >
        <Image
          source={{ uri: gym.imageLink }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlayGradient} />
        {gym.tag && (
          <View style={styles.gymTagBadge}>
            <Text style={styles.gymTagText}>{gym.tag}</Text>
          </View>
        )}
        <View style={styles.imageDistanceBadge}>
          <Text style={styles.imageDistanceText}>📍 {cleanDistance}</Text>
        </View>
      </View>

      {/* 2. Right Information Body */}
      <View style={styles.cardBody}>
        {/* Row 1: Title, Subtitle & Interactive Like Button */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.titleArea}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {gym.title}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {gym.subtitle}
            </Text>
          </View>

          {/* Compact Interactive Like Button */}
          <TouchableOpacity
            style={[styles.likeButton, isLiked && styles.likeButtonActive]}
            onPress={() => onToggleLike(gym.id, gym.likes)}
            activeOpacity={0.7}
          >
            <Text style={styles.likeHeartIcon}>{isLiked ? '❤️' : '🤍'}</Text>
            <Text style={[styles.likeCountText, isLiked && styles.likeCountTextActive]}>
              {(gym.likes || 0).toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Short Description (Compact 2 lines) */}
        <Text style={styles.cardDescription} numberOfLines={isDesktop ? 2 : 2}>
          {shortDesc}
        </Text>

        {/* Row 3: Metrics Row (Rating, Distance, Travel Time, Hours) */}
        <View style={styles.metricsRow}>
          <View style={styles.metricPill}>
            <Text style={styles.metricPillText}>⭐ {Number(gym.rating || 4.8).toFixed(1)}</Text>
          </View>
          <View style={[styles.metricPill, styles.metricPillHighlight]}>
            <Text style={styles.metricPillTextHighlight}>🚗 {driveTime}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricPillText}>🚶 {walkTime}</Text>
          </View>
          {gym.timings && (
            <View style={styles.metricPill}>
              <Text style={styles.metricPillText}>⏰ {gym.timings.split(',')[0].replace('(Sun: 6:00 AM - 1:00 PM)', '')}</Text>
            </View>
          )}
        </View>

        {/* Row 4: Address & Facilities inline */}
        <View style={styles.addressAndFacilitiesRow}>
          <Text style={styles.addressText} numberOfLines={1}>
            📍 {gym.address || gym.location || 'Near Hotel'}
            {facilities ? `   ✦   ${facilities}` : ''}
          </Text>
        </View>

        {/* Row 5: Action Buttons (Right-aligned, compact) */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => onSelectGym(gym)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Text style={styles.viewDetailsArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.directionsButton}
            onPress={() => onQuickDirections(gym)}
            activeOpacity={0.8}
          >
            <Text style={styles.directionsButtonIcon}>📍</Text>
            <Text style={styles.directionsButtonText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1014',
  },
  headerBar: {
    backgroundColor: '#14161F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.2)',
    paddingTop: Platform.OS === 'web' ? 10 : 8,
    paddingBottom: 10,
    paddingHorizontal: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    gap: 6,
  },
  backButtonIcon: {
    color: '#E2C082',
    fontSize: 15,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  originPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  originPillIcon: {
    marginRight: 5,
    fontSize: 11,
  },
  originPillText: {
    color: '#A0A5B5',
    fontSize: 11,
    fontWeight: '500',
  },
  titleSection: {
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.4)',
  },
  categoryBadgeText: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  curatedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  curatedBadgeText: {
    color: '#8E94A5',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 21 : 18,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'web' ? "'Playfair Display', Georgia, serif" : 'serif',
    marginBottom: 2,
  },
  pageSubtitle: {
    color: '#A0A5B5',
    fontSize: 12,
    lineHeight: 16,
  },
  controlsWrapper: {
    gap: 6,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1014',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    outlineStyle: 'none',
  },
  clearSearchButton: {
    padding: 4,
  },
  clearSearchText: {
    color: '#787C8E',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 1,
  },
  categoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryChipActive: {
    backgroundColor: '#E2C082',
    borderColor: '#E2C082',
  },
  categoryChipText: {
    color: '#B0B4C3',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#0F1014',
    fontWeight: '800',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  sortLabel: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sortOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sortButtonActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.18)',
    borderColor: '#E2C082',
  },
  sortButtonText: {
    color: '#8E94A5',
    fontSize: 10,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#E2C082',
    fontWeight: '700',
  },
  scrollList: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    gap: 10,
  },
  listContentDesktop: {
    maxWidth: 1060,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#A0A5B5',
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#8E94A5',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 380,
  },
  resetFiltersButton: {
    marginTop: 10,
    backgroundColor: '#E2C082',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  resetFiltersText: {
    color: '#0F1014',
    fontWeight: '700',
    fontSize: 12,
  },

  // ===========================================================================
  // COMPACT GYM CARD STYLES
  // ===========================================================================
  gymCard: {
    backgroundColor: '#151722',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.16)',
    overflow: 'hidden',
    flexDirection: 'column',
    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.35)',
    transition: 'all 0.2s ease',
  },
  gymCardDesktop: {
    flexDirection: 'row',
    height: 195,
  },
  gymCardTablet: {
    flexDirection: 'row',
    height: 205,
  },
  gymCardHovered: {
    borderColor: 'rgba(226, 192, 130, 0.45)',
    backgroundColor: '#181B27',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
  },
  cardImageContainer: {
    position: 'relative',
    height: 140,
    width: '100%',
  },
  cardImageContainerDesktop: {
    width: 240,
    height: '100%',
  },
  cardImageContainerTablet: {
    width: 200,
    height: '100%',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 16, 20, 0.22)',
  },
  gymTagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 16, 20, 0.88)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#E2C082',
  },
  gymTagText: {
    color: '#E2C082',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  imageDistanceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  imageDistanceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  titleArea: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: Platform.OS === 'web' ? "'Playfair Display', Georgia, serif" : 'serif',
  },
  cardSubtitle: {
    color: '#B0B4C3',
    fontSize: 11,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  likeButtonActive: {
    backgroundColor: 'rgba(235, 87, 87, 0.15)',
    borderColor: '#EB5757',
  },
  likeHeartIcon: {
    fontSize: 11,
  },
  likeCountText: {
    color: '#A0A5B5',
    fontSize: 11,
    fontWeight: '700',
  },
  likeCountTextActive: {
    color: '#FF6B6B',
  },
  cardDescription: {
    color: '#8E94A5',
    fontSize: 12,
    lineHeight: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metricPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  metricPillHighlight: {
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
  },
  metricPillText: {
    color: '#B8BAC8',
    fontSize: 10,
    fontWeight: '600',
  },
  metricPillTextHighlight: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '700',
  },
  addressAndFacilitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    color: '#787C8E',
    fontSize: 11,
    flex: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 2,
  },
  viewDetailsButton: {
    backgroundColor: '#E2C082',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 6,
    gap: 4,
  },
  viewDetailsText: {
    color: '#0F1014',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  viewDetailsArrow: {
    color: '#0F1014',
    fontSize: 13,
    fontWeight: 'bold',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(226, 192, 130, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 6,
    gap: 4,
  },
  directionsButtonIcon: {
    fontSize: 12,
  },
  directionsButtonText: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '700',
  },
  listFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 10,
  },
  listFooterText: {
    color: '#555968',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
});
