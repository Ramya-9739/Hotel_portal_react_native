// =============================================================================
// src/components/IndiaTouristDirectoryModal.js
// Centralized India-Wide Global Tourist Destinations Directory Modal
// Provides safe, read-only public browsing of Super Admin curated destinations across India.
// =============================================================================

import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';

import LucideIcon from './LucideIcon';
import { openMapLink } from '../data/hotelsData';

const DEFAULT_DEST_IMAGE =
  'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80';

export default function IndiaTouristDirectoryModal({
  visible = false,
  destinations = [],
  hotel = null,
  onClose,
  onSelectDestination,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Compute available states and categories from current dataset
  const availableStates = useMemo(() => {
    const states = new Set();
    destinations.forEach((d) => {
      if (d.state && d.state.trim()) states.add(d.state.trim());
    });
    return ['all', ...Array.from(states).sort()];
  }, [destinations]);

  const availableCategories = useMemo(() => {
    const cats = new Set();
    destinations.forEach((d) => {
      if (d.category && d.category.trim()) cats.add(d.category.trim());
    });
    return ['all', ...Array.from(cats).sort()];
  }, [destinations]);

  // Filter destinations
  const filteredList = useMemo(() => {
    return destinations.filter((dest) => {
      if (!dest.isActive && dest.isActive !== undefined) return false;

      if (selectedState !== 'all' && (dest.state || '').toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }
      if (selectedCategory !== 'all' && (dest.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const name = (dest.name || '').toLowerCase();
        const city = (dest.city || '').toLowerCase();
        const state = (dest.state || '').toLowerCase();
        const desc = (dest.description || '').toLowerCase();
        const addr = (dest.address || '').toLowerCase();
        return name.includes(q) || city.includes(q) || state.includes(q) || desc.includes(q) || addr.includes(q);
      }

      return true;
    });
  }, [destinations, selectedState, selectedCategory, searchQuery]);

  const handleOpenMap = (dest) => {
    let url = '';
    if (dest.latitude != null && dest.longitude != null) {
      url = `https://www.google.com/maps/search/?api=1&query=${dest.latitude},${dest.longitude}`;
    } else {
      const q = encodeURIComponent(`${dest.name}, ${dest.city || ''}, ${dest.state || ''}, India`);
      url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    }
    openMapLink(url);
  };

  const handleOpenDirections = (dest) => {
    let destParam = '';
    if (dest.latitude != null && dest.longitude != null) {
      destParam = `${dest.latitude},${dest.longitude}`;
    } else {
      destParam = encodeURIComponent(`${dest.name}, ${dest.city || ''}, ${dest.state || ''}`);
    }

    let originParam = '';
    if (hotel?.latitude != null && hotel?.longitude != null) {
      originParam = `${hotel.latitude},${hotel.longitude}`;
    } else if (hotel?.hotelAddress || hotel?.city) {
      originParam = encodeURIComponent(`${hotel.hotelName || ''}, ${hotel.hotelAddress || hotel.city || ''}`);
    }

    const url = originParam
      ? `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=driving`
      : `https://www.google.com/maps/dir/?api=1&destination=${destParam}`;

    openMapLink(url);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, isDesktop ? styles.desktopModal : styles.mobileModal]}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <LucideIcon name="map-pin" size={18} color="#C5A46D" />
                <Text style={styles.headerTitle}>GLOBAL TOURIST DESTINATIONS DIRECTORY</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {filteredList.length} Destinations • India-Wide
                  </Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>
                Super Admin verified national heritage, royal sanctuaries, and excursions across India.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityLabel="Close Directory"
            >
              <LucideIcon name="x" size={18} color="#F2EFE8" />
            </TouchableOpacity>
          </View>

          {/* Search & Filter Bar */}
          <View style={styles.filtersBar}>
            {/* Search Input */}
            <View style={styles.searchBox}>
              <LucideIcon name="search" size={14} color="#807E78" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search destinations by name, city, state, or heritage..."
                placeholderTextColor="#807E78"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <LucideIcon name="x" size={12} color="#807E78" />
                </TouchableOpacity>
              )}
            </View>

            {/* State Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillsScroll}
              contentContainerStyle={styles.pillsScrollInner}
            >
              {availableStates.map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.pillBtn, selectedState === st && styles.pillBtnActive]}
                  onPress={() => setSelectedState(st)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, selectedState === st && styles.pillTextActive]}>
                    {st === 'all' ? 'All States' : st}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillsScroll}
              contentContainerStyle={styles.pillsScrollInner}
            >
              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pillBtn, selectedCategory === cat && styles.pillBtnActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, selectedCategory === cat && styles.pillTextActive]}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Destinations Scroll Area */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyScrollInner}
            showsVerticalScrollIndicator={true}
          >
            {filteredList.length === 0 ? (
              <View style={styles.emptyBox}>
                <LucideIcon name="map-pin" size={36} color="#807E78" />
                <Text style={styles.emptyTitle}>No Destinations Found</Text>
                <Text style={styles.emptyText}>
                  Try selecting &quot;All States&quot; or clearing your search query to see more attractions across India.
                </Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {filteredList.map((dest) => (
                  <View key={dest.destinationId || dest._id} style={styles.destCard}>
                    <Image
                      source={{ uri: dest.imageLink || DEFAULT_DEST_IMAGE }}
                      style={styles.destCardImage}
                    />
                    <View style={styles.destCardBody}>
                      {/* Category & State Pills */}
                      <View style={styles.cardTagsRow}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>
                            {dest.category || 'Attraction'}
                          </Text>
                        </View>
                        <View style={styles.locationBadge}>
                          <LucideIcon name="map-pin" size={10} color="#C5A46D" />
                          <Text style={styles.locationBadgeText}>
                            {dest.city ? `${dest.city}, ${dest.state}` : dest.state}
                          </Text>
                        </View>
                      </View>

                      {/* Title */}
                      <Text style={styles.destCardTitle} numberOfLines={2}>
                        {dest.name}
                      </Text>

                      {/* Timings & Entry */}
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <LucideIcon name="clock" size={11} color="#C5A46D" />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {dest.timings || 'Open Daily'}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <LucideIcon name="dollar-sign" size={11} color="#C5A46D" />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {dest.entryFee || 'Verified'}
                          </Text>
                        </View>
                      </View>

                      {/* Description */}
                      {Boolean(dest.description) && (
                        <Text style={styles.destCardDesc} numberOfLines={3}>
                          {dest.description}
                        </Text>
                      )}

                      {/* Address */}
                      {Boolean(dest.address) && (
                        <Text style={styles.destCardAddress} numberOfLines={1}>
                          📍 {dest.address}
                        </Text>
                      )}

                      {/* Actions */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.actionMapBtn}
                          onPress={() => handleOpenMap(dest)}
                          activeOpacity={0.8}
                        >
                          <LucideIcon name="map-pin" size={11} color="#101114" />
                          <Text style={styles.actionMapBtnText}>View Map ↗</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionDirBtn}
                          onPress={() => handleOpenDirections(dest)}
                          activeOpacity={0.8}
                        >
                          <LucideIcon name="compass" size={11} color="#C5A46D" />
                          <Text style={styles.actionDirBtnText}>Directions ↗</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#15161A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.3)',
    overflow: 'hidden',
    flexDirection: 'column',
    maxHeight: '92%',
  },
  desktopModal: {
    width: '90%',
    maxWidth: 1100,
    height: '88%',
  },
  mobileModal: {
    width: '100%',
    height: '92%',
  },
  headerBar: {
    backgroundColor: '#1C1D21',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 164, 109, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    color: '#F2EFE8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  countBadge: {
    backgroundColor: 'rgba(197, 164, 109, 0.15)',
    borderColor: 'rgba(197, 164, 109, 0.35)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: '#C5A46D',
    fontSize: 10,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2B31',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  filtersBar: {
    backgroundColor: '#101114',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#24252B',
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1D21',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2B31',
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F2EFE8',
    fontSize: 12.5,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  pillsScroll: {
    flexGrow: 0,
  },
  pillsScrollInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillBtn: {
    backgroundColor: '#1C1D21',
    borderWidth: 1,
    borderColor: '#2A2B31',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  pillBtnActive: {
    backgroundColor: 'rgba(197, 164, 109, 0.18)',
    borderColor: '#C5A46D',
  },
  pillText: {
    color: '#A5A39D',
    fontSize: 10.5,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#F2EFE8',
    fontWeight: '700',
  },
  bodyScroll: {
    flex: 1,
    backgroundColor: '#101114',
  },
  bodyScrollInner: {
    padding: 16,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    color: '#F2EFE8',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: '#807E78',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 400,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  destCard: {
    flexBasis: '100%',
    backgroundColor: '#191B20',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.16)',
    overflow: 'hidden',
    marginBottom: 8,
    ...Platform.select({
      web: {
        width: 'calc(50% - 7px)',
        flexBasis: 'calc(50% - 7px)',
      },
    }),
  },
  destCardImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#2A2B31',
  },
  destCardBody: {
    padding: 12,
    gap: 6,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: 'rgba(197, 164, 109, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: '#C5A46D',
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationBadgeText: {
    color: '#A5A39D',
    fontSize: 10.5,
    fontWeight: '600',
  },
  destCardTitle: {
    color: '#F2EFE8',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#C5A46D',
    fontSize: 10,
    fontWeight: '600',
  },
  destCardDesc: {
    color: '#94A3B8',
    fontSize: 10.5,
    lineHeight: 15,
  },
  destCardAddress: {
    color: '#807E78',
    fontSize: 9.5,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionMapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C5A46D',
    borderRadius: 6,
    paddingVertical: 7,
    gap: 5,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  actionMapBtnText: {
    color: '#101114',
    fontSize: 10.5,
    fontWeight: '800',
  },
  actionDirBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#24252B',
    borderWidth: 1,
    borderColor: 'rgba(197, 164, 109, 0.3)',
    borderRadius: 6,
    paddingVertical: 7,
    gap: 5,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  actionDirBtnText: {
    color: '#C5A46D',
    fontSize: 10.5,
    fontWeight: '700',
  },
});

