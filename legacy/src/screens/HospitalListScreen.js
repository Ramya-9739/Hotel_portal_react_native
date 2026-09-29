// =============================================================================
// src/screens/HospitalListScreen.js
// Dedicated Hospital List Page for Hotel Portal
// Meets Faculty Requirement:
// [ TITLE + SUBTITLE ] | [ DATA 1 ] | [ DATA 2 ] | [ DATA 3 ] | [ DATA 4 ] | [ DATA 5 ] | [ Website ] | [ Directions ]
//
// Dynamic Google Maps turn-by-turn routing from current hotel location:
// https://www.google.com/maps/dir/?api=1&origin=${hotel.latitude},${hotel.longitude}&destination=${hospital.latitude},${hospital.longitude}&travelmode=driving
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

export default function HospitalListScreen({
  hotel = null,
  onBackToHotel,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'emergency24x7' | 'multi'

  // Extract hospitals list from current selected hotel
  const rawHospitals = hotel?.nearby?.hospitals || [];

  // Filtered and searched hospitals
  const filteredHospitals = useMemo(() => {
    return rawHospitals.filter((h) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (h.title || '').toLowerCase().includes(query);
        const areaMatch = (h.area || h.address || '').toLowerCase().includes(query);
        const facilityMatch = (h.facilities || []).some((f) => f.toLowerCase().includes(query));
        if (!titleMatch && !areaMatch && !facilityMatch) return false;
      }

      // 2. Chip Filter
      if (filterMode === 'emergency24x7') {
        return h.isEmergency24x7 === true;
      }
      if (filterMode === 'multi') {
        return (h.facilities || []).length >= 3;
      }

      return true;
    });
  }, [rawHospitals, searchQuery, filterMode]);

  const handleCallEmergency = () => {
    const phone = hotel?.contactPhone || '112';
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
              <Text style={styles.screenTagText}>HEALTHCARE & EMERGENCY CONCIERGE</Text>
            </View>
            <View style={styles.verifiedTag}>
              <Text style={styles.verifiedTagText}>✓ 24/7 Verified Routing</Text>
            </View>
          </View>

          <Text style={styles.screenTitle}>
            Emergency Hospitals & Tertiary Medical Care
          </Text>
          <Text style={styles.screenSubtitle}>
            Accredited multi-speciality hospitals, emergency trauma units, ICU and cardiac care centers near {safeVal(hotel?.name, 'your hotel stay')}.
          </Text>
        </View>

        {/* Emergency Alert Banner */}
        <View style={styles.emergencyBanner}>
          <View style={styles.emergencyBannerIconBox}>
            <Text style={styles.emergencyBannerIcon}>🚨</Text>
          </View>
          <View style={styles.emergencyBannerContent}>
            <Text style={styles.emergencyBannerTitle}>
              CRITICAL EMERGENCY DIRECTORY
            </Text>
            <Text style={styles.emergencyBannerText}>
              For life-threatening emergencies, dial 112 / 108 or contact the hotel front desk immediately. The concierge can dispatch private hospital chauffeur transit with priority emergency clearance.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.emergencyCallBtn}
            onPress={handleCallEmergency}
            activeOpacity={0.8}
          >
            <Text style={styles.emergencyCallBtnText}>📞 Call Desk</Text>
          </TouchableOpacity>
        </View>

        {/* Controls Bar: Search & Filter Chips */}
        <View style={[styles.controlsBar, !isDesktop && styles.controlsBarMobile]}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search hospitals by name, area, or ICU..."
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
                All Hospitals ({rawHospitals.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterMode === 'emergency24x7' && styles.filterChipActive]}
              onPress={() => setFilterMode('emergency24x7')}
            >
              <Text style={[styles.filterChipText, filterMode === 'emergency24x7' && styles.filterChipTextActive]}>
                🚨 24/7 Trauma Centers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterMode === 'multi' && styles.filterChipActive]}
              onPress={() => setFilterMode('multi')}
            >
              <Text style={[styles.filterChipText, filterMode === 'multi' && styles.filterChipTextActive]}>
                🏥 Multi-Speciality
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Faculty Requirement Layout Table */}
        <UniversalCategoryTableList
          items={filteredHospitals}
          category="hospitals"
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  screenTagText: {
    color: '#F87171',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  verifiedTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  verifiedTagText: {
    color: '#4ADE80',
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
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 22,
    gap: 14,
  },
  emergencyBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyBannerIcon: {
    fontSize: 18,
  },
  emergencyBannerContent: {
    flex: 1,
  },
  emergencyBannerTitle: {
    color: '#FCA5A5',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  emergencyBannerText: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 15,
  },
  emergencyCallBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  emergencyCallBtnText: {
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
