// =============================================================================
// src/components/ListingCard.js
// Compact, Responsive, Production-Grade Listing Card
// Supports: Hotels, Restaurants, Gyms, Takeaway, Home Delivery
// Matches User Specifications:
// - Title, Subtitle, Type/Cuisine, Location, Distance
// - Crystal-Clear Availability ('Available' or 'Not Available')
// - Consistent aspect ratio image, compact height, responsive columns
// - Hotel-specific payment methods displayed directly on hotel cards
// =============================================================================

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';

export default function ListingCard({
  item,
  category = 'hotels',
  onPress,
}) {
  if (!item) return null;

  const isAvailable =
    item.availability === 'Available' ||
    item.status === 'Available' ||
    item.status === 'CONFIRMED' ||
    (item.availability !== 'Not Available' && item.availability !== 'Closed');

  const title = item.title || item.name || 'Listing';
  const subtitle = item.subtitle || item.cuisine || item.shortDescription || '';
  const image = item.imageLink || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';
  const location = item.location || 'Central City';
  const distance = item.distance || item.hotelDistance || '1.0 km';
  const rating = item.rating || item.customerRatings || 4.8;
  const isHotel = category === 'hotels' || item.category === 'Hotels' || item.componentType === 1;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress && onPress(item)}
      style={styles.cardContainer}
    >
      {/* 1. Controlled Image Header (Consistent Aspect Ratio) */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: image }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* Floating Category Tag (Top Left) */}
        <View style={styles.tagBadge}>
          <Text style={styles.tagBadgeText}>
            {item.tag || (isHotel ? 'HOTEL' : (item.cuisine || category.toUpperCase()))}
          </Text>
        </View>

        {/* Floating Availability Indicator (Top Right - Part 15 & 26: Available vs Not Available) */}
        <View
          style={[
            styles.availabilityBadge,
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
              styles.availabilityText,
              { color: isAvailable ? '#4ADE80' : '#FCA5A5' },
            ]}
          >
            {isAvailable ? 'Available' : 'Not Available'}
          </Text>
        </View>
      </View>

      {/* 2. Compact Body Info */}
      <View style={styles.cardBody}>
        {/* Title & Rating */}
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.ratingPill}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingScore}>{Number(rating).toFixed(1)}</Text>
          </View>
        </View>

        {/* Subtitle / Cuisine */}
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>

        {/* Location & Distance */}
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {location} • <Text style={styles.distanceHighlight}>{distance}</Text>
          </Text>
        </View>

        {/* 3. Category-Specific Highlights */}
        {isHotel ? (
          // Hotel-Specific Information (Part 5 & Part 8: Hotel Payment Methods)
          <View style={styles.metaRow}>
            {item.pricePerNight ? (
              <Text style={styles.priceTag}>{item.pricePerNight}</Text>
            ) : null}
            {Array.isArray(item.paymentMethods) && item.paymentMethods.length > 0 ? (
              <View style={styles.paymentChips}>
                <Text style={styles.paymentLabel}>💳 </Text>
                <Text style={styles.paymentText} numberOfLines={1}>
                  {item.paymentMethods.slice(0, 3).join(', ')}
                  {item.paymentMethods.length > 3 ? ` +${item.paymentMethods.length - 3}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        ) : category === 'restaurants' ? (
          // Restaurant Highlights: Takeaway / Delivery
          <View style={styles.metaRow}>
            <View style={styles.servicePill}>
              <Text style={styles.servicePillText}>
                Takeaway: {item.takeaway ? '✓ YES' : '✗ NO'}
              </Text>
            </View>
            <View style={styles.servicePill}>
              <Text style={styles.servicePillText}>
                Delivery: {item.homeDelivery ? '✓ YES' : '✗ NO'}
              </Text>
            </View>
          </View>
        ) : category === 'gyms' ? (
          // Gym Highlights: Hours & Facilities
          <View style={styles.metaRow}>
            <Text style={styles.gymHoursText} numberOfLines={1}>
              ⏱️ {item.timings || '6:00 AM - 10:00 PM'}
            </Text>
          </View>
        ) : category === 'takeaway' ? (
          // Takeaway Highlights
          <View style={styles.metaRow}>
            <View style={styles.takeawayPill}>
              <Text style={styles.takeawayPillText}>
                🥡 {item.takeawayStatus || item.takeawayTime || '15 mins ready'}
              </Text>
            </View>
          </View>
        ) : (
          // Home Delivery Highlights
          <View style={styles.metaRow}>
            <Text style={styles.deliveryInfoText} numberOfLines={1}>
              🛵 {item.deliveryTime || '30 mins'} • {item.deliveryFee || 'Free Delivery'}
            </Text>
          </View>
        )}

        {/* 4. Action Button: View Details */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.detailsBtn}
            activeOpacity={0.8}
            onPress={() => onPress && onPress(item)}
          >
            <Text style={styles.detailsBtnText}>View Details</Text>
            <Text style={styles.detailsBtnArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0D1322',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 10,
    ...Platform.select({
      web: {
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
      },
    }),
  },
  imageWrapper: {
    width: '100%',
    height: 136, // Controlled height (not oversized, compact)
    backgroundColor: '#1E293B',
    position: 'relative',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(7, 10, 18, 0.78)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
  },
  tagBadgeText: {
    color: '#E2C082',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  availabilityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  availGreen: {
    backgroundColor: 'rgba(20, 83, 45, 0.85)',
    borderColor: '#22C55E',
  },
  availRed: {
    backgroundColor: 'rgba(127, 29, 29, 0.85)',
    borderColor: '#EF4444',
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardBody: {
    padding: 10,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    gap: 2,
  },
  ratingStar: {
    color: '#F59E0B',
    fontSize: 10,
  },
  ratingScore: {
    color: '#FCD34D',
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '400',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  locationIcon: {
    fontSize: 10,
  },
  locationText: {
    color: '#CBD5E1',
    fontSize: 10.5,
    fontWeight: '500',
  },
  distanceHighlight: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  priceTag: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '800',
  },
  paymentChips: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  paymentLabel: {
    fontSize: 10,
  },
  paymentText: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '600',
  },
  servicePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  servicePillText: {
    color: '#E2E8F0',
    fontSize: 9.5,
    fontWeight: '600',
  },
  gymHoursText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
  },
  takeawayPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  takeawayPillText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  deliveryInfoText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 6,
  },
  detailsBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    borderRadius: 6,
    paddingVertical: 5.5,
    gap: 5,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      },
    }),
  },
  detailsBtnText: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  detailsBtnArrow: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '900',
  },
});
