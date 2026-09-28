// =============================================================================
// src/screens/PharmacyListScreen.js
// Dedicated Pharmacy List Page for Hotel Portal
// Meets Faculty Requirement:
// [ TITLE + SUBTITLE ] | [ DATA 1 ] | [ DATA 2 ] | [ DATA 3 ] | [ DATA 4 ] | [ DATA 5 ] | [ Website ] | [ Directions ]
//
// Dynamic Google Maps turn-by-turn routing from current hotel location:
// https://www.google.com/maps/dir/?api=1&origin=${hotel.latitude},${hotel.longitude}&destination=${pharmacy.latitude},${pharmacy.longitude}&travelmode=driving
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
import UniversalCategoryTableList from '../components/UniversalCategoryTableList';
import { safeVal } from '../data/hotelsData';

export default function PharmacyListScreen({
  hotel = null,
  onBackToHotel,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'open24x7' | 'delivery'

  // Extract pharmacies list from current selected hotel
  const rawPharmacies = hotel?.nearby?.pharmacies || [];

  // Filtered and searched pharmacies
  const filteredPharmacies = useMemo(() => {
    return rawPharmacies.filter((p) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (p.title || '').toLowerCase().includes(query);
        const areaMatch = (p.area || p.address || '').toLowerCase().includes(query);
        const deliveryMatch = (p.deliveryService || '').toLowerCase().includes(query);
        if (!titleMatch && !areaMatch && !deliveryMatch) return false;
      }

      // 2. Chip Filter
      if (filterMode === 'open24x7') {
        return p.isOpen24x7 === true;
      }
      if (filterMode === 'delivery') {
        return (p.deliveryService || '').toLowerCase().includes('delivery') || (p.deliveryService || '').toLowerCase().includes('available');
      }

      return true;
    });
  }, [rawPharmacies, searchQuery, filterMode]);

  const handleCallConcierge = () => {
    const phone = hotel?.contactPhone || '+91 821 241 5566';
    if (Platform.OS === 'web') {
      window.open(`tel:${phone.replace(/\s+/g, '')}`);
    } else {
      Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. TOP NAVIGATION & ORIGIN BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToHotel}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>← Back to Hotel Portal</Text>
        </TouchableOpacity>

        {/* Dynamic Hotel Origin Indicator */}
        <View style={styles.originPill}>
          <Text style={styles.originPillIcon}>🏨</Text>
          <Text style={styles.originPillLabel}>
            Origin Stay:{' '}
            <Text style={styles.originPillValue}>
              {hotel?.name || 'Active Hotel'}{hotel?.city ? `, ${hotel.city}` : ''}
            </Text>
          </Text>
          {hotel?.latitude && hotel?.longitude ? (
            <Text style={styles.originCoords}>
              ({Number(hotel.latitude).toFixed(4)}°N, {Number(hotel.longitude).toFixed(4)}°E)
            </Text>
          ) : null}
        </View>
      </View>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Screen Header */}
        <View style={styles.headerBox}>
          <View style={styles.badgeRow}>
            <View style={styles.screenTag}>
              <Text style={styles.screenTagText}>PHARMACY & MEDICAL DISPENSARY</Text>
            </View>
            <View style={styles.verifiedTag}>
              <Text style={styles.verifiedTagText}>✓ 24/7 Verified Stock</Text>
            </View>
          </View>

          <Text style={styles.screenTitle}>
            24/7 Pharmacies, Chemists & Medical Supplies
          </Text>
          <Text style={styles.screenSubtitle}>
            Licensed 24/7 emergency chemists, prescription dispensaries, and express doorstep suite delivery near {safeVal(hotel?.name, 'your stay')}.
          </Text>
        </View>

        {/* Concierge Delivery Banner */}
        <View style={styles.deliveryBanner}>
          <View style={styles.deliveryBannerIconBox}>
            <Text style={styles.deliveryBannerIcon}>🛎️</Text>
          </View>
          <View style={styles.deliveryBannerContent}>
            <Text style={styles.deliveryBannerTitle}>
              SUITE MEDICINE DELIVERY CONCIERGE
            </Text>
            <Text style={styles.deliveryBannerText}>
              Need urgent medicines delivered directly to your room? Contact the front desk to arrange express courier pickup from verified 24/7 partner pharmacies with zero hassle.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deliveryCallBtn}
            onPress={handleCallConcierge}
            activeOpacity={0.8}
          >
            <Text style={styles.deliveryCallBtnText}>🛎️ Request Delivery</Text>
          </TouchableOpacity>
        </View>

        {/* Controls Bar: Search & Filter Chips */}
        <View style={[styles.controlsBar, !isDesktop && styles.controlsBarMobile]}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search pharmacies by name, 24/7 status, or location..."
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
            <TouchableOpacity
              style={[styles.filterChip, filterMode === 'all' && styles.filterChipActive]}
              onPress={() => setFilterMode('all')}
            >
              <Text style={[styles.filterChipText, filterMode === 'all' && styles.filterChipTextActive]}>
                All Pharmacies ({rawPharmacies.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterMode === 'open24x7' && styles.filterChipActive]}
              onPress={() => setFilterMode('open24x7')}
            >
              <Text style={[styles.filterChipText, filterMode === 'open24x7' && styles.filterChipTextActive]}>
                🕒 24/7 Open Chemists
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterMode === 'delivery' && styles.filterChipActive]}
              onPress={() => setFilterMode('delivery')}
            >
              <Text style={[styles.filterChipText, filterMode === 'delivery' && styles.filterChipTextActive]}>
                🛵 Doorstep Delivery
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Faculty Requirement Layout Table */}
        <UniversalCategoryTableList
          items={filteredPharmacies}
          category="pharmacies"
          hotel={hotel}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0A0B0E',
    flexDirection: 'column',
  },
  navBar: {
    backgroundColor: '#12141A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
  },
  backButtonText: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '700',
  },
  originPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 14,
    gap: 6,
  },
  originPillIcon: {
    fontSize: 13,
  },
  originPillLabel: {
    color: '#94A3B8',
    fontSize: 11.5,
  },
  originPillValue: {
    color: '#E2C082',
    fontWeight: '700',
  },
  originCoords: {
    color: '#64748B',
    fontSize: 10.5,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
  },
  headerBox: {
    marginBottom: 20,
    flexDirection: 'column',
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  screenTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  screenTagText: {
    color: '#34D399',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  verifiedTag: {
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  verifiedTagText: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '700',
  },
  screenTitle: {
    color: '#F8F6F0',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.4,
    ...Platform.select({
      web: {
        fontFamily: "'Playfair Display', Georgia, serif",
      },
    }),
  },
  screenSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 820,
  },
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 22,
    gap: 14,
  },
  deliveryBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryBannerIcon: {
    fontSize: 18,
  },
  deliveryBannerContent: {
    flex: 1,
  },
  deliveryBannerTitle: {
    color: '#A7F3D0',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  deliveryBannerText: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 15,
  },
  deliveryCallBtn: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  deliveryCallBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 16,
  },
  controlsBarMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12141A',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
    color: '#64748B',
  },
  searchInput: {
    flex: 1,
    color: '#F8F6F0',
    fontSize: 12.5,
    padding: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  clearSearchText: {
    color: '#64748B',
    fontSize: 13,
    paddingHorizontal: 4,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: '#12141A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterChipActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderColor: '#E2C082',
  },
  filterChipText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#E2C082',
    fontWeight: '700',
  },
});
