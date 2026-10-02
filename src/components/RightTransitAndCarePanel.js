// =============================================================================
// src/components/RightTransitAndCarePanel.js
// Middle Right Column (~28%): Healthcare & Transit Hubs
// Requirements matching original design & commit 0f56733:
// 1. Vertical list
// 2. Thumbnail
// 3. Category/tag (HEALTHCARE, HOSPITAL CARE, TRANSIT HUB)
// 4. Title
// 5. Subtitle/address
// 6. Distance
// 7. Direction/action button ↗
// =============================================================================

import React, { useMemo } from 'react';
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
import { getDirectionsUrl, safeVal, HOSPITAL_FALLBACK_IMAGE } from '../data/hotelsData';

export default function RightTransitAndCarePanel({
  hotel,
  onSelectTransitItem,
}) {
  const handleOpenLink = (url) => {
    if (!url) return;
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch((err) => console.error('Error opening link:', err));
    }
  };

  const handleAction = (item) => {
    const directionsUrl = getDirectionsUrl(hotel, item);
    const link = item.websiteUrl || item.link;
    if (onSelectTransitItem) {
      onSelectTransitItem(item);
    } else if (directionsUrl) {
      handleOpenLink(directionsUrl);
    } else if (link) {
      handleOpenLink(link);
    }
  };

  // Combine Healthcare and Transit items for the Middle Right quadrant
  const combinedItems = useMemo(() => {
    const hospitals = (hotel?.nearby?.hospitals || []).map((h) => ({
      ...h,
      itemType: 'care',
      tag: h.tag || (h.isEmergency24x7 ? 'HEALTHCARE' : 'HOSPITAL CARE'),
      imageLink: h.imageLink || HOSPITAL_FALLBACK_IMAGE,
    }));

    const transit = (hotel?.nearby?.transportation || []).map((t) => ({
      ...t,
      itemType: 'transit',
      tag: t.tag || t.category || 'TRANSIT HUB',
      imageLink: t.imageLink || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
    }));

    // Interleave or list healthcare first, then transit hubs
    return [...hospitals, ...transit];
  }, [hotel]);

  const hotelCity = hotel?.city || 'Local Area';

  return (
    <View style={styles.container}>
      {/* 1. SECTION HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            🏥 HEALTHCARE & TRANSIT HUBS
          </Text>
          <Text style={styles.sectionSubtitle} numberOfLines={1}>
            {`Emergency hospitals, rapid transit & 24/7 care near ${hotelCity}`}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{combinedItems.length} Hubs</Text>
        </View>
      </View>

      {/* 2. SCROLLABLE LIST WITH THUMBNAILS & DETAILS */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={[styles.scrollContent, combinedItems.length === 0 && styles.emptyScrollContent]}
        style={styles.scrollContainer}
        scrollIndicatorInsets={{ right: 1 }}
        nestedScrollEnabled={true}
      >
        {combinedItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏥</Text>
            <Text style={styles.emptyTitle}>No healthcare or transit facilities found.</Text>
            <Text style={styles.emptySub}>
              Hospitals, clinics, and transit stations near {hotelCity} will appear once loaded.
            </Text>
          </View>
        ) : (
          combinedItems.map((item, index) => {
            const directionsUrl = getDirectionsUrl(hotel, item);
            const externalLink = item.link || item.websiteUrl;
            const imgSrc = item.imageLink || item.image || HOSPITAL_FALLBACK_IMAGE;
            const categoryTag = (item.tag || (item.itemType === 'care' ? 'HEALTHCARE' : 'TRANSIT HUB')).toUpperCase();
            const distanceText = item.distance || item.hotelDistance || item.location || 'Nearby';

            return (
              <TouchableOpacity
                key={item.id || `care-transit-${index}`}
                activeOpacity={0.82}
                onPress={() => handleAction(item)}
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
                      {categoryTag}
                    </Text>
                  </View>

                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {safeVal(item.title, 'Healthcare / Transit Station')}
                  </Text>

                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {safeVal(item.subtitle || item.description || item.notes, 'Priority emergency care & passenger transit')}
                  </Text>

                  <Text style={styles.distanceText} numberOfLines={1}>
                    {distanceText}
                  </Text>
                </View>

                {/* Right Action Button */}
                <TouchableOpacity
                  style={styles.actionCircleBtn}
                  onPress={() => {
                    if (directionsUrl) {
                      handleOpenLink(directionsUrl);
                    } else if (externalLink) {
                      handleOpenLink(externalLink);
                    } else if (onSelectTransitItem) {
                      onSelectTransitItem(item);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionArrowText}>↗</Text>
                </TouchableOpacity>
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
    color: '#E2C082',
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
  actionCircleBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionArrowText: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
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
