// =============================================================================
// src/components/ChauffeurModal.js
// Dedicated Luxury Chauffeur Fleet Dispatch Modal for Hotel Dining Guests
// Enables guests to select a private luxury car (Mercedes S-Class, Range Rover,
// Sprinter VIP), specify pickup timing, and receive a live driver dispatch voucher.
// Synced to backend REST API & Admin Console.
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { apiService } from '../services/apiService';

// Curated Hotel Fleet Options
const FLEET_VEHICLES = [
  {
    id: 'mercedes-s-class',
    name: 'Mercedes-Benz S-Class',
    badge: 'FLAGSHIP SEDAN',
    capacity: '1–3 Guests • 2 Large Bags',
    features: 'Heated Nappa Leather, Ambient Lighting, Chilled Spring Water, High-Speed WiFi',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=500&q=80',
    driver: 'Capt. Rajesh Sharma',
    driverRating: '4.98 ★',
    plate: 'VIP-FLEET-001',
  },
  {
    id: 'range-rover',
    name: 'Range Rover Autobiography',
    badge: 'LUXURY ALL-TERRAIN',
    capacity: '1–4 Guests • 4 Large Bags',
    features: 'Panoramic Sky Lounge, Executive Rear Reclining, Acoustic Glazing',
    image: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=500&q=80',
    driver: 'Capt. Michael D’Souza',
    driverRating: '4.95 ★',
    plate: 'MH-01-VIP-888',
  },
  {
    id: 'bmw-7-series',
    name: 'BMW 7 Series Protection',
    badge: 'PRESIDENTIAL LIMO',
    capacity: '1–3 Guests • 3 Bags',
    features: 'Executive Lounge Seating, Theatre Display, Massage Chairs, Privacy Curtains',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&q=80',
    driver: 'Capt. Vikramaditya Singh',
    driverRating: '5.00 ★',
    plate: 'MH-01-ROYAL-01',
  },
  {
    id: 'mercedes-sprinter',
    name: 'Mercedes Sprinter VIP Jet Lounge',
    badge: 'GROUP RETREAT',
    capacity: '5–8 Guests • 8 Bags',
    features: 'First-Class Jet Cabin, Espresso Bar, Apple TV, Conference Workstation',
    image: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=500&q=80',
    driver: 'Capt. Gurpreet Singh',
    driverRating: '4.92 ★',
    plate: 'MH-01-BUS-900',
  },
];

export default function ChauffeurModal({
  visible = false,
  component,
  hotel,
  onClose,
  onDispatchConfirmed,
}) {
  if (!component) return null;

  // Form State
  const [selectedVehicle, setSelectedVehicle] = useState(FLEET_VEHICLES[0]);
  const [pickupTiming, setPickupTiming] = useState('immediate'); // 'immediate' | 'scheduled'
  const [scheduledTime, setScheduledTime] = useState('In 30 Minutes');
  const [pickupLocation, setPickupLocation] = useState('Hotel Main Grand Porch');
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [luggageCount, setLuggageCount] = useState('1-2 Bags');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dispatchedTrip, setDispatchedTrip] = useState(null);

  // Reset when opened
  useEffect(() => {
    if (visible) {
      setDispatchedTrip(null);
      setErrorMessage('');
    }
  }, [visible, component?.id]);

  const handleConfirmDispatch = async () => {
    setErrorMessage('');
    if (!guestName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!roomNumber.trim()) {
      setErrorMessage('Please enter your hotel Room or Suite number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const timingLabel =
        pickupTiming === 'immediate'
          ? '⚡ Immediate (ETA: 5–8 mins at Porch)'
          : `⏰ Scheduled (${scheduledTime})`;

      const payload = {
        componentId: component.id,
        componentTitle: `Chauffeur to ${component.title}`,
        category: 'Private Chauffeur Fleet',
        guestName: guestName.trim(),
        roomNumber: roomNumber.trim(),
        phone: phone.trim(),
        bookingDate: 'Today',
        timeSlot: timingLabel,
        guestCount: selectedVehicle.id === 'mercedes-sprinter' ? 6 : 2,
        experienceType: `${selectedVehicle.name} • Plate: ${selectedVehicle.plate}`,
        specialRequests: `Pickup: ${pickupLocation} • Luggage: ${luggageCount}${
          specialInstructions ? ` • Notes: ${specialInstructions.trim()}` : ''
        }`,
      };

      const result = await apiService.createBooking(payload);
      if (result && result.success) {
        const tripDetails = {
          ...result.booking,
          vehicle: selectedVehicle,
          driver: selectedVehicle.driver,
          plate: selectedVehicle.plate,
          driverRating: selectedVehicle.driverRating,
          pickupLocation,
          timingLabel,
        };
        setDispatchedTrip(tripDetails);
        if (onDispatchConfirmed) {
          onDispatchConfirmed(tripDetails);
        }
      } else {
        setErrorMessage(result?.error || 'Failed to dispatch chauffeur. Please try again.');
      }
    } catch (err) {
      console.error('[ChauffeurModal] Dispatch error:', err);
      setErrorMessage('Network error communicating with concierge dispatch desk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!dispatchedTrip) return;
    const hotelTitle = hotel?.name ? hotel.name.toUpperCase() : 'HOTEL';
    const text = `🚗 *${hotelTitle} VIP CHAUFFEUR DISPATCH*\nRef: ${dispatchedTrip.id}\nVehicle: ${dispatchedTrip.vehicle.name} (${dispatchedTrip.plate})\nChauffeur: ${dispatchedTrip.driver} (${dispatchedTrip.driverRating})\nDestination: ${component.title}\nGuest: ${dispatchedTrip.guestName} (${dispatchedTrip.roomNumber})\nPickup: ${dispatchedTrip.pickupLocation}\nStatus: En Route to Porch (ETA 5 mins)`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

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
          <View style={styles.modalHeader}>
            <View style={styles.headerTitles}>
              <View style={styles.badgeRow}>
                <Text style={styles.badgeIcon}>🚗</Text>
                <Text style={styles.badgeText}>
                  {dispatchedTrip ? 'CHAUFFEUR ON THE WAY' : 'PRIVATE LUXURY FLEET DISPATCH'}
                </Text>
              </View>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {dispatchedTrip ? 'Live Chauffeur Pass' : `Transit to ${component.title}`}
              </Text>
              <Text style={styles.headerSubtitle}>
                {dispatchedTrip
                  ? 'Your private vehicle is pulling up to the hotel front entrance.'
                  : 'Select your vehicle of choice and our valet concierge will dispatch immediately.'}
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

          {/* Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {dispatchedTrip ? (
              /* ============================================================= */
              /* STATE 2: LIVE CHAUFFEUR DISPATCH PASS                         */
              /* ============================================================= */
              <View style={styles.dispatchSuccessWrapper}>
                {/* Flashing Live Radar Indicator */}
                <View style={styles.radarIconWrap}>
                  <Text style={styles.radarIcon}>🚘</Text>
                </View>
                <Text style={styles.dispatchTitle}>Chauffeur Dispatched!</Text>
                <Text style={styles.dispatchSubtitle}>
                  Please proceed to the <Text style={styles.goldText}>{dispatchedTrip.pickupLocation}</Text>
                </Text>

                {/* Driver & Car Boarding Pass */}
                <View style={styles.boardingPass}>
                  {/* Top Bar: Car Name + Plate */}
                  <View style={styles.carHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.carModelText}>{dispatchedTrip.vehicle.name}</Text>
                      <Text style={styles.carPlateText}>Plate: {dispatchedTrip.plate}</Text>
                    </View>
                    <View style={styles.etaPill}>
                      <Text style={styles.etaPillText}>ETA: 5 MINS</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Driver Profile */}
                  <View style={styles.driverProfileRow}>
                    <View style={styles.driverAvatar}>
                      <Text style={styles.driverAvatarText}>👨‍✈️</Text>
                    </View>
                    <View style={styles.driverInfoCol}>
                      <Text style={styles.driverNameText}>{dispatchedTrip.driver}</Text>
                      <Text style={styles.driverExpText}>
                        VIP Fleet Captain • {dispatchedTrip.driverRating}
                      </Text>
                    </View>
                    <View style={styles.verifiedShield}>
                      <Text style={styles.verifiedShieldText}>✓ Hotel Certified</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Trip Matrix */}
                  <View style={styles.tripMatrix}>
                    <View style={styles.matrixItem}>
                      <Text style={styles.matrixLabel}>DESTINATION</Text>
                      <Text style={styles.matrixValue} numberOfLines={1}>{component.title}</Text>
                    </View>
                    <View style={styles.matrixItem}>
                      <Text style={styles.matrixLabel}>GUEST & ROOM</Text>
                      <Text style={styles.matrixValue}>{dispatchedTrip.guestName} ({dispatchedTrip.roomNumber})</Text>
                    </View>
                    <View style={styles.matrixItem}>
                      <Text style={styles.matrixLabel}>PICKUP TIMING</Text>
                      <Text style={styles.matrixValue}>{dispatchedTrip.timingLabel}</Text>
                    </View>
                    <View style={styles.matrixItem}>
                      <Text style={styles.matrixLabel}>TRIP REF CODE</Text>
                      <Text style={[styles.matrixValue, styles.goldText]}>{dispatchedTrip.id}</Text>
                    </View>
                  </View>

                  {/* Valet Assistance Note */}
                  <View style={styles.valetAssurance}>
                    <Text style={styles.valetIcon}>🛎️</Text>
                    <Text style={styles.valetText}>
                      The head doorman will announce your car by name upon arrival at the porch. Complimentary bottled Evian water and chilled towels are provided inside.
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.passActionsRow}>
                  <TouchableOpacity
                    style={styles.btnWhatsapp}
                    onPress={handleShareWhatsApp}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnWhatsappText}>📱 Send Trip Details to WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnReturn}
                    onPress={onClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnReturnText}>Return to Guide</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* ============================================================= */
              /* STATE 1: VEHICLE & TIMING SELECTION FORM                      */
              /* ============================================================= */
              <View style={styles.formContainer}>
                
                {/* Destination Banner */}
                <View style={styles.destinationCard}>
                  <Image source={{ uri: component.imageLink }} style={styles.destThumb} />
                  <View style={styles.destDetails}>
                    <Text style={styles.destLabel}>DIRECT CHAUFFEUR TRANSIT TO:</Text>
                    <Text style={styles.destTitle} numberOfLines={1}>{component.title}</Text>
                    <Text style={styles.destMeta}>📍 {component.location || 'City Destination'} • ~15–20 Mins Drive</Text>
                  </View>
                </View>

                {/* Error Banner */}
                {errorMessage ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                  </View>
                ) : null}

                {/* 1. Vehicle Fleet Selection */}
                <Text style={styles.sectionHeading}>1. SELECT LUXURY FLEET VEHICLE</Text>
                
                <View style={styles.fleetList}>
                  {FLEET_VEHICLES.map((car) => {
                    const isSelected = selectedVehicle.id === car.id;
                    return (
                      <TouchableOpacity
                        key={car.id}
                        style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                        onPress={() => setSelectedVehicle(car)}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: car.image }} style={styles.vehiclePhoto} />

                        <View style={styles.vehicleInfoCol}>
                          <View style={styles.vehicleHeaderRow}>
                            <Text style={styles.vehicleName}>{car.name}</Text>
                            <View style={[styles.vehicleBadge, isSelected && styles.vehicleBadgeActive]}>
                              <Text style={[styles.vehicleBadgeText, isSelected && styles.vehicleBadgeTextActive]}>
                                {car.badge}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.vehicleCapacity}>👥 {car.capacity}</Text>
                          <Text style={styles.vehicleFeatures} numberOfLines={1}>✦ {car.features}</Text>
                          <Text style={styles.assignedDriver}>
                            Chauffeur: <Text style={styles.driverHighlight}>{car.driver}</Text> ({car.driverRating})
                          </Text>
                        </View>

                        {/* Radio Check Circle */}
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Pickup Timing */}
                <Text style={styles.sectionHeading}>2. PICKUP TIMING & LOCATION</Text>

                <View style={styles.timingToggleRow}>
                  <TouchableOpacity
                    style={[styles.timingBtn, pickupTiming === 'immediate' && styles.timingBtnActive]}
                    onPress={() => setPickupTiming('immediate')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.timingBtnIcon}>⚡</Text>
                    <View>
                      <Text style={[styles.timingBtnTitle, pickupTiming === 'immediate' && styles.timingBtnTitleActive]}>
                        Immediate Dispatch
                      </Text>
                      <Text style={styles.timingBtnSub}>Driver arrives in 5–8 mins</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.timingBtn, pickupTiming === 'scheduled' && styles.timingBtnActive]}
                    onPress={() => setPickupTiming('scheduled')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.timingBtnIcon}>⏰</Text>
                    <View>
                      <Text style={[styles.timingBtnTitle, pickupTiming === 'scheduled' && styles.timingBtnTitleActive]}>
                        Schedule for Later
                      </Text>
                      <Text style={styles.timingBtnSub}>Specify departure time</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {pickupTiming === 'scheduled' && (
                  <View style={styles.scheduledChipsRow}>
                    {['In 30 Minutes', 'In 1 Hour', 'Today 6:00 PM', 'Today 8:00 PM', 'Tomorrow Morning'].map((timeOpt) => (
                      <TouchableOpacity
                        key={timeOpt}
                        style={[styles.timeChip, scheduledTime === timeOpt && styles.timeChipActive]}
                        onPress={() => setScheduledTime(timeOpt)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.timeChipText, scheduledTime === timeOpt && styles.timeChipTextActive]}>
                          {timeOpt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Pickup Point Selection */}
                <View style={styles.pickupLocationRow}>
                  {['Hotel Main Grand Porch', 'North Garden Lobby', 'Executive Suite Valet'].map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      style={[styles.locChip, pickupLocation === loc && styles.locChipActive]}
                      onPress={() => setPickupLocation(loc)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.locChipText, pickupLocation === loc && styles.locChipTextActive]}>
                        📍 {loc}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 3. Guest Details */}
                <Text style={styles.sectionHeading}>3. GUEST INFORMATION</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.4 }]}>
                    <Text style={styles.inputLabel}>GUEST FULL NAME *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Mr. Alexander Wright"
                      placeholderTextColor="#64748B"
                      value={guestName}
                      onChangeText={setGuestName}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>ROOM / SUITE # *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Suite 408"
                      placeholderTextColor="#64748B"
                      value={roomNumber}
                      onChangeText={setRoomNumber}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>MOBILE PHONE / WHATSAPP</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. +91 98765 43210"
                      placeholderTextColor="#64748B"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>LUGGAGE</Text>
                    <View style={styles.luggageRow}>
                      {['No Bags', '1–2 Bags', '3+ Bags'].map((lug) => (
                        <TouchableOpacity
                          key={lug}
                          style={[styles.lugChip, luggageCount === lug && styles.lugChipActive]}
                          onPress={() => setLuggageCount(lug)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.lugChipText, luggageCount === lug && styles.lugChipTextActive]}>
                            {lug}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={[styles.inputGroup, { marginTop: 4 }]}>
                  <Text style={styles.inputLabel}>SPECIAL INSTRUCTIONS (OPTIONAL)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Need child seat, driver please meet at elevators..."
                    placeholderTextColor="#64748B"
                    value={specialInstructions}
                    onChangeText={setSpecialInstructions}
                  />
                </View>

                {/* Dispatch CTA Button */}
                <TouchableOpacity
                  style={[styles.dispatchSubmitBtn, isSubmitting && styles.dispatchSubmitBtnDisabled]}
                  onPress={handleConfirmDispatch}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#0B0F19" />
                  ) : (
                    <>
                      <Text style={styles.dispatchSubmitIcon}>🚘</Text>
                      <Text style={styles.dispatchSubmitText}>
                        Dispatch {selectedVehicle.name} to Porch
                      </Text>
                      <Text style={styles.dispatchSubmitArrow}>→</Text>
                    </>
                  )}
                </TouchableOpacity>

              </View>
            )}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 14, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: '#090D1A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#0E1424',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitles: {
    flex: 1,
    paddingRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeText: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  closeBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formContainer: {
    gap: 12,
  },
  destinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  destThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1C2336',
  },
  destDetails: {
    flex: 1,
  },
  destLabel: {
    color: '#E2C082',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  destTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  destMeta: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeading: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  fleetList: {
    gap: 8,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 10,
    padding: 9,
    gap: 10,
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'all 0.15s ease' },
    }),
  },
  vehicleCardSelected: {
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    borderColor: '#E2C082',
  },
  vehiclePhoto: {
    width: 65,
    height: 50,
    borderRadius: 7,
    backgroundColor: '#182033',
  },
  vehicleInfoCol: {
    flex: 1,
    gap: 1.5,
  },
  vehicleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleName: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  vehicleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vehicleBadgeActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.25)',
  },
  vehicleBadgeText: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '700',
  },
  vehicleBadgeTextActive: {
    color: '#E2C082',
    fontWeight: '800',
  },
  vehicleCapacity: {
    color: '#CBD5E1',
    fontSize: 9.5,
  },
  vehicleFeatures: {
    color: '#94A3B8',
    fontSize: 9,
  },
  assignedDriver: {
    color: '#64748B',
    fontSize: 8.5,
  },
  driverHighlight: {
    color: '#E2C082',
    fontWeight: '700',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#E2C082',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2C082',
  },
  timingToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  timingBtnActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    borderColor: '#E2C082',
  },
  timingBtnIcon: {
    fontSize: 18,
  },
  timingBtnTitle: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  timingBtnTitleActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  timingBtnSub: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 1,
  },
  scheduledChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  timeChipActive: {
    backgroundColor: '#E2C082',
    borderColor: '#E2C082',
  },
  timeChipText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: '#0B0F19',
    fontWeight: '800',
  },
  pickupLocationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  locChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  locChipActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderColor: '#E2C082',
  },
  locChipText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  locChipTextActive: {
    color: '#E2C082',
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    color: '#FFFFFF',
    fontSize: 12,
  },
  luggageRow: {
    flexDirection: 'row',
    gap: 6,
  },
  lugChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  lugChipActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderColor: '#E2C082',
  },
  lugChipText: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '600',
  },
  lugChipTextActive: {
    color: '#E2C082',
    fontWeight: '800',
  },
  dispatchSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2C082',
    paddingVertical: 11,
    borderRadius: 9,
    gap: 8,
    marginTop: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(226, 192, 130, 0.3)',
      },
    }),
  },
  dispatchSubmitBtnDisabled: {
    opacity: 0.6,
  },
  dispatchSubmitIcon: {
    fontSize: 14,
  },
  dispatchSubmitText: {
    color: '#0B0F19',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  dispatchSubmitArrow: {
    color: '#0B0F19',
    fontSize: 14,
    fontWeight: '900',
  },

  // ===========================================================================
  // LIVE CHAUFFEUR BOARDING PASS STYLES
  // ===========================================================================
  dispatchSuccessWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  radarIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 2,
    borderColor: '#E2C082',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  radarIcon: {
    fontSize: 26,
  },
  dispatchTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  dispatchSubtitle: {
    color: '#CBD5E1',
    fontSize: 11.5,
    textAlign: 'center',
  },
  goldText: {
    color: '#E2C082',
    fontWeight: '800',
  },
  boardingPass: {
    width: '100%',
    backgroundColor: '#0E1528',
    borderWidth: 1.5,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginTop: 6,
  },
  carHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carModelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  carPlateText: {
    color: '#E2C082',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  etaPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: '#34D399',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  etaPillText: {
    color: '#34D399',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  driverProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1,
    borderColor: '#E2C082',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: {
    fontSize: 18,
  },
  driverInfoCol: {
    flex: 1,
  },
  driverNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  driverExpText: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  verifiedShield: {
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verifiedShieldText: {
    color: '#E2C082',
    fontSize: 9,
    fontWeight: '700',
  },
  tripMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matrixItem: {
    width: '48%',
  },
  matrixLabel: {
    color: '#64748B',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  matrixValue: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  valetAssurance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 192, 130, 0.08)',
    borderRadius: 8,
    padding: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.2)',
  },
  valetIcon: {
    fontSize: 14,
  },
  valetText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 9.5,
    lineHeight: 13,
  },
  passActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  btnWhatsapp: {
    flex: 1.4,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  btnWhatsappText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  btnReturn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  btnReturnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
});
