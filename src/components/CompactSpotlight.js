// =============================================================================
// src/components/CompactSpotlight.js
// Compact Hotel Spotlight Component (~200px height on desktop)
// Solves Part 1 UI problem (Takes too much space) by replacing giant 400px+ hero
// with a clean, information-dense, luxury card.
// Displays hotel-specific accepted payment methods and real-time availability.
// =============================================================================

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Linking,
} from 'react-native';

export default function CompactSpotlight({
  hotel,
  onViewDetails,
  onBookNow,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  if (!hotel) return null;

  const title = hotel.title || hotel.name || 'Active Hotel';
  const subtitle = hotel.subtitle || 'Hotel & Guest Services';
  const location = hotel.location || hotel.address || hotel.city || '';
  const distance = hotel.distance || '';
  const rating = hotel.rating || hotel.customerRatings || 5.0;
  const image = hotel.imageLink || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
  const price = hotel.pricePerNight || '';
  const isAvailable = hotel.availability === 'Available' || !hotel.availability;
  const paymentMethods = Array.isArray(hotel.paymentMethods) && hotel.paymentMethods.length > 0
    ? hotel.paymentMethods
    : ['UPI', 'Credit Card', 'Debit Card', 'Cash'];

  const handleOpenWebsite = () => {
    const url = hotel.externalUrl || hotel.websiteUrl || (hotel.latitude && hotel.longitude ? `https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}` : `https://www.google.com/search?q=${encodeURIComponent(title)}`);
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch((err) => console.error('Failed to open external url:', err));
    }
  };

  return (
    <View style={styles.spotlightWrapper}>
      {/* Small Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.crownIcon}>👑</Text>
          <Text style={styles.spotlightBadgeText}>SIGNATURE HOTEL SPOTLIGHT</Text>
          <Text style={styles.badgeSub}>• Featured Experience</Text>
        </View>

        <TouchableOpacity
          style={styles.websiteLink}
          onPress={handleOpenWebsite}
          activeOpacity={0.8}
        >
          <Text style={styles.websiteLinkText}>🔗 Official Website ↗</Text>
        </TouchableOpacity>
      </View>

      {/* Main Split Content Card */}
      <View style={[styles.card, !isDesktop && styles.cardMobile]}>
        {/* Left: Controlled 16:9 Image */}
        <View style={[styles.imageContainer, !isDesktop && styles.imageContainerMobile]}>
          <Image
            source={{ uri: image }}
            style={styles.hotelImage}
            resizeMode="cover"
          />
          {/* Availability Floating Badge */}
          <View
            style={[
              styles.availBadge,
              isAvailable ? styles.availGreen : styles.availRed,
            ]}
          >
            <View
              style={[
                styles.availDot,
                { backgroundColor: isAvailable ? '#22C55E' : '#EF4444' },
              ]}
            />
            <Text
              style={[
                styles.availText,
                { color: isAvailable ? '#4ADE80' : '#FCA5A5' },
              ]}
            >
              {isAvailable ? 'Available' : 'Not Available'}
            </Text>
          </View>
        </View>

        {/* Right: Rich Information Details */}
        <View style={styles.infoContainer}>
          {/* Row 1: Title & Rating & Price */}
          <View style={styles.rowBetween}>
            <View style={styles.titleCol}>
              <Text style={styles.hotelTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.hotelSub} numberOfLines={1}>
                {subtitle} • <Text style={styles.locationText}>{location} ({distance})</Text>
              </Text>
            </View>

            <View style={styles.priceCol}>
              <Text style={styles.priceValue}>{price}</Text>
              <Text style={styles.pricePer}>per night</Text>
            </View>
          </View>

          {/* Row 2: Hotel-Specific Payment Methods */}
          <View style={styles.paymentsRow}>
            <Text style={styles.paymentsLabel}>💳 Accepted Payments:</Text>
            <View style={styles.paymentChips}>
              {paymentMethods.map((pm, idx) => (
                <View key={`spot-pm-${idx}`} style={styles.pmChip}>
                  <Text style={styles.pmChipText}>{pm}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Row 3: Amenities & Actions */}
          <View style={styles.bottomRow}>
            {/* Amenities Chips */}
            <View style={styles.amenitiesList}>
              <Text style={styles.amenityItem}>🛏️ Palace / Garden View</Text>
              <Text style={styles.amenityDot}>•</Text>
              <Text style={styles.amenityItem}>🍽️ 9 Fine Dining</Text>
              <Text style={styles.amenityDot}>•</Text>
              <Text style={styles.amenityItem}>💆 Luxury Spa</Text>
              <Text style={styles.amenityDot}>•</Text>
              <Text style={styles.amenityItem}>🏊 Pool</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsGroup}>
              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => onViewDetails && onViewDetails(hotel)}
                activeOpacity={0.8}
              >
                <Text style={styles.detailsBtnText}>View Details →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => onBookNow && onBookNow(hotel)}
                activeOpacity={0.8}
              >
                <Text style={styles.bookBtnText}>🛎️ Reserve Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spotlightWrapper: {
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.28)',
    padding: 12,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
      },
    }),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  crownIcon: {
    fontSize: 16,
  },
  spotlightBadgeText: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  badgeSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  websiteLink: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
  },
  websiteLinkText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  cardMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  imageContainer: {
    width: 220,
    height: 125,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  imageContainerMobile: {
    width: '100%',
    height: 160,
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  availBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  availGreen: {
    backgroundColor: 'rgba(7, 20, 14, 0.88)',
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  availRed: {
    backgroundColor: 'rgba(28, 10, 10, 0.88)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availText: {
    fontSize: 10,
    fontWeight: '800',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    marginRight: 10,
  },
  hotelTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  hotelSub: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 2,
  },
  locationText: {
    color: '#94A3B8',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceValue: {
    color: '#E2C082',
    fontSize: 17,
    fontWeight: '900',
  },
  pricePer: {
    color: '#94A3B8',
    fontSize: 10,
  },
  paymentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  paymentsLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  paymentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  pmChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pmChipText: {
    color: '#E2E8F0',
    fontSize: 10.5,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  amenitiesList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  amenityItem: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  amenityDot: {
    color: '#475569',
    fontSize: 10,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  detailsBtnText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  bookBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#E2C082',
    borderRadius: 8,
  },
  bookBtnText: {
    color: '#070A12',
    fontSize: 11,
    fontWeight: '900',
  },
});
