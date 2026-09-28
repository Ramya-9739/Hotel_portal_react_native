// =============================================================================
// src/components/RightTransitAndCarePanel.js
// Right Column Panel for Hotel Portal:
// 1. Healthcare Gateways (Hospitals & Pharmacies compact cards with Image + Title)
//    Clicking navigates to dedicated Hospital and Pharmacy list screens!
// 2. Transportation & Mobility Links (Simple list style WITHOUT large images)
//    Includes: Title, Subtitle, Link, Directions
// =============================================================================

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { getDirectionsUrl, safeVal, HOSPITAL_FALLBACK_IMAGE, PHARMACY_FALLBACK_IMAGE } from '../data/hotelsData';

export default function RightTransitAndCarePanel({
  hotel,
  onSelectTransitItem,
}) {
  const transitItems = hotel?.nearby?.transportation || [];

  const handleOpenLink = (url) => {
    if (!url) return;
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch((err) => console.error('Error opening link:', err));
    }
  };

  return (
    <View style={styles.container}>
      {/* ================================================================= */}
      {/* DEDICATED TRANSPORTATION & MOBILITY PANEL (Full Right Column)     */}
      {/* ================================================================= */}
      <View style={styles.transitSection}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleBox}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              🚆 TRANSIT & MOBILITY
            </Text>
            <Text style={styles.sectionSubtitle} numberOfLines={1}>
              Railway, Metro, Airport & Private Chauffeur
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{transitItems.length} Links</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={[styles.scrollContent, transitItems.length === 0 && styles.emptyScrollContent]}
          style={styles.scrollContainer}
          scrollIndicatorInsets={{ right: 1 }}
          nestedScrollEnabled={true}
        >
          {transitItems.length === 0 ? (
            <View style={styles.transitEmptyBox}>
              <Text style={styles.transitEmptyIcon}>🚆</Text>
              <Text style={styles.transitEmptyTitle}>No transportation facilities found near this hotel.</Text>
              <Text style={styles.transitEmptySub}>
                Real railway, metro, bus or airport hubs near {hotel?.city || 'this stay'} will appear once loaded.
              </Text>
            </View>
          ) : (
            transitItems.map((item, index) => {
              const directionsUrl = getDirectionsUrl(hotel, item);
            const externalLink = item.link || item.websiteUrl;

            return (
              <View
                key={item.id || `transit-${index}`}
                style={[
                  styles.listItemRow,
                  index % 2 === 1 && styles.listItemRowAlt,
                ]}
              >
                {/* Top Badge: Hub Type */}
                <View style={styles.itemTopRow}>
                  <View style={styles.transitBadge}>
                    <Text style={styles.transitBadgeText}>
                      {safeVal(item.category || item.tag || item.type, 'TRANSIT HUB').toUpperCase()}
                    </Text>
                  </View>
                  {item.distance ? (
                    <Text style={styles.transitDistanceText}>
                      📍 {item.distance}
                    </Text>
                  ) : null}
                </View>

                {/* Title & Subtitle */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onSelectTransitItem && onSelectTransitItem(item)}
                >
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {safeVal(item.title, 'Transit Station')}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.itemSubtitle} numberOfLines={2}>
                  {safeVal(item.subtitle || item.description || item.notes, 'Mobility and passenger transit hub')}
                </Text>

                {/* Actions: Link + Directions */}
                <View style={styles.actionsRow}>
                  {externalLink ? (
                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => handleOpenLink(externalLink)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnSecondaryText}>🔗 Link ↗</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.disabledBtn}>
                      <Text style={styles.disabledBtnText}>Website unavailable</Text>
                    </View>
                  )}

                  {directionsUrl ? (
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => handleOpenLink(directionsUrl)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnPrimaryText}>🧭 Directions ↗</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.disabledBtn}>
                      <Text style={styles.disabledBtnText} numberOfLines={1}>
                        {!hotel || (!hotel.latitude && !hotel.lat) ? 'Hotel loc. unset' : 'Directions unavailable'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
        </ScrollView>
      </View>
    </View>
  );
}

// =============================================================================
// HEALTHCARE & PHARMACY BOTTOM GATEWAYS BAR
// Mounted at the bottom of the portal above/beside bottom curations
// =============================================================================
export function HealthcareGatewaysBar({
  hotel,
  onNavigateToHospitals,
  onNavigateToPharmacies,
}) {
  const hospitals = hotel?.nearby?.hospitals || [];
  const pharmacies = hotel?.nearby?.pharmacies || [];

  const hospitalThumbnail = hospitals[0]?.imageLink || HOSPITAL_FALLBACK_IMAGE;
  const pharmacyThumbnail = pharmacies[0]?.imageLink || PHARMACY_FALLBACK_IMAGE;

  return (
    <View style={styles.bottomCareBarContainer}>
      <View style={styles.bottomCareCardsRow}>
        {/* Card 1: Emergency Hospitals */}
        <TouchableOpacity
          style={styles.bottomCareCompactCard}
          onPress={onNavigateToHospitals}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: hospitalThumbnail }}
            style={styles.bottomCareCardThumb}
            resizeMode="cover"
          />
          <View style={styles.bottomCareCardOverlay} />
          <View style={styles.bottomCareCardContent}>
            <View style={styles.careBadge}>
              <Text style={styles.careBadgeText}>🚨 24/7 EMERGENCY & TRAUMA</Text>
            </View>
            <Text style={styles.bottomCareCardTitle} numberOfLines={1}>
              Emergency Hospitals & ICU
            </Text>
            <Text style={styles.bottomCareCardSubtitle} numberOfLines={1}>
              {hospitals.length} tertiary care units near {hotel?.city || 'stay'} • Doctors on call 24/7
            </Text>
            <View style={styles.careActionPill}>
              <Text style={styles.careActionPillText}>Open Hospitals Directory ({hospitals.length}) →</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Card 2: 24/7 Pharmacies */}
        <TouchableOpacity
          style={styles.bottomCareCompactCard}
          onPress={onNavigateToPharmacies}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: pharmacyThumbnail }}
            style={styles.bottomCareCardThumb}
            resizeMode="cover"
          />
          <View style={styles.bottomCareCardOverlay} />
          <View style={styles.bottomCareCardContent}>
            <View style={[styles.careBadge, styles.pharmacyBadge]}>
              <Text style={[styles.careBadgeText, styles.pharmacyBadgeText]}>💊 24/7 CHEMISTS & DISPENSARY</Text>
            </View>
            <Text style={styles.bottomCareCardTitle} numberOfLines={1}>
              Pharmacies & Chemists
            </Text>
            <Text style={styles.bottomCareCardSubtitle} numberOfLines={1}>
              {pharmacies.length} verified chemists near {hotel?.city || 'stay'} • Prescription delivery
            </Text>
            <View style={[styles.careActionPill, styles.pharmacyActionPill]}>
              <Text style={[styles.careActionPillText, styles.pharmacyActionPillText]}>Open Pharmacies Directory ({pharmacies.length}) →</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111217',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.16)',
    padding: 10,
    flexDirection: 'column',
    gap: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      },
    }),
  },
  healthcareSection: {
    flexDirection: 'column',
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.12)',
  },
  sectionHeaderMini: {
    gap: 1,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionHeaderSubtitle: {
    color: '#64748B',
    fontSize: 8.5,
  },
  healthcareCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  careCompactCard: {
    flex: 1,
    height: 98,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#181A22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  careCardThumb: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  careCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 11, 15, 0.78)',
  },
  careCardContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 7,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  careBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  careBadgeText: {
    color: '#FCA5A5',
    fontSize: 7.5,
    fontWeight: '800',
  },
  pharmacyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  pharmacyBadgeText: {
    color: '#6EE7B7',
  },
  careCardTitle: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  careCardSubtitle: {
    color: '#94A3B8',
    fontSize: 8.5,
  },
  careActionPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  careActionPillText: {
    color: '#FECACA',
    fontSize: 8.5,
    fontWeight: '700',
  },
  pharmacyActionPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  pharmacyActionPillText: {
    color: '#A7F3D0',
  },
  transitSection: {
    flex: 1,
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  headerTitleBox: {
    flex: 1,
    gap: 1,
  },
  sectionTitle: {
    color: '#F8F6F0',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    ...Platform.select({
      web: {
        fontFamily: "'Playfair Display', Georgia, serif",
      },
    }),
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 9,
  },
  countBadge: {
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
  },
  countBadgeText: {
    color: '#E2C082',
    fontSize: 8.5,
    fontWeight: '800',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'column',
    gap: 6,
    paddingBottom: 4,
  },
  listItemRow: {
    backgroundColor: '#151720',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    flexDirection: 'column',
    gap: 3,
  },
  listItemRowAlt: {
    backgroundColor: '#181A24',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transitBadge: {
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  transitBadgeText: {
    color: '#E2C082',
    fontSize: 8,
    fontWeight: '800',
  },
  transitDistanceText: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '600',
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  itemSubtitle: {
    color: '#94A3B8',
    fontSize: 9.5,
    lineHeight: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
    paddingTop: 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(226, 192, 130, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    borderRadius: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '700',
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#E2C082',
    borderRadius: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    color: '#0D0E12',
    fontSize: 9.5,
    fontWeight: '800',
  },
  disabledBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtnText: {
    color: '#475569',
    fontSize: 9,
  },

  // ---------------------------------------------------------------------------
  // Bottom Healthcare & Pharmacy Gateways Styles
  // ---------------------------------------------------------------------------
  bottomCareBarContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 3,
  },
  bottomCareCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bottomCareCompactCard: {
    flex: 1,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#181A22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.2s ease' },
    }),
  },
  bottomCareCardThumb: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bottomCareCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 11, 15, 0.82)',
  },
  bottomCareCardContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  bottomCareCardTitle: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  bottomCareCardSubtitle: {
    color: '#94A3B8',
    fontSize: 9,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  transitEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 6,
  },
  transitEmptyIcon: {
    fontSize: 26,
    color: '#64748B',
  },
  transitEmptyTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  transitEmptySub: {
    color: '#64748B',
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 15,
    maxWidth: 220,
  },
});
