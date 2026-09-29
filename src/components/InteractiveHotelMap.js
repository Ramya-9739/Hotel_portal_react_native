// =============================================================================
// src/components/InteractiveHotelMap.js
// Interactive Map with Direct Google Maps Launcher
// Displays active hotel location. Clicking anywhere on the map,
// marker, popup, header, or badge directly opens Google Maps in a new tab.
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';

const DEFAULT_HOTEL = {
  name: 'Hotel Location',
  address: 'Active Hotel Location',
  lat: 20.5937,
  lng: 78.9629,
  googleMapsUrl: '',
};

export default function InteractiveHotelMap({
  hotelName = DEFAULT_HOTEL.name,
  hotelAddress = DEFAULT_HOTEL.address,
  initialLat = DEFAULT_HOTEL.lat,
  initialLng = DEFAULT_HOTEL.lng,
  googleMapsUrl = DEFAULT_HOTEL.googleMapsUrl,
}) {
  const numLat = parseFloat(initialLat);
  const numLng = parseFloat(initialLng);
  const validLat = !isNaN(numLat) && numLat !== 0 ? numLat : DEFAULT_HOTEL.lat;
  const validLng = !isNaN(numLng) && numLng !== 0 ? numLng : DEFAULT_HOTEL.lng;

  const [currentLat, setCurrentLat] = useState(validLat);
  const [currentLng, setCurrentLng] = useState(validLng);
  const [locationLabel, setLocationLabel] = useState(hotelName || DEFAULT_HOTEL.name);
  const [isMoved, setIsMoved] = useState(false);
  const iframeRef = useRef(null);

  // Sync state if props change
  useEffect(() => {
    const nextLat = parseFloat(initialLat);
    const nextLng = parseFloat(initialLng);
    const resolvedLat = !isNaN(nextLat) && nextLat !== 0 ? nextLat : DEFAULT_HOTEL.lat;
    const resolvedLng = !isNaN(nextLng) && nextLng !== 0 ? nextLng : DEFAULT_HOTEL.lng;

    setCurrentLat(resolvedLat);
    setCurrentLng(resolvedLng);
    setLocationLabel(hotelName || DEFAULT_HOTEL.name);
    setIsMoved(false);
  }, [initialLat, initialLng, hotelName]);

  // If coordinates are missing, render graceful fallback per requirement
  if (!validLat || !validLng || isNaN(validLat) || isNaN(validLng)) {
    return (
      <View style={styles.unconfiguredContainer}>
        <Text style={styles.unconfiguredIcon}>📍</Text>
        <Text style={styles.unconfiguredTitle}>Hotel location not configured</Text>
        <Text style={styles.unconfiguredSub}>
          Exact latitude and longitude coordinates are required to display the interactive map and calculate turn-by-turn directions.
        </Text>
      </View>
    );
  }

  // Open location directly in Google Maps
  const handleOpenGoogleMaps = (overrideUrl) => {
    const fallbackUrl = (validLat && validLng) ? `https://www.google.com/maps/search/?api=1&query=${validLat},${validLng}` : '';
    const defaultUrl = googleMapsUrl || fallbackUrl;
    let url = overrideUrl || defaultUrl;

    if (!overrideUrl && isMoved) {
      url = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;
    }

    if (Platform.OS === 'web') {
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      if (url) Linking.openURL(url).catch((err) => console.error('Error opening maps:', err));
    }
  };

  // Handle messages from the Leaflet map iframe
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleMessage = (event) => {
        if (!event.data) return;

        // Directly open Google Maps when map or marker is clicked inside iframe
        if (event.data.type === 'OPEN_GOOGLE_MAPS') {
          const fallbackUrl = (validLat && validLng) ? `https://www.google.com/maps/search/?api=1&query=${validLat},${validLng}` : '';
          const targetUrl = event.data.url || googleMapsUrl || fallbackUrl;
          if (targetUrl) window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }

        if (event.data.type === 'PIN_MOVED') {
          const { lat, lng } = event.data;
          setCurrentLat(Number(lat.toFixed(5)));
          setCurrentLng(Number(lng.toFixed(5)));
          setIsMoved(true);
          setLocationLabel(`Selected Pin: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [googleMapsUrl]);

  // Reset pin back to original hotel location
  const handleResetPin = () => {
    setCurrentLat(initialLat);
    setCurrentLng(initialLng);
    setLocationLabel(hotelName);
    setIsMoved(false);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'RESET_PIN', lat: initialLat, lng: initialLng, name: hotelName },
        '*'
      );
    }
  };

  // Direct Google Maps URL dynamically resolved from hotel coordinates or location search
  const safeHotelName = hotelName || DEFAULT_HOTEL.name;
  const safeHotelAddress = hotelAddress || DEFAULT_HOTEL.address;
  const directMapsUrl =
    googleMapsUrl ||
    (validLat && validLng
      ? `https://www.google.com/maps/search/?api=1&query=${validLat},${validLng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(safeHotelName + ' ' + safeHotelAddress)}`);

  // HTML content for Leaflet map with direct Google Maps launch on click
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #16181F;
            cursor: pointer !important;
          }
          .custom-red-pin {
            font-size: 26px;
            text-align: center;
            line-height: 26px;
            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.65));
            cursor: pointer !important;
          }
          .leaflet-popup-content-wrapper {
            background: #16181F;
            color: #F8F6F0;
            border: 1px solid rgba(226, 192, 130, 0.4);
            border-radius: 8px;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.6);
          }
          .leaflet-popup-tip {
            background: #16181F;
          }
          .leaflet-control-zoom a {
            background: #16181F !important;
            color: #E2C082 !important;
            border-color: rgba(226, 192, 130, 0.25) !important;
          }
          .gmaps-btn {
            display: inline-block;
            margin-top: 6px;
            background: #E2C082;
            color: #0F1014;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 10px;
            text-decoration: none;
            cursor: pointer;
            border: none;
            letter-spacing: 0.3px;
          }
          .gmaps-btn:hover {
            background: #F1D9A7;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          var hotelLat = ${Number(currentLat || validLat || DEFAULT_HOTEL.lat)};
          var hotelLng = ${Number(currentLng || validLng || DEFAULT_HOTEL.lng)};
          var hotelTitle = ${JSON.stringify(safeHotelName)};
          var directMapsUrl = ${JSON.stringify(directMapsUrl)};
          
          var map = L.map('map', {
            zoomControl: true,
            attributionControl: false
          }).setView([hotelLat, hotelLng], 14);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          var pinIcon = L.divIcon({
            className: 'custom-red-pin',
            html: '📍',
            iconSize: [28, 28],
            iconAnchor: [14, 26],
            popupAnchor: [0, -26]
          });

          var marker = L.marker([hotelLat, hotelLng], {
            icon: pinIcon,
            draggable: false
          }).addTo(map);

          var safeAddress = ${JSON.stringify(safeHotelAddress)};
          var popupContent = '<div style="padding:2px 0;"><b>' + hotelTitle + '</b><br><span style="color:#CBD5E1;font-size:10px;">' + safeAddress + '</span></div>';
          marker.bindPopup(popupContent).openPopup();

          function launchGoogleMaps(lat, lng) {
            var targetUrl = directMapsUrl;
            if (lat && lng && (Math.abs(lat - hotelLat) > 0.001 || Math.abs(lng - hotelLng) > 0.001)) {
              targetUrl = 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng;
            }
            if (window.parent) {
              window.parent.postMessage({ type: 'OPEN_GOOGLE_MAPS', url: targetUrl }, '*');
            }
            try {
              window.open(targetUrl, '_blank');
            } catch (e) {}
          }

          // Clicking anywhere on map launches the route / pin in Google Maps
          map.on('click', function(e) {
            launchGoogleMaps(e.latlng.lat, e.latlng.lng);
          });

          marker.on('click', function(e) {
            launchGoogleMaps(hotelLat, hotelLng);
          });

          window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'RESET_PIN') {
              marker.setLatLng([e.data.lat, e.data.lng]);
              map.setView([e.data.lat, e.data.lng], 14);
              marker.bindPopup(popupContent).openPopup();
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.mapContainer}>
      {/* Header Bar with Hotel Name, Move Indicator, and Single Clean Action Button */}
      <View style={styles.mapHeader}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => handleOpenGoogleMaps()}
          activeOpacity={0.8}
          accessibilityLabel="Open Hotel in Google Maps"
        >
          <Text style={styles.pinIcon}>📍</Text>
          <View style={styles.headerTitles}>
            <Text style={styles.mapTitle} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Text style={styles.mapSubtitle} numberOfLines={1}>
              {isMoved
                ? `Pin: ${currentLat}°N, ${currentLng}°E`
                : hotelAddress}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {isMoved && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetPin}
              activeOpacity={0.8}
            >
              <Text style={styles.resetBtnText}>↺ Reset</Text>
            </TouchableOpacity>
          )}

          {/* SINGLE GOOGLE MAPS BUTTON */}
          <TouchableOpacity
            style={styles.googleMapsBtn}
            onPress={() => handleOpenGoogleMaps()}
            activeOpacity={0.8}
          >
            <Text style={styles.googleMapsBtnText}>Google Maps ↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Map Container */}
      <View style={styles.iframeWrapper}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={mapHtml}
            style={styles.iframeStyle}
            title="Interactive Hotel Map"
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>📍 {hotelName}</Text>
            <Text style={styles.fallbackSub}>{hotelAddress}</Text>
            <TouchableOpacity
              style={styles.googleMapsBtn}
              onPress={() => handleOpenGoogleMaps()}
            >
              <Text style={styles.googleMapsBtnText}>Open in Google Maps ↗</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    height: '100%',
    minHeight: 180,
    backgroundColor: '#16181F',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.18)',
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111217',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.15)',
    gap: 6,
    flexShrink: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  pinIcon: {
    fontSize: 13,
  },
  headerTitles: {
    flex: 1,
    gap: 1,
  },
  mapTitle: {
    color: '#F8F6F0',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  mapSubtitle: {
    color: '#94A3B8',
    fontSize: 8.5,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  resetBtnText: {
    color: '#CBD5E1',
    fontSize: 8.5,
    fontWeight: '700',
  },
  googleMapsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(226, 192, 130, 0.18)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.5)',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  googleMapsBtnText: {
    color: '#E2C082',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  iframeWrapper: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    backgroundColor: '#16181F',
    position: 'relative',
  },
  iframeStyle: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  fallbackText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  fallbackSub: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
  },
  unconfiguredContainer: {
    flex: 1,
    height: '100%',
    backgroundColor: '#111217',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 6,
  },
  unconfiguredIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  unconfiguredTitle: {
    color: '#F87171',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  unconfiguredSub: {
    color: '#94A3B8',
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: 240,
  },
});
