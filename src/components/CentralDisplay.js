// =============================================================================
// src/components/CentralDisplay.js
// Ultra-Refined Digital Lobby Hero Showcase
// Features:
// - Left: Active Hotel high-res photography gallery slideshow
// - Right: Interactive Map (1-click direct Google Maps launch)
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import InteractiveHotelMap from './InteractiveHotelMap';

const ORIGINAL_HOTEL_PHOTOS = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=85',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=85',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=85',
];

const PHOTO_LABELS = [
  'Grand Resort Entrance & Serene Pool',
  'Executive Suite Bedroom',
  'Courtyard Patio',
  'Sunset Garden Terrace & Lounge',
];

export default function CentralDisplay({
  hotel,
  component,
  onViewDetails,
  onBookStay,
}) {
  const activeHotel = hotel || {
    name: 'Selected Hotel',
    subtitle: 'Luxury Accommodation & Guest Services',
    brandBadge: 'GUEST CONCIERGE PORTAL',
    city: '',
    address: 'Select a hotel in Admin to populate details',
    latitude: null,
    longitude: null,
    rating: 5.0,
    pricePerNight: '',
    googleMapsUrl: '',
    images: ORIGINAL_HOTEL_PHOTOS,
    imageCaptions: PHOTO_LABELS,
  };

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [isHovering, setIsHovering] = useState(false);
  const hoverHandlers =
    Platform.OS === 'web'
      ? {
          onMouseEnter: () => setIsHovering(true),
          onMouseLeave: () => setIsHovering(false),
        }
      : {};

  // Dynamic gallery based on hotel with absolute fallback
  const rawGallery =
    activeHotel.images && activeHotel.images.length > 0
      ? activeHotel.images
      : activeHotel.imageObjects && activeHotel.imageObjects.length > 0
      ? activeHotel.imageObjects.map((img) => img.url).filter(Boolean)
      : activeHotel.imageLink
      ? [activeHotel.imageLink]
      : component?.gallery && component.gallery.length > 0
      ? component.gallery
      : ORIGINAL_HOTEL_PHOTOS;

  const parsedGallery = rawGallery
    .map((item) => (typeof item === 'object' && item?.url ? item.url : item))
    .map((url) =>
      url && typeof url === 'string' && (url.includes('693569657') || url.includes('bstatic'))
        ? ORIGINAL_HOTEL_PHOTOS[0]
        : url
    )
    .filter((url) => url && typeof url === 'string');

  const gallery = parsedGallery.length > 0 ? parsedGallery : ORIGINAL_HOTEL_PHOTOS;

  const photoCaptions =
    activeHotel.imageCaptions && activeHotel.imageCaptions.length > 0
      ? activeHotel.imageCaptions
      : activeHotel.imageObjects && activeHotel.imageObjects.length > 0
      ? activeHotel.imageObjects.map((o) => o.caption || o.name || `Photo ID: ${o.id}`)
      : PHOTO_LABELS;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when hotel changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activeHotel.id, activeHotel.name]);

  // Auto-cycle images for slideshow
  useEffect(() => {
    if (gallery.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % gallery.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [gallery.length]);

  // Handle click on hotel: opens booking/inquiry modal
  const handleHotelClick = () => {
    if (onBookStay) {
      onBookStay(activeHotel);
    } else if (onViewDetails) {
      onViewDetails(activeHotel);
    }
  };

  const currentImage = gallery[currentImageIndex] || gallery[0] || ORIGINAL_HOTEL_PHOTOS[0];
  const photoCaption = photoCaptions[currentImageIndex] || PHOTO_LABELS[0];

  return (
    <View style={styles.container}>
      {/* 1. Masthead Header: Dynamic Hotel Name & Subtitle */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={handleHotelClick}
          activeOpacity={0.8}
          accessibilityLabel="Click to view stay registration and booking"
        >
          <Text style={styles.crownIcon}>✦</Text>
          <View>
            <Text style={styles.spotlightTitle}>
              {activeHotel.brandBadge || `${activeHotel.name.toUpperCase()} · ${(activeHotel.city || '').toUpperCase()}`}
            </Text>
            <Text style={styles.spotlightSubtitle}>
              {activeHotel.subtitle || activeHotel.address}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Quick Rate Pill */}
        <TouchableOpacity
          style={styles.ratePill}
          onPress={handleHotelClick}
          activeOpacity={0.8}
        >
          <Text style={styles.ratePillText}>
            ★ {activeHotel.rating || 4.95} · From {activeHotel.pricePerNight || '₹8,500 / night'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Side-by-Side Main Area: Left (Luxury Photo Showcase) | Right (Interactive Leaflet Map) */}
      <View style={[styles.mainRow, !isDesktop && styles.mainRowMobile]}>
        {/* LEFT SIDE: Image Showcase with refined captions and reservation button */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handleHotelClick}
          style={[
            styles.leftImageCard,
            !isDesktop && styles.leftImageCardMobile,
            isHovering && styles.leftImageCardHover,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Click to register and book stay"
          {...hoverHandlers}
        >
          <ImageBackground
            key={`${activeHotel.id || activeHotel.name}-${currentImageIndex}`}
            source={{ uri: currentImage }}
            style={styles.heroImage}
            imageStyle={styles.heroImageStyle}
            resizeMode="cover"
          >
            {/* Top Row: Hotel Brand Pill + Slideshow Counter */}
            <View style={styles.imageOverlayTop}>
              <View style={styles.hotelBrandPill}>
                <Text style={styles.hotelBrandPillIcon}>✦</Text>
                <Text style={styles.hotelBrandPillText}>{activeHotel.name}</Text>
              </View>
              <View style={styles.slideCounterBadge}>
                <Text style={styles.slideCounterText}>
                  {currentImageIndex + 1} / {gallery.length}
                </Text>
              </View>
            </View>

            {/* Bottom Row: Photo Caption, Pagination Dots & Reserve CTA */}
            <View style={styles.imageOverlayBottom}>
              <View style={styles.captionWrap}>
                <Text style={styles.captionText}>{photoCaption}</Text>
                <View style={styles.dotsContainer}>
                  {gallery.map((_, idx) => (
                    <TouchableOpacity
                      key={`dot-${idx}`}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation && e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                      style={[
                        styles.paginationDot,
                        currentImageIndex === idx && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.registerBookingPill}
                onPress={(e) => {
                  e.stopPropagation && e.stopPropagation();
                  handleHotelClick();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.registerBookingPillText}>Reserve Suite ↗</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* RIGHT SIDE: Interactive Map with direct Google Maps launch from Hotel Coordinates */}
        <View style={[styles.rightMapCard, !isDesktop && styles.rightMapCardMobile]}>
          <InteractiveHotelMap
            key={`map-${activeHotel.id || activeHotel.name}-${activeHotel.latitude ?? activeHotel.lat ?? 'default'}-${activeHotel.longitude ?? activeHotel.lng ?? 'default'}`}
            hotelName={activeHotel.name}
            hotelAddress={activeHotel.address}
            initialLat={parseFloat(activeHotel.latitude ?? activeHotel.lat) || null}
            initialLng={parseFloat(activeHotel.longitude ?? activeHotel.lng) || null}
            googleMapsUrl={activeHotel.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeHotel.name + ' ' + (activeHotel.address || activeHotel.city || ''))}`}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#111217',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.16)',
    padding: 10,
    justifyContent: 'space-between',
    height: '100%',
    minHeight: 280,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  crownIcon: {
    fontSize: 15,
    color: '#E2C082',
  },
  spotlightTitle: {
    color: '#F8F6F0',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    ...Platform.select({
      web: {
        fontFamily: "'Playfair Display', Georgia, serif",
      },
    }),
  },
  spotlightSubtitle: {
    color: '#E2C082',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  ratePill: {
    backgroundColor: 'rgba(226, 192, 130, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.3)',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, transform 0.15s ease',
      },
    }),
  },
  ratePillText: {
    color: '#E2C082',
    fontSize: 9,
    fontWeight: '700',
  },

  // Main Side-by-Side Area
  mainRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 220,
  },
  mainRowMobile: {
    flexDirection: 'column',
    minHeight: 480,
  },

  // LEFT SIDE: Image Card (Wider and cinematic)
  leftImageCard: {
    flex: 55,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.2)',
    backgroundColor: '#16181F',
    position: 'relative',
    height: '100%',
    minHeight: 200,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
      },
    }),
  },
  leftImageCardHover: {
    ...Platform.select({
      web: {
        transform: [{ scale: 1.008 }],
        borderColor: 'rgba(226, 192, 130, 0.45)',
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  leftImageCardMobile: {
    flex: 0,
    height: 240,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  heroImageStyle: {
    borderRadius: 9,
  },
  imageOverlayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
    backgroundColor: 'rgba(15, 16, 20, 0.35)',
  },
  hotelBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 16, 20, 0.82)',
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.4)',
  },
  hotelBrandPillIcon: {
    fontSize: 9,
    color: '#E2C082',
  },
  hotelBrandPillText: {
    color: '#F8F6F0',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  slideCounterBadge: {
    backgroundColor: 'rgba(15, 16, 20, 0.8)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  slideCounterText: {
    color: '#F8F6F0',
    fontSize: 8,
    fontWeight: '700',
  },
  imageOverlayBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(15, 16, 20, 0.72)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(6px)',
      },
    }),
  },
  captionWrap: {
    gap: 3,
  },
  captionText: {
    color: '#F8F6F0',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    ...Platform.select({
      web: {
        fontFamily: "'Playfair Display', Georgia, serif",
      },
    }),
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paginationDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  paginationDotActive: {
    width: 14,
    backgroundColor: '#E2C082',
  },
  registerBookingPill: {
    backgroundColor: '#E2C082',
    paddingVertical: 3.5,
    paddingHorizontal: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2C082',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  registerBookingPillText: {
    color: '#0F1014',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // RIGHT SIDE: Interactive Map Card
  rightMapCard: {
    flex: 45,
    backgroundColor: '#16181F',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.18)',
    overflow: 'hidden',
    height: '100%',
    minHeight: 200,
  },
  rightMapCardMobile: {
    flex: 0,
    height: 240,
    minHeight: 200,
    marginTop: 8,
  },
});