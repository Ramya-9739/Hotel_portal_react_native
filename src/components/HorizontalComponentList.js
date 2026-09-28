import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import DisplayComponent from './DisplayComponent';

export default function HorizontalComponentList({
  title = 'ATTRACTIONS',
  subtitle = 'Explore the best of the region',
  actionLabel = '',
  items = [],
  emptyMessage = '',
  selectedId,
  onSelectComponent,
  onViewDetails,
  onScanPress,
  filterTabs = null,
  activeTab = null,
  onTabChange = null,
  showSortControls = true,
  defaultSort = 'default',
}) {
  const scrollRef = useRef(null);
  const { width } = useWindowDimensions();

  // Responsive Card Width: Compact proportions for 5-quadrant layout
  const isDesktop = width >= 768;
  const cardWidth = isDesktop
    ? Math.max(215, Math.min(235, (width - 60) / 4.8))
    : Math.max(200, width * 0.75);

  const displayItems = items.length > 0 ? items : [];

  // Sorting state (default: 'likes' when activeTab is gyms, or defaultSort)
  const [activeSort, setActiveSort] = useState(activeTab === 'gyms' ? 'likes' : defaultSort);
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel' | 'list'

  // Sync sort when activeTab changes
  useEffect(() => {
    if (activeTab === 'gyms') {
      setActiveSort('likes');
    } else {
      setActiveSort(defaultSort);
    }
  }, [activeTab, defaultSort]);

  // Helper to extract distance as a numeric value for accurate distance sorting
  const parseDistanceNum = (item) => {
    const raw = String(item.distance || item.hotelDistance || item.location || '99');
    const match = raw.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 99;
  };

  // Compute sorted items
  const sortedItems = useMemo(() => {
    const arr = [...displayItems];
    if (activeSort === 'likes') {
      return arr.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    if (activeSort === 'rating') {
      return arr.sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
    }
    if (activeSort === 'distance') {
      return arr.sort((a, b) => parseDistanceNum(a) - parseDistanceNum(b));
    }
    return arr;
  }, [displayItems, activeSort]);

  // Scroll Tracking State
  const [scrollX, setScrollX] = useState(0);
  const [maxScrollX, setMaxScrollX] = useState(1);

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const currentX = contentOffset.x;
    setScrollX(currentX);
    const max = Math.max(1, contentSize.width - layoutMeasurement.width);
    setMaxScrollX(max);
  };

  // Scroll one viewport / 2 cards to the left
  const scrollLeft = () => {
    if (scrollRef.current) {
      const step = cardWidth * 1.8;
      const target = Math.max(0, scrollX - step);
      scrollRef.current.scrollTo({ x: target, animated: true });
    }
  };

  // Scroll one viewport / 2 cards to the right
  const scrollRight = () => {
    if (scrollRef.current) {
      const step = cardWidth * 1.8;
      const target = Math.min(maxScrollX, scrollX + step);
      scrollRef.current.scrollTo({ x: target, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header: Icon + Gold Title, Subtitle, Optional Filter Tabs, and Compact Scroll Icons */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.sectionSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {/* Optional Category Filter Tabs (For Cafes, Gyms, Takeaway, Home Delivery) */}
        {filterTabs && filterTabs.length > 0 && (
          <View style={styles.filterTabsRow}>
            {filterTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.filterTabPill, isActive && styles.filterTabPillActive]}
                  onPress={() => onTabChange && onTabChange(tab.id)}
                  activeOpacity={0.8}
                >
                  {tab.icon ? <Text style={styles.filterTabIcon}>{tab.icon}</Text> : null}
                  <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                    {tab.label} {tab.count !== undefined ? `(${tab.count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Right side: Compact Scroll Bar Icons (◀ and ▶) without taking vertical space */}
        <View style={styles.headerRightControls}>
          {actionLabel ? (
            <View style={styles.actionButton}>
              <Text style={styles.actionLabelText}>
                {actionLabel}
              </Text>
            </View>
          ) : null}

          {/* Sleek Scroll Bar Icons */}
          {viewMode === 'carousel' && (
            <View style={styles.scrollIconsGroup}>
              <TouchableOpacity
                style={styles.scrollIconButton}
                activeOpacity={0.7}
                onPress={scrollLeft}
                accessibilityLabel="Scroll Left"
              >
                <Text style={styles.scrollIconText}>‹</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.scrollIconButton}
                activeOpacity={0.7}
                onPress={scrollRight}
                accessibilityLabel="Scroll Right"
              >
                <Text style={styles.scrollIconText}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* 2. Interactive Sort & View Bar */}
      {showSortControls && filterTabs && filterTabs.length > 0 && (
        <View style={styles.sortBarRow}>
          <View style={styles.sortOptionsGroup}>
            <Text style={styles.sortLabel}>SORT BY:</Text>

            <TouchableOpacity
              style={[styles.sortPill, activeSort === 'likes' && styles.sortPillActive]}
              onPress={() => setActiveSort('likes')}
              activeOpacity={0.8}
            >
              <Text style={[styles.sortPillText, activeSort === 'likes' && styles.sortPillTextActive]}>
                ❤️ Most Likes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortPill, activeSort === 'rating' && styles.sortPillActive]}
              onPress={() => setActiveSort('rating')}
              activeOpacity={0.8}
            >
              <Text style={[styles.sortPillText, activeSort === 'rating' && styles.sortPillTextActive]}>
                ⭐ Highest Rated
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortPill, activeSort === 'distance' && styles.sortPillActive]}
              onPress={() => setActiveSort('distance')}
              activeOpacity={0.8}
            >
              <Text style={[styles.sortPillText, activeSort === 'distance' && styles.sortPillTextActive]}>
                📍 Nearest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortPill, activeSort === 'default' && styles.sortPillActive]}
              onPress={() => setActiveSort('default')}
              activeOpacity={0.8}
            >
              <Text style={[styles.sortPillText, activeSort === 'default' && styles.sortPillTextActive]}>
                ✦ Recommended
              </Text>
            </TouchableOpacity>
          </View>

          {/* View Mode Switcher: Carousel vs Ranked List */}
          <View style={styles.viewModeToggleRow}>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'carousel' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('carousel')}
              activeOpacity={0.8}
            >
              <Text style={[styles.viewModeBtnText, viewMode === 'carousel' && styles.viewModeBtnTextActive]}>
                ⇄ Carousel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewModeBtn, viewMode === 'list' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}
            >
              <Text style={[styles.viewModeBtnText, viewMode === 'list' && styles.viewModeBtnTextActive]}>
                ☰ Ranked List ({sortedItems.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. Main Content: Empty State OR Carousel View OR Ranked List View */}
      {sortedItems.length === 0 ? (
        <View style={styles.horizontalEmptyBox}>
          <Text style={styles.horizontalEmptyIcon}>✦</Text>
          <Text style={styles.horizontalEmptyTitle}>No items currently available</Text>
          <Text style={styles.horizontalEmptySubtitle}>
            {emptyMessage || 'Items for this category can be added from the Admin Dashboard.'}
          </Text>
        </View>
      ) : viewMode === 'carousel' ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          directionalLockEnabled={true}
          nestedScrollEnabled={true}
        >
          {sortedItems.map((item, index) => (
            <DisplayComponent
              key={`${item.id}-${index}`}
              item={item}
              isSelected={selectedId === item.id}
              onPress={onSelectComponent}
              mode="card"
              orientation="horizontal"
              cardWidth={cardWidth}
              onScanPress={onScanPress}
            />
          ))}
        </ScrollView>
      ) : (
        /* Ranked List View with Full Directions & Details Buttons */
        <View style={styles.rankedListContainer}>
          {sortedItems.map((item, index) => {
            const rankLabel =
              index === 0
                ? '🥇 #1'
                : index === 1
                ? '🥈 #2'
                : index === 2
                ? '🥉 #3'
                : `#${index + 1}`;

            return (
              <TouchableOpacity
                key={`${item.id}-ranked-${index}`}
                style={[styles.rankedCard, selectedId === item.id && styles.rankedCardSelected]}
                onPress={() => onSelectComponent && onSelectComponent(item)}
                activeOpacity={0.88}
              >
                {/* Thumbnail & Rank Badge */}
                <View style={styles.rankedImageWrapper}>
                  <Image
                    source={{ uri: item.imageLink || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80' }}
                    style={styles.rankedImage}
                    resizeMode="cover"
                  />
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>{rankLabel}</Text>
                  </View>
                </View>

                {/* Content Info */}
                <View style={styles.rankedContent}>
                  <View style={styles.rankedTitleRow}>
                    <Text style={styles.rankedTitle} numberOfLines={1}>
                      {item.title}
                    </Text>

                    <View style={styles.rankedMetricsGroup}>
                      {item.likes ? (
                        <View style={styles.rankedLikesPill}>
                          <Text style={styles.rankedLikesText}>
                            ❤️ {item.likes.toLocaleString()} Likes
                          </Text>
                        </View>
                      ) : null}

                      {item.rating ? (
                        <View style={styles.rankedRatingPill}>
                          <Text style={styles.rankedRatingText}>
                            ★ {typeof item.rating === 'number' ? item.rating.toFixed(2) : item.rating}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <Text style={styles.rankedSubtitle} numberOfLines={1}>
                    {item.subtitle || item.shortDescription || 'Premier fitness destination'}
                  </Text>

                  {/* Distance & Hours Line */}
                  <View style={styles.rankedMetaLine}>
                    <Text style={styles.rankedMetaDistance}>
                      📍 {item.distance || item.hotelDistance || item.location || 'Nearby'}
                    </Text>
                    <Text style={styles.rankedMetaDot}>•</Text>
                    <Text style={styles.rankedMetaTiming}>
                      🕒 {item.timing || item.timings || 'Daily Access'}
                    </Text>
                    {item.offer ? (
                      <>
                        <Text style={styles.rankedMetaDot}>•</Text>
                        <Text style={styles.rankedMetaOffer}>
                          🎟️ {item.offer}
                        </Text>
                      </>
                    ) : null}
                  </View>

                  {/* Services Chips */}
                  {Array.isArray(item.services) && item.services.length > 0 && (
                    <View style={styles.rankedServicesList}>
                      {item.services.slice(0, 4).map((srv, sIdx) => (
                        <View key={`srv-${sIdx}`} style={styles.rankedServiceTag}>
                          <Text style={styles.rankedServiceTagText}>{srv}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Quick Action Buttons: Directions & Details */}
                <View style={styles.rankedActionsCol}>
                  <TouchableOpacity
                    style={styles.rankedDirectionBtn}
                    onPress={() => onSelectComponent && onSelectComponent(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.rankedDirectionBtnIcon}>🗺️</Text>
                    <Text style={styles.rankedDirectionBtnText}>Directions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rankedDetailsBtn}
                    onPress={() => (onViewDetails ? onViewDetails(item) : onSelectComponent(item))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.rankedDetailsBtnIcon}>📖</Text>
                    <Text style={styles.rankedDetailsBtnText}>Details</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111217',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    marginVertical: 1,
    flexShrink: 0,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  titleColumn: {
    gap: 0.5,
  },
  sectionTitle: {
    color: '#F8F6F0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    ...Platform.select({
      web: {
        fontFamily: "'Playfair Display', Georgia, serif",
      },
    }),
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 8,
    marginTop: 0.5,
  },
  actionButton: {
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(226, 192, 130, 0.12)',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
  },
  actionLabelText: {
    color: '#E2C082',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scrollIconsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scrollIconButton: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
      },
    }),
  },
  scrollIconText: {
    color: '#E2C082',
    fontSize: 13,
    fontWeight: '700',
    marginTop: -1,
  },
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  filterTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterTabPillActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.18)',
    borderColor: '#E2C082',
  },
  filterTabIcon: {
    fontSize: 9.5,
  },
  filterTabText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#F8FAFC',
    fontWeight: '900',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },

  // Sort Bar & Options
  sortBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3.5,
    paddingHorizontal: 5,
    marginVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.12)',
    flexWrap: 'wrap',
    gap: 5,
  },
  sortOptionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  sortLabel: {
    color: '#E2C082',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sortPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  sortPillActive: {
    backgroundColor: 'rgba(226, 192, 130, 0.2)',
    borderColor: '#E2C082',
  },
  sortPillText: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '600',
  },
  sortPillTextActive: {
    color: '#F8F6F0',
    fontWeight: '800',
  },
  viewModeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewModeBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  viewModeBtnActive: {
    backgroundColor: '#E2C082',
    borderColor: '#E2C082',
  },
  viewModeBtnText: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '600',
  },
  viewModeBtnTextActive: {
    color: '#0F1014',
    fontWeight: '900',
  },

  // Ranked List View
  rankedListContainer: {
    paddingVertical: 4,
    gap: 4,
  },
  rankedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161822',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.16)',
    padding: 6,
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  rankedCardSelected: {
    borderColor: '#E2C082',
    backgroundColor: 'rgba(226, 192, 130, 0.08)',
  },
  rankedImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1A1D26',
    flexShrink: 0,
  },
  rankedImage: {
    width: '100%',
    height: '100%',
  },
  rankBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(15, 16, 20, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#E2C082',
  },
  rankBadgeText: {
    color: '#E2C082',
    fontSize: 7,
    fontWeight: '900',
  },
  rankedContent: {
    flex: 1,
    gap: 2,
  },
  rankedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  rankedTitle: {
    flex: 1,
    color: '#F8F6F0',
    fontSize: 11.5,
    fontWeight: '800',
    ...Platform.select({
      web: {
        fontFamily: "'Playfair Display', Georgia, serif",
      },
    }),
  },
  rankedMetricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankedLikesPill: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  rankedLikesText: {
    color: '#FDA4AF',
    fontSize: 7.5,
    fontWeight: '800',
  },
  rankedRatingPill: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  rankedRatingText: {
    color: '#FBBF24',
    fontSize: 7.5,
    fontWeight: '800',
  },
  rankedSubtitle: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '500',
  },
  rankedMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  rankedMetaDistance: {
    color: '#CBD5E1',
    fontSize: 7.5,
    fontWeight: '600',
  },
  rankedMetaDot: {
    color: '#64748B',
    fontSize: 6.5,
  },
  rankedMetaTiming: {
    color: '#38BDF8',
    fontSize: 7.5,
    fontWeight: '600',
  },
  rankedMetaOffer: {
    color: '#4ADE80',
    fontSize: 7.5,
    fontWeight: '600',
  },
  rankedServicesList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexWrap: 'wrap',
    marginTop: 1,
  },
  rankedServiceTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rankedServiceTagText: {
    color: '#A0AEC0',
    fontSize: 7,
    fontWeight: '500',
  },
  rankedActionsCol: {
    flexDirection: 'column',
    gap: 3.5,
    flexShrink: 0,
    justifyContent: 'center',
  },
  rankedDirectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2C082',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 4,
    gap: 3,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  rankedDirectionBtnIcon: {
    fontSize: 8.5,
  },
  rankedDirectionBtnText: {
    color: '#0F1014',
    fontSize: 8,
    fontWeight: '900',
  },
  rankedDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.4)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  rankedDetailsBtnIcon: {
    fontSize: 8.5,
  },
  rankedDetailsBtnText: {
    color: '#E2C082',
    fontSize: 8,
    fontWeight: '800',
  },
  horizontalEmptyBox: {
    height: 140,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 4,
    marginHorizontal: 12,
  },
  horizontalEmptyIcon: {
    fontSize: 22,
    color: '#E2C082',
    opacity: 0.7,
  },
  horizontalEmptyTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  horizontalEmptySubtitle: {
    color: '#64748B',
    fontSize: 10.5,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 15,
  },
});

