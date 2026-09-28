// =============================================================================
// src/components/WeatherConciergeBar.js
// Luxury Weather & Smart Time-of-Day AI Concierge Ambience Bar
// Features live temperature, sunset indicator, dynamic smart recommendations,
// and quick multi-language internationalization selector.
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LANGUAGES, TRANSLATIONS } from '../data/translations';

export default function WeatherConciergeBar({
  currentLanguage = 'en',
  onLanguageChange,
}) {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  // Determine recommendation period based on local clock hour
  const [period, setPeriod] = useState('evening'); // 'morning' | 'afternoon' | 'evening' | 'night'

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      setPeriod('morning');
    } else if (hour >= 12 && hour < 17) {
      setPeriod('afternoon');
    } else if (hour >= 17 && hour < 20) {
      setPeriod('evening');
    } else {
      setPeriod('night');
    }
  }, []);

  const getRecommendationText = () => {
    switch (period) {
      case 'morning':
        return t.recommendationMorning;
      case 'afternoon':
        return t.recommendationAfternoon;
      case 'evening':
        return t.recommendationEvening;
      case 'night':
      default:
        return t.recommendationNight;
    }
  };

  return (
    <View style={styles.barContainer}>
      {/* Left: Atmospheric Weather & Sunset Indicators */}
      <View style={styles.weatherLeft}>
        <View style={styles.weatherItem}>
          <Text style={styles.weatherIcon}>☀️</Text>
          <Text style={styles.tempText}>29°C</Text>
          <Text style={styles.weatherCondition}>{t.weatherSunny}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.breezeItem}>
          <Text style={styles.breezeIcon}>🌊</Text>
          <Text style={styles.breezeText}>{t.weatherBreeze}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.sunsetItem}>
          <Text style={styles.sunsetIcon}>🌇</Text>
          <Text style={styles.sunsetText}>{t.sunsetAt}</Text>
        </View>
      </View>

      {/* Center: Smart Time-of-Day Concierge Tip Pill */}
      <View style={styles.recommendationPill}>
        <Text style={styles.recommendationText} numberOfLines={1}>
          {getRecommendationText()}
        </Text>
      </View>

      {/* Right: Multi-Language Selector Pills */}
      <View style={styles.langSelectorRow}>
        {LANGUAGES.map((lang) => {
          const isSelected = currentLanguage === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              activeOpacity={0.75}
              onPress={() => onLanguageChange && onLanguageChange(lang.code)}
              style={[styles.langBtn, isSelected && styles.langBtnActive]}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={[styles.langText, isSelected && styles.langTextActive]}>
                {lang.code.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11, 14, 22, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 3.5,
    flexWrap: 'nowrap',
    gap: 8,
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherIcon: {
    fontSize: 12,
  },
  tempText: {
    color: '#FDE68A',
    fontSize: 10.5,
    fontWeight: '800',
  },
  weatherCondition: {
    color: '#94A3B8',
    fontSize: 9.5,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  breezeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...Platform.select({
      default: {},
    }),
  },
  breezeIcon: {
    fontSize: 11,
  },
  breezeText: {
    color: '#BAE6FD',
    fontSize: 9.5,
    fontWeight: '600',
  },
  sunsetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sunsetIcon: {
    fontSize: 11,
  },
  sunsetText: {
    color: '#FBBF24',
    fontSize: 9.5,
    fontWeight: '600',
  },
  recommendationPill: {
    flex: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationText: {
    color: '#C7D2FE',
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  langSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 3,
  },
  langBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: 'rgba(129, 140, 248, 0.55)',
  },
  langFlag: {
    fontSize: 9.5,
  },
  langText: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '700',
  },
  langTextActive: {
    color: '#FFFFFF',
  },
});
