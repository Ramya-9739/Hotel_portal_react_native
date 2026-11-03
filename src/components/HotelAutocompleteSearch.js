// =============================================================================
// src/components/HotelAutocompleteSearch.js
// Google-Style Live Hotel Autocomplete Search Component
// Dual Source:
//   Source 1: Registered Hotels (MongoDB) - hotels already in database
//   Source 2: Discover Hotels (Google Places API) - external discovery
//
// Features:
//   - Real-time suggestions while typing (>= 2 characters)
//   - 300ms debounce delay
//   - Request cancellation via AbortController & sequence ID
//   - Two clearly labelled sections (Registered vs Discover)
//   - Keyboard accessibility (ArrowUp, ArrowDown, Enter, Escape)
//   - Click-outside and Escape to close
//   - Highlights matching search tokens in gold
//   - Prevents duplicate hotel registrations
//   - Luxury dark-and-gold aesthetic matching Hotel Portal
// =============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { apiService } from '../services/apiService';

/**
 * Text highlighter helper: highlights matched query tokens in gold
 */
const HighlightedText = ({ text, query, baseStyle, highlightStyle }) => {
  if (!text) return null;
  const trimmed = (query || '').trim();
  if (!trimmed || trimmed.length < 2) {
    return <Text style={baseStyle}>{text}</Text>;
  }

  // Tokenize query words
  const tokens = trimmed
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (tokens.length === 0) {
    return <Text style={baseStyle}>{text}</Text>;
  }

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text style={baseStyle}>
      {parts.map((part, idx) => {
        const isMatch = regex.test(part);
        regex.lastIndex = 0;
        return isMatch ? (
          <Text key={idx} style={highlightStyle}>
            {part}
          </Text>
        ) : (
          <Text key={idx}>{part}</Text>
        );
      })}
    </Text>
  );
};

export default function HotelAutocompleteSearch({
  onSelectHotel,
  placeholder = 'Type hotel name, city, or address (e.g. Taj, Mango, Emerald, Bengaluru)...',
  maxSuggestions = 8,
  containerStyle,
}) {
  const [query, setQuery] = useState('');
  const [registeredHotels, setRegisteredHotels] = useState([]);
  const [discoveredHotels, setDiscoveredHotels] = useState([]);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(true);
  const [googleNoticeMessage, setGoogleNoticeMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // References for debouncing, sequence tracking, and cancellation
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const latestRequestIdRef = useRef(0);
  const lastExecutedQueryRef = useRef('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Close dropdown on click outside (Web support)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleClickOutside = (e) => {
        if (containerRef.current) {
          const domNode = containerRef.current;
          if (domNode && typeof domNode.contains === 'function') {
            if (!domNode.contains(e.target)) {
              setIsOpen(false);
              setHighlightedIndex(-1);
            }
          }
        }
      };

      document.addEventListener('pointerdown', handleClickOutside);
      return () => {
        document.removeEventListener('pointerdown', handleClickOutside);
      };
    }
  }, []);

  // Global escape key listener (Web)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleGlobalKeyDown = (e) => {
        if (e.key === 'Escape' && isOpen) {
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
      };

      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => {
        window.removeEventListener('keydown', handleGlobalKeyDown);
      };
    }
  }, [isOpen]);

  // Combined flat list for unified keyboard navigation
  const allNavigableItems = [
    ...registeredHotels.map((h) => ({ ...h, _section: 'registered' })),
    ...discoveredHotels.map((h) => ({ ...h, _section: 'discovered' })),
  ];

  // Core dual-source search fetcher
  const fetchSuggestions = useCallback(
    async (searchTerm) => {
      const trimmed = (searchTerm || '').trim();

      // Start fetching only after user enters at least 2 characters
      if (trimmed.length < 2) {
        setRegisteredHotels([]);
        setDiscoveredHotels([]);
        setIsOpen(false);
        setError(null);
        setIsLoading(false);
        setHasSearched(false);
        return;
      }

      // Prevent duplicate API requests if query is unchanged
      if (trimmed === lastExecutedQueryRef.current && (registeredHotels.length > 0 || discoveredHotels.length > 0)) {
        setIsOpen(true);
        return;
      }

      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const requestId = ++latestRequestIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        // Concurrently query both Source 1 (MongoDB) and Source 2 (Google Places API)
        const [mongoRes, discoverRes] = await Promise.all([
          apiService.searchHotels(trimmed, {
            limit: maxSuggestions,
            signal: controller.signal,
          }),
          apiService.discoverHotels(trimmed, {
            limit: maxSuggestions,
            signal: controller.signal,
          }),
        ]);

        // Ensure this response matches the most recent request
        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        if (mongoRes?.aborted || discoverRes?.aborted) {
          return;
        }

        // Process MongoDB Registered Hotels
        const regList = (mongoRes && mongoRes.success && Array.isArray(mongoRes.data)) ? mongoRes.data : [];
        setRegisteredHotels(regList);

        // Process Google Places Discovered Hotels
        if (discoverRes && discoverRes.success) {
          setIsGoogleConfigured(discoverRes.configured !== false);
          setGoogleNoticeMessage(discoverRes.message || '');
          setDiscoveredHotels(Array.isArray(discoverRes.data) ? discoverRes.data : []);
        } else {
          setIsGoogleConfigured(discoverRes?.configured !== false);
          setGoogleNoticeMessage(discoverRes?.message || discoverRes?.error || '');
          setDiscoveredHotels([]);
        }

        lastExecutedQueryRef.current = trimmed;
        setHasSearched(true);
        setIsOpen(true);
        setHighlightedIndex(-1);
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (requestId === latestRequestIdRef.current) {
          setError(`Search failed: ${err.message || 'Network error'}`);
          setIsOpen(true);
        }
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [maxSuggestions, registeredHotels.length, discoveredHotels.length]
  );

  // Handle live input change with 300ms debounce
  const handleChangeText = (text) => {
    setQuery(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setRegisteredHotels([]);
      setDiscoveredHotels([]);
      setIsOpen(false);
      setError(null);
      setIsLoading(false);
      setHasSearched(false);
      lastExecutedQueryRef.current = '';
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(trimmed);
    }, 300);
  };

  // Clear search input and state
  const handleClear = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setQuery('');
    setRegisteredHotels([]);
    setDiscoveredHotels([]);
    setError(null);
    setIsLoading(false);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setHasSearched(false);
    lastExecutedQueryRef.current = '';
    if (inputRef.current) inputRef.current.focus();
  };

  // Hotel selection handler
  const handleSelectHotel = (hotel) => {
    if (!hotel) return;
    setIsOpen(false);
    setHighlightedIndex(-1);
    setQuery(hotel.name || hotel.title || hotel.hotelName || '');
    lastExecutedQueryRef.current = (hotel.name || hotel.title || hotel.hotelName || '').trim();

    if (onSelectHotel) {
      onSelectHotel(hotel);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const key = e.nativeEvent?.key || e.key;
    if (!key) return;

    const totalCount = allNavigableItems.length;

    if (key === 'ArrowDown') {
      if (e.preventDefault) e.preventDefault();
      if (!isOpen && totalCount > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
      if (totalCount > 0) {
        setHighlightedIndex((prev) => (prev < totalCount - 1 ? prev + 1 : 0));
      }
    } else if (key === 'ArrowUp') {
      if (e.preventDefault) e.preventDefault();
      if (totalCount > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalCount - 1));
      }
    } else if (key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && allNavigableItems[highlightedIndex]) {
        if (e.preventDefault) e.preventDefault();
        handleSelectHotel(allNavigableItems[highlightedIndex]);
      } else if (!isOpen && query.trim().length >= 2) {
        if (e.preventDefault) e.preventDefault();
        fetchSuggestions(query.trim());
      }
    } else if (key === 'Escape') {
      if (e.preventDefault) e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Retry search
  const handleRetry = () => {
    if (query.trim().length >= 2) {
      fetchSuggestions(query.trim());
    }
  };

  const totalResultsCount = registeredHotels.length + discoveredHotels.length;
  const showDropdown = isOpen && (totalResultsCount > 0 || hasSearched || error || isLoading || !isGoogleConfigured);

  return (
    <View
      ref={containerRef}
      style={[styles.wrapper, containerStyle]}
      {...(Platform.OS === 'web' ? { 'data-component': 'hotel-autocomplete-search' } : {})}
    >
      {/* Search Input Bar */}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          isOpen && styles.inputContainerActiveDropdown,
        ]}
      >
        <Text style={styles.searchIcon}>⌕</Text>

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => {
            setIsFocused(true);
            if (query.trim().length >= 2) {
              if (registeredHotels.length > 0 || discoveredHotels.length > 0 || hasSearched) {
                setIsOpen(true);
              } else {
                fetchSuggestions(query.trim());
              }
            }
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          onKeyPress={handleKeyDown}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Hotel Search Autocomplete"
          accessibilityRole="search"
        />

        {/* Loading Spinner in Input */}
        {isLoading && (
          <View style={styles.inputSpinnerWrapper}>
            <ActivityIndicator size="small" color="#E2C082" />
          </View>
        )}

        {/* Clear Button (✕) */}
        {query.length > 0 && !isLoading && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            accessibilityLabel="Clear hotel search"
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Google-Style Dropdown Suggestions with 2 Clearly Labelled Sections */}
      {showDropdown && (
        <View style={styles.dropdown}>
          {/* Dropdown Master Header */}
          <View style={styles.dropdownHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.headerDot} />
              <Text style={styles.dropdownHeaderText}>
                HOTEL DISCOVERY DIRECTORY {totalResultsCount > 0 ? `(${totalResultsCount} MATCHES)` : ''}
              </Text>
            </View>
            <Text style={styles.keyboardHintText}>
              ↑ ↓ navigate • ↵ Enter select • Esc close
            </Text>
          </View>

          {/* Loading state inside dropdown */}
          {isLoading && totalResultsCount === 0 && (
            <View style={styles.centerStatusBox}>
              <ActivityIndicator size="small" color="#E2C082" />
              <Text style={styles.statusText}>Searching MongoDB & Google Places...</Text>
            </View>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.errorTitle}>Search Request Failed</Text>
                <Text style={styles.errorSubtitle}>{error}</Text>
              </View>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            ref={scrollRef}
            style={styles.suggestionsScroll}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
          >
            {/* ============================================================= */}
            {/* SECTION 1: REGISTERED HOTELS (MongoDB)                         */}
            {/* ============================================================= */}
            <View style={styles.sectionHeaderBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.sectionBadgeIcon}>🏢</Text>
                <Text style={styles.sectionTitleText}>REGISTERED HOTELS</Text>
                <View style={styles.sectionSourceTag}>
                  <Text style={styles.sectionSourceTagText}>MongoDB database</Text>
                </View>
              </View>
              <Text style={styles.sectionCounterText}>
                {registeredHotels.length} {registeredHotels.length === 1 ? 'hotel' : 'hotels'}
              </Text>
            </View>

            {registeredHotels.length > 0 ? (
              registeredHotels.map((hotel, idx) => {
                const globalIndex = idx;
                const isHighlighted = globalIndex === highlightedIndex;
                const hotelName = hotel.name || hotel.title || hotel.hotelName || 'Untitled Hotel';
                const hotelCity = hotel.city || 'City Registered';
                const hotelAddress = hotel.address || hotel.hotelAddress || '';
                const locationText = [hotelCity, hotelAddress].filter(Boolean).join(' • ');
                const thumbnailUri = hotel.imageLink || (hotel.images && hotel.images[0]) || '';
                const status = (hotel.status || 'approved').toLowerCase();
                const isApproved = status === 'approved';
                const isPending = status === 'pending';

                return (
                  <TouchableOpacity
                    key={`mongo-${hotel.hotelPropertyId || hotel.id || idx}`}
                    style={[
                      styles.suggestionItem,
                      isHighlighted && styles.suggestionItemHighlighted,
                    ]}
                    onPress={() => handleSelectHotel(hotel)}
                    onMouseEnter={() => setHighlightedIndex(globalIndex)}
                    activeOpacity={0.75}
                  >
                    {/* Thumbnail */}
                    <View style={styles.thumbnailWrapper}>
                      {thumbnailUri ? (
                        <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} resizeMode="cover" />
                      ) : (
                        <View style={styles.thumbnailFallback}>
                          <Text style={styles.thumbnailFallbackIcon}>🏨</Text>
                        </View>
                      )}
                    </View>

                    {/* Details */}
                    <View style={styles.itemDetails}>
                      <View style={styles.itemTitleRow}>
                        <HighlightedText
                          text={hotelName}
                          query={query}
                          baseStyle={styles.hotelName}
                          highlightStyle={styles.highlightedText}
                        />

                        {/* Status Badge */}
                        <View
                          style={[
                            styles.statusBadge,
                            isApproved
                              ? styles.statusApproved
                              : isPending
                              ? styles.statusPending
                              : styles.statusRejected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isApproved
                                ? styles.statusApprovedText
                                : isPending
                                ? styles.statusPendingText
                                : styles.statusRejectedText,
                            ]}
                          >
                            {status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.locationText} numberOfLines={1}>
                        📍 {locationText}
                      </Text>

                      <View style={styles.metaRow}>
                        <Text style={styles.ratingText}>
                          ★ {hotel.rating ? Number(hotel.rating).toFixed(1) : '4.9'}
                        </Text>
                        {hotel.pricePerNight ? (
                          <Text style={styles.priceText}>• {hotel.pricePerNight}</Text>
                        ) : null}
                        <View style={styles.registeredPill}>
                          <Text style={styles.registeredPillText}>✓ In Database</Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Arrow */}
                    <View style={[styles.arrowContainer, isHighlighted && styles.arrowContainerActive]}>
                      <Text style={[styles.arrowText, isHighlighted && styles.arrowTextActive]}>➔</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              !isLoading && (
                <View style={styles.emptySectionBox}>
                  <Text style={styles.emptySectionText}>
                    No registered hotels matching "{query.trim()}" in MongoDB database.
                  </Text>
                </View>
              )
            )}

            {/* ============================================================= */}
            {/* SECTION 2: DISCOVER HOTELS (Google Places API)                 */}
            {/* ============================================================= */}
            <View style={[styles.sectionHeaderBanner, styles.sectionHeaderBannerExternal]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.sectionBadgeIcon}>🌐</Text>
                <Text style={styles.sectionTitleText}>DISCOVER HOTELS</Text>
                <View style={[styles.sectionSourceTag, styles.sectionSourceTagGoogle]}>
                  <Text style={styles.sectionSourceTagTextGoogle}>Google Places API</Text>
                </View>
              </View>
              <Text style={styles.sectionCounterText}>
                {isGoogleConfigured ? `${discoveredHotels.length} discovered` : 'Not Configured'}
              </Text>
            </View>

            {/* Google Places API Not Configured Notice */}
            {!isGoogleConfigured ? (
              <View style={styles.googleNotConfiguredBox}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <Text style={{ fontSize: 18 }}>ℹ️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.googleNotConfiguredTitle}>Google Places API Key Required</Text>
                    <Text style={styles.googleNotConfiguredText}>
                      To discover and import hotels worldwide (e.g. Taj, Marriott, Hyatt) directly from Google, add your API key to:
                    </Text>
                    <View style={styles.codeSnippetBox}>
                      <Text style={styles.codeSnippetText}>backend/.env ➔ GOOGLE_PLACES_API_KEY=your_key_here</Text>
                    </View>
                    <Text style={styles.googleNotConfiguredSubtext}>
                      MongoDB database search remains 100% active and functional.
                    </Text>
                  </View>
                </View>
              </View>
            ) : discoveredHotels.length > 0 ? (
              discoveredHotels.map((hotel, idx) => {
                const globalIndex = registeredHotels.length + idx;
                const isHighlighted = globalIndex === highlightedIndex;
                const hotelName = hotel.name || hotel.title || 'Discovered Hotel';
                const hotelAddress = hotel.address || hotel.city || 'Address available';
                const isAlreadyInDb = hotel.isRegistered;

                return (
                  <TouchableOpacity
                    key={`discover-${hotel.placeId || idx}`}
                    style={[
                      styles.suggestionItem,
                      styles.suggestionItemExternal,
                      isHighlighted && styles.suggestionItemHighlighted,
                    ]}
                    onPress={() => handleSelectHotel({ ...hotel, isExternalDiscovery: true })}
                    onMouseEnter={() => setHighlightedIndex(globalIndex)}
                    activeOpacity={0.75}
                  >
                    {/* Thumbnail */}
                    <View style={[styles.thumbnailWrapper, styles.thumbnailWrapperExternal]}>
                      {hotel.imageLink ? (
                        <Image source={{ uri: hotel.imageLink }} style={styles.thumbnail} resizeMode="cover" />
                      ) : (
                        <View style={styles.thumbnailFallbackExternal}>
                          <Text style={{ fontSize: 20 }}>🌐</Text>
                        </View>
                      )}
                    </View>

                    {/* Details */}
                    <View style={styles.itemDetails}>
                      <View style={styles.itemTitleRow}>
                        <HighlightedText
                          text={hotelName}
                          query={query}
                          baseStyle={styles.hotelName}
                          highlightStyle={styles.highlightedText}
                        />

                        {isAlreadyInDb ? (
                          <View style={styles.alreadyRegisteredBadge}>
                            <Text style={styles.alreadyRegisteredText}>ALREADY IN PORTAL</Text>
                          </View>
                        ) : (
                          <View style={styles.addToPortalBadge}>
                            <Text style={styles.addToPortalText}>+ ADD TO PORTAL</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.locationText} numberOfLines={1}>
                        📍 {hotelAddress}
                      </Text>

                      <View style={styles.metaRow}>
                        {hotel.rating ? (
                          <Text style={styles.ratingText}>★ {Number(hotel.rating).toFixed(1)}</Text>
                        ) : (
                          <Text style={styles.ratingText}>Google Verified</Text>
                        )}
                        <Text style={styles.priceText}>• Google Places</Text>
                        <Text style={styles.idBadgeText}>Place ID: {hotel.placeId?.slice(0, 16)}...</Text>
                      </View>
                    </View>

                    {/* Action Arrow */}
                    <View style={[styles.arrowContainer, isHighlighted && styles.arrowContainerActive]}>
                      <Text style={[styles.arrowText, isHighlighted && styles.arrowTextActive]}>＋</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              !isLoading && hasSearched && (
                <View style={styles.emptySectionBox}>
                  <Text style={styles.emptySectionText}>
                    No external hotels found matching "{query.trim()}" on Google Places.
                  </Text>
                </View>
              )
            )}
          </ScrollView>

          {/* Dropdown Footer */}
          <View style={styles.dropdownFooter}>
            <Text style={styles.footerNoteText}>
              Dual Engine Search: MongoDB Database + Google Places API Discovery
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
    zIndex: 1000,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121520',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2A2E45',
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    ...(Platform.OS === 'web'
      ? { transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }
      : {}),
  },
  inputContainerFocused: {
    borderColor: '#E2C082',
    shadowColor: '#E2C082',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inputContainerActiveDropdown: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: '#E2C082',
  },
  searchIcon: {
    color: '#E2C082',
    fontSize: 18,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: '100%',
    outlineStyle: 'none',
  },
  inputSpinnerWrapper: {
    paddingHorizontal: 4,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#121520',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: '#E2C082',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 20,
    zIndex: 2000,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#191D2E',
    borderBottomWidth: 1,
    borderBottomColor: '#252A40',
  },
  headerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
  },
  dropdownHeaderText: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  keyboardHintText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
  },
  suggestionsScroll: {
    maxHeight: 420,
  },
  sectionHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#161A2B',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#22283E',
  },
  sectionHeaderBannerExternal: {
    backgroundColor: '#131B2A',
    borderTopColor: '#2B3855',
  },
  sectionBadgeIcon: {
    fontSize: 13,
  },
  sectionTitleText: {
    color: '#E2C082',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionSourceTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  sectionSourceTagText: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '700',
  },
  sectionSourceTagGoogle: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  sectionSourceTagTextGoogle: {
    color: '#60A5FA',
    fontSize: 9,
    fontWeight: '700',
  },
  sectionCounterText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  emptySectionBox: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  emptySectionText: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
  },
  googleNotConfiguredBox: {
    padding: 14,
    backgroundColor: '#161928',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 6,
  },
  googleNotConfiguredTitle: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  googleNotConfiguredText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16,
  },
  codeSnippetBox: {
    backgroundColor: '#0A0C14',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#242B42',
  },
  codeSnippetText: {
    color: '#FCD34D',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  googleNotConfiguredSubtext: {
    color: '#86EFAC',
    fontSize: 10,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#121520',
    borderBottomWidth: 1,
    borderBottomColor: '#1E2336',
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    ...(Platform.OS === 'web'
      ? { cursor: 'pointer', transition: 'background-color 0.12s ease, border-left-color 0.12s ease' }
      : {}),
  },
  suggestionItemExternal: {
    backgroundColor: '#101422',
  },
  suggestionItemHighlighted: {
    backgroundColor: '#1C2133',
    borderLeftColor: '#E2C082',
  },
  thumbnailWrapper: {
    width: 46,
    height: 46,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0A0C14',
    borderWidth: 1,
    borderColor: '#2A2E45',
  },
  thumbnailWrapperExternal: {
    borderColor: '#2A3B58',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1E2E',
  },
  thumbnailFallbackExternal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#152136',
  },
  thumbnailFallbackIcon: {
    fontSize: 20,
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  hotelName: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  highlightedText: {
    color: '#FDE047',
    fontWeight: '800',
    backgroundColor: 'rgba(234, 179, 8, 0.22)',
    borderRadius: 2,
    paddingHorizontal: 2,
  },
  locationText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  ratingText: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '700',
  },
  priceText: {
    color: '#CBD5E1',
    fontSize: 10,
  },
  idBadgeText: {
    color: '#64748B',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  registeredPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  registeredPillText: {
    color: '#86EFAC',
    fontSize: 9,
    fontWeight: '700',
  },
  alreadyRegisteredBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  alreadyRegisteredText: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '800',
  },
  addToPortalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1,
    borderColor: '#E2C082',
  },
  addToPortalText: {
    color: '#E2C082',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusApproved: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  statusApprovedText: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '700',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusPendingText: {
    color: '#FBBF24',
    fontSize: 9,
    fontWeight: '700',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  statusRejectedText: {
    color: '#F87171',
    fontSize: 9,
    fontWeight: '700',
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: '#23283E',
  },
  arrowContainerActive: {
    backgroundColor: '#E2C082',
    borderColor: '#E2C082',
  },
  arrowText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  arrowTextActive: {
    color: '#0A0D14',
    fontWeight: '800',
  },
  centerStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  statusText: {
    color: '#E2C082',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    backgroundColor: '#2A141A',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorIcon: {
    fontSize: 20,
  },
  errorTitle: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  errorSubtitle: {
    color: '#F87171',
    fontSize: 11,
    marginTop: 2,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownFooter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0F121C',
    borderTopWidth: 1,
    borderTopColor: '#1F2436',
    alignItems: 'center',
  },
  footerNoteText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
  },
});
