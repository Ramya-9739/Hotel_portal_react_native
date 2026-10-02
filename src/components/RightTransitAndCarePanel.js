// =============================================================================
// src/components/RightTransitAndCarePanel.js
// Middle Right Column (~28%): TRANSPORTATION ONLY
// Dedicated exclusively to transportation & mobility links:
// - Bus stations, metro stations, railway stations, airports, taxi/cab services
// Requirements:
// 1. Image if available
// 2. Name
// 3. Transportation type
// 4. Address
// 5. Distance
// 6. View Details
// 7. Get Directions
// NO hospitals or pharmacies here (they belong in All Curations at the bottom).
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
import { getDirectionsUrl, safeVal } from '../data/hotelsData';

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

  const handleGetDirections = (item) => {
    const directionsUrl = getDirectionsUrl(hotel, item);
    if (directionsUrl) {
      handleOpenLink(directionsUrl);
    } else if (item.link || item.websiteUrl) {
      handleOpenLink(item.link || item.websiteUrl);
    } else if (onSelectTransitItem) {
      onSelectTransitItem(item);
    }
  };

  const handleItemClick = (item) => {
    if (onSelectTransitItem) {
      onSelectTransitItem(item);
    } else {
      handleGetDirections(item);
    }
  };

  const hotelCity = hotel?.city || 'Local Area';

  return (
    <View style={styles.container}>
      {/* 1. SECTION HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            🚕 TRANSPORTATION
          </Text>
          <Text style={styles.sectionSubtitle} numberOfLines={1}>
            {`Bus stations, metro, railway, airports & cab services near ${hotelCity}`}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{transitItems.length} Links</Text>
        </View>
      </View>

      {/* 2. SCROLLABLE LIST WITH THUMBNAIL, DETAILS & ACTIONS */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={[styles.scrollContent, transitItems.length === 0 && styles.emptyScrollContent]}
        style={styles.scrollContainer}
        scrollIndicatorInsets={{ right: 1 }}
        nestedScrollEnabled={true}
      >
        {transitItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🚕</Text>
            <Text style={styles.emptyTitle}>No transportation hubs found near this hotel.</Text>
            <Text style={styles.emptySub}>
              Railway, metro, airport, and taxi services near {hotelCity} will appear once loaded.
            </Text>
          </View>
        ) : (
          transitItems.map((item, index) => {
            const imgSrc = item.imageLink || item.image || item.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80';
            const transitType = (item.type || item.tag || item.category || 'TRANSIT HUB').toUpperCase();
            const distanceText = item.distance || item.hotelDistance || item.location || 'Nearby';
            const addressText = item.address || item.location || `${hotelCity} Hub`;

            return (
              <TouchableOpacity
                key={item.id || `trans-${index}`}
                activeOpacity={0.82}
                onPress={() => handleItemClick(item)}
                style={[
                  styles.listItemRow,
                  index % 2 === 1 && styles.listItemRowAlt,
                ]}
              >
                {/* Left Thumbnail */}
                <Image
                  source={{ uri: imgSrc }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />

                {/* Middle Info */}
                <View style={styles.infoCol}>
                  <View style={styles.tagRow}>
                    <Text style={styles.categoryTagText} numberOfLines={1}>
                      {transitType}
                    </Text>
                  </View>

                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {safeVal(item.title, 'Transit Station')}
                  </Text>

                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {safeVal(addressText, 'Transit Corridor')}
                  </Text>

                  <Text style={styles.distanceText} numberOfLines={1}>
                    📍 {distanceText}
                  </Text>
                </View>

                {/* Right Action: Get Directions & View Details */}
                <View style={styles.actionsColumn}>
                  <TouchableOpacity
                    style={styles.actionCircleBtn}
                    onPress={(e) => {
                      e.stopPropagation && e.stopPropagation();
                      handleGetDirections(item);
                    }}
                    activeOpacity={0.7}
                    accessibilityLabel="Get Directions"
                  >
                    <Text style={styles.actionArrowText}>↗</Text>
                  </TouchableOpacity>
                  <Text style={styles.actionLabelSmall}>Directions</Text>
                </View>
              </TouchableOpacity>
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
    padding: 8,
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
    marginBottom: 6,
    paddingHorizontal: 2,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.12)',
  },
  headerTitleBox: {
    flex: 1,
    gap: 1,
  },
  sectionTitle: {
    color: '#F8F6F0',
    fontSize: 12,
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
    fontSize: 8.5,
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
    gap: 5,
    paddingBottom: 4,
  },
  listItemRow: {
    backgroundColor: '#151720',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      },
    }),
  },
  listItemRowAlt: {
    backgroundColor: '#181A24',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1C1F2B',
    flexShrink: 0,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 1,
    minWidth: 0,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTagText: {
    color: '#38BDF8',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  itemSubtitle: {
    color: '#94A3B8',
    fontSize: 8.5,
    lineHeight: 12,
  },
  distanceText: {
    color: '#64748B',
    fontSize: 7.5,
    fontWeight: '600',
  },
  actionsColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  actionCircleBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionArrowText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  actionLabelSmall: {
    color: '#64748B',
    fontSize: 6.5,
    fontWeight: '600',
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 26,
    color: '#64748B',
  },
  emptyTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 10.5,
    textAlign: 'center',
    lineHeight: 15,
    maxWidth: 220,
  },
});
