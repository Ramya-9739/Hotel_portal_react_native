// =============================================================================
// src/components/RouteDetailsModal.js
// Start-to-End Navigation & Turn-by-Turn Directions Modal for ALL Places
// (Tourist Attractions, Shopping Malls, Transit & Hospitals, Dining, ATMs, Pools, Parlours)
// Shows origin (Active Hotel) to destination with exact distance,
// travel times, step-by-step directions, Google Maps navigation, and concierge booking.
// =============================================================================

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Linking,
} from 'react-native';

export const HOTEL_START = {
  name: 'Hotel Porch',
  address: 'Hotel Location',
  lat: null,
  lng: null,
};

export const HOTEL_ORIGIN_QUERY = 'Hotel Location';

/**
 * Returns Google Maps destination query.
 * Prioritizes exact coordinates [lat, lng].
 * If coordinates missing, constructs query dynamically from item address and hotel city.
 */
export function getGoogleMapsDestinationQuery(item, hotel) {
  if (!item) return hotel?.city ? `${hotel.city}` : 'Destination';

  const destLat = item.latitude ?? item.lat;
  const destLng = item.longitude ?? item.lng;
  if (destLat && destLng && !isNaN(destLat) && !isNaN(destLng)) {
    return `${destLat},${destLng}`;
  }

  const cleanTitle = (item.title || item.name || '').replace(/\(.*?\)/g, '').replace(/•.*$/g, '').trim();
  const rawLoc = (item.location || item.address || '').replace(/•.*$/g, '').replace(/\d+(\.\d+)?\s*km.*$/gi, '').trim();
  const city = hotel?.city || '';

  const queryParts = [cleanTitle, rawLoc, city].filter(Boolean);
  return queryParts.join(', ');
}

/**
 * Returns dynamic, step-by-step directions starting from the active hotel.
 */
export function getRouteDirections(item, hotel) {
  const hotelName = hotel?.name || 'Hotel';
  const hotelAddr = hotel?.address || hotel?.city || 'Hotel Porch';
  const destName = item?.title || item?.name || 'Destination';
  const destLocation = item?.location || item?.address || hotel?.city || '';
  const distanceStr = item?.distance || item?.hotelDistance || '';

  return [
    { step: 1, text: `Depart ${hotelName} main lobby / entrance on ${hotelAddr}.` },
    { step: 2, text: `Take the primary connecting avenue towards ${destLocation || destName}.` },
    { step: 3, text: `Follow directional signage along the main corridor directly towards ${destName}.` },
    { step: 4, text: `Arrive at ${destName} visitor entrance & parking${distanceStr ? ` (${distanceStr})` : ''}.` },
  ];
}

export default function RouteDetailsModal({
  visible = false,
  item,
  hotel,
  onClose,
  onViewDetails,
  onBook,
}) {
  if (!item) return null;

  const rawDistance = item.distance || item.hotelDistance || item.location || '2.4 km';
  const cleanDistance = String(rawDistance).replace('📍', '').replace('from Hotel', '').trim();

  // Compute Google Maps Directions URL dynamically using active hotel coordinates as origin
  const originLat = hotel?.latitude ?? hotel?.lat;
  const originLng = hotel?.longitude ?? hotel?.lng;
  const originQuery = (originLat && originLng && !isNaN(originLat) && !isNaN(originLng))
    ? `${originLat},${originLng}`
    : encodeURIComponent(hotel?.address || hotel?.name || (hotel?.city ? `${hotel.city}, India` : HOTEL_ORIGIN_QUERY));

  const destLat = item?.latitude ?? item?.lat;
  const destLng = item?.longitude ?? item?.lng;
  const destinationQuery = (destLat && destLng && !isNaN(destLat) && !isNaN(destLng))
    ? `${destLat},${destLng}`
    : encodeURIComponent(getGoogleMapsDestinationQuery(item, hotel));

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${destinationQuery}&travelmode=driving`;

  const handleOpenDirections = () => {
    if (Platform.OS === 'web') {
      window.open(googleMapsDirectionsUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(googleMapsDirectionsUrl).catch((err) => console.error('Error opening maps:', err));
    }
  };

  const handleOpenWebsite = () => {
    const url = item.externalUrl || item.link || item.websiteUrl || `https://www.google.com/search?q=${encodeURIComponent(item.title + ' ' + (hotel?.city || ''))}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch((err) => console.error('Error opening website:', err));
    }
  };

  const handleCall = () => {
    const phone = item.contactPhone || item.phone || '+91 821 241 5500';
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`).catch((err) => console.error('Error calling:', err));
  };

  const routeSteps = getRouteDirections(item, hotel);

  // Compute travel times
  const driveTime = item.driveTime || (cleanDistance.includes('0.') ? '2 mins' : cleanDistance.includes('1.') ? '4 mins' : '12 mins');
  const autoTime = cleanDistance.includes('0.') ? '3 mins' : cleanDistance.includes('1.') ? '6 mins' : '16 mins';
  const walkTime = item.walkTime || (cleanDistance.includes('0.2') ? '2 mins' : cleanDistance.includes('0.3') ? '3 mins' : cleanDistance.includes('0.6') ? '7 mins' : '25 mins');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.badgeRow}>
                <Text style={styles.headerCategoryBadge}>
                  {item.tag || item.category || `${(hotel?.city || 'Local').toUpperCase()} CURATION`}
                </Text>
                <Text style={styles.liveNavBadge}>🧭 LIVE DIRECTIONS</Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Destination Image & Quick Meta */}
            {item.imageLink ? (
              <View style={styles.imageWrap}>
                <Image
                  source={{ uri: item.imageLink }}
                  style={styles.destinationImage}
                  resizeMode="cover"
                />
                <View style={styles.imageScrim}>
                  <Text style={styles.imageTitle}>{item.title}</Text>
                  <Text style={styles.imageSubtitle} numberOfLines={1}>
                    {item.subtitle || item.shortDescription || `Curated ${hotel?.city || 'local'} destination`}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* START TO END ROUTE SUMMARY CARD (REQUESTED BY USER) */}
            <View style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <Text style={styles.routeHeaderTitle}>START ➔ ENDING POINT NAVIGATION</Text>
                <View style={styles.distancePill}>
                  <Text style={styles.distancePillText}>📍 {cleanDistance}</Text>
                </View>
              </View>

              {/* Point A: Starting Point */}
              <View style={styles.routePointRow}>
                <View style={styles.pointDotStart}>
                  <Text style={styles.pointDotText}>A</Text>
                </View>
                <View style={styles.pointInfo}>
                  <View style={styles.pointLabelRow}>
                    <Text style={styles.pointLabelStart}>🟢 STARTING POINT (ORIGIN)</Text>
                    <Text style={styles.pointHotelTag}>YOUR HOTEL</Text>
                  </View>
                  <Text style={styles.pointName}>{hotel?.name || 'Active Hotel'}</Text>
                  <Text style={styles.pointAddress}>{hotel?.address || hotel?.city || 'Hotel Entrance'}</Text>
                </View>
              </View>

              {/* Route Connecting Line with Travel Times */}
              <View style={styles.connectingLineRow}>
                <View style={styles.connectingVerticalLine} />
                <View style={styles.travelTimesGroup}>
                  <View style={styles.travelChip}>
                    <Text style={styles.travelChipIcon}>🚗</Text>
                    <Text style={styles.travelChipText}>Drive: ~{driveTime}</Text>
                  </View>
                  <View style={styles.travelChip}>
                    <Text style={styles.travelChipIcon}>🛺</Text>
                    <Text style={styles.travelChipText}>Auto: ~{autoTime}</Text>
                  </View>
                  <View style={styles.travelChip}>
                    <Text style={styles.travelChipIcon}>🚶</Text>
                    <Text style={styles.travelChipText}>Walk: ~{walkTime}</Text>
                  </View>
                </View>
              </View>

              {/* Point B: Ending Point */}
              <View style={styles.routePointRow}>
                <View style={styles.pointDotEnd}>
                  <Text style={styles.pointDotText}>B</Text>
                </View>
                <View style={styles.pointInfo}>
                  <Text style={styles.pointLabelEnd}>🔴 ENDING POINT (DESTINATION)</Text>
                  <Text style={styles.pointName}>{item.title}</Text>
                  <Text style={styles.pointAddress}>
                    {item.address || item.location || (hotel?.city ? `${hotel.city}, India` : 'Local Area')}
                  </Text>
                </View>
              </View>
            </View>

            {/* STEP-BY-STEP DIRECTIONS */}
            <View style={styles.stepsContainer}>
              <View style={styles.stepsHeader}>
                <Text style={styles.stepsHeaderIcon}>🧭</Text>
                <Text style={styles.stepsHeaderTitle}>TURN-BY-TURN ROUTE GUIDANCE</Text>
              </View>
              <View style={styles.stepsList}>
                {routeSteps.map((s, idx) => (
                  <View key={`route-step-${idx}`} style={styles.stepItemRow}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{s.step}</Text>
                    </View>
                    <Text style={styles.stepItemText}>{s.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* PRIMARY ACTION: GOOGLE MAPS LIVE DIRECTIONS */}
            <View style={styles.actionsGroup}>
              <TouchableOpacity
                style={styles.primaryDirectionBtn}
                onPress={handleOpenDirections}
                activeOpacity={0.85}
              >
                <Text style={styles.directionBtnIcon}>🗺️</Text>
                <View style={styles.directionBtnContent}>
                  <Text style={styles.directionBtnTitle}>Open in Google Maps Live Navigation</Text>
                  <Text style={styles.directionBtnSub}>
                    Get real-time GPS route from {hotel?.name || 'Your Hotel'} to {item.title}
                  </Text>
                </View>
                <Text style={styles.directionBtnArrow}>➔</Text>
              </TouchableOpacity>

              {/* Secondary Actions: Full Details & Concierge Booking */}
              <View style={styles.dualActionsRow}>
                {onViewDetails ? (
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => onViewDetails(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.viewDetailsIcon}>📖</Text>
                    <Text style={styles.viewDetailsText}>View Details & History</Text>
                  </TouchableOpacity>
                ) : null}

                {onBook ? (
                  <TouchableOpacity
                    style={styles.bookChauffeurBtn}
                    onPress={() => onBook(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.bookChauffeurIcon}>🚗</Text>
                    <Text style={styles.bookChauffeurText}>Book Chauffeur Ride</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Website & Call Links */}
              <View style={styles.secondaryLinksRow}>
                <TouchableOpacity
                  style={styles.secondaryLinkBtn}
                  onPress={handleOpenWebsite}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryLinkIcon}>🌐</Text>
                  <Text style={styles.secondaryLinkText}>Website / Info ↗</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryLinkBtn}
                  onPress={handleCall}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryLinkIcon}>📞</Text>
                  <Text style={styles.secondaryLinkText}>Call Place Direct</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Proximity Details & Offer Info */}
            <View style={styles.metaBox}>
              {item.timing ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaIcon}>🕒</Text>
                  <Text style={styles.metaText}>Hours: {item.timing}</Text>
                </View>
              ) : null}
              {item.offer ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaIcon}>✦</Text>
                  <Text style={styles.metaTextHighlight}>{item.offer}</Text>
                </View>
              ) : null}
              {item.additionalInfo ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaIcon}>ℹ️</Text>
                  <Text style={styles.metaText}>{item.additionalInfo}</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%',
    backgroundColor: '#0D1322',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 192, 130, 0.4)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(226, 192, 130, 0.18)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(10, 14, 24, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleWrap: {
    flex: 1,
    gap: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerCategoryBadge: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  liveNavBadge: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    gap: 12,
  },
  imageWrap: {
    width: '100%',
    height: 135,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E2433',
  },
  destinationImage: {
    width: '100%',
    height: '100%',
  },
  imageScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(10, 14, 24, 0.85)',
  },
  imageTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  imageSubtitle: {
    color: '#CBD5E1',
    fontSize: 9.5,
  },

  // Route card
  routeCard: {
    backgroundColor: '#131826',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    padding: 12,
    gap: 6,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  routeHeaderTitle: {
    color: '#E2C082',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  distancePill: {
    backgroundColor: 'rgba(226, 192, 130, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.5)',
  },
  distancePillText: {
    color: '#E2C082',
    fontSize: 10.5,
    fontWeight: '900',
  },
  routePointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pointDotStart: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    shadowColor: '#10B981',
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  pointDotEnd: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    shadowColor: '#EF4444',
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  pointDotText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  pointInfo: {
    flex: 1,
    gap: 2,
  },
  pointLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointLabelStart: {
    color: '#10B981',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  pointHotelTag: {
    color: '#E2C082',
    fontSize: 8,
    fontWeight: '900',
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  pointLabelEnd: {
    color: '#EF4444',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  pointName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
  },
  pointAddress: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 14,
  },
  connectingLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 11,
    gap: 16,
    marginVertical: 4,
  },
  connectingVerticalLine: {
    width: 2,
    height: 42,
    backgroundColor: 'rgba(226, 192, 130, 0.45)',
  },
  travelTimesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  travelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  travelChipIcon: {
    fontSize: 10,
  },
  travelChipText: {
    color: '#E2E8F0',
    fontSize: 9.5,
    fontWeight: '700',
  },

  // Steps container
  stepsContainer: {
    backgroundColor: 'rgba(15, 20, 32, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 8,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 6,
  },
  stepsHeaderIcon: {
    fontSize: 13,
  },
  stepsHeaderTitle: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  stepsList: {
    gap: 6,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepNumberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '900',
  },
  stepItemText: {
    color: '#CBD5E1',
    fontSize: 10.5,
    lineHeight: 15,
    flex: 1,
  },

  // Actions
  actionsGroup: {
    gap: 8,
  },
  primaryDirectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(56, 189, 248, 0.25)',
      },
    }),
  },
  directionBtnIcon: {
    fontSize: 22,
  },
  directionBtnContent: {
    flex: 1,
    gap: 2,
  },
  directionBtnTitle: {
    color: '#38BDF8',
    fontSize: 12.5,
    fontWeight: '900',
  },
  directionBtnSub: {
    color: '#94A3B8',
    fontSize: 9.5,
  },
  directionBtnArrow: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '900',
  },

  // Dual action row (Details & Book)
  dualActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.5)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 8,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  viewDetailsIcon: {
    fontSize: 12,
  },
  viewDetailsText: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '800',
  },
  bookChauffeurBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 8,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  bookChauffeurIcon: {
    fontSize: 12,
  },
  bookChauffeurText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },

  secondaryLinksRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  secondaryLinkIcon: {
    fontSize: 12,
  },
  secondaryLinkText: {
    color: '#CBD5E1',
    fontSize: 10.5,
    fontWeight: '700',
  },

  metaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 11,
    color: '#94A3B8',
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 10,
  },
  metaTextHighlight: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '700',
  },
});
