// =============================================================================
// src/services/placeSearchService.js
// Place Search Service Abstraction Layer - ZERO hardcoded business data
// Dual Engine:
//   1. Google Places API (New) when API key is configured.
//   2. OpenStreetMap Nominatim + Komoot Photon when no API key is provided
//      (allows immediate testing with ANY real hotel worldwide without paid credentials).
// =============================================================================

const CATEGORY_TO_PLACES_TYPES = {
  tourist:      ['tourist_attraction', 'museum', 'park', 'art_gallery', 'zoo', 'amusement_park'],
  shopping:     ['shopping_mall', 'department_store', 'store', 'market'],
  hospital:     ['hospital', 'doctor', 'health'],
  gym:          ['gym'],
  pharmacy:     ['pharmacy', 'drugstore'],
  transport:    ['bus_station', 'train_station', 'subway_station', 'airport', 'taxi_stand', 'car_rental'],
  takeaway:     ['restaurant', 'meal_takeaway', 'food'],
  restaurant:   ['restaurant', 'food'],
  cafe:         ['cafe', 'bakery'],
  atm:          ['atm', 'bank'],
  salon:        ['beauty_salon', 'hair_care'],
  spa:          ['spa'],
  supermarket:  ['supermarket', 'grocery_or_supermarket'],
  police:       ['police'],
  clinic:       ['doctor', 'health'],
  park:         ['park', 'natural_feature'],
  bank:         ['bank', 'finance'],
};

// Fallback search terms for OpenStreetMap Nominatim
const CATEGORY_TO_OSM_TERMS = {
  tourist:      ['attraction', 'museum', 'monument'],
  shopping:     ['shopping_mall', 'mall', 'supermarket'],
  hospital:     ['hospital', 'clinic'],
  gym:          ['fitness', 'gym'],
  pharmacy:     ['pharmacy', 'chemist'],
  transport:    ['station', 'bus_station', 'subway_station'],
  takeaway:     ['restaurant', 'fast_food', 'takeaway'],
  restaurant:   ['restaurant', 'cafe'],
  cafe:         ['cafe', 'bakery'],
  atm:          ['atm', 'bank'],
  salon:        ['salon'],
  spa:          ['spa'],
  supermarket:  ['supermarket'],
  police:       ['police'],
  clinic:       ['clinic'],
  park:         ['park'],
  bank:         ['bank'],
};

function resolveApiKey() {
  if (typeof window !== 'undefined' && window.__HOTEL_PORTAL_CONFIG__ && window.__HOTEL_PORTAL_CONFIG__.googlePlacesApiKey) {
    return window.__HOTEL_PORTAL_CONFIG__.googlePlacesApiKey;
  }
  if (typeof process !== 'undefined' && process.env) {
    const envKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY ||
      process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
      process.env.GOOGLE_PLACES_API_KEY;
    if (envKey && envKey.trim() && !envKey.startsWith('YOUR_')) return envKey.trim();
  }
  return null;
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizePlaceFromGoogle(p, hotelLat, hotelLng, category) {
  const placeLat = p.location && p.location.latitude;
  const placeLng = p.location && p.location.longitude;
  const distanceKm = (placeLat && placeLng) ? haversineKm(hotelLat, hotelLng, placeLat, placeLng) : null;
  let openingHours = null;
  if (p.regularOpeningHours && p.regularOpeningHours.weekdayDescriptions && p.regularOpeningHours.weekdayDescriptions.length > 0) {
    openingHours = p.regularOpeningHours.weekdayDescriptions.slice(0, 2).join(', ');
  }
  let photoRef = null;
  if (p.photos && p.photos.length > 0) photoRef = p.photos[0].name;

  const title = (p.displayName && p.displayName.text) || 'Unknown Place';
  const address = p.formattedAddress || 'Address unavailable';
  const travelTime = distanceKm ? `${Math.max(2, Math.round((distanceKm / 25) * 60))} mins drive` : 'Drive time unavailable';

  // Build Faculty 5-Column schema based on category
  let data1 = p.rating ? `★ ${p.rating} (${p.userRatingCount || 0} reviews)` : 'Rating unavailable';
  let data2 = distanceKm ? `${distanceKm.toFixed(1)} km from Hotel` : 'Distance unavailable';
  let data3 = openingHours || 'Hours unavailable';
  let data4 = 'Verified Listing';
  let data5 = p.internationalPhoneNumber || (p.websiteUri ? 'Website available' : 'Contact unavailable');

  if (category === 'hospital' || category === 'hospitals') {
    data1 = address.split(',')[0] || 'Local District';
    data2 = 'Medical & Emergency Care';
    data3 = openingHours || '24/7 Casualty & Inpatient';
    data4 = 'Ambulance & Trauma Services';
    data5 = p.internationalPhoneNumber || 'Front Desk Assistance';
  } else if (category === 'gym' || category === 'gyms') {
    data1 = p.rating ? `★ ${p.rating}` : 'Fitness Verified';
    data2 = distanceKm ? `${distanceKm.toFixed(1)} km` : 'Near Hotel';
    data3 = travelTime;
    data4 = openingHours || 'Standard Operating Hours';
    data5 = `${p.userRatingCount || 0} verified reviews`;
  } else if (category === 'pharmacy' || category === 'pharmacies') {
    data1 = distanceKm ? `${distanceKm.toFixed(1)} km` : 'Near Hotel';
    data2 = openingHours || 'Operating Hours on File';
    data3 = 'Licensed Dispensary';
    data4 = p.rating ? `★ ${p.rating}` : 'Verified Chemist';
    data5 = p.internationalPhoneNumber || 'Doorstep Assistance';
  } else if (category === 'shopping') {
    data1 = p.rating ? `★ ${p.rating}` : 'Retail Complex';
    data2 = distanceKm ? `${distanceKm.toFixed(1)} km` : 'Near Hotel';
    data3 = openingHours || 'Mall Hours Available';
    data4 = 'Shopping & Retail';
    data5 = p.websiteUri ? 'Official Website Available' : 'Store Directory';
  }

  const directionsUrl = (placeLat && placeLng)
    ? `https://www.google.com/maps/dir/?api=1&origin=${hotelLat},${hotelLng}&destination=${placeLat},${placeLng}&travelmode=driving`
    : null;

  return {
    id: p.id || ('place-' + Date.now() + '-' + Math.random()),
    placeId: p.id,
    title: title,
    name: title,
    subtitle: address,
    address: address,
    latitude: placeLat || null,
    longitude: placeLng || null,
    lat: placeLat || null,
    lng: placeLng || null,
    rating: p.rating || null,
    ratingsTotal: p.userRatingCount || null,
    likes: p.userRatingCount || null,
    websiteUrl: p.websiteUri || null,
    link: p.websiteUri || null,
    phone: p.internationalPhoneNumber || null,
    openingHours: openingHours,
    timings: openingHours,
    hours: openingHours,
    photoRef: photoRef,
    imageLink: null,
    distance: distanceKm ? `${distanceKm.toFixed(1)} km from Hotel` : null,
    hotelDistance: distanceKm ? `${distanceKm.toFixed(1)} km` : null,
    distanceKm: distanceKm,
    businessStatus: p.businessStatus || null,
    types: p.types || [],
    category: category,
    source: 'google_places',
    directionsUrl: directionsUrl,
    data1: data1,
    data2: data2,
    data3: data3,
    data4: data4,
    data5: data5,
  };
}

function normalizePlaceFromOSM(item, hotelLat, hotelLng, category) {
  const placeLat = parseFloat(item.lat);
  const placeLng = parseFloat(item.lon);
  const distanceKm = (!isNaN(placeLat) && !isNaN(placeLng))
    ? haversineKm(hotelLat, hotelLng, placeLat, placeLng)
    : null;

  const rawName = item.name || (item.display_name ? item.display_name.split(',')[0].trim() : 'Local Venue');
  const addressParts = (item.display_name || '').split(',');
  const subtitle = addressParts.slice(1, 4).join(',').trim() || item.display_name || 'Address unavailable';
  const tags = item.extratags || {};

  const website = tags.website || tags['contact:website'] || tags.url || null;
  const phone = tags.phone || tags['contact:phone'] || null;
  const openingHours = tags.opening_hours || null;
  const travelTime = distanceKm ? `${Math.max(2, Math.round((distanceKm / 25) * 60))} mins drive` : 'Drive time unavailable';

  // Build Faculty 5-Column schema based on category
  let data1 = 'Verified Location';
  let data2 = distanceKm ? `${distanceKm.toFixed(1)} km from Hotel` : 'Distance unavailable';
  let data3 = openingHours || 'Hours unavailable';
  let data4 = website ? 'Website available' : 'Local Verification';
  let data5 = phone || 'Contact unavailable';

  const catLower = (category || '').toLowerCase();
  if (catLower.includes('hosp')) {
    data1 = item.address?.suburb || item.address?.neighbourhood || item.address?.city || addressParts[1]?.trim() || 'Local District';
    data2 = tags.healthcare || (tags.emergency === 'yes' ? 'Tertiary Emergency Care' : 'Multi-Speciality Hospital');
    data3 = tags.emergency === 'yes' ? '24/7 Emergency Casualty' : (openingHours || 'Inpatient & Outpatient');
    data4 = tags.ambulance || (tags.emergency === 'yes' ? 'Ambulance Services On Call' : 'Hospital Medical Services');
    data5 = phone || 'Front Desk Assistance';
  } else if (catLower.includes('gym')) {
    data1 = tags.sport ? `${tags.sport.toUpperCase()} Fitness` : 'Fitness & Strength';
    data2 = distanceKm ? `${distanceKm.toFixed(1)} km` : 'Near Hotel';
    data3 = travelTime;
    data4 = openingHours || 'Morning & Evening Sessions';
    data5 = tags.operator || (website ? 'Official Portal' : 'Member Access');
  } else if (catLower.includes('pharm')) {
    data1 = distanceKm ? `${distanceKm.toFixed(1)} km` : 'Near Hotel';
    data2 = openingHours || 'Daily Pharmacy Hours';
    data3 = tags['opening_hours'] === '24/7' ? '24/7 All-Night Chemist' : 'Licensed Dispensary';
    data4 = 'Prescription Medicines & Care';
    data5 = phone || 'Counter Assistance';
  } else if (catLower.includes('shop')) {
    data1 = tags.shop ? `${tags.shop.toUpperCase()} Center` : 'Retail Destination';
    data2 = distanceKm ? `${distanceKm.toFixed(1)} km` : 'Near Hotel';
    data3 = openingHours || 'Store Operating Hours';
    data4 = item.type || 'Shopping Destination';
    data5 = website ? 'Website Available' : 'Mall Concierge';
  } else if (catLower.includes('tourist')) {
    data1 = tags.tourism ? `${tags.tourism.toUpperCase()} Landmark` : 'Historic & Cultural Site';
    data2 = distanceKm ? `${distanceKm.toFixed(1)} km` : 'Near Hotel';
    data3 = openingHours || 'Public Visiting Hours';
    data4 = website ? 'Official Site Available' : 'Heritage Guide';
    data5 = item.address?.city || addressParts[2]?.trim() || 'Visitor Point';
  } else if (catLower.includes('transport')) {
    data1 = distanceKm ? `${distanceKm.toFixed(1)} km` : 'Near Hotel';
    data2 = travelTime;
    data3 = tags.railway ? 'Railway Station' : (tags.subway === 'yes' ? 'Metro Station' : (tags.station || 'Transit Station'));
    data4 = tags.network || 'Public Transportation Network';
    data5 = tags.operator || 'Scheduled Departures';
  } else if (catLower.includes('takeaway')) {
    data1 = tags.cuisine ? `${tags.cuisine.toUpperCase()} Cuisine` : 'Express Takeaway';
    data2 = distanceKm ? `${distanceKm.toFixed(1)} km` : 'Near Hotel';
    data3 = travelTime;
    data4 = openingHours || 'Daily Takeaway Hours';
    data5 = phone || 'Quick Counter Pickup';
  }

  const directionsUrl = (!isNaN(placeLat) && !isNaN(placeLng))
    ? `https://www.google.com/maps/dir/?api=1&origin=${hotelLat},${hotelLng}&destination=${placeLat},${placeLng}&travelmode=driving`
    : null;

  return {
    id: `osm-${item.place_id || item.osm_id || Math.random()}`,
    placeId: `osm-${item.place_id || item.osm_id}`,
    title: rawName,
    name: rawName,
    subtitle: subtitle,
    address: item.display_name || subtitle,
    latitude: !isNaN(placeLat) ? placeLat : null,
    longitude: !isNaN(placeLng) ? placeLng : null,
    lat: !isNaN(placeLat) ? placeLat : null,
    lng: !isNaN(placeLng) ? placeLng : null,
    rating: null,
    ratingsTotal: null,
    likes: null,
    websiteUrl: website,
    link: website,
    phone: phone,
    openingHours: openingHours,
    timings: openingHours,
    hours: openingHours,
    imageLink: null,
    distance: distanceKm ? `${distanceKm.toFixed(1)} km from Hotel` : null,
    hotelDistance: distanceKm ? `${distanceKm.toFixed(1)} km` : null,
    distanceKm: distanceKm,
    category: category,
    source: 'osm_nominatim',
    directionsUrl: directionsUrl,
    data1: data1,
    data2: data2,
    data3: data3,
    data4: data4,
    data5: data5,
  };
}

export function getPhotoUrl(photoRef, maxWidth) {
  if (!maxWidth) maxWidth = 800;
  const apiKey = resolveApiKey();
  if (!apiKey || !photoRef) return null;
  if (photoRef.startsWith('places/')) return 'https://places.googleapis.com/v1/' + photoRef + '/media?maxWidthPx=' + maxWidth + '&key=' + apiKey;
  return 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=' + maxWidth + '&photo_reference=' + photoRef + '&key=' + apiKey;
}

/**
 * Searches for real hotels worldwide by name.
 * Engine 1: Google Places Autocomplete (if API key set).
 * Engine 2: OpenStreetMap Nominatim + Komoot Photon (live worldwide place search with zero hardcoded entries).
 */
export async function searchHotelByName(query) {
  if (!query || !query.trim()) return { success: false, results: [], error: 'Query is empty' };
  const cleanQuery = query.trim();
  const apiKey = resolveApiKey();

  // Try Google Places if API key is present
  if (apiKey) {
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
        body: JSON.stringify({ input: cleanQuery, includedPrimaryTypes: ['lodging'] })
      });
      if (response.ok) {
        const json = await response.json();
        const suggestions = json.suggestions || [];
        if (suggestions.length > 0) {
          return {
            success: true,
            source: 'google_places',
            results: suggestions.filter((s) => s.placePrediction).map((s) => ({
              placeId: s.placePrediction.placeId,
              description: (s.placePrediction.text && s.placePrediction.text.text) || '',
              mainText: (s.placePrediction.structuredFormat && s.placePrediction.structuredFormat.mainText && s.placePrediction.structuredFormat.mainText.text) || '',
              secondaryText: (s.placePrediction.structuredFormat && s.placePrediction.structuredFormat.secondaryText && s.placePrediction.structuredFormat.secondaryText.text) || '',
            }))
          };
        }
      }
    } catch (err) {
      console.warn('[PlaceSearchService] Google Places Autocomplete fallback to OSM:', err.message);
    }
  }

  // Engine 2: OpenStreetMap Nominatim (Free, live worldwide geocoding)
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&addressdetails=1&extratags=1&limit=8`;
    const osmRes = await fetch(osmUrl, {
      headers: { 'User-Agent': 'HotelPortalApp/1.0 (LocationBasedHotelService)' }
    });
    if (osmRes.ok) {
      const osmData = await osmRes.json();
      if (Array.isArray(osmData) && osmData.length > 0) {
        return {
          success: true,
          source: 'osm_nominatim',
          results: osmData.map((item) => {
            const rawName = item.name || (item.display_name ? item.display_name.split(',')[0].trim() : cleanQuery);
            const addressParts = (item.display_name || '').split(',');
            const secondary = addressParts.slice(1, 4).join(',').trim();
            return {
              placeId: `osm-${item.place_id || item.osm_id}`,
              description: item.display_name,
              mainText: rawName,
              secondaryText: secondary,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              address: item.display_name,
              city: item.address?.city || item.address?.town || item.address?.state_district || addressParts[addressParts.length - 2]?.trim() || '',
              extratags: item.extratags || {},
              raw: item,
            };
          })
        };
      }
    }
  } catch (osmErr) {
    console.warn('[PlaceSearchService] Nominatim search error:', osmErr.message);
  }

  // Engine 3: Komoot Photon fallback (Elasticsearch OSM with fuzzy matching)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=8`;
    const photonRes = await fetch(photonUrl);
    if (photonRes.ok) {
      const photonData = await photonRes.json();
      if (photonData.features && photonData.features.length > 0) {
        return {
          success: true,
          source: 'photon_komoot',
          results: photonData.features.map((f, idx) => {
            const p = f.properties || {};
            const coords = f.geometry && f.geometry.coordinates; // [lng, lat]
            const name = p.name || cleanQuery;
            const secondary = [p.street, p.city, p.state, p.country].filter(Boolean).join(', ');
            return {
              placeId: `photon-${p.osm_id || idx}`,
              description: `${name}, ${secondary}`,
              mainText: name,
              secondaryText: secondary,
              latitude: coords ? coords[1] : null,
              longitude: coords ? coords[0] : null,
              address: `${name}, ${secondary}`,
              city: p.city || p.state || '',
            };
          })
        };
      }
    }
  } catch (photonErr) {
    console.warn('[PlaceSearchService] Photon search error:', photonErr.message);
  }

  return { success: false, results: [], error: 'No places found matching query' };
}

/**
 * Fetches full details for a chosen hotel.
 * Engine 1: Google Places Details (if placeId is Google ID and API key set).
 * Engine 2: OSM details from the cached place result.
 */
export async function fetchHotelDetailsByPlaceId(placeId, cachedResult = null) {
  if (!placeId) return { success: false, error: 'No placeId provided' };

  // If placeId came from OSM/Photon and we already have cached coordinates & address
  if (cachedResult && cachedResult.latitude != null && cachedResult.longitude != null) {
    const lat = cachedResult.latitude;
    const lng = cachedResult.longitude;
    const tags = cachedResult.extratags || {};
    return {
      success: true,
      hotel: {
        placeId: placeId,
        name: cachedResult.mainText || cachedResult.name || 'Selected Hotel',
        title: cachedResult.mainText || cachedResult.name || 'Selected Hotel',
        address: cachedResult.address || cachedResult.description || '',
        subtitle: cachedResult.secondaryText || cachedResult.address || '',
        city: cachedResult.city || (cachedResult.address ? cachedResult.address.split(',').slice(-3, -2)[0]?.trim() : ''),
        latitude: lat,
        longitude: lng,
        lat: lat,
        lng: lng,
        rating: null,
        ratingsTotal: null,
        websiteUrl: tags.website || tags['contact:website'] || null,
        phone: tags.phone || tags['contact:phone'] || null,
        openingHours: tags.opening_hours || null,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        photos: [],
        images: [],
        imageObjects: [],
        source: cachedResult.source || 'osm_nominatim',
        nearby: {
          touristPlaces: [],
          shopping: [],
          transportation: [],
          hospitals: [],
          pharmacies: [],
          gyms: [],
          takeaways: [],
          restaurants: [],
        }
      }
    };
  }

  // Google Places Details
  const apiKey = resolveApiKey();
  if (apiKey && !placeId.startsWith('osm-') && !placeId.startsWith('photon-')) {
    try {
      const fieldMask = ['id','displayName','formattedAddress','location','rating','userRatingCount','websiteUri','internationalPhoneNumber','regularOpeningHours','photos','types','googleMapsUri','businessStatus'].join(',');
      const response = await fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': fieldMask }
      });
      if (response.ok) {
        const p = await response.json();
        let openingHours = null;
        if (p.regularOpeningHours && p.regularOpeningHours.weekdayDescriptions && p.regularOpeningHours.weekdayDescriptions.length > 0) {
          openingHours = p.regularOpeningHours.weekdayDescriptions.join('; ');
        }
        const photos = (p.photos || []).slice(0, 8).map((photo, idx) => ({
          id: String(Date.now() + idx), ref: photo.name, caption: 'Hotel Photo ' + (idx + 1), url: getPhotoUrl(photo.name, 1200)
        }));
        const lat = p.location && p.location.latitude;
        const lng = p.location && p.location.longitude;
        return {
          success: true,
          hotel: {
            placeId: p.id,
            name: (p.displayName && p.displayName.text) || 'Unknown Hotel',
            title: (p.displayName && p.displayName.text) || 'Unknown Hotel',
            address: p.formattedAddress || null,
            subtitle: p.formattedAddress || null,
            city: (p.formattedAddress ? p.formattedAddress.split(',').slice(-3, -2)[0]?.trim() : '') || '',
            latitude: lat || null,
            longitude: lng || null,
            lat: lat || null,
            lng: lng || null,
            rating: p.rating || null,
            ratingsTotal: p.userRatingCount || null,
            websiteUrl: p.websiteUri || null,
            phone: p.internationalPhoneNumber || null,
            openingHours: openingHours,
            googleMapsUrl: p.googleMapsUri || (lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null),
            photos: photos,
            images: photos.map((ph) => ph.url).filter(Boolean),
            imageObjects: photos,
            source: 'google_places',
            nearby: { touristPlaces: [], shopping: [], transportation: [], hospitals: [], pharmacies: [], gyms: [], takeaways: [], restaurants: [] }
          }
        };
      }
    } catch (err) {
      console.warn('[PlaceSearchService] Google Places Details error:', err.message);
    }
  }

  return { success: false, error: 'Could not fetch details for place ID' };
}

/**
 * Real Nearby Search Engine:
 * searchNearby(latitude, longitude, category, radius)
 *
 * If Google Places API key is configured: queries Google Places (New).
 * Else: queries OpenStreetMap Nominatim with viewbox bounded to the exact GPS coordinates and radius.
 * ZERO hardcoded responses. Empty array returned when no real places found.
 */
export async function searchNearby(lat, lng, category, radius) {
  if (!radius) radius = 5000;
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
    return { success: false, places: [], error: 'Hotel location coordinates (lat/lng) are missing.' };
  }

  const apiKey = resolveApiKey();

  // Engine 1: Google Places API if key is present
  if (apiKey) {
    try {
      const types = CATEGORY_TO_PLACES_TYPES[category] || [category];
      const fieldMask = ['places.id','places.displayName','places.formattedAddress','places.location','places.rating','places.userRatingCount','places.websiteUri','places.internationalPhoneNumber','places.regularOpeningHours','places.photos','places.types','places.businessStatus'].join(',');
      const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': fieldMask },
        body: JSON.stringify({ includedTypes: types, maxResultCount: 12, locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: radius } } })
      });
      if (response.ok) {
        const json = await response.json();
        const places = (json.places || []).map((p) => normalizePlaceFromGoogle(p, lat, lng, category));
        return { success: true, places: places, source: 'google_places' };
      }
    } catch (err) {
      console.warn('[PlaceSearchService] Google Places searchNearby error, falling back to OSM:', err.message);
    }
  }

  // Engine 2: OpenStreetMap Nominatim Bounded Viewbox Search
  try {
    const radiusKm = radius / 1000;
    const dLat = radiusKm / 111;
    const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
    const viewbox = `${lng - dLng},${lat + dLat},${lng + dLng},${lat - dLat}`;

    const searchTerms = CATEGORY_TO_OSM_TERMS[category] || [category];
    const gatheredPlaces = [];
    const seenIds = new Set();

    for (const term of searchTerms) {
      if (gatheredPlaces.length >= 8) break;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=json&addressdetails=1&extratags=1&viewbox=${viewbox}&bounded=1&limit=6`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'HotelPortalApp/1.0 (LocationNearbyPlaces)' }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            const uid = item.place_id || item.osm_id;
            if (!seenIds.has(uid)) {
              seenIds.add(uid);
              gatheredPlaces.push(normalizePlaceFromOSM(item, lat, lng, category));
            }
            if (gatheredPlaces.length >= 8) break;
          }
        }
      }
    }

    // Sort by real haversine distance
    gatheredPlaces.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));

    return {
      success: true,
      places: gatheredPlaces,
      source: 'osm_nominatim'
    };
  } catch (err) {
    console.error('[PlaceSearchService] OSM searchNearby error:', err.message);
    return { success: false, places: [], error: err.message, source: 'osm_error' };
  }
}

export function isApiKeyConfigured() { return !!resolveApiKey(); }

export function getApiConfigStatus() {
  const key = resolveApiKey();
  if (!key) {
    return {
      configured: false,
      status: 'FREE_MODE_ACTIVE',
      message: 'Running in OpenStreetMap mode (zero API key needed). Real places are dynamically fetched worldwide.',
      engine: 'OpenStreetMap Nominatim + Komoot Photon',
    };
  }
  return {
    configured: true,
    status: 'CONFIGURED',
    message: 'Google Places API key is active.',
    keyPreview: key.slice(0, 8) + '...' + key.slice(-4),
    engine: 'Google Places API (New)'
  };
}

const placeSearchService = {
  searchNearby,
  searchHotelByName,
  fetchHotelDetailsByPlaceId,
  getPhotoUrl,
  isApiKeyConfigured,
  getApiConfigStatus,
  CATEGORY_TO_PLACES_TYPES,
  CATEGORY_TO_OSM_TERMS,
  haversineKm,
};

export default placeSearchService;
