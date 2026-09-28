// =============================================================================
// src/components/VerticalComponentList.js
// Style: Art Deco Heritage meets Warm Minimalist Luxury
// Clean Vertical Column for Curated Services & Transit
// =============================================================================

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Platform,
} from 'react-native';
import DisplayComponent from './DisplayComponent';

export default function VerticalComponentList({
  title = 'SHOPPING & LIFESTYLE',
  subtitle = 'Boutiques, markets and local finds',
  items = [],
  selectedId,
  onSelectComponent,
  onScanPress,
}) {
  return (
    <View style={styles.container}>
      {/* 1. Header: Serif Title & Subtitle */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.sectionSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {/* 2. Vertical List Items */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
        scrollIndicatorInsets={{ right: 1 }}
        nestedScrollEnabled={true}
      >
        {items.map((item) => (
          <DisplayComponent
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            onPress={onSelectComponent}
            mode="listItem"
            orientation="vertical"
            onScanPress={onScanPress}
          />
        ))}
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
    borderColor: 'rgba(226, 192, 130, 0.14)',
    padding: 8,
    flexDirection: 'column',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      },
    }),
  },
  headerRow: {
    marginBottom: 6,
    gap: 2,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: '#F8F6F0',
    fontSize: 12.5,
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
    fontSize: 9,
  },
  scrollContainer: {
    flex: 1,
    paddingRight: 2,
  },
  scrollContent: {
    paddingVertical: 2,
  },
});
