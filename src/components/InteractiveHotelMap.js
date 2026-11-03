// =============================================================================
// src/components/InteractiveHotelMap.js
// Interactive Map with Direct Google Maps Launcher
// Displays active hotel location. Clicking anywhere on the map,
// marker, popup, header, or action buttons directly opens Google Maps.
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  extractEntityCoordinates,
  getHotelLocationUrl,
  getDirectionsToHotelUrl,
  getEntityFullAddress,
  openMapLink,
} from '../data/hotelsData';

export default function InteractiveHotelMap({
  hotelName = 'Active Hotel',
  hotelAddress = '',
  hotelLatLong = '',
  hotelCity = '',
  initialLat = null,
  initialLng = null,
  googleMapsUrl = '',
}) {
  // Extract and validate real coordinates from props
  const coords = extractEntityCoordinates({
    latitude: initialLat,
    longitude: initialLng,
    hotelLatLong: hotelLatLong,
    address: hotelAddress,
    name: hotelName,
  });

  const [currentLat, setCurrentLat] = useState(coords.lat);
  const [currentLng, setCurrentLng] = useState(coords.lng);
  const [locationLabel, setLocationLabel] = useState(hotelName || 'Active Hotel Location');
  const [isMoved, setIsMoved] = useState(false);
  const iframeRef = useRef(null);

  // Sync state if props change
  useEffect(() => {
    const fresh = extractEntityCoordinates({
      latitude: initialLat,
      longitude: initialLng,
      hotelLatLong: hotelLatLong,
      address: hotelAddress,
      name: hotelName,
    });
    setCurrentLat(fresh.lat);
    setCurrentLng(fresh.lng);
    setLocationLabel(hotelName || 'Active Hotel Location');
    setIsMoved(false);
  }, [initialLat, initialLng, hotelLatLong, hotelAddress, hotelName]);

  const hotelObj = {
    name: hotelName,
    address: hotelAddress,
    city: hotelCity,
    latitude: currentLat != null ? currentLat : coords.lat,
    longitude: currentLng != null ? currentLng : coords.lng,
  };

  const safeHotelName = hotelName || 'Active Hotel';
  const safeHotelAddress = hotelAddress || (hotelCity ? `${hotelCity}, India` : 'Hotel Location');
  const fullAddress = getEntityFullAddress(hotelObj);

  // Dynamic Google Maps URLs
  const viewMapsUrl =
    (coords.isValid && currentLat != null && currentLng != null)
      ? `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`
      : (googleMapsUrl || getHotelLocationUrl(hotelObj));

  const directionsUrl =
    (coords.isValid && currentLat != null && currentLng != null)
      ? `https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLng}`
      : getDirectionsToHotelUrl(hotelObj);

  // Open location in Google Maps (View Location mode)
  const handleOpenGoogleMaps = (overrideUrl) => {
    let url = overrideUrl || viewMapsUrl;
    if (!overrideUrl && isMoved && currentLat != null && currentLng != null) {
      url = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;
    }
    openMapLink(url);
  };

  // Open driving directions to this hotel
  const handleOpenDirections = (overrideUrl) => {
    let url = overrideUrl || directionsUrl;
    if (!overrideUrl && isMoved && currentLat != null && currentLng != null) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLng}`;
    }
    openMapLink(url);
  };

  // Handle messages from the Leaflet map iframe
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleMessage = (event) => {
        if (!event.data) return;

        if (event.data.type === 'OPEN_GOOGLE_MAPS') {
          const targetUrl = event.data.url || viewMapsUrl;
          openMapLink(targetUrl);
        }

        if (event.data.type === 'OPEN_DIRECTIONS') {
          const targetUrl = event.data.url || directionsUrl;
          openMapLink(targetUrl);
        }

        if (event.data.type === 'PIN_MOVED') {
          const { lat, lng } = event.data;
          setCurrentLat(Number(lat.toFixed(5)));
          setCurrentLng(Number(lng.toFixed(5)));
          setIsMoved(true);
          setLocationLabel(`Pin: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [viewMapsUrl, directionsUrl]);

  // Reset pin back to original hotel location
  const handleResetPin = () => {
    setCurrentLat(coords.lat);
    setCurrentLng(coords.lng);
    setLocationLabel(hotelName);
    setIsMoved(false);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'RESET_PIN', lat: coords.lat, lng: coords.lng, name: hotelName },
        '*'
      );
    }
  };

  // Fallback lat/lng for Leaflet if coordinates are completely absent (fallback to center of Bengaluru/India gracefully)
  const mapCenterLat = coords.isValid && coords.lat != null ? coords.lat : 12.9753;
  const mapCenterLng = coords.isValid && coords.lng != null ? coords.lng : 77.6062;

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
            padding: 2px;
          }
          .leaflet-popup-tip {
            background: #16181F;
          }
          .leaflet-control-zoom a {
            background: #16181F !important;
            color: #E2C082 !important;
            border-color: rgba(226, 192, 130, 0.25) !important;
          }
          .popup-btn-row {
            display: flex;
            gap: 6px;
            margin-top: 8px;
          }
          .gmaps-btn {
            display: inline-block;
            background: #E2C082;
            color: #0F1014;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 10px;
            text-decoration: none;
            cursor: pointer;
            border: none;
          }
          .gmaps-btn:hover {
            background: #F1D9A7;
          }
          .gmaps-btn-dir {
            background: #1E2333;
            color: #E2C082;
            border: 1px solid rgba(226, 192, 130, 0.4);
          }
          .gmaps-btn-dir:hover {
            background: #283045;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          var hotelLat = ${Number(mapCenterLat)};
          var hotelLng = ${Number(mapCenterLng)};
          var hotelTitle = ${JSON.stringify(safeHotelName)};
          var viewMapsUrl = ${JSON.stringify(viewMapsUrl)};
          var directionsUrl = ${JSON.stringify(directionsUrl)};
          var hasCoords = ${Boolean(coords.isValid)};
          
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
          var popupContent = '<div style="padding:4px 2px;">' +
            '<b>' + hotelTitle + '</b><br>' +
            '<span style="color:#CBD5E1;font-size:10px;">' + safeAddress + '</span>' +
            '<div class="popup-btn-row">' +
              '<button class="gmaps-btn" onclick="launchGoogleMaps(' + hotelLat + ',' + hotelLng + ')">📍 View Map ↗</button>' +
              '<button class="gmaps-btn gmaps-btn-dir" onclick="launchDirections()">🧭 Directions ↗</button>' +
            '</div>' +
          '</div>';

          marker.bindPopup(popupContent).openPopup();

          function launchGoogleMaps(lat, lng) {
            var targetUrl = viewMapsUrl;
            if (hasCoords && lat && lng && (Math.abs(lat - hotelLat) > 0.001 || Math.abs(lng - hotelLng) > 0.001)) {
              targetUrl = 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng;
            }
            if (window.parent) {
              window.parent.postMessage({ type: 'OPEN_GOOGLE_MAPS', url: targetUrl }, '*');
            }
            try {
              window.open(targetUrl, '_blank');
            } catch (e) {}
          }

          function launchDirections() {
            if (window.parent) {
              window.parent.postMessage({ type: 'OPEN_DIRECTIONS', url: directionsUrl }, '*');
            }
            try {
              window.open(directionsUrl, '_blank');
            } catch (e) {}
          }

          // Clicking map or marker opens Google Maps
          map.on('click', function(e) {
            launchGoogleMaps(e.latlng.lat, e.latlng.lng);
          });

          marker.on('click', function(e) {
            marker.openPopup();
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
      {/* Header Bar with Hotel Name, Coordinates/Address, and Quick Map Actions */}
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
                : (safeHotelAddress || fullAddress)}
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

          {/* VIEW MAP BUTTON */}
          <TouchableOpacity
            style={styles.googleMapsBtn}
            onPress={() => handleOpenGoogleMaps()}
            activeOpacity={0.8}
            accessibilityLabel="View Hotel in Google Maps"
          >
            <Text style={styles.googleMapsBtnText}>📍 Map ↗</Text>
          </TouchableOpacity>

          {/* GET DIRECTIONS BUTTON */}
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => handleOpenDirections()}
            activeOpacity={0.8}
            accessibilityLabel="Get Directions to Hotel in Google Maps"
          >
            <Text style={styles.directionsBtnText}>🧭 Directions ↗</Text>
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
            <Text style={styles.fallbackText}>📍 {safeHotelName}</Text>
            <Text style={styles.fallbackSub}>{safeHotelAddress}</Text>
            <View style={styles.fallbackActions}>
              <TouchableOpacity
                style={styles.googleMapsBtn}
                onPress={() => handleOpenGoogleMaps()}
              >
                <Text style={styles.googleMapsBtnText}>Open Map ↗</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={() => handleOpenDirections()}
              >
                <Text style={styles.directionsBtnText}>Get Directions ↗</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(15, 17, 24, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 192, 130, 0.12)',
    flexShrink: 0,
    gap: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
    minWidth: 0,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  pinIcon: {
    fontSize: 14,
  },
  headerTitles: {
    flex: 1,
    minWidth: 0,
  },
  mapTitle: {
    color: '#F8F6F0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  mapSubtitle: {
    color: '#94A3B8',
    fontSize: 9.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  resetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  resetBtnText: {
    color: '#CBD5E1',
    fontSize: 9.5,
    fontWeight: '700',
  },
  googleMapsBtn: {
    backgroundColor: 'rgba(226, 192, 130, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(226, 192, 130, 0.4)',
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    borderRadius: 5,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
      },
    }),
  },
  googleMapsBtnText: {
    color: '#E2C082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  directionsBtn: {
    backgroundColor: '#E2C082',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 5,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(226, 192, 130, 0.3)',
      },
    }),
  },
  directionsBtnText: {
    color: '#0D0F17',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
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
  fallbackActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
});
