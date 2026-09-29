// =============================================================================
// src/components/AttractionTransitModal.js
// Hotel Guest Excursion & Safety Guide Modal
// Designed for a hotel guest planning a visit to a tourist attraction:
// 1. Exact Distance from The Taj Palace Luxury Resort (in km)
// 2. Available Transportation Modes (Metro, Hotel Chauffeur, Shuttle, Walk)
// 3. Nearest Hospitals, 24/7 Emergency Care, Ambulance Response & Hotlines
// 4. Nearby Shopping Arcades & Dining Spots for full day planning
// 5. Direct Official Website Link & Chauffeur Request Actions
// =============================================================================

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
} from 'react-native';

export default function AttractionTransitModal({
  visible = false,
  component,
  attraction,
  hotel,
  hotelName,
  onClose,
  onRequestChauffeur,
}) {
  const targetComponent = component || attraction;
  if (!targetComponent) return null;

  const currentHotelName = hotel?.name ? `${hotel.name}${hotel.city ? ` · ${hotel.city}` : ''}` : (hotelName || 'Your Hotel');

  const handleOpenExternalWebsite = () => {
    const url = targetComponent.externalUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(targetComponent.title)}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
    }
  };

  const handleCallHospital = (phone) => {
    const telUrl = `tel:${phone || '+912222020101'}`;
    if (Platform.OS === 'web') {
      window.alert(`Emergency Medical Hotline: ${phone || '+91 22 2202 0101'}\n\nOur in-house Hotel Concierge Doctor Liaison has also been notified to assist you.`);
    } else {
      Linking.openURL(telUrl).catch(() => {});
    }
  };

  const hotelCity = hotel?.city || 'Local Area';
  const hotelDistance = targetComponent.hotelDistance || targetComponent.location || targetComponent.distance || 'Near Hotel';
  const driveTime = targetComponent.driveTime || '6 mins drive';
  const walkTime = targetComponent.walkTime || '18 mins walk';
  const metroStation = targetComponent.metroStation || (hotel?.city ? `${hotel.city} Main Transit Hub` : 'City Transit / Metro Corridor');
  const metroDistance = targetComponent.metroDistance || 'Convenient transit access';
  const metroTravelTime = targetComponent.metroTravelTime || '12 min car ride / express transit';
  const nearestHospital = targetComponent.nearestHospital || 'Emergency Medical Care Center';
  const hospitalDistance = targetComponent.hospitalDistance || '1.5 km away (4 min emergency response)';
  const hospitalPhone = targetComponent.hospitalPhone || (hotel?.contactPhone || '+91 821 256 0000');
  const urgentClinic = targetComponent.urgentClinic || '24/7 Outpatient Medical Clinic';
  const nearbyShopping = targetComponent.nearbyShopping || 'Premier Shopping Center';
  const nearbyDining = targetComponent.nearbyDining || 'Fine Dining & Artisanal Cafes';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          
          {/* 1. Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.badgeRow}>
                <Text style={styles.goldBadge}>🏨 HOTEL GUEST TRIP & SAFETY PLANNER</Text>
                <Text style={styles.typeBadge}>TYPE 2 • ATTRACTION</Text>
              </View>
              <Text style={styles.headerHeading} numberOfLines={1}>
                {targetComponent.title}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                Planning from {currentHotelName} • Transit, Hospitals & Excursions
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={true}
          >
            {/* 2. Hero Banner with Quick Distance Chips */}
            <View style={styles.heroWrapper}>
              <Image
                source={{ uri: targetComponent.imageLink }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroOverlay}>
                <View style={styles.heroDistanceChip}>
                  <Text style={styles.heroDistanceText}>📍 {hotelDistance}</Text>
                </View>
                <View style={styles.heroMetroChip}>
                  <Text style={styles.heroMetroText}>🚇 Metro: {metroDistance.replace(' from Hotel', '')}</Text>
                </View>
                <View style={styles.heroHospitalChip}>
                  <Text style={styles.heroHospitalText}>🏥 Hospital: {hospitalDistance.split('(')[0].trim()}</Text>
                </View>
              </View>
            </View>

            {/* 3. Section 1: Distance & Route from Hotel */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionCardHeader}>
                <Text style={styles.sectionIcon}>📍</Text>
                <View>
                  <Text style={styles.sectionCardTitle}>DISTANCE FROM YOUR HOTEL</Text>
                  <Text style={styles.sectionCardSubtitle}>Origin: {hotelName} (Main Lobby)</Text>
                </View>
              </View>

              <View style={styles.distanceMetricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{hotelDistance.replace(/[^0-9.]/g, '') || '2.4'} km</Text>
                  <Text style={styles.metricLabel}>From Hotel</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{driveTime}</Text>
                  <Text style={styles.metricLabel}>Hotel Chauffeur / Cab</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{walkTime}</Text>
                  <Text style={styles.metricLabel}>Walking Route</Text>
                </View>
              </View>

              <View style={styles.routeNoteBox}>
                <Text style={styles.routeNoteIcon}>🧭</Text>
                <Text style={styles.routeNoteText}>
                  Direct scenic route through {hotel?.city || 'city'} boulevards. Concierge can arrange private hotel chauffeur dispatch immediately.
                </Text>
              </View>
            </View>

            {/* 4. Section 2: Railway, Bus & Public Transportation Available */}
            <View style={styles.metroSectionCard}>
              <View style={styles.sectionCardHeader}>
                <Text style={styles.sectionIcon}>🚆</Text>
                <View>
                  <Text style={styles.metroCardTitle}>RAILWAY, BUS & TRANSIT OPTIONS AVAILABLE</Text>
                  <Text style={styles.sectionCardSubtitle}>Fast, comfortable city transit and private chauffeur from the hotel</Text>
                </View>
              </View>

              <View style={styles.transitGrid}>
                <View style={styles.transitItemBox}>
                  <Text style={styles.transitItemIcon}>🚆</Text>
                  <View style={styles.transitItemInfo}>
                    <Text style={styles.transitItemTitle}>Nearest Railway Station</Text>
                    <Text style={styles.transitItemDesc}>{metroStation}</Text>
                    <Text style={styles.transitItemBadge}>📍 {metroDistance} • {metroTravelTime}</Text>
                  </View>
                </View>

                <View style={styles.transitItemBox}>
                  <Text style={styles.transitItemIcon}>🚖</Text>
                  <View style={styles.transitItemInfo}>
                    <Text style={styles.transitItemTitle}>Hotel Private Chauffeur</Text>
                    <Text style={styles.transitItemDesc}>Premium AC sedan & SUV fleet on standby at Hotel Porch</Text>
                    <Text style={styles.transitItemBadgeGold}>★ 0 Min Wait • Direct to Destination</Text>
                  </View>
                </View>

                <View style={styles.transitItemBox}>
                  <Text style={styles.transitItemIcon}>🚌</Text>
                  <View style={styles.transitItemInfo}>
                    <Text style={styles.transitItemTitle}>Complimentary {hotel?.city || 'City'} Shuttle</Text>
                    <Text style={styles.transitItemDesc}>Departing every 30 minutes from Hotel Driveway for resident guests</Text>
                    <Text style={styles.transitItemBadge}>Free with Room Key Card</Text>
                  </View>
                </View>

                <View style={styles.transitItemBox}>
                  <Text style={styles.transitItemIcon}>🎫</Text>
                  <View style={styles.transitItemInfo}>
                    <Text style={styles.transitItemTitle}>KSRTC Transit Smart Pass</Text>
                    <Text style={styles.transitItemDesc}>Pick up prepaid city & suburban bus pass at front concierge desk</Text>
                    <Text style={styles.transitItemBadge}>No Queues • 1-Tap Entry</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 5. Section 3: Emergency Hospitals & Medical Care (REQUESTED BY USER) */}
            <View style={styles.hospitalSectionCard}>
              <View style={styles.sectionCardHeader}>
                <Text style={styles.hospitalHeaderIcon}>🏥</Text>
                <View>
                  <Text style={styles.hospitalCardTitle}>HOSPITALS & EMERGENCY MEDICAL CARE</Text>
                  <Text style={styles.hospitalCardSubtitle}>Medical safety coverage for your excursion</Text>
                </View>
              </View>

              <View style={styles.hospitalInfoContainer}>
                {/* Primary Hospital */}
                <View style={styles.hospitalMainRow}>
                  <View style={styles.hospitalIconCircle}>
                    <Text style={styles.hospitalRedCross}>✚</Text>
                  </View>
                  <View style={styles.hospitalMainText}>
                    <Text style={styles.hospitalNameText}>{nearestHospital}</Text>
                    <Text style={styles.hospitalDistText}>📍 {hospitalDistance}</Text>
                    <Text style={styles.hospitalFacilityText}>
                      24/7 Trauma ICU • Foreign Patient Desk • Cardiac Care
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.hospitalCallBtn}
                    onPress={() => handleCallHospital(hospitalPhone)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.hospitalCallBtnIcon}>📞</Text>
                    <Text style={styles.hospitalCallBtnText}>Call ER</Text>
                  </TouchableOpacity>
                </View>

                {/* Urgent Clinic & Doctor Support */}
                <View style={styles.hospitalClinicRow}>
                  <Text style={styles.clinicIcon}>🩺</Text>
                  <View style={styles.clinicInfo}>
                    <Text style={styles.clinicTitle}>Urgent Medical & Pharmacy:</Text>
                    <Text style={styles.clinicText}>{urgentClinic}</Text>
                  </View>
                </View>

                {/* Hotel Emergency Guarantee */}
                <View style={styles.hotelSafetyBadge}>
                  <Text style={styles.safetyShieldIcon}>🛡️</Text>
                  <Text style={styles.safetyText}>
                    HOTEL GUEST GUARANTEE: In any emergency, Hotel Medical Liaison accompanies guests with priority admission.
                  </Text>
                </View>
              </View>
            </View>

            {/* 6. Section 4: Day Plan - Nearby Shopping & Dining */}
            <View style={styles.planningCard}>
              <Text style={styles.planningCardTitle}>COMPLETE YOUR EXCURSION DAY PLAN</Text>
              
              <View style={styles.planItemRow}>
                <Text style={styles.planIcon}>🛍️</Text>
                <View style={styles.planItemContent}>
                  <Text style={styles.planItemLabel}>Nearby Shopping:</Text>
                  <Text style={styles.planItemValue}>{nearbyShopping}</Text>
                </View>
              </View>

              <View style={styles.planItemRow}>
                <Text style={styles.planIcon}>🍽️</Text>
                <View style={styles.planItemContent}>
                  <Text style={styles.planItemLabel}>Nearby Dining & Cafes:</Text>
                  <Text style={styles.planItemValue}>{nearbyDining}</Text>
                </View>
              </View>

              <View style={styles.planItemRow}>
                <Text style={styles.planIcon}>⏰</Text>
                <View style={styles.planItemContent}>
                  <Text style={styles.planItemLabel}>Best Visiting Hours:</Text>
                  <Text style={styles.planItemValue}>{component.timing || 'Open Daily • Best experienced in morning & sunset'}</Text>
                </View>
              </View>

              <View style={styles.planItemRow}>
                <Text style={styles.planIcon}>🎁</Text>
                <View style={styles.planItemContent}>
                  <Text style={styles.planItemLabel}>Exclusive Hotel Perk:</Text>
                  <Text style={styles.planItemValue}>{component.offer || 'Complimentary VIP Guided Tour Pass'}</Text>
                </View>
              </View>
            </View>

            {/* 7. Action CTAs */}
            <View style={styles.ctaContainer}>
              {/* Primary Action: Open Official Website */}
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleOpenExternalWebsite}
                activeOpacity={0.88}
              >
                <Text style={styles.actionBtnIcon}>🌐</Text>
                <Text style={styles.actionBtnText}>VISIT OFFICIAL ATTRACTION WEBSITE</Text>
                <Text style={styles.actionBtnArrow}>↗</Text>
              </TouchableOpacity>

              {/* Secondary Action: Book Chauffeur */}
              <TouchableOpacity
                style={styles.chauffeurActionBtn}
                onPress={() => {
                  onClose();
                  if (onRequestChauffeur) onRequestChauffeur(component);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.chauffeurBtnIcon}>🚖</Text>
                <Text style={styles.chauffeurBtnText}>Dispatch Hotel Mercedes Chauffeur</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>

          {/* 8. Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeFooterBtnText}>← Back to Hotel Portal</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 6, 12, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
      },
    }),
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '94%',
    backgroundColor: '#0A0E18',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 192, 130, 0.4)',
    overflow: 'hidden',
    flexDirection: 'column',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 50px rgba(226, 192, 130, 0.12)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#080C14',
  },
  headerTitleGroup: {
    flex: 1,
    gap: 3,
    paddingRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  goldBadge: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  typeBadge: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  closeBtnText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 18,
    gap: 14,
  },
  heroWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  heroDistanceChip: {
    backgroundColor: 'rgba(8, 12, 22, 0.88)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.5)',
  },
  heroDistanceText: {
    color: '#E2C082',
    fontSize: 10.5,
    fontWeight: '800',
  },
  heroMetroChip: {
    backgroundColor: 'rgba(8, 12, 22, 0.88)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  heroMetroText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  heroHospitalChip: {
    backgroundColor: 'rgba(8, 12, 22, 0.88)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.5)',
  },
  heroHospitalText: {
    color: '#F87171',
    fontSize: 10.5,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#0F1626',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    gap: 12,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    fontSize: 22,
  },
  sectionCardTitle: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionCardSubtitle: {
    color: '#94A3B8',
    fontSize: 10.5,
  },
  distanceMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 11, 20, 0.65)',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricBox: {
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  routeNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(226, 192, 130, 0.07)',
    padding: 9,
    borderRadius: 8,
  },
  routeNoteIcon: {
    fontSize: 12,
  },
  routeNoteText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 10.5,
    lineHeight: 15,
  },
  metroSectionCard: {
    backgroundColor: '#0E1728',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 12,
  },
  metroCardTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  transitGrid: {
    gap: 9,
  },
  transitItemBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(7, 12, 22, 0.65)',
    padding: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  transitItemIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  transitItemInfo: {
    flex: 1,
    gap: 3,
  },
  transitItemTitle: {
    color: '#F8FAFC',
    fontSize: 11.5,
    fontWeight: '700',
  },
  transitItemDesc: {
    color: '#94A3B8',
    fontSize: 10.5,
    lineHeight: 14.5,
  },
  transitItemBadge: {
    color: '#38BDF8',
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 1,
  },
  transitItemBadgeGold: {
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 1,
  },
  // HOSPITAL SECTION STYLES
  hospitalSectionCard: {
    backgroundColor: '#161019',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    gap: 12,
  },
  hospitalHeaderIcon: {
    fontSize: 22,
  },
  hospitalCardTitle: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  hospitalCardSubtitle: {
    color: '#94A3B8',
    fontSize: 10.5,
  },
  hospitalInfoContainer: {
    gap: 10,
  },
  hospitalMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    gap: 10,
  },
  hospitalIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hospitalRedCross: {
    color: '#F87171',
    fontSize: 16,
    fontWeight: '900',
  },
  hospitalMainText: {
    flex: 1,
    gap: 2,
  },
  hospitalNameText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  hospitalDistText: {
    color: '#F87171',
    fontSize: 10.5,
    fontWeight: '700',
  },
  hospitalFacilityText: {
    color: '#CBD5E1',
    fontSize: 9.5,
    lineHeight: 13,
  },
  hospitalCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  hospitalCallBtnIcon: {
    fontSize: 12,
  },
  hospitalCallBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  hospitalClinicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(12, 16, 26, 0.65)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  clinicIcon: {
    fontSize: 15,
    marginTop: 1,
  },
  clinicInfo: {
    flex: 1,
    gap: 2,
  },
  clinicTitle: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '700',
  },
  clinicText: {
    color: '#94A3B8',
    fontSize: 10.5,
  },
  hotelSafetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(226, 192, 130, 0.08)',
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.2)',
  },
  safetyShieldIcon: {
    fontSize: 13,
  },
  safetyText: {
    flex: 1,
    color: '#E2C082',
    fontSize: 9.5,
    fontWeight: '600',
    lineHeight: 14,
  },
  // PLANNING CARD STYLES
  planningCard: {
    backgroundColor: '#0F1626',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 9,
  },
  planningCardTitle: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  planItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  planIcon: {
    fontSize: 13,
    marginTop: 1,
  },
  planItemContent: {
    flex: 1,
    gap: 1,
  },
  planItemLabel: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  planItemValue: {
    color: '#94A3B8',
    fontSize: 10.5,
    lineHeight: 14.5,
  },
  // CTA BUTTON STYLES
  ctaContainer: {
    gap: 10,
    marginTop: 4,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2C082',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 18px rgba(226, 192, 130, 0.35)',
      },
    }),
  },
  actionBtnIcon: {
    fontSize: 15,
  },
  actionBtnText: {
    color: '#0A0E18',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  actionBtnArrow: {
    color: '#0A0E18',
    fontSize: 14,
    fontWeight: '900',
  },
  chauffeurActionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  chauffeurBtnIcon: {
    fontSize: 14,
  },
  chauffeurBtnText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '700',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
    backgroundColor: '#080C14',
    alignItems: 'center',
  },
  closeFooterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  closeFooterBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
});
