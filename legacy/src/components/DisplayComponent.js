// =============================================================================
// src/components/DisplayComponent.js
// Editorial Cards & List Items for Hotel Concierge Portal
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';

/**
 * Returns human-readable luxury category meta
 */
export const getCategoryMeta = (componentType, customCategory) => {
  if (customCategory) {
    return {
      label: customCategory.toUpperCase(),
      icon: '✦',
      color: '#E2C082',
    };
  }

  const type = parseInt(componentType, 10);
  switch (type) {
    case 1:
      return { label: 'RESIDENCE', icon: '✦', color: '#E2C082' };
    case 2:
    case 0:
      return { label: 'LOCAL EXCURSION', icon: '✦', color: '#E2C082' };
    case 3:
      return { label: 'SILK & WELLNESS', icon: '✦', color: '#E2C082' };
    case 4:
      return { label: 'TRANSIT & CARE', icon: '✦', color: '#E2C082' };
    case 5:
    default:
      return { label: 'GASTRONOMY', icon: '✦', color: '#E2C082' };
  }
};

export default function DisplayComponent({
  item,
  isSelected = false,
  onPress,
  mode = 'card', // 'card' | 'listItem'
  orientation = 'horizontal',
  cardWidth,
}) {
  if (!item) return null;

  const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80';
  const [imgSrc, setImgSrc] = useState(item.imageLink || DEFAULT_FALLBACK_IMAGE);

  useEffect(() => {
    setImgSrc(item.imageLink || DEFAULT_FALLBACK_IMAGE);
  }, [item.imageLink]);

  const meta = getCategoryMeta(item.componentType, item.category);

  // Distance / drive formatting
  const distanceLabel = item.driveTime
    ? `${item.driveTime} · ${item.hotelDistance || item.location || ''}`
    : item.hotelDistance || item.location || 'Local area';

  const type = parseInt(item.componentType, 10);
  const id = String(item.id || '').toLowerCase();
  const isBottomType = type >= 5 || id.includes('bottom') || id.includes('rest');
  const isExternalLink = !isBottomType && (type <= 4 || id.includes('center') || id.includes('top') || id.includes('left') || id.includes('right'));

  // ===========================================================================
  // 1. LIST ITEM MODE (For Neighborhood & Concierge Columns)
  // ===========================================================================
  if (mode === 'listItem' || orientation === 'vertical') {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => onPress && onPress(item)}
        style={[styles.listItemContainer, isSelected && styles.listItemSelected]}
      >
        <Image
          source={{ uri: imgSrc }}
          onError={() => setImgSrc(DEFAULT_FALLBACK_IMAGE)}
          style={styles.listThumbnail}
          resizeMode="cover"
        />

        <View style={styles.listInfo}>
          <View style={styles.listBadgeRow}>
            <Text style={styles.listCategoryText}>{meta.label}</Text>
            {item.likes ? (
              <Text style={styles.listLikesText}>❤️ {item.likes.toLocaleString()}</Text>
            ) : null}
            {item.rating ? (
              <Text style={styles.listRatingText}>★ {typeof item.rating === 'number' ? item.rating.toFixed(2) : item.rating}</Text>
            ) : null}
          </View>
          <Text style={styles.listTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.listSubtitle} numberOfLines={1}>
            {item.subtitle || item.shortDescription || 'Curated destination'}
          </Text>
          {item.location || item.timing ? (
            <Text style={styles.listLocationText} numberOfLines={1}>
              {item.location || item.timing}
            </Text>
          ) : null}
        </View>

        <View style={styles.listArrowWrap}>
          <Text style={styles.listArrowIcon}>
            {isExternalLink ? '↗' : '→'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // ===========================================================================
  // 2. CARD MODE (Editorial Magazine Cards for Royal Excursions & Dining)
  // Fully displays image without dark overlay cutting it in half
  // ===========================================================================
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress && onPress(item)}
      style={[
        styles.cardContainer,
        cardWidth ? { width: cardWidth } : null,
        isSelected && styles.cardSelected,
      ]}
    >
      {/* 1. Full Image Showcase Section */}
      <View style={styles.cardImageWrapper}>
        <Image
          source={{ uri: imgSrc }}
          onError={() => setImgSrc(DEFAULT_FALLBACK_IMAGE)}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* Floating Category Pill */}
        <View style={styles.categoryPill}>
          <Text style={styles.categoryPillText}>✦ {item.tag || meta.label}</Text>
        </View>

        {/* Floating Likes Pill */}
        {item.likes ? (
          <View style={styles.floatingLikesPill}>
            <Text style={styles.floatingLikesText}>
              ❤️ {item.likes >= 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
            </Text>
          </View>
        ) : item.timing ? (
          <View style={styles.timingPill}>
            <Text style={styles.timingPillText} numberOfLines={1}>
              {item.timing}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 2. Clean Dedicated Details Section */}
      <View style={styles.cardBottomArea}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.actionArrowBtn}>
            <Text style={styles.actionArrowText}>{isExternalLink ? '↗' : '→'}</Text>
          </View>
        </View>

        <View style={styles.cardDetailsRow}>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.subtitle || item.shortDescription || 'Curated local experience.'}
          </Text>
          <View style={styles.cardBadgeGroup}>
            {item.rating ? (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>★ {typeof item.rating === 'number' ? item.rating.toFixed(2) : item.rating}</Text>
              </View>
            ) : null}
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText} numberOfLines={1}>
                {distanceLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ===========================================================================
  // LIST ITEM STYLES
  // ===========================================================================
  // ===========================================================================
  // LIST ITEM STYLES
  // ===========================================================================
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16181F',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.12)',
    borderRadius: 8,
    padding: 5,
    marginBottom: 4,
    gap: 7,
    ...Platform.select({
      web: {
        transition: 'all 0.16s ease',
        cursor: 'pointer',
      },
    }),
  },
  listItemSelected: {
    borderColor: '#E2C082',
    backgroundColor: 'rgba(226, 192, 130, 0.08)',
  },
  listThumbnail: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#1A1D26',
  },
  listInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 1,
  },
  listBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listCategoryText: {
    color: '#E2C082',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  listTitle: {
    color: '#F8F6F0',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    ...Platform.select({
      web: {
        fontFamily: "'Playfair Display', Georgia, serif",
      },
    }),
  },
  listSubtitle: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '400',
  },
  listLocationText: {
    color: '#64748B',
    fontSize: 7.5,
    fontWeight: '500',
  },
  listArrowWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listArrowIcon: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '700',
  },

  // ===========================================================================
  // CARD STYLES (Clean Split Layout: Prominent Photo + Uncluttered Info)
  // ===========================================================================
  cardContainer: {
    width: 215,
    height: 116,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#16181F',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.16)',
    marginRight: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.18s ease, border-color 0.18s ease',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
      },
    }),
  },
  cardSelected: {
    borderColor: '#E2C082',
    transform: [{ scale: 1.02 }],
  },
  cardImageWrapper: {
    width: '100%',
    height: 74,
    backgroundColor: '#1A1D26',
    position: 'relative',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  categoryPill: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(15, 16, 20, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  categoryPillText: {
    color: '#E2C082',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  timingPill: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(15, 16, 20, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  timingPillText: {
    color: '#CBD5E1',
    fontSize: 7,
    fontWeight: '600',
  },
  cardBottomArea: {
    height: 42,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#111217',
    justifyContent: 'center',
    gap: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 192, 130, 0.1)',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  cardTitle: {
    flex: 1,
    color: '#F8F6F0',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    ...Platform.select({
      web: {
        fontFamily: "'Playfair Display', Georgia, serif",
      },
    }),
  },
  actionArrowBtn: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#E2C082',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionArrowText: {
    color: '#0F1014',
    fontSize: 9,
    fontWeight: '800',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  cardSubtitle: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '400',
  },
  distanceBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexShrink: 0,
  },
  distanceText: {
    color: '#CBD5E1',
    fontSize: 7,
    fontWeight: '600',
  },
  listLikesText: {
    color: '#F43F5E',
    fontSize: 7.5,
    fontWeight: '700',
    marginLeft: 6,
  },
  listRatingText: {
    color: '#FBBF24',
    fontSize: 7.5,
    fontWeight: '800',
    marginLeft: 5,
  },
  floatingLikesPill: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(15, 16, 20, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  floatingLikesText: {
    color: '#FDA4AF',
    fontSize: 7.5,
    fontWeight: '800',
  },
  cardBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  ratingBadge: {
    paddingHorizontal: 3.5,
    paddingVertical: 1,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    flexShrink: 0,
  },
  ratingBadgeText: {
    color: '#FBBF24',
    fontSize: 7,
    fontWeight: '800',
  },
});
