// =============================================================================
// src/screens/CategoryDirectoryScreen.js
// Dedicated Themed Category Directory Page for Hotel Portal
// Meets Faculty & Guide Requirements:
// 1. Redirects from Category Title Buttons at the bottom of the Guest Portal
// 2. Distinct Visual Themes for each component (Hospitals, Cafes, Pharmacies, Gyms, etc.)
// 3. Information Table consisting of Title, Subtitle, Timings, Emergency Availability,
//    Facilities/Highlights, Ratings, and Dynamic Turn-by-Turn GPS Directions from Hotel.
// =============================================================================

import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import LucideIcon from '../components/LucideIcon';
import UniversalCategoryTableList from '../components/UniversalCategoryTableList';
import { getCategoryTheme, CATEGORY_THEMES } from '../theme/categoryThemes';
import { safeVal } from '../data/hotelsData';

export default function CategoryDirectoryScreen({
  category = 'cafes',
  hotel = null,
  onBackToHotel,
  onSelectCategory,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // Active category theme definition
  const currentCategoryKey = (category || 'cafes').toLowerCase();
  const theme = useMemo(() => getCategoryTheme(currentCategoryKey), [currentCategoryKey]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');

  // Extract raw places for the category from the current hotel
  const rawItems = useMemo(() => {
    if (!hotel || !hotel.nearby) return [];
    const nb = hotel.nearby;
    const cat = currentCategoryKey;

    if (cat.includes('hosp')) return nb.hospitals || [];
    if (cat.includes('pharm')) return nb.pharmacies || [];
    if (cat.includes('cafe')) return nb.cafes || [];
    if (cat.includes('gym')) return nb.gyms || [];
    if (cat.includes('restaur') || cat.includes('dine')) return nb.restaurants || [];
    if (cat.includes('pool') || cat.includes('swim')) return nb.pools || nb.swimmingPools || [];
    if (cat.includes('spa') || cat.includes('parlour') || cat.includes('salon')) return nb.spa || [];
    if (cat.includes('takeaway')) return nb.takeaway || nb.takeaways || [];
    if (cat.includes('delivery')) return nb.delivery || [];
    if (cat.includes('atm') || cat.includes('bank')) return nb.atms || [];

    return nb[cat] || [];
  }, [hotel, currentCategoryKey]);

  // Filter items based on search and chip filter
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tMatch = (item.title || item.name || '').toLowerCase().includes(q);
        const subMatch = (item.subtitle || item.description || item.address || item.area || '').toLowerCase().includes(q);
        const facMatch = Array.isArray(item.facilities)
          ? item.facilities.some((f) => String(f).toLowerCase().includes(q))
          : String(item.facilities || item.services || '').toLowerCase().includes(q);
        const timingMatch = (item.timings || item.hours || item.timing || '').toLowerCase().includes(q);
        if (!tMatch && !subMatch && !facMatch && !timingMatch) return false;
      }

      // 2. Chip Filter Modes
      if (filterMode === 'all') return true;
      if (filterMode === 'emergency24x7') return item.isEmergency24x7 === true;
      if (filterMode === 'open24x7') return item.isOpen24x7 === true || item.is24x7 === true;
      if (filterMode === 'delivery') return (item.deliveryService || '').toLowerCase().includes('delivery') || (item.deliveryService || '').toLowerCase().includes('available');
      if (filterMode === 'multi') return (item.facilities || []).length >= 3;
      if (filterMode === 'roasteries') return (item.cuisine || item.title || '').toLowerCase().includes('roast') || (item.cuisine || '').toLowerCase().includes('coffee');
      if (filterMode === 'breakfast') return (item.timings || item.timing || '').toLowerCase().includes('am') || (item.cuisine || '').toLowerCase().includes('bakery');
      if (filterMode === 'yoga') return (item.category || item.services || '').toLowerCase().includes('yoga');
      if (filterMode === 'crossfit') return (item.category || item.services || '').toLowerCase().includes('crossfit') || (item.services || '').toLowerCase().includes('weights');
      if (filterMode === 'fine_dining') return (item.rating || 0) >= 4.8;
      if (filterMode === 'heated') return (item.features || item.additionalInfo || '').toLowerCase().includes('heat') || (item.title || '').toLowerCase().includes('heat');
      if (filterMode === 'ayurveda') return (item.services || item.title || '').toLowerCase().includes('ayur');

      return true;
    });
  }, [rawItems, searchQuery, filterMode]);

  const handleActionCall = () => {
    const phone = hotel?.hotelContactNumber || hotel?.contactPhone || theme.emergencyPhone || '+91 80 4000 5000';
    if (Platform.OS === 'web') {
      window.open(`tel:${phone.replace(/\s+/g, '')}`);
    } else {
      Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
    }
  };

  // Quick switch categories list
  const availableCategories = [
    { id: 'cafes', label: 'Bistros & Cafes', icon: 'coffee' },
    { id: 'hospitals', label: 'Hospitals', icon: 'cross' },
    { id: 'pharmacies', label: 'Pharmacies', icon: 'shield' },
    { id: 'gyms', label: 'Wellness & Gyms', icon: 'dumbbell' },
    { id: 'restaurants', label: 'Restaurants', icon: 'utensils' },
    { id: 'pools', label: 'Swimming Pools', icon: 'waves' },
    { id: 'spa', label: 'Parlour & Spa', icon: 'sparkles' },
    { id: 'takeaway', label: 'Takeaway', icon: 'shopping-bag' },
    { id: 'delivery', label: 'Suite Delivery', icon: 'truck' },
    { id: 'atms', label: '24/7 ATMs', icon: 'credit-card' },
  ];

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.surfaceBg || '#0A0B0E' }]}>
      {/* 1. TOP NAVIGATION & ORIGIN BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToHotel}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <LucideIcon name="arrow-left" size={15} color="#C5A46D" />
            <Text style={styles.backButtonText}>Back to Hotel Portal</Text>
          </View>
        </TouchableOpacity>

        {/* Dynamic Hotel Origin Indicator */}
        <View style={styles.originPill}>
          <LucideIcon name="building-2" size={13} color="#C5A46D" />
          <Text style={styles.originPillLabel}>
            Origin Stay:{' '}
            <Text style={styles.originPillValue}>
              {hotel?.name || hotel?.hotelName || 'Active Hotel'}{hotel?.city ? `, ${hotel.city}` : ''}
            </Text>
          </Text>
          {hotel?.latitude && hotel?.longitude ? (
            <Text style={styles.originCoords}>
              ({Number(hotel.latitude).toFixed(4)}°N, {Number(hotel.longitude).toFixed(4)}°E)
            </Text>
          ) : null}
        </View>
      </View>

      {/* Quick Category Navigation Bar */}
      <View style={styles.categorySwitchBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categorySwitchScroll}
        >
          <Text style={styles.categorySwitchLabel}>SWITCH DIRECTORY:</Text>
          {availableCategories.map((catItem) => {
            const isSelected = catItem.id === currentCategoryKey;
            const itemTheme = getCategoryTheme(catItem.id);
            return (
              <TouchableOpacity
                key={catItem.id}
                style={[
                  styles.categoryPill,
                  isSelected && {
                    backgroundColor: itemTheme.accentBackground,
                    borderColor: itemTheme.primaryColor,
                    borderWidth: 1.5,
                  },
                ]}
                onPress={() => onSelectCategory && onSelectCategory(catItem.id)}
                activeOpacity={0.8}
              >
                <LucideIcon
                  name={catItem.icon}
                  size={13}
                  color={isSelected ? itemTheme.primaryColor : '#A5A39D'}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && { color: itemTheme.primaryColor, fontWeight: '800' },
                  ]}
                >
                  {catItem.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Dynamic Themed Header Box */}
        <View
          style={[
            styles.headerBox,
            {
              borderLeftColor: theme.primaryColor,
              borderLeftWidth: 4,
              backgroundColor: theme.accentBackground,
              borderColor: theme.accentBorder,
            },
          ]}
        >
          <View style={styles.badgeRow}>
            <View style={[styles.screenTag, { backgroundColor: theme.badgeBg, borderColor: theme.accentBorder }]}>
              <Text style={[styles.screenTagText, { color: theme.badgeText }]}>
                {theme.tag}
              </Text>
            </View>
            <View style={styles.verifiedTag}>
              <LucideIcon name="check-circle" size={12} color="#10B981" />
              <Text style={styles.verifiedTagText}>Turn-by-Turn GPS Verified</Text>
            </View>
          </View>

          <Text style={styles.screenTitle}>{theme.name}</Text>
          <Text style={styles.screenSubtitle}>
            {theme.tagline} Verified routing and distance calculated from{' '}
            <Text style={{ color: '#F2EFE8', fontWeight: '700' }}>
              {hotel?.name || hotel?.hotelName || 'your active stay'}
            </Text>.
          </Text>
        </View>

        {/* Themed Notice / Action Banner */}
        <View
          style={[
            styles.noticeBanner,
            {
              backgroundColor: theme.accentBackground,
              borderColor: theme.accentBorder,
            },
          ]}
        >
          <View
            style={[
              styles.noticeIconBox,
              { backgroundColor: theme.badgeBg, borderColor: theme.accentBorder },
            ]}
          >
            <LucideIcon name={theme.emergencyIcon || 'alert-triangle'} size={20} color={theme.primaryColor} />
          </View>
          <View style={styles.noticeContent}>
            <Text style={[styles.noticeTitle, { color: theme.primaryColor }]}>
              {currentCategoryKey.includes('hosp') ? 'CRITICAL EMERGENCY DIRECTORY' : `${theme.shortName.toUpperCase()} CONCIERGE PRIVILEGE`}
            </Text>
            <Text style={styles.noticeText}>{theme.emergencyNotice}</Text>
          </View>
          <TouchableOpacity
            style={[styles.noticeActionBtn, { backgroundColor: theme.primaryColor }]}
            onPress={handleActionCall}
            activeOpacity={0.8}
          >
            <Text style={styles.noticeActionBtnText}>
              {theme.emergencyActionLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Controls Bar: Search & Filter Chips */}
        <View style={[styles.controlsBar, !isDesktop && styles.controlsBarMobile]}>
          <View style={styles.searchBox}>
            <LucideIcon name="search" size={15} color="#807E78" />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${theme.shortName.toLowerCase()} by title, area, specialty, or timings...`}
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.filterChipsRow}>
            {theme.filterChips.map((chip) => {
              const isActive = filterMode === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.filterChip,
                    isActive && {
                      backgroundColor: theme.primaryColor,
                      borderColor: theme.primaryColor,
                    },
                  ]}
                  onPress={() => setFilterMode(chip.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && { color: '#101114', fontWeight: '800' },
                    ]}
                  >
                    {chip.label} {chip.id === 'all' ? `(${rawItems.length})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Faculty & Guide Compliant Themed Universal Table */}
        <UniversalCategoryTableList
          items={filteredItems}
          category={currentCategoryKey}
          hotel={hotel}
          theme={theme}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  navBar: {
    backgroundColor: '#12141A',
    borderBottomWidth: 1,
    borderBottomColor: '#26272C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  backButton: {
    backgroundColor: 'rgba(197, 164, 109, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.4)',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  backButtonText: {
    color: '#C5A46D',
    fontSize: 12,
    fontWeight: '700',
  },
  originPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1D21',
    borderWidth: 1,
    borderColor: '#2A2B31',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  originPillLabel: {
    color: '#A5A39D',
    fontSize: 11.5,
  },
  originPillValue: {
    color: '#F2EFE8',
    fontWeight: '700',
  },
  originCoords: {
    color: '#C5A46D',
    fontSize: 10.5,
    fontFamily: Platform.select({ web: 'monospace', default: 'System' }),
  },
  categorySwitchBar: {
    backgroundColor: '#15161A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B31',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  categorySwitchScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categorySwitchLabel: {
    color: '#807E78',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginRight: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1D21',
    borderWidth: 1,
    borderColor: '#2E3038',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 6,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  categoryPillText: {
    color: '#A5A39D',
    fontSize: 11.5,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  headerBox: {
    backgroundColor: '#1C1D21',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2B31',
    padding: 20,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  screenTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  screenTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  verifiedTagText: {
    color: '#6EE7B7',
    fontSize: 10.5,
    fontWeight: '700',
  },
  screenTitle: {
    color: '#F2EFE8',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    color: '#A5A39D',
    fontSize: 13,
    lineHeight: 19,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    flexWrap: 'wrap',
  },
  noticeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeContent: {
    flex: 1,
    minWidth: 260,
    gap: 4,
  },
  noticeTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  noticeText: {
    color: '#F2EFE8',
    fontSize: 12.5,
    lineHeight: 18,
  },
  noticeActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  noticeActionBtnText: {
    color: '#101114',
    fontSize: 12,
    fontWeight: '800',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },
  controlsBarMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15161A',
    borderWidth: 1,
    borderColor: '#2A2B31',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F2EFE8',
    fontSize: 12.5,
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  clearSearchText: {
    color: '#807E78',
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#1C1D21',
    borderWidth: 1,
    borderColor: '#2A2B31',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  filterChipText: {
    color: '#A5A39D',
    fontSize: 11.5,
    fontWeight: '600',
  },
});
