// =============================================================================
// src/components/SimpleShoppingList.js
// Clean, Lightweight List-Style Presentation WITHOUT Large Images
// Requirements:
// 1. Title
// 2. Subtitle
// 3. Likes / Rating
// 4. Distance
// 5. Website link
// 6. Turn-by-turn driving directions from current hotel
// =============================================================================

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { getDirectionsUrl, safeVal } from '../data/hotelsData';

export default function SimpleShoppingList({
  title = '🛍️ SHOPPING & MALLS',
  subtitle = 'Premier retail destinations & lifestyle malls',
  items = [],
  hotel,
  onSelectItem,
}) {
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
      {/* 1. SECTION HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.sectionSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{items.length} Places</Text>
        </View>
      </View>

      {/* 2. SCROLLABLE CLEAN LIST WITHOUT LARGE IMAGES */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={[styles.scrollContent, items.length === 0 && styles.emptyScrollContent]}
        style={styles.scrollContainer}
        scrollIndicatorInsets={{ right: 1 }}
        nestedScrollEnabled={true}
      >
        {items.length === 0 ? (
          <View style={styles.shoppingEmptyBox}>
            <Text style={styles.shoppingEmptyIcon}>🛍️</Text>
            <Text style={styles.shoppingEmptyTitle}>No shopping destinations found near this hotel.</Text>
            <Text style={styles.shoppingEmptySub}>
              Real shopping malls and retail centers near {hotel?.city || 'this location'} will appear once loaded.
            </Text>
          </View>
        ) : (
          items.map((item, index) => {
            const directionsUrl = getDirectionsUrl(hotel, item);
          const websiteUrl = item.websiteUrl || item.link;

          return (
            <View
              key={item.id || `shop-${index}`}
              style={[
                styles.listItemRow,
                index % 2 === 1 && styles.listItemRowAlt,
              ]}
            >
              {/* Category Tag + Store Badge */}
              <View style={styles.itemTopRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {safeVal(item.category || item.tag, 'SHOPPING').toUpperCase()}
                  </Text>
                </View>
                {item.storeCount ? (
                  <Text style={styles.storeCountText}>{item.storeCount}</Text>
                ) : null}
              </View>

              {/* Title & Subtitle */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSelectItem && onSelectItem(item)}
              >
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {safeVal(item.title, 'Shopping Venue')}
                </Text>
              </TouchableOpacity>

              <Text style={styles.itemSubtitle} numberOfLines={2}>
                {safeVal(item.subtitle || item.description, 'Premier retail experience')}
              </Text>

              {/* Metadata Row: Rating, Likes, Distance */}
              <View style={styles.metaRow}>
                {item.rating ? (
                  <View style={styles.metaPill}>
                    <Text style={styles.ratingText}>★ {item.rating}</Text>
                  </View>
                ) : null}

                {item.likes ? (
                  <View style={styles.metaPill}>
                    <Text style={styles.likesText}>❤️ {item.likes.toLocaleString()}</Text>
                  </View>
                ) : null}

                <View style={styles.metaPill}>
                  <Text style={styles.distanceText}>
                    📍 {safeVal(item.distance || item.hotelDistance, 'Nearby')}
                  </Text>
                </View>

                {item.openingHours ? (
                  <Text style={styles.hoursText} numberOfLines={1}>
                    🕒 {item.openingHours}
                  </Text>
                ) : null}
              </View>

              {/* Action Buttons: Website + Directions */}
              <View style={styles.actionsRow}>
                {websiteUrl ? (
                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={() => handleOpenLink(websiteUrl)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnSecondaryText}>🌐 Website ↗</Text>
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
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.12)',
  },
  headerTitleBox: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    color: '#F8F6F0',
    fontSize: 13,
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
    fontSize: 9.5,
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
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'column',
    gap: 8,
    paddingBottom: 4,
  },
  listItemRow: {
    backgroundColor: '#151720',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    flexDirection: 'column',
    gap: 4,
    ...Platform.select({
      web: {
        transition: 'all 0.15s ease',
      },
    }),
  },
  listItemRowAlt: {
    backgroundColor: '#181A24',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  categoryBadgeText: {
    color: '#E2C082',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  storeCountText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  itemSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metaPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingText: {
    color: '#F4DC9E',
    fontSize: 9.5,
    fontWeight: '700',
  },
  likesText: {
    color: '#F87171',
    fontSize: 9.5,
    fontWeight: '600',
  },
  distanceText: {
    color: '#CBD5E1',
    fontSize: 9.5,
    fontWeight: '600',
  },
  hoursText: {
    color: '#64748B',
    fontSize: 9,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(226, 192, 130, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.25)',
    borderRadius: 5,
    paddingVertical: 4.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '700',
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#E2C082',
    borderRadius: 5,
    paddingVertical: 4.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    color: '#0D0E12',
    fontSize: 10,
    fontWeight: '800',
  },
  disabledBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 5,
    paddingVertical: 4.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtnText: {
    color: '#475569',
    fontSize: 9.5,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  shoppingEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 6,
  },
  shoppingEmptyIcon: {
    fontSize: 26,
    color: '#64748B',
  },
  shoppingEmptyTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  shoppingEmptySub: {
    color: '#64748B',
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 15,
    maxWidth: 220,
  },
});
